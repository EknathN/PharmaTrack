from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import uuid
import os
import shutil

from .. import models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

@router.post("/{batch_id}/dispose")
def finalize_disposal(
    batch_id: int, 
    before_photo_id: int,
    after_photo_id: int,
    video_id: int,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.DISPOSER:
        raise HTTPException(status_code=403, detail="Only disposers can finalize disposal")

    # Verify inventory is with disposer
    inventory = db.query(models.Inventory).filter(
        models.Inventory.batch_id == batch_id,
        models.Inventory.owner_id == current_user.id
    ).first()

    if not inventory or inventory.quantity <= 0:
        raise HTTPException(status_code=400, detail="No inventory to dispose")

    # In a real system, we'd verify the proofs belong to this batch/shipment
    
    # Generate mock certificate
    cert_path = f"uploads/proofs/CERT_{uuid.uuid4().hex[:8]}.pdf"
    with open(cert_path, "w") as f:
        f.write("OFFICIAL DISPOSAL CERTIFICATE")
        
    disposal_record = models.DisposalRecord(
        batch_id=batch_id,
        disposer_id=current_user.id,
        before_photo_id=before_photo_id,
        after_photo_id=after_photo_id,
        video_id=video_id,
        certificate_path=cert_path
    )
    
    db.add(disposal_record)
    
    # Mark inventory as fully disposed
    inventory.status = "fully_disposed"
    inventory.quantity = 0
    
    db.commit()
    db.refresh(disposal_record)
    
    return {"message": "Disposal finalized successfully", "certificate_url": f"/{cert_path}"}
