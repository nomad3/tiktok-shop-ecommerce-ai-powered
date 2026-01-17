from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

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

    # Supplier Information
    supplier_url = Column(Text, nullable=True)
    supplier_name = Column(String(100), nullable=True)
    supplier_cost_cents = Column(Integer, nullable=True)
    profit_margin = Column(Float, nullable=True)
    import_source = Column(String(50), default="manual")  # 'tiktok', 'aliexpress', 'manual'

    # Legacy field (kept for compatibility)
    supplier_info = Column(Text, nullable=True)

    # Metadata
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
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    email = Column(String, nullable=False)
    amount_cents = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    stripe_session_id = Column(String, nullable=True)

    # Fulfillment
    tracking_number = Column(String(100), nullable=True)
    tracking_url = Column(Text, nullable=True)
    supplier_order_id = Column(String(100), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Shipping address (stored as JSON or simple text)
    shipping_address = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    product = relationship("Product", backref="orders")


class SuggestionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TrendSuggestion(Base):
    """AI-generated product suggestions from trend analysis."""
    __tablename__ = "trend_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    hashtag = Column(String, nullable=False)
    views = Column(Integer, default=0)
    growth_rate = Column(Float, default=0.0)
    engagement = Column(Integer, default=0)
    video_count = Column(Integer, default=0)

    # AI Scores
    trend_score = Column(Float, default=0.0)
    urgency_score = Column(Float, default=0.0)
    ai_reasoning = Column(Text, nullable=True)

    # AI Suggestions
    suggested_name = Column(String, nullable=True)
    suggested_description = Column(Text, nullable=True)
    suggested_price_cents = Column(Integer, nullable=True)

    # Status
    status = Column(String, default=SuggestionStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Link to created product (if approved)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)


class ProductView(Base):
    """Track product page views for conversion analytics."""
    __tablename__ = "product_views"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    session_id = Column(String, nullable=True)  # For unique visitor tracking
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())


class TrendVelocity(str, enum.Enum):
    RISING = "rising"
    STABLE = "stable"
    DECLINING = "declining"


class AIRecommendation(str, enum.Enum):
    IMPORT = "import"
    WATCH = "watch"
    SKIP = "skip"


class TrendProduct(Base):
    """Products discovered from trend analysis - ready for import."""
    __tablename__ = "trend_products"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)

    # Source & Category
    source = Column(String(50), nullable=False)  # 'tiktok', 'instagram', 'aliexpress'
    category = Column(String(100), nullable=True)

    # Trend Metrics
    trend_score = Column(Float, default=0.0)
    trend_velocity = Column(String(20), default=TrendVelocity.STABLE)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)

    # Pricing
    supplier_url = Column(Text, nullable=True)
    supplier_price_cents = Column(Integer, nullable=True)
    suggested_price_cents = Column(Integer, nullable=True)
    estimated_margin = Column(Float, nullable=True)

    # AI Analysis
    ai_recommendation = Column(String(20), nullable=True)  # 'import', 'watch', 'skip'
    ai_reasoning = Column(Text, nullable=True)

    # Import Status
    is_imported = Column(Boolean, default=False)
    imported_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    # Timestamps
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class IntegrationPlatform(str, enum.Enum):
    SHOPIFY = "shopify"
    WOOCOMMERCE = "woocommerce"
    TIKTOK_SHOP = "tiktok_shop"
    AMAZON = "amazon"
    EBAY = "ebay"


class Integration(Base):
    """Store integrations with external e-commerce platforms."""
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)  # 'shopify', 'woocommerce', etc.
    name = Column(String(100))  # User-friendly name
    store_url = Column(Text)

    # Credentials (stored encrypted in production)
    api_key = Column(Text, nullable=True)
    api_secret = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=False)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    sync_status = Column(String(20), default="pending")  # pending, syncing, synced, error
    sync_error = Column(Text, nullable=True)

    # Settings
    auto_sync_products = Column(Boolean, default=True)
    auto_sync_orders = Column(Boolean, default=True)
    sync_interval_minutes = Column(Integer, default=30)

    # Stats
    products_synced = Column(Integer, default=0)
    orders_synced = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
