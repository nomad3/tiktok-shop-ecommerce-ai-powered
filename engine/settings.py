from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from database import SessionLocal, Base
from sqlalchemy import Column, Integer, String, Text, DateTime

router = APIRouter()


# Store Settings Model (create if not exists)
class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(100), default="My Store")
    store_logo_url = Column(Text, nullable=True)
    store_favicon_url = Column(Text, nullable=True)
    primary_color = Column(String(7), default="#FE2C55")
    accent_color = Column(String(7), default="#25F4EE")
    contact_email = Column(String(255), nullable=True)
    social_instagram = Column(Text, nullable=True)
    social_tiktok = Column(Text, nullable=True)
    social_facebook = Column(Text, nullable=True)
    social_twitter = Column(Text, nullable=True)
    shipping_policy = Column(Text, nullable=True)
    return_policy = Column(Text, nullable=True)
    privacy_policy = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# Pydantic schemas
class StoreSettingsSchema(BaseModel):
    store_name: Optional[str] = "My Store"
    store_logo_url: Optional[str] = None
    store_favicon_url: Optional[str] = None
    primary_color: Optional[str] = "#FE2C55"
    accent_color: Optional[str] = "#25F4EE"
    contact_email: Optional[str] = None
    social_instagram: Optional[str] = None
    social_tiktok: Optional[str] = None
    social_facebook: Optional[str] = None
    social_twitter: Optional[str] = None
    shipping_policy: Optional[str] = None
    return_policy: Optional[str] = None
    privacy_policy: Optional[str] = None

    class Config:
        from_attributes = True


class StoreSettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    store_favicon_url: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    contact_email: Optional[str] = None
    social_instagram: Optional[str] = None
    social_tiktok: Optional[str] = None
    social_facebook: Optional[str] = None
    social_twitter: Optional[str] = None
    shipping_policy: Optional[str] = None
    return_policy: Optional[str] = None
    privacy_policy: Optional[str] = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_or_create_settings(db: Session) -> StoreSettings:
    """Get existing settings or create default ones."""
    settings = db.query(StoreSettings).first()
    if not settings:
        settings = StoreSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=StoreSettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    """Get current store settings."""
    settings = get_or_create_settings(db)
    return settings


@router.put("", response_model=StoreSettingsSchema)
def update_settings(update: StoreSettingsUpdate, db: Session = Depends(get_db)):
    """Update store settings."""
    settings = get_or_create_settings(db)

    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(settings, key, value)

    db.commit()
    db.refresh(settings)

    return settings
