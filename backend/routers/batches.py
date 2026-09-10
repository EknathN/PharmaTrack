from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import qrcode
import os
import uuid
from datetime import datetime

from .. import models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.BatchResponse)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.MANUFACTURER:
        raise HTTPException(status_code=403, detail="Only manufacturers can create batches")

    batch_number = batch.batch_number
    if not batch_number:
        batch_number = f"BN-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    # Check if batch exists
    if db.query(models.Batch).filter(models.Batch.batch_number == batch_number).first():
        raise HTTPException(status_code=400, detail="Batch number already exists")

    # Generate unique Batch ID and readable multi-line QR content
    batch_id_str = f"BAT-{uuid.uuid4().hex[:8]}"
    mfg_str = batch.mfg_date.strftime("%d-%m-%Y") if hasattr(batch.mfg_date, "strftime") else str(batch.mfg_date)
    exp_str = batch.exp_date.strftime("%d-%m-%Y") if hasattr(batch.exp_date, "strftime") else str(batch.exp_date)
    
    strips_val = "10 capsules per strip"
    total_qty_val = "100 boxes"
    if isinstance(batch.quantity_details, dict):
        strips_val = batch.quantity_details.get("strips_per_box", strips_val)
        boxes_num = batch.quantity_details.get("total_boxes", 100)
        total_qty_val = f"{boxes_num} boxes"

    qr_data = (
        f"Manufacturer: {current_user.name}\n"
        f"Medicine: {batch.medicine_name}\n"
        f"Batch No: {batch_number}\n"
        f"Mfg Date: {mfg_str}\n"
        f"Exp Date: {exp_str}\n"
        f"Strips: {strips_val}\n"
        f"Total Quantity: {total_qty_val}\n"
        f"Batch ID: {batch_id_str}"
    )

    new_batch = models.Batch(
        batch_number=batch_number,
        medicine_name=batch.medicine_name,
        mfg_date=batch.mfg_date,
        exp_date=batch.exp_date,
        quantity_details=batch.quantity_details,
        manufacturer_id=current_user.id,
        qr_data=qr_data,
        is_locked=True
    )

    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    # Automatically add to manufacturer's inventory
    total_units = batch.quantity_details.get("total_boxes", 0)
    inventory_item = models.Inventory(
        batch_id=new_batch.id,
        owner_role=models.RoleEnum.MANUFACTURER,
        owner_id=current_user.id,
        quantity=total_units,
        status="in_stock"
    )
    db.add(inventory_item)
    db.commit()

    return new_batch

@router.get("/", response_model=List[schemas.BatchResponse])
def get_batches(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Any role can see batches they own or have interacted with, but for simplicity let's allow all for now.
    # In a real app, restrict by ownership or history.
    batches = db.query(models.Batch).all()
    return batches

@router.get("/{batch_id}/qr")
def generate_qr(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    img = qrcode.make(batch.qr_data)
    
    qr_dir = "uploads/qrs"
    os.makedirs(qr_dir, exist_ok=True)
    file_path = f"{qr_dir}/{batch.qr_data}.png"
    img.save(file_path)

    return {"qr_url": f"/{file_path}"}
