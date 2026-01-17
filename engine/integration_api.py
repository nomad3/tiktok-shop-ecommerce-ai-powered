"""Integration API endpoints for connecting to external e-commerce platforms."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

from database import get_db
from models import Integration
from services.shopify_service import create_shopify_service
from services.woocommerce_service import create_woocommerce_service

logger = logging.getLogger(__name__)

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
    """Test integration connection using the actual platform API."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    try:
        if integration.platform == "shopify":
            if not integration.access_token or not integration.store_url:
                integration.is_connected = False
                integration.sync_status = "error"
                integration.sync_error = "Missing store URL or access token"
                db.commit()
                return TestConnectionResponse(
                    success=False,
                    message="Missing store URL or access token"
                )

            service = create_shopify_service(integration.store_url, integration.access_token)
            result = await service.test_connection()

            integration.is_connected = result.success
            integration.sync_status = "ready" if result.success else "error"
            integration.sync_error = None if result.success else result.message
            db.commit()

            return TestConnectionResponse(
                success=result.success,
                message=result.message
            )

        elif integration.platform == "woocommerce":
            if not integration.api_key or not integration.api_secret or not integration.store_url:
                integration.is_connected = False
                integration.sync_status = "error"
                integration.sync_error = "Missing store URL or API credentials"
                db.commit()
                return TestConnectionResponse(
                    success=False,
                    message="Missing store URL or API credentials"
                )

            service = create_woocommerce_service(
                integration.store_url,
                integration.api_key,
                integration.api_secret
            )
            result = await service.test_connection()

            integration.is_connected = result.success
            integration.sync_status = "ready" if result.success else "error"
            integration.sync_error = None if result.success else result.message
            db.commit()

            return TestConnectionResponse(
                success=result.success,
                message=result.message
            )

        else:
            return TestConnectionResponse(
                success=False,
                message=f"Platform '{integration.platform}' connection testing not implemented"
            )

    except Exception as e:
        logger.error(f"Connection test error: {e}")
        integration.is_connected = False
        integration.sync_status = "error"
        integration.sync_error = str(e)
        db.commit()
        return TestConnectionResponse(
            success=False,
            message=f"Connection test failed: {str(e)}"
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
    """Trigger a sync for the integration using the actual platform API."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if not integration.is_connected:
        raise HTTPException(status_code=400, detail="Integration is not connected")

    # Update sync status
    integration.sync_status = "syncing"
    db.commit()

    products_count = 0
    orders_count = 0

    try:
        if integration.platform == "shopify":
            service = create_shopify_service(integration.store_url, integration.access_token)

            if sync_type in ["all", "products"]:
                products = await service.fetch_products(limit=100)
                products_count = len(products)
                logger.info(f"Synced {products_count} products from Shopify")

            if sync_type in ["all", "orders"]:
                orders = await service.fetch_orders(limit=100)
                orders_count = len(orders)
                logger.info(f"Synced {orders_count} orders from Shopify")

        elif integration.platform == "woocommerce":
            service = create_woocommerce_service(
                integration.store_url,
                integration.api_key,
                integration.api_secret
            )

            if sync_type in ["all", "products"]:
                products = await service.fetch_products(per_page=100)
                products_count = len(products)
                logger.info(f"Synced {products_count} products from WooCommerce")

            if sync_type in ["all", "orders"]:
                orders = await service.fetch_orders(per_page=100)
                orders_count = len(orders)
                logger.info(f"Synced {orders_count} orders from WooCommerce")

        # Update integration stats
        integration.sync_status = "synced"
        integration.last_sync_at = datetime.utcnow()
        integration.sync_error = None

        if sync_type in ["all", "products"]:
            integration.products_synced = products_count
        if sync_type in ["all", "orders"]:
            integration.orders_synced = orders_count

        db.commit()
        db.refresh(integration)

        return {
            "success": True,
            "message": "Sync completed",
            "products_synced": products_count,
            "orders_synced": orders_count
        }

    except Exception as e:
        logger.error(f"Sync error: {e}")
        integration.sync_status = "error"
        integration.sync_error = str(e)
        db.commit()

        return {
            "success": False,
            "message": f"Sync failed: {str(e)}",
            "products_synced": 0,
            "orders_synced": 0
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


class PushProductRequest(BaseModel):
    """Request to push a product to an integration."""
    title: str
    description: str
    price: float
    image_url: Optional[str] = None
    sku: Optional[str] = None
    inventory_quantity: int = 100


class PushProductResponse(BaseModel):
    """Response from pushing a product."""
    success: bool
    message: str
    external_id: Optional[str] = None
    external_url: Optional[str] = None


@router.post("/{integration_id}/push-product", response_model=PushProductResponse)
async def push_product(
    integration_id: int,
    request: PushProductRequest,
    db: Session = Depends(get_db)
):
    """Push a product to the connected platform."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if not integration.is_connected:
        raise HTTPException(status_code=400, detail="Integration is not connected")

    try:
        if integration.platform == "shopify":
            service = create_shopify_service(integration.store_url, integration.access_token)
            result = await service.create_product(
                title=request.title,
                description=request.description,
                price=request.price,
                image_url=request.image_url,
                inventory_quantity=request.inventory_quantity
            )

            if result:
                # Update products synced count
                integration.products_synced = (integration.products_synced or 0) + 1
                db.commit()

                return PushProductResponse(
                    success=True,
                    message="Product created successfully on Shopify",
                    external_id=str(result.get("id")),
                    external_url=f"https://{integration.store_url}/admin/products/{result.get('id')}"
                )
            else:
                return PushProductResponse(
                    success=False,
                    message="Failed to create product on Shopify"
                )

        elif integration.platform == "woocommerce":
            service = create_woocommerce_service(
                integration.store_url,
                integration.api_key,
                integration.api_secret
            )
            result = await service.create_product(
                name=request.title,
                description=request.description,
                regular_price=request.price,
                image_url=request.image_url,
                sku=request.sku or "",
                stock_quantity=request.inventory_quantity
            )

            if result:
                # Update products synced count
                integration.products_synced = (integration.products_synced or 0) + 1
                db.commit()

                return PushProductResponse(
                    success=True,
                    message="Product created successfully on WooCommerce",
                    external_id=str(result.get("id")),
                    external_url=result.get("permalink")
                )
            else:
                return PushProductResponse(
                    success=False,
                    message="Failed to create product on WooCommerce"
                )

        else:
            return PushProductResponse(
                success=False,
                message=f"Platform '{integration.platform}' does not support product push"
            )

    except Exception as e:
        logger.error(f"Push product error: {e}")
        return PushProductResponse(
            success=False,
            message=f"Failed to push product: {str(e)}"
        )


@router.get("/{integration_id}/products")
async def get_integration_products(
    integration_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Fetch products from the connected platform."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if not integration.is_connected:
        raise HTTPException(status_code=400, detail="Integration is not connected")

    try:
        if integration.platform == "shopify":
            service = create_shopify_service(integration.store_url, integration.access_token)
            products = await service.fetch_products(limit=limit)
            return {
                "success": True,
                "products": [
                    {
                        "id": p.id,
                        "title": p.title,
                        "description": p.description,
                        "images": p.images,
                        "variants": p.variants,
                        "status": p.status
                    }
                    for p in products
                ]
            }

        elif integration.platform == "woocommerce":
            service = create_woocommerce_service(
                integration.store_url,
                integration.api_key,
                integration.api_secret
            )
            products = await service.fetch_products(per_page=limit)
            return {
                "success": True,
                "products": [
                    {
                        "id": p.id,
                        "title": p.name,
                        "description": p.description,
                        "price": p.price,
                        "images": p.images,
                        "status": p.status
                    }
                    for p in products
                ]
            }

        else:
            return {
                "success": False,
                "message": f"Platform '{integration.platform}' not supported",
                "products": []
            }

    except Exception as e:
        logger.error(f"Fetch products error: {e}")
        return {
            "success": False,
            "message": str(e),
            "products": []
        }


@router.get("/{integration_id}/orders")
async def get_integration_orders(
    integration_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Fetch orders from the connected platform."""
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if not integration.is_connected:
        raise HTTPException(status_code=400, detail="Integration is not connected")

    try:
        if integration.platform == "shopify":
            service = create_shopify_service(integration.store_url, integration.access_token)
            orders = await service.fetch_orders(limit=limit)
            return {
                "success": True,
                "orders": [
                    {
                        "id": o.id,
                        "order_number": o.order_number,
                        "email": o.email,
                        "total_price": o.total_price,
                        "currency": o.currency,
                        "financial_status": o.financial_status,
                        "fulfillment_status": o.fulfillment_status,
                        "line_items": o.line_items,
                        "created_at": o.created_at
                    }
                    for o in orders
                ]
            }

        elif integration.platform == "woocommerce":
            service = create_woocommerce_service(
                integration.store_url,
                integration.api_key,
                integration.api_secret
            )
            orders = await service.fetch_orders(per_page=limit)
            return {
                "success": True,
                "orders": [
                    {
                        "id": o.id,
                        "order_number": o.order_number,
                        "email": o.customer_email,
                        "customer_name": o.customer_name,
                        "total": o.total,
                        "currency": o.currency,
                        "status": o.status,
                        "line_items": o.line_items,
                        "created_at": o.created_at
                    }
                    for o in orders
                ]
            }

        else:
            return {
                "success": False,
                "message": f"Platform '{integration.platform}' not supported",
                "orders": []
            }

    except Exception as e:
        logger.error(f"Fetch orders error: {e}")
        return {
            "success": False,
            "message": str(e),
            "orders": []
        }
