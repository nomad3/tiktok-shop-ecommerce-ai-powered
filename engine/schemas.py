from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None
    price_cents: int
    main_image_url: Optional[str] = None
    trend_score: float = 0.0
    urgency_score: float = 0.0

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
