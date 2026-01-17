"""Integration API endpoints for connecting to external e-commerce platforms."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Integration

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


# ============== Schemas ==============

class IntegrationCreate(BaseModel):
    platform: str
    name: str
    store_url: str
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    store_url: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None
    auto_sync_products: Optional[bool] = None
    auto_sync_orders: Optional[bool] = None
    sync_interval_minutes: Optional[int] = None


class IntegrationResponse(BaseModel):
    id: int
    platform: str
    name: str
    store_url: Optional[str]
    is_active: bool
    is_connected: bool
    last_sync_at: Optional[datetime]
    sync_status: str
    sync_error: Optional[str]
    auto_sync_products: bool
    auto_sync_orders: bool
    sync_interval_minutes: int
    products_synced: int
    orders_synced: int
    created_at: datetime

    class Config:
        from_attributes = True


class PlatformInfo(BaseModel):
    id: str
    name: str
    description: str
    status: str  # available, coming_soon, planned
    features: List[str]
    setup_fields: List[dict]


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


# ============== Platform Definitions ==============

SUPPORTED_PLATFORMS = [
    {
        "id": "shopify",
        "name": "Shopify",
        "description": "Sync products and orders with your Shopify store",
        "status": "available",
        "features": ["product_sync", "order_sync", "inventory_sync"],
        "setup_fields": [
            {"name": "store_url", "label": "Store URL", "type": "text", "placeholder": "your-store.myshopify.com", "required": True},
            {"name": "access_token", "label": "Access Token", "type": "password", "placeholder": "shpat_...", "required": True},
        ]
    },
    {
        "id": "woocommerce",
        "name": "WooCommerce",
        "description": "Connect your WordPress WooCommerce store",
        "status": "available",
        "features": ["product_sync", "order_sync", "inventory_sync"],
        "setup_fields": [
            {"name": "store_url", "label": "Store URL", "type": "text", "placeholder": "https://your-store.com", "required": True},
            {"name": "api_key", "label": "Consumer Key", "type": "password", "placeholder": "ck_...", "required": True},
            {"name": "api_secret", "label": "Consumer Secret", "type": "password", "placeholder": "cs_...", "required": True},
        ]
    },
    {
        "id": "tiktok_shop",
        "name": "TikTok Shop",
        "description": "Sell directly on TikTok",
        "status": "coming_soon",
        "features": ["product_sync", "order_sync", "live_shopping"],
        "setup_fields": []
    },
    {
        "id": "amazon",
        "name": "Amazon Seller",
        "description": "Expand to Amazon marketplace",
        "status": "planned",
        "features": ["product_sync", "order_sync", "fba_integration"],
        "setup_fields": []
    },
    {
        "id": "ebay",
        "name": "eBay",
        "description": "List products on eBay",
        "status": "planned",
        "features": ["product_sync", "order_sync"],
        "setup_fields": []
    },
]


# ============== Endpoints ==============

@router.get("/platforms", response_model=List[PlatformInfo])
async def list_platforms():
    """List all supported e-commerce platforms."""
    return SUPPORTED_PLATFORMS


@router.get("/", response_model=List[IntegrationResponse])
async def list_integrations(db: Session = Depends(get_db)):
    """List all connected integrations."""
    integrations = db.query(Integration).filter(Integration.is_active == True).all()
    return integrations


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(integration_id: int, db: Session = Depends(get_db)):
    """Get a single integration by ID."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@router.post("/connect", response_model=IntegrationResponse)
async def connect_integration(
    request: IntegrationCreate,
    db: Session = Depends(get_db)
):
    """Connect a new integration."""
    # Check if platform is supported
    platform_ids = [p["id"] for p in SUPPORTED_PLATFORMS if p["status"] == "available"]
    if request.platform not in platform_ids:
        raise HTTPException(status_code=400, detail=f"Platform '{request.platform}' is not available")

    # Check if already connected
    existing = db.query(Integration).filter(
        Integration.platform == request.platform,
        Integration.store_url == request.store_url,
        Integration.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This store is already connected")

    # Create integration
    integration = Integration(
        platform=request.platform,
        name=request.name,
        store_url=request.store_url,
        api_key=request.api_key,
        api_secret=request.api_secret,
        access_token=request.access_token,
        is_active=True,
        is_connected=False,
        sync_status="pending"
    )

    db.add(integration)
    db.commit()
    db.refresh(integration)

    return integration


@router.post("/{integration_id}/test", response_model=TestConnectionResponse)
async def test_connection(integration_id: int, db: Session = Depends(get_db)):
    """Test integration connection."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    # In production, this would actually test the connection
    # For demo, we'll simulate success if credentials are present
    has_credentials = bool(
        (integration.platform == "shopify" and integration.access_token) or
        (integration.platform == "woocommerce" and integration.api_key and integration.api_secret)
    )

    if has_credentials:
        integration.is_connected = True
        integration.sync_status = "synced"
        integration.sync_error = None
        db.commit()
        return TestConnectionResponse(
            success=True,
            message="Successfully connected to store"
        )
    else:
        integration.is_connected = False
        integration.sync_status = "error"
        integration.sync_error = "Missing credentials"
        db.commit()
        return TestConnectionResponse(
            success=False,
            message="Connection failed: Missing required credentials"
        )


@router.patch("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: int,
    request: IntegrationUpdate,
    db: Session = Depends(get_db)
):
    """Update integration settings."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(integration, key, value)

    db.commit()
    db.refresh(integration)
    return integration


@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: int, db: Session = Depends(get_db)):
    """Disconnect (soft delete) an integration."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration.is_active = False
    integration.is_connected = False
    db.commit()

    return {"success": True, "message": f"Disconnected {integration.name}"}


@router.post("/{integration_id}/sync")
async def trigger_sync(
    integration_id: int,
    sync_type: str = "all",  # all, products, orders
    db: Session = Depends(get_db)
):
    """Trigger a sync for the integration."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if not integration.is_connected:
        raise HTTPException(status_code=400, detail="Integration is not connected")

    # Update sync status
    integration.sync_status = "syncing"
    db.commit()

    # In production, this would trigger actual sync
    # For demo, simulate successful sync
    import random
    integration.sync_status = "synced"
    integration.last_sync_at = datetime.utcnow()

    if sync_type in ["all", "products"]:
        integration.products_synced = random.randint(10, 100)
    if sync_type in ["all", "orders"]:
        integration.orders_synced = random.randint(5, 50)

    db.commit()
    db.refresh(integration)

    return {
        "success": True,
        "message": f"Sync completed",
        "products_synced": integration.products_synced,
        "orders_synced": integration.orders_synced
    }


@router.get("/{integration_id}/stats")
async def get_integration_stats(integration_id: int, db: Session = Depends(get_db)):
    """Get sync statistics for an integration."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    return {
        "platform": integration.platform,
        "is_connected": integration.is_connected,
        "sync_status": integration.sync_status,
        "last_sync_at": integration.last_sync_at,
        "products_synced": integration.products_synced,
        "orders_synced": integration.orders_synced,
        "sync_error": integration.sync_error
    }
