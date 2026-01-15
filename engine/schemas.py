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
