from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class ProductStatus(str, enum.Enum):
    TESTING = "testing"
    LIVE = "live"
    PAUSED = "paused"
    KILLED = "killed"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price_cents = Column(Integer, nullable=False)
    cost_cents = Column(Integer, nullable=True)

    # Media
    main_image_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)

    # Urgency & Status
    status = Column(String, default=ProductStatus.TESTING) # stored as string for sqlite compatibility
    trend_score = Column(Float, default=0.0)
    urgency_score = Column(Float, default=0.0)

    # Metadata
    supplier_info = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TrendSignal(Base):
    __tablename__ = "trend_signals"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True) # Can be null if signal not yet linked to product

    source = Column(String, nullable=False) # tiktok, amazon, google
    metric = Column(String, nullable=False) # views, growth, comments
    value = Column(Float, nullable=False)

    raw_data = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    email = Column(String, nullable=False)
    amount_cents = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    stripe_session_id = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
