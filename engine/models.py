from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean, Index
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
    __table_args__ = (
        Index('ix_products_status', 'status'),
        Index('ix_products_trend_score', 'trend_score'),
        Index('ix_products_created_at', 'created_at'),
        Index('ix_products_status_trend', 'status', 'trend_score'),  # Composite for common queries
    )

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
    __table_args__ = (
        Index('ix_orders_status', 'status'),
        Index('ix_orders_created_at', 'created_at'),
        Index('ix_orders_email', 'email'),
        Index('ix_orders_status_created', 'status', 'created_at'),  # Composite for dashboard queries
    )

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
    __table_args__ = (
        Index('ix_trend_suggestions_status', 'status'),
        Index('ix_trend_suggestions_trend_score', 'trend_score'),
        Index('ix_trend_suggestions_created_at', 'created_at'),
    )

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
    __table_args__ = (
        Index('ix_trend_products_source', 'source'),
        Index('ix_trend_products_trend_score', 'trend_score'),
        Index('ix_trend_products_is_imported', 'is_imported'),
        Index('ix_trend_products_ai_recommendation', 'ai_recommendation'),
        Index('ix_trend_products_discovered_at', 'discovered_at'),
    )

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
    __table_args__ = (
        Index('ix_integrations_platform', 'platform'),
        Index('ix_integrations_is_active', 'is_active'),
        Index('ix_integrations_sync_status', 'sync_status'),
    )

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


class ChatSession(Base):
    """Customer support chat sessions."""
    __tablename__ = "chat_sessions"
    __table_args__ = (
        Index('ix_chat_sessions_status', 'status'),
        Index('ix_chat_sessions_customer_email', 'customer_email'),
        Index('ix_chat_sessions_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)
    customer_email = Column(String(255), nullable=True)
    customer_name = Column(String(255), nullable=True)

    status = Column(String(20), default="active")  # active, pending_escalation, escalated, resolved
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Associated ticket if escalated
    ticket_id = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    """Messages within a chat session."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))

    role = Column(String(20))  # 'user', 'assistant', 'system'
    content = Column(Text)
    metadata_json = Column(Text, nullable=True)  # JSON for confidence, intent, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    session = relationship("ChatSession", back_populates="messages")


class Notification(Base):
    """User notifications."""
    __tablename__ = "notifications"
    __table_args__ = (
        Index('ix_notifications_user_is_read', 'user_id', 'is_read'),
        Index('ix_notifications_user_created', 'user_id', 'created_at'),
        Index('ix_notifications_priority', 'priority'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), index=True)  # User identifier

    type = Column(String(50))  # 'order', 'alert', 'system', 'insight'
    title = Column(String(255))
    message = Column(Text)
    link = Column(Text, nullable=True)  # Optional link to related page

    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Priority: low, medium, high, urgent
    priority = Column(String(20), default="medium")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Supplier(Base):
    """Supplier information for dropshipping."""
    __tablename__ = "suppliers"
    __table_args__ = (
        Index('ix_suppliers_platform', 'platform'),
        Index('ix_suppliers_auto_order', 'auto_order_enabled'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    platform = Column(String(50), nullable=False)  # aliexpress, cj, printful, etc.

    # Contact info
    website_url = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)

    # API credentials (encrypted)
    api_credentials_encrypted = Column(Text, nullable=True)

    # Settings
    auto_order_enabled = Column(Boolean, default=False)
    max_order_value_cents = Column(Integer, default=10000)  # $100 default
    default_shipping_method = Column(String(50), nullable=True)

    # Reliability metrics
    reliability_score = Column(Float, default=5.0)  # 1-10 scale
    avg_shipping_days = Column(Float, nullable=True)
    total_orders = Column(Integer, default=0)
    successful_orders = Column(Integer, default=0)
    failed_orders = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product_links = relationship("ProductSupplier", back_populates="supplier")


class ProductSupplier(Base):
    """Link between products and their suppliers."""
    __tablename__ = "product_suppliers"
    __table_args__ = (
        Index('ix_product_suppliers_product', 'product_id'),
        Index('ix_product_suppliers_supplier', 'supplier_id'),
        Index('ix_product_suppliers_primary', 'is_primary'),
    )

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    # Supplier product info
    supplier_product_url = Column(Text, nullable=True)
    supplier_sku = Column(String(100), nullable=True)
    supplier_product_id = Column(String(100), nullable=True)

    # Pricing
    supplier_price_cents = Column(Integer, nullable=True)
    shipping_cost_cents = Column(Integer, nullable=True)
    total_cost_cents = Column(Integer, nullable=True)

    # Stock
    stock_quantity = Column(Integer, nullable=True)
    is_available = Column(Boolean, default=True)

    # Priority
    is_primary = Column(Boolean, default=True)
    priority = Column(Integer, default=1)

    # Last sync
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    last_ordered_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="product_links")


class FulfillmentRule(Base):
    """Rules for automatic order fulfillment."""
    __tablename__ = "fulfillment_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Condition type: order_value, product_status, customer_type, etc.
    condition_type = Column(String(50), nullable=False)
    condition_operator = Column(String(20), nullable=False)  # lt, gt, eq, contains
    condition_value = Column(String(255), nullable=False)

    # Action: auto_fulfill, hold_for_review, notify, reject
    action = Column(String(50), nullable=False)
    action_params = Column(Text, nullable=True)  # JSON for additional params

    # Rule settings
    priority = Column(Integer, default=1)
    is_enabled = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
