"""Pydantic schemas for request/response validation.

Provides comprehensive input validation with field constraints,
regex patterns, and custom validators.
"""

from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
import re


# ============== Validation Helpers ==============

def validate_slug(value: str) -> str:
    """Validate slug format (lowercase, alphanumeric, hyphens only)."""
    if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', value):
        raise ValueError('Slug must be lowercase alphanumeric with hyphens only')
    if len(value) < 3:
        raise ValueError('Slug must be at least 3 characters')
    if len(value) > 100:
        raise ValueError('Slug must be at most 100 characters')
    return value


def validate_url(value: Optional[str]) -> Optional[str]:
    """Validate URL format."""
    if value is None or value == '':
        return None
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    if not url_pattern.match(value):
        raise ValueError('Invalid URL format')
    return value


def validate_price(value: int) -> int:
    """Validate price is non-negative."""
    if value < 0:
        raise ValueError('Price cannot be negative')
    if value > 1000000000:  # $10M max
        raise ValueError('Price exceeds maximum allowed value')
    return value


def validate_score(value: float) -> float:
    """Validate score is between 0 and 100."""
    if value < 0:
        raise ValueError('Score cannot be negative')
    if value > 100:
        raise ValueError('Score cannot exceed 100')
    return value


# ============== Product Schemas ==============

class ProductBase(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None
    price_cents: int
    main_image_url: Optional[str] = None
    trend_score: float = 0.0
    urgency_score: float = 0.0
    supplier_url: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_cost_cents: Optional[int] = None
    profit_margin: Optional[float] = None
    import_source: Optional[str] = "manual"

    @field_validator('slug')
    @classmethod
    def validate_slug_field(cls, v: str) -> str:
        return validate_slug(v)

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if len(v) > 255:
            raise ValueError('Name must be at most 255 characters')
        return v.strip()

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 10000:
            raise ValueError('Description must be at most 10000 characters')
        return v

    @field_validator('price_cents')
    @classmethod
    def validate_price_field(cls, v: int) -> int:
        return validate_price(v)

    @field_validator('main_image_url', 'supplier_url')
    @classmethod
    def validate_url_field(cls, v: Optional[str]) -> Optional[str]:
        return validate_url(v)

    @field_validator('trend_score', 'urgency_score')
    @classmethod
    def validate_score_field(cls, v: float) -> float:
        return validate_score(v)

    @field_validator('supplier_cost_cents')
    @classmethod
    def validate_supplier_cost(cls, v: Optional[int]) -> Optional[int]:
        if v is not None:
            return validate_price(v)
        return v

    @field_validator('profit_margin')
    @classmethod
    def validate_margin(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -100 or v > 1000):
            raise ValueError('Profit margin must be between -100% and 1000%')
        return v

    @field_validator('import_source')
    @classmethod
    def validate_import_source(cls, v: Optional[str]) -> Optional[str]:
        valid_sources = ['tiktok', 'aliexpress', 'manual', 'shopify', 'woocommerce']
        if v and v.lower() not in valid_sources:
            raise ValueError(f'Import source must be one of: {valid_sources}')
        return v.lower() if v else 'manual'


class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    product_id: int
    email: str
    amount_cents: int

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        if not email_pattern.match(v):
            raise ValueError('Invalid email format')
        return v.lower()

    @field_validator('product_id')
    @classmethod
    def validate_product_id(cls, v: int) -> int:
        if v < 1:
            raise ValueError('Product ID must be positive')
        return v

    @field_validator('amount_cents')
    @classmethod
    def validate_amount(cls, v: int) -> int:
        return validate_price(v)

class CheckoutSessionRequest(BaseModel):
    product_id: int
    quantity: int = 1

class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


# Trend Signal schemas
class TrendSignalBase(BaseModel):
    source: str
    metric: str
    value: float
    raw_data: Optional[str] = None

class TrendSignalCreate(TrendSignalBase):
    product_id: Optional[int] = None

class TrendSignal(TrendSignalBase):
    id: int
    product_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Scoring schemas
class ScoringRequest(BaseModel):
    hashtag: str
    views: int = 0
    growth_rate: float = 0.0
    engagement: int = 0
    video_count: int = 0

class ScoringResponse(BaseModel):
    trend_score: float
    urgency_score: float
    reasoning: str
    suggested_name: Optional[str] = None
    suggested_description: Optional[str] = None


# Ingest response
class IngestResponse(BaseModel):
    trends_fetched: int
    products_created: int
    signals_stored: int


# ============ ADMIN SCHEMAS ============

class TrendSuggestionBase(BaseModel):
    hashtag: str
    views: int = 0
    growth_rate: float = 0.0
    engagement: int = 0
    video_count: int = 0
    trend_score: float = 0.0
    urgency_score: float = 0.0
    ai_reasoning: Optional[str] = None
    suggested_name: Optional[str] = None
    suggested_description: Optional[str] = None
    suggested_price_cents: Optional[int] = None


class TrendSuggestionCreate(TrendSuggestionBase):
    pass


class TrendSuggestion(TrendSuggestionBase):
    id: int
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    product_id: Optional[int] = None

    class Config:
        from_attributes = True


class ApproveRequest(BaseModel):
    price_cents: Optional[int] = None  # Override suggested price
    name: Optional[str] = None  # Override suggested name


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_cents: Optional[int] = None
    status: Optional[str] = None
    main_image_url: Optional[str] = None
    supplier_url: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_cost_cents: Optional[int] = None
    profit_margin: Optional[float] = None
    import_source: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters')
            if len(v) > 255:
                raise ValueError('Name must be at most 255 characters')
            return v.strip()
        return v

    @field_validator('price_cents', 'supplier_cost_cents')
    @classmethod
    def validate_price_field(cls, v: Optional[int]) -> Optional[int]:
        if v is not None:
            return validate_price(v)
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = ['testing', 'live', 'paused', 'killed']
            if v.lower() not in valid_statuses:
                raise ValueError(f'Status must be one of: {valid_statuses}')
            return v.lower()
        return v

    @field_validator('main_image_url', 'supplier_url')
    @classmethod
    def validate_url_field(cls, v: Optional[str]) -> Optional[str]:
        return validate_url(v)


class Order(BaseModel):
    id: int
    product_id: Optional[int]
    email: str
    amount_cents: int
    status: str
    stripe_session_id: Optional[str]
    created_at: datetime
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class AdminStats(BaseModel):
    orders_today: int
    revenue_today_cents: int
    total_products: int
    live_products: int
    pending_suggestions: int
    views_today: int
    conversion_rate: float


class OrderStatusUpdate(BaseModel):
    status: str

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        if v.lower() not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}')
        return v.lower()


class OrderTrackingUpdate(BaseModel):
    tracking_number: str
    tracking_url: Optional[str] = None

    @field_validator('tracking_number')
    @classmethod
    def validate_tracking_number(cls, v: str) -> str:
        if not v or len(v.strip()) < 5:
            raise ValueError('Tracking number must be at least 5 characters')
        if len(v) > 100:
            raise ValueError('Tracking number must be at most 100 characters')
        return v.strip()

    @field_validator('tracking_url')
    @classmethod
    def validate_tracking_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_url(v)
