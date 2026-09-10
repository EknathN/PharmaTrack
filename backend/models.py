from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum
from sqlalchemy import Enum

class RoleEnum(str, enum.Enum):
    MANUFACTURER = "manufacturer"
    DISTRIBUTOR = "distributor"
    RETAILER = "retailer"
    DISPOSER = "disposer"
    ADMIN = "admin"

class ShipmentStatus(str, enum.Enum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    RECEIVED = "received"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.RETAILER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String, unique=True, index=True)
    medicine_name = Column(String, index=True)
    mfg_date = Column(DateTime)
    exp_date = Column(DateTime)
    quantity_details = Column(JSON) # e.g. {"strips_per_box": 10, "capsules_per_strip": 10, "total_boxes": 100}
    manufacturer_id = Column(Integer, ForeignKey("users.id"))
    qr_data = Column(String, unique=True)
    is_locked = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    manufacturer = relationship("User")
    inventory = relationship("Inventory", back_populates="batch")

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    owner_role = Column(Enum(RoleEnum))
    owner_id = Column(Integer, ForeignKey("users.id"))
    quantity = Column(Integer) # Tracks the number of boxes/units currently owned
    status = Column(String) # e.g. 'in_stock', 'near_expiry', 'disposed'

    batch = relationship("Batch", back_populates="inventory")
    owner = relationship("User")

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    shipment_type = Column(String) # e.g. "forward", "return", "disposal"
    from_role = Column(Enum(RoleEnum))
    from_id = Column(Integer, ForeignKey("users.id"))
    to_role = Column(Enum(RoleEnum))
    to_id = Column(Integer, ForeignKey("users.id"))
    batch_id = Column(Integer, ForeignKey("batches.id"))
    quantity = Column(Integer)
    shipment_qr = Column(String, unique=True)
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.CREATED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch")

class Proof(Base):
    __tablename__ = "proofs"
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=True)
    proof_type = Column(String) # "dispatch", "receipt", "disposal_before", "disposal_after", "disposal_video"
    file_path = Column(String)
    ai_verification_score = Column(Float, nullable=True)
    is_ai_generated = Column(Boolean, default=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

class DisposalRecord(Base):
    __tablename__ = "disposal_records"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    disposer_id = Column(Integer, ForeignKey("users.id"))
    before_photo_id = Column(Integer, ForeignKey("proofs.id"))
    after_photo_id = Column(Integer, ForeignKey("proofs.id"))
    video_id = Column(Integer, ForeignKey("proofs.id"))
    certificate_path = Column(String)
    disposed_at = Column(DateTime(timezone=True), server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    type = Column(String) # "near_expiry", "shipment_received", "fraud_detected", "smart_restock"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    retailer_id = Column(Integer, ForeignKey("users.id"), index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    medicine_name = Column(String, index=True)
    quantity = Column(Integer)
    sold_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RestockAlert(Base):
    __tablename__ = "restock_alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    user_role = Column(Enum(RoleEnum))
    medicine_name = Column(String, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    current_stock = Column(Integer)
    daily_velocity = Column(Float)
    days_left = Column(Float)
    suggested_quantity = Column(Integer)
    alert_type = Column(String) # "fast_moving_low_stock" or "frequent_stock_out"
    status = Column(String, default="active") # "active", "restock_pending", "dismissed"
    headline = Column(String)
    message = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class RestockOrder(Base):
    __tablename__ = "restock_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), index=True)
    requester_role = Column(Enum(RoleEnum))
    supplier_id = Column(Integer, ForeignKey("users.id"), index=True)
    supplier_role = Column(Enum(RoleEnum))
    medicine_name = Column(String, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    quantity = Column(Integer)
    status = Column(String, default="pending") # "pending", "restock_pending", "fulfilled", "cancelled"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
