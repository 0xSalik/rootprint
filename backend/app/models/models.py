import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from app.core.config import settings

# Vector dimension is driven by the AI core's embedder. Default 384 matches
# `intfloat/multilingual-e5-small`. If you switch to OpenAI's
# `text-embedding-3-small` (1536) or Jina v3 (1024), set
# HUNARMAND_EMBEDDING_DIMENSIONS to match BEFORE running migrations,
# and run an alembic upgrade so the column is recreated at the new dim.
EMBEDDING_DIM: int = settings.HUNARMAND_EMBEDDING_DIMENSIONS

class Master(Base):
    __tablename__ = "masters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    lineage_id = Column(String)
    workshop_location = Column(String)
    bio = Column(Text)
    ed25519_public_key = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vaults = relationship("Vault", back_populates="master")
    craft_dnas = relationship("CraftDNA", back_populates="master")
    sanads = relationship("Sanad", back_populates="master")
    workshops = relationship("Workshop", back_populates="master")


class Vault(Base):
    __tablename__ = "vaults"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    master_id = Column(UUID(as_uuid=True), ForeignKey("masters.id"), nullable=False)
    media_s3_key = Column(String)
    status = Column(String, default="pending") # pending, processing, completed
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    master = relationship("Master", back_populates="vaults")
    craft_dna = relationship("CraftDNA", back_populates="vault", uselist=False)


class CraftDNA(Base):
    __tablename__ = "craft_dnas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    master_id = Column(UUID(as_uuid=True), ForeignKey("masters.id"), nullable=False)
    vault_id = Column(UUID(as_uuid=True), ForeignKey("vaults.id"), nullable=False)
    
    technique_name = Column(String)
    transcript = Column(Text)
    translated_transcript = Column(Text)
    technique_graph = Column(JSONB)
    supplier_graph = Column(JSONB)
    
    # Driven by HUNARMAND_EMBEDDING_DIMENSIONS (default 384 for
    # intfloat/multilingual-e5-small in the AI core). pgvector enforces
    # this at the column level; switching providers requires an alembic
    # upgrade.
    embedding = Column(Vector(EMBEDDING_DIM))
    
    created_at = Column(DateTime, default=datetime.utcnow)

    master = relationship("Master", back_populates="craft_dnas")
    vault = relationship("Vault", back_populates="craft_dna")
    sanads = relationship("Sanad", back_populates="craft_dna")


class Sanad(Base):
    __tablename__ = "sanads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    master_id = Column(UUID(as_uuid=True), ForeignKey("masters.id"), nullable=False)
    craft_dna_id = Column(UUID(as_uuid=True), ForeignKey("craft_dnas.id"), nullable=True)
    
    piece_name = Column(String, nullable=False)
    material_origin = Column(String)
    crypto_signature = Column(String)
    metadata_json = Column(JSONB)
    is_public = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    master = relationship("Master", back_populates="sanads")
    craft_dna = relationship("CraftDNA", back_populates="sanads")


class Workshop(Base):
    __tablename__ = "workshops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    master_id = Column(UUID(as_uuid=True), ForeignKey("masters.id"), nullable=False)
    format = Column(String) # E.g., Master Session, Half-Day
    price = Column(Float)
    duration_mins = Column(Integer)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    master = relationship("Master", back_populates="workshops")
    bookings = relationship("Booking", back_populates="workshop")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    workshop_id = Column(UUID(as_uuid=True), ForeignKey("workshops.id"), nullable=False)
    user_phone = Column(String, nullable=False)
    booking_date = Column(DateTime, nullable=False)
    status = Column(String, default="confirmed")
    payment_id = Column(String)
    num_participants = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    workshop = relationship("Workshop", back_populates="bookings")


class Bundle(Base):
    __tablename__ = "bundles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Float)
    # Using ARRAY of UUIDs to store references to Sanad items
    sanad_ids = Column(ARRAY(UUID(as_uuid=True))) 
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    bundle_id = Column(UUID(as_uuid=True), ForeignKey("bundles.id"))
    user_phone = Column(String, nullable=False)
    status = Column(String, default="pending")
    shipping_address = Column(Text)
    payment_id = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
