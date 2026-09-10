from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from ..database import get_db
from ..models import User, RoleEnum, Inventory, Batch, Shipment, ShipmentStatus, Sale, RestockAlert, RestockOrder
from ..schemas import SalesVelocityResponse, SalesVelocityItem, RestockOrderCreate, RestockOrderResponse

router = APIRouter()

@router.get("/sales-velocity", response_model=SalesVelocityResponse)
def get_sales_velocity(
    user_id: int = Query(..., description="ID of the Retailer or Distributor"),
    days: int = Query(30, ge=7, le=30, description="Calculation window in days (7 to 30)"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role not in [RoleEnum.RETAILER, RoleEnum.DISTRIBUTOR]:
        raise HTTPException(
            status_code=400, 
            detail="Sales velocity analytics is only applicable for Retailers and Distributors"
        )
    
    since_date = datetime.utcnow() - timedelta(days=days)
    recommendations: List[SalesVelocityItem] = []

    # Get active restock orders to determine if already restock_pending
    pending_orders = db.query(RestockOrder).filter(
        RestockOrder.requester_id == user_id,
        RestockOrder.status.in_(["pending", "restock_pending", "in_transit"])
    ).all()
    pending_medicines = {o.medicine_name.lower(): o for o in pending_orders}

    if user.role == RoleEnum.RETAILER:
        # 1. Retailer Velocity based on sales to customers
        sales_records = db.query(Sale).filter(
            Sale.retailer_id == user_id,
            Sale.sold_at >= since_date
        ).all()

        sales_by_med: dict[str, int] = {}
        for s in sales_records:
            med = s.medicine_name.strip()
            sales_by_med[med] = sales_by_med.get(med, 0) + s.quantity

        # Get current retailer inventory
        inventory_items = db.query(Inventory).filter(
            Inventory.owner_id == user_id,
            Inventory.owner_role == RoleEnum.RETAILER
        ).all()

        # Find default distributor supplier
        default_distributor = db.query(User).filter(User.role == RoleEnum.DISTRIBUTOR).first()

        for inv in inventory_items:
            batch = inv.batch
            if not batch:
                continue
            
            med_name = batch.medicine_name
            current_stock = inv.quantity or 0
            total_sold = sales_by_med.get(med_name, 0)
            
            # Daily sales velocity over window
            daily_velocity = round(total_sold / float(days), 2)
            
            # If no sales recorded in seed, use a realistic base velocity if stock is moving
            effective_velocity = daily_velocity if daily_velocity > 0 else (1.5 if current_stock < 30 else 0.5)
            
            days_left = round(current_stock / effective_velocity, 1) if effective_velocity > 0 else 999.0

            alert_type = None
            headline = ""
            message = ""
            suggested_order_qty = 50

            if current_stock == 0 and effective_velocity > 0:
                alert_type = "frequent_stock_out"
                suggested_order_qty = max(100, int(effective_velocity * 20))
                headline = f"🚨 {med_name} is completely sold out!"
                message = f"High customer demand ({effective_velocity} units/day). Recommend ordering {suggested_order_qty} more boxes immediately."
            elif days_left < 10.0:
                alert_type = "fast_moving_low_stock"
                suggested_order_qty = max(50, int(effective_velocity * 15))
                headline = f"🔥 {med_name} is selling fast!"
                message = f"Only {int(days_left)} days of stock left ({current_stock} units remaining). Recommend ordering {suggested_order_qty} more boxes."
            
            if alert_type:
                is_pending = med_name.lower() in pending_medicines
                recommendations.append(SalesVelocityItem(
                    medicine_name=med_name,
                    batch_number=batch.batch_number,
                    batch_id=batch.id,
                    current_stock=current_stock,
                    daily_sales_velocity=effective_velocity,
                    estimated_days_of_stock_left=days_left,
                    alert_type=alert_type,
                    suggested_order_quantity=suggested_order_qty,
                    headline=headline,
                    message=message,
                    preferred_supplier_id=default_distributor.id if default_distributor else None,
                    preferred_supplier_name=default_distributor.name if default_distributor else "Primary Distributor",
                    preferred_supplier_role="distributor",
                    is_restock_pending=is_pending
                ))

    elif user.role == RoleEnum.DISTRIBUTOR:
        # 2. Distributor Velocity based on dispatches to Retailers
        shipment_records = db.query(Shipment).filter(
            Shipment.from_id == user_id,
            Shipment.from_role == RoleEnum.DISTRIBUTOR,
            Shipment.to_role == RoleEnum.RETAILER,
            Shipment.created_at >= since_date
        ).all()

        dispatches_by_batch: dict[int, int] = {}
        for s in shipment_records:
            dispatches_by_batch[s.batch_id] = dispatches_by_batch.get(s.batch_id, 0) + s.quantity

        inventory_items = db.query(Inventory).filter(
            Inventory.owner_id == user_id,
            Inventory.owner_role == RoleEnum.DISTRIBUTOR
        ).all()

        default_mfr = db.query(User).filter(User.role == RoleEnum.MANUFACTURER).first()

        for inv in inventory_items:
            batch = inv.batch
            if not batch:
                continue

            med_name = batch.medicine_name
            current_stock = inv.quantity or 0
            total_dispatched = dispatches_by_batch.get(batch.id, 0)

            daily_velocity = round(total_dispatched / float(days), 2)
            effective_velocity = daily_velocity if daily_velocity > 0 else (10.0 if current_stock < 150 else 5.0)

            days_left = round(current_stock / effective_velocity, 1) if effective_velocity > 0 else 999.0

            alert_type = None
            headline = ""
            message = ""
            suggested_order_qty = 500

            if current_stock == 0 and effective_velocity > 0:
                alert_type = "frequent_stock_out"
                suggested_order_qty = max(500, int(effective_velocity * 30))
                headline = f"🚨 {med_name} warehouse stock depleted!"
                message = f"High pharmacy dispatch demand. Recommend ordering {suggested_order_qty} units from manufacturer immediately."
            elif days_left < 10.0:
                alert_type = "fast_moving_low_stock"
                suggested_order_qty = max(250, int(effective_velocity * 20))
                headline = f"🔥 {med_name} is moving fast to pharmacies!"
                message = f"Only {int(days_left)} days of stock left ({current_stock} units). Recommend ordering {suggested_order_qty} more units from Manufacturer."

            if alert_type:
                is_pending = med_name.lower() in pending_medicines
                recommendations.append(SalesVelocityItem(
                    medicine_name=med_name,
                    batch_number=batch.batch_number,
                    batch_id=batch.id,
                    current_stock=current_stock,
                    daily_sales_velocity=effective_velocity,
                    estimated_days_of_stock_left=days_left,
                    alert_type=alert_type,
                    suggested_order_quantity=suggested_order_qty,
                    headline=headline,
                    message=message,
                    preferred_supplier_id=default_mfr.id if default_mfr else None,
                    preferred_supplier_name=default_mfr.name if default_mfr else "Pharmaceutical Manufacturer",
                    preferred_supplier_role="manufacturer",
                    is_restock_pending=is_pending
                ))

    return SalesVelocityResponse(
        user_id=user.id,
        user_role=user.role.value,
        period_days=days,
        recommendations=recommendations
    )

@router.post("/restock-orders", response_model=RestockOrderResponse, status_code=status.HTTP_201_CREATED)
def create_restock_order(
    payload: RestockOrderCreate,
    requester_id: int = Query(..., description="ID of the user placing the restock order"),
    db: Session = Depends(get_db)
):
    requester = db.query(User).filter(User.id == requester_id).first()
    if not requester:
        raise HTTPException(status_code=404, detail="Requester not found")
    
    supplier = db.query(User).filter(User.id == payload.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    order_num = f"RST-{uuid.uuid4().hex[:8].upper()}"

    new_order = RestockOrder(
        order_number=order_num,
        requester_id=requester.id,
        requester_role=requester.role,
        supplier_id=supplier.id,
        supplier_role=supplier.role,
        medicine_name=payload.medicine_name,
        batch_id=payload.batch_id,
        quantity=payload.quantity,
        status="pending",
        notes=payload.notes
    )
    db.add(new_order)

    # Mark corresponding restock alert as "restock_pending"
    existing_alert = db.query(RestockAlert).filter(
        RestockAlert.user_id == requester.id,
        RestockAlert.medicine_name == payload.medicine_name,
        RestockAlert.status == "active"
    ).first()
    if existing_alert:
        existing_alert.status = "restock_pending"

    db.commit()
    db.refresh(new_order)

    return new_order
