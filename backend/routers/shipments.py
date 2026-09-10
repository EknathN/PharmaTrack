from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
import shutil

from .. import models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

# Simplified AI Mock - in a real scenario, this uses HuggingFace Transformers
def verify_image_is_real(file_path: str) -> bool:
    # return True for valid, False for AI-generated
    # To integrate:
    # from transformers import pipeline
    # pipe = pipeline("image-classification", model="umm-maybe/AI-image-detector")
    # result = pipe(file_path)
    # return "artificial" not in result[0]['label']
    return True

@router.post("/", response_model=schemas.ShipmentResponse)
def create_shipment(shipment: schemas.ShipmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify sender has enough inventory
    inventory = db.query(models.Inventory).filter(
        models.Inventory.batch_id == shipment.batch_id,
        models.Inventory.owner_id == current_user.id
    ).first()

    if not inventory or inventory.quantity < shipment.quantity:
        raise HTTPException(status_code=400, detail="Insufficient inventory")

    shipment_qr = f"SHIP-{uuid.uuid4().hex[:12]}"
    
    new_shipment = models.Shipment(
        shipment_type="forward",
        from_role=current_user.role,
        from_id=current_user.id,
        to_role=shipment.to_role,
        to_id=shipment.to_id,
        batch_id=shipment.batch_id,
        quantity=shipment.quantity,
        shipment_qr=shipment_qr,
        status=models.ShipmentStatus.CREATED
    )
    
    db.add(new_shipment)
    # Deduct from inventory
    inventory.quantity -= shipment.quantity
    db.commit()
    db.refresh(new_shipment)
    return new_shipment

@router.post("/{shipment_id}/proof")
def upload_proof(shipment_id: int, proof_type: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    upload_dir = "uploads/proofs"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{uuid.uuid4().hex}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # AI Verification
    is_real = verify_image_is_real(file_path)
    if not is_real:
        # Delete file and reject
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Image rejected: AI-generated anomaly detected")

    proof = models.Proof(
        shipment_id=shipment_id,
        proof_type=proof_type,
        file_path=file_path,
        is_ai_generated=False,
        uploaded_by=current_user.id
    )
    db.add(proof)
    db.commit()
    db.refresh(proof)

    return {"message": "Proof uploaded successfully", "proof_id": proof.id}

@router.post("/{shipment_id}/receive")
def receive_shipment(shipment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    if shipment.to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to receive this shipment")

    shipment.status = models.ShipmentStatus.RECEIVED
    
    # Add to receiver's inventory
    inventory = db.query(models.Inventory).filter(
        models.Inventory.batch_id == shipment.batch_id,
        models.Inventory.owner_id == current_user.id
    ).first()

    if inventory:
        inventory.quantity += shipment.quantity
    else:
        new_inventory = models.Inventory(
            batch_id=shipment.batch_id,
            owner_role=current_user.role,
            owner_id=current_user.id,
            quantity=shipment.quantity,
            status="in_stock"
        )
        db.add(new_inventory)
        
    db.commit()
    return {"message": "Shipment received and inventory updated"}
