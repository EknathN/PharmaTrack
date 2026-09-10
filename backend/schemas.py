from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from .models import RoleEnum, ShipmentStatus

# --- Users ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[RoleEnum] = None

# --- Batches ---
class BatchBase(BaseModel):
    batch_number: Optional[str] = None
    medicine_name: str
    mfg_date: datetime
    exp_date: datetime
    quantity_details: Dict[str, Any]

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: int
    manufacturer_id: int
    qr_data: str
    is_locked: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- Inventory ---
class InventoryResponse(BaseModel):
    id: int
    batch_id: int
    owner_role: RoleEnum
    owner_id: int
    quantity: int
    status: str
    batch: BatchResponse
    class Config:
        from_attributes = True

# --- Shipments ---
class ShipmentCreate(BaseModel):
    to_role: RoleEnum
    to_id: int
    batch_id: int
    quantity: int

class ShipmentResponse(BaseModel):
    id: int
    shipment_type: str
    from_role: RoleEnum
    from_id: int
    to_role: RoleEnum
    to_id: int
    batch_id: int
    quantity: int
    shipment_qr: str
    status: ShipmentStatus
    created_at: datetime
    class Config:
        from_attributes = True
