# Phase 3: Integrations

**Duration:** Week 3-4
**Goal:** Build integration layer for Shopify, WooCommerce with product/order sync

---

## 3.1 Integration Architecture

### Tasks

**3.1.1 Create base integration class**
- File: `engine/integrations/base.py`
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime

class BaseIntegration(ABC):
    """Abstract base class for all e-commerce integrations"""

    def __init__(self, integration_id: int, credentials: dict):
        self.integration_id = integration_id
        self.credentials = credentials

    @abstractmethod
    async def test_connection(self) -> bool:
        """Test if credentials are valid"""
        pass

    @abstractmethod
    async def get_products(self, limit: int = 100, cursor: str = None) -> dict:
        """Fetch products from platform"""
        pass

    @abstractmethod
    async def create_product(self, product_data: dict) -> dict:
        """Create product on platform"""
        pass

    @abstractmethod
    async def update_product(self, external_id: str, product_data: dict) -> dict:
        """Update existing product"""
        pass

    @abstractmethod
    async def delete_product(self, external_id: str) -> bool:
        """Delete product from platform"""
        pass

    @abstractmethod
    async def get_orders(self, since: datetime = None, limit: int = 100) -> List[dict]:
        """Fetch orders from platform"""
        pass

    @abstractmethod
    async def update_order_status(self, external_id: str, status: str, tracking: dict = None) -> dict:
        """Update order status and tracking"""
        pass

    @abstractmethod
    async def get_inventory(self, product_ids: List[str] = None) -> List[dict]:
        """Get inventory levels"""
        pass

    @abstractmethod
    async def update_inventory(self, external_id: str, quantity: int) -> dict:
        """Update inventory level"""
        pass

    # Common utilities
    def map_product_to_platform(self, product: dict) -> dict:
        """Map internal product to platform format"""
        raise NotImplementedError

    def map_product_from_platform(self, external_product: dict) -> dict:
        """Map platform product to internal format"""
        raise NotImplementedError

    def map_order_from_platform(self, external_order: dict) -> dict:
        """Map platform order to internal format"""
        raise NotImplementedError
```

**3.1.2 Create integration models**
- File: `engine/models.py` (extend)
```python
class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True)
    platform = Column(String(50), nullable=False)  # 'shopify', 'woocommerce', etc.
    name = Column(String(100))  # User-friendly name
    store_url = Column(Text)

    # Encrypted credentials
    api_key_encrypted = Column(Text)
    api_secret_encrypted = Column(Text)
    access_token_encrypted = Column(Text)
    refresh_token_encrypted = Column(Text)
    token_expires_at = Column(DateTime)

    # Status
    is_active = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=False)
    last_sync_at = Column(DateTime)
    sync_status = Column(String(20), default='pending')  # pending, syncing, synced, error
    sync_error = Column(Text)

    # Settings
    auto_sync_products = Column(Boolean, default=True)
    auto_sync_orders = Column(Boolean, default=True)
    auto_sync_inventory = Column(Boolean, default=True)
    sync_interval_minutes = Column(Integer, default=30)

    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    channel_listings = relationship("ProductChannelListing", back_populates="integration")
    channel_orders = relationship("ChannelOrder", back_populates="integration")


class ProductChannelListing(Base):
    __tablename__ = "product_channel_listings"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    integration_id = Column(Integer, ForeignKey('integrations.id'), nullable=False)

    external_product_id = Column(String(100))
    external_variant_id = Column(String(100))
    external_url = Column(Text)

    # Channel-specific pricing
    channel_price_cents = Column(Integer)
    channel_compare_at_price_cents = Column(Integer)

    # Status
    is_published = Column(Boolean, default=False)
    last_synced_at = Column(DateTime)
    sync_status = Column(String(20), default='pending')
    sync_error = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="channel_listings")
    integration = relationship("Integration", back_populates="channel_listings")

    __table_args__ = (UniqueConstraint('product_id', 'integration_id'),)


class ChannelOrder(Base):
    __tablename__ = "channel_orders"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    integration_id = Column(Integer, ForeignKey('integrations.id'), nullable=False)

    external_order_id = Column(String(100))
    external_order_number = Column(String(50))

    # Financial
    channel_fee_cents = Column(Integer)
    channel_tax_cents = Column(Integer)

    # Raw data for debugging
    raw_data = Column(JSON)

    # Timestamps
    created_at = Column(DateTime, default=func.now())

    # Relationships
    order = relationship("Order", back_populates="channel_order")
    integration = relationship("Integration", back_populates="channel_orders")
```

**3.1.3 Create encryption utility**
- File: `engine/utils/encryption.py`
```python
from cryptography.fernet import Fernet
import os

class CredentialEncryption:
    def __init__(self):
        self.key = os.environ.get('ENCRYPTION_KEY')
        if not self.key:
            raise ValueError("ENCRYPTION_KEY not set")
        self.fernet = Fernet(self.key.encode())

    def encrypt(self, data: str) -> str:
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        return self.fernet.decrypt(encrypted_data.encode()).decode()
```

**3.1.4 Create integration factory**
- File: `engine/integrations/factory.py`
```python
from .shopify import ShopifyIntegration
from .woocommerce import WooCommerceIntegration

class IntegrationFactory:
    _integrations = {
        'shopify': ShopifyIntegration,
        'woocommerce': WooCommerceIntegration,
    }

    @classmethod
    def create(cls, platform: str, integration_id: int, credentials: dict):
        if platform not in cls._integrations:
            raise ValueError(f"Unknown platform: {platform}")
        return cls._integrations[platform](integration_id, credentials)

    @classmethod
    def supported_platforms(cls) -> list:
        return list(cls._integrations.keys())
```

### Files to Create
- `engine/integrations/__init__.py`
- `engine/integrations/base.py`
- `engine/integrations/factory.py`
- `engine/utils/__init__.py`
- `engine/utils/encryption.py`

### Files to Modify
- `engine/models.py` - Add integration models

---

## 3.2 Shopify Integration

### Tasks

**3.2.1 Create Shopify client**
- File: `engine/integrations/shopify/client.py`
```python
import httpx
from typing import Optional, List

class ShopifyClient:
    """Low-level Shopify API client"""

    API_VERSION = "2024-01"

    def __init__(self, store_url: str, access_token: str):
        self.store_url = store_url.rstrip('/')
        self.access_token = access_token
        self.base_url = f"https://{self.store_url}/admin/api/{self.API_VERSION}"

    @property
    def headers(self):
        return {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }

    async def get(self, endpoint: str, params: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/{endpoint}",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()

    async def post(self, endpoint: str, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/{endpoint}",
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            return response.json()

    async def put(self, endpoint: str, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/{endpoint}",
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            return response.json()

    async def delete(self, endpoint: str) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/{endpoint}",
                headers=self.headers
            )
            return response.status_code == 200

    # Product methods
    async def get_products(self, limit: int = 50, cursor: str = None) -> dict:
        params = {"limit": limit}
        if cursor:
            params["page_info"] = cursor
        return await self.get("products.json", params)

    async def create_product(self, product_data: dict) -> dict:
        return await self.post("products.json", {"product": product_data})

    async def update_product(self, product_id: str, product_data: dict) -> dict:
        return await self.put(f"products/{product_id}.json", {"product": product_data})

    async def delete_product(self, product_id: str) -> bool:
        return await self.delete(f"products/{product_id}.json")

    # Order methods
    async def get_orders(self, status: str = "any", limit: int = 50) -> dict:
        return await self.get("orders.json", {"status": status, "limit": limit})

    async def get_order(self, order_id: str) -> dict:
        return await self.get(f"orders/{order_id}.json")

    async def update_order(self, order_id: str, data: dict) -> dict:
        return await self.put(f"orders/{order_id}.json", {"order": data})

    # Fulfillment methods
    async def create_fulfillment(self, order_id: str, fulfillment_data: dict) -> dict:
        return await self.post(
            f"orders/{order_id}/fulfillments.json",
            {"fulfillment": fulfillment_data}
        )

    # Inventory methods
    async def get_inventory_levels(self, inventory_item_ids: List[str]) -> dict:
        ids = ",".join(inventory_item_ids)
        return await self.get("inventory_levels.json", {"inventory_item_ids": ids})

    async def set_inventory_level(self, inventory_item_id: str, location_id: str, quantity: int) -> dict:
        return await self.post("inventory_levels/set.json", {
            "inventory_item_id": inventory_item_id,
            "location_id": location_id,
            "available": quantity
        })
```

**3.2.2 Create Shopify integration**
- File: `engine/integrations/shopify/integration.py`
```python
from ..base import BaseIntegration
from .client import ShopifyClient

class ShopifyIntegration(BaseIntegration):
    """Shopify integration implementation"""

    def __init__(self, integration_id: int, credentials: dict):
        super().__init__(integration_id, credentials)
        self.client = ShopifyClient(
            store_url=credentials['store_url'],
            access_token=credentials['access_token']
        )

    async def test_connection(self) -> bool:
        try:
            await self.client.get("shop.json")
            return True
        except Exception:
            return False

    async def get_products(self, limit: int = 100, cursor: str = None) -> dict:
        return await self.client.get_products(limit, cursor)

    async def create_product(self, product_data: dict) -> dict:
        shopify_product = self.map_product_to_platform(product_data)
        result = await self.client.create_product(shopify_product)
        return self.map_product_from_platform(result['product'])

    async def update_product(self, external_id: str, product_data: dict) -> dict:
        shopify_product = self.map_product_to_platform(product_data)
        result = await self.client.update_product(external_id, shopify_product)
        return self.map_product_from_platform(result['product'])

    async def delete_product(self, external_id: str) -> bool:
        return await self.client.delete_product(external_id)

    async def get_orders(self, since = None, limit: int = 100):
        result = await self.client.get_orders(limit=limit)
        return [self.map_order_from_platform(o) for o in result.get('orders', [])]

    async def update_order_status(self, external_id: str, status: str, tracking: dict = None):
        if status == 'shipped' and tracking:
            return await self.client.create_fulfillment(external_id, {
                "tracking_number": tracking.get('number'),
                "tracking_company": tracking.get('carrier'),
                "tracking_url": tracking.get('url'),
                "notify_customer": True
            })
        return await self.client.update_order(external_id, {"note": f"Status: {status}"})

    async def get_inventory(self, product_ids = None):
        # Implementation
        pass

    async def update_inventory(self, external_id: str, quantity: int):
        # Implementation
        pass

    def map_product_to_platform(self, product: dict) -> dict:
        """Map internal product to Shopify format"""
        return {
            "title": product['name'],
            "body_html": product.get('description', ''),
            "vendor": product.get('vendor', ''),
            "product_type": product.get('category', ''),
            "tags": product.get('tags', []),
            "variants": [{
                "price": str(product['price_cents'] / 100),
                "compare_at_price": str(product.get('compare_at_price_cents', 0) / 100) if product.get('compare_at_price_cents') else None,
                "sku": product.get('sku', ''),
                "inventory_management": "shopify",
                "inventory_quantity": product.get('inventory_quantity', 0)
            }],
            "images": [{"src": img} for img in product.get('images', [])]
        }

    def map_product_from_platform(self, shopify_product: dict) -> dict:
        """Map Shopify product to internal format"""
        variant = shopify_product.get('variants', [{}])[0]
        return {
            "external_id": str(shopify_product['id']),
            "name": shopify_product['title'],
            "description": shopify_product.get('body_html', ''),
            "price_cents": int(float(variant.get('price', 0)) * 100),
            "sku": variant.get('sku', ''),
            "inventory_quantity": variant.get('inventory_quantity', 0),
            "images": [img['src'] for img in shopify_product.get('images', [])],
            "external_url": f"https://{self.credentials['store_url']}/products/{shopify_product['handle']}"
        }

    def map_order_from_platform(self, shopify_order: dict) -> dict:
        """Map Shopify order to internal format"""
        return {
            "external_id": str(shopify_order['id']),
            "external_order_number": shopify_order.get('order_number'),
            "email": shopify_order.get('email'),
            "total_cents": int(float(shopify_order.get('total_price', 0)) * 100),
            "subtotal_cents": int(float(shopify_order.get('subtotal_price', 0)) * 100),
            "tax_cents": int(float(shopify_order.get('total_tax', 0)) * 100),
            "shipping_cents": int(float(shopify_order.get('total_shipping_price_set', {}).get('shop_money', {}).get('amount', 0)) * 100),
            "status": self._map_order_status(shopify_order.get('fulfillment_status')),
            "shipping_address": shopify_order.get('shipping_address'),
            "line_items": [{
                "external_id": str(item['id']),
                "product_id": str(item.get('product_id')),
                "name": item['name'],
                "quantity": item['quantity'],
                "price_cents": int(float(item['price']) * 100)
            } for item in shopify_order.get('line_items', [])],
            "created_at": shopify_order.get('created_at')
        }

    def _map_order_status(self, shopify_status: str) -> str:
        status_map = {
            None: 'pending',
            'fulfilled': 'shipped',
            'partial': 'processing',
        }
        return status_map.get(shopify_status, 'pending')
```

**3.2.3 Create Shopify OAuth flow**
- File: `engine/integrations/shopify/oauth.py`
```python
import os
import httpx
import hmac
import hashlib
from urllib.parse import urlencode

class ShopifyOAuth:
    def __init__(self):
        self.api_key = os.environ.get('SHOPIFY_API_KEY')
        self.api_secret = os.environ.get('SHOPIFY_API_SECRET')
        self.scopes = [
            'read_products', 'write_products',
            'read_orders', 'write_orders',
            'read_inventory', 'write_inventory',
            'read_fulfillments', 'write_fulfillments'
        ]

    def get_auth_url(self, shop: str, redirect_uri: str, state: str) -> str:
        """Generate OAuth authorization URL"""
        params = {
            'client_id': self.api_key,
            'scope': ','.join(self.scopes),
            'redirect_uri': redirect_uri,
            'state': state
        }
        return f"https://{shop}/admin/oauth/authorize?{urlencode(params)}"

    async def exchange_code(self, shop: str, code: str) -> dict:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{shop}/admin/oauth/access_token",
                json={
                    'client_id': self.api_key,
                    'client_secret': self.api_secret,
                    'code': code
                }
            )
            response.raise_for_status()
            return response.json()

    def verify_webhook(self, data: bytes, hmac_header: str) -> bool:
        """Verify Shopify webhook signature"""
        digest = hmac.new(
            self.api_secret.encode(),
            data,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(digest, hmac_header)
```

**3.2.4 Create Shopify webhooks handler**
- File: `engine/integrations/shopify/webhooks.py`
```python
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from .oauth import ShopifyOAuth
from ...database import get_db

router = APIRouter()
oauth = ShopifyOAuth()

@router.post("/orders/create")
async def handle_order_create(request: Request, db: Session = Depends(get_db)):
    """Handle new order from Shopify"""
    body = await request.body()
    hmac_header = request.headers.get('X-Shopify-Hmac-Sha256', '')

    if not oauth.verify_webhook(body, hmac_header):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    data = await request.json()
    # Process order...
    return {"status": "ok"}

@router.post("/orders/updated")
async def handle_order_update(request: Request, db: Session = Depends(get_db)):
    """Handle order update from Shopify"""
    # Similar implementation
    pass

@router.post("/products/update")
async def handle_product_update(request: Request, db: Session = Depends(get_db)):
    """Handle product update from Shopify"""
    # For inventory sync
    pass
```

### Files to Create
- `engine/integrations/shopify/__init__.py`
- `engine/integrations/shopify/client.py`
- `engine/integrations/shopify/integration.py`
- `engine/integrations/shopify/oauth.py`
- `engine/integrations/shopify/webhooks.py`

---

## 3.3 WooCommerce Integration

### Tasks

**3.3.1 Create WooCommerce client**
- File: `engine/integrations/woocommerce/client.py`
```python
import httpx
from typing import Optional, List
import base64

class WooCommerceClient:
    """Low-level WooCommerce API client"""

    API_VERSION = "wc/v3"

    def __init__(self, store_url: str, consumer_key: str, consumer_secret: str):
        self.store_url = store_url.rstrip('/')
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.base_url = f"{self.store_url}/wp-json/{self.API_VERSION}"

    @property
    def auth(self):
        """Basic auth for WooCommerce"""
        credentials = f"{self.consumer_key}:{self.consumer_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return {"Authorization": f"Basic {encoded}"}

    async def get(self, endpoint: str, params: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/{endpoint}",
                headers=self.auth,
                params=params
            )
            response.raise_for_status()
            return response.json()

    async def post(self, endpoint: str, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/{endpoint}",
                headers=self.auth,
                json=data
            )
            response.raise_for_status()
            return response.json()

    async def put(self, endpoint: str, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/{endpoint}",
                headers=self.auth,
                json=data
            )
            response.raise_for_status()
            return response.json()

    async def delete(self, endpoint: str) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/{endpoint}",
                headers=self.auth,
                params={"force": True}
            )
            return response.status_code == 200

    # Product methods
    async def get_products(self, per_page: int = 50, page: int = 1) -> list:
        return await self.get("products", {"per_page": per_page, "page": page})

    async def create_product(self, product_data: dict) -> dict:
        return await self.post("products", product_data)

    async def update_product(self, product_id: str, product_data: dict) -> dict:
        return await self.put(f"products/{product_id}", product_data)

    async def delete_product(self, product_id: str) -> bool:
        return await self.delete(f"products/{product_id}")

    # Order methods
    async def get_orders(self, status: str = "any", per_page: int = 50) -> list:
        params = {"per_page": per_page}
        if status != "any":
            params["status"] = status
        return await self.get("orders", params)

    async def get_order(self, order_id: str) -> dict:
        return await self.get(f"orders/{order_id}")

    async def update_order(self, order_id: str, data: dict) -> dict:
        return await self.put(f"orders/{order_id}", data)
```

**3.3.2 Create WooCommerce integration**
- File: `engine/integrations/woocommerce/integration.py`
```python
from ..base import BaseIntegration
from .client import WooCommerceClient

class WooCommerceIntegration(BaseIntegration):
    """WooCommerce integration implementation"""

    def __init__(self, integration_id: int, credentials: dict):
        super().__init__(integration_id, credentials)
        self.client = WooCommerceClient(
            store_url=credentials['store_url'],
            consumer_key=credentials['consumer_key'],
            consumer_secret=credentials['consumer_secret']
        )

    async def test_connection(self) -> bool:
        try:
            await self.client.get("system_status")
            return True
        except Exception:
            return False

    async def get_products(self, limit: int = 100, cursor: str = None) -> dict:
        page = int(cursor) if cursor else 1
        products = await self.client.get_products(per_page=limit, page=page)
        return {"products": products, "next_cursor": str(page + 1) if len(products) == limit else None}

    async def create_product(self, product_data: dict) -> dict:
        woo_product = self.map_product_to_platform(product_data)
        result = await self.client.create_product(woo_product)
        return self.map_product_from_platform(result)

    async def update_product(self, external_id: str, product_data: dict) -> dict:
        woo_product = self.map_product_to_platform(product_data)
        result = await self.client.update_product(external_id, woo_product)
        return self.map_product_from_platform(result)

    async def delete_product(self, external_id: str) -> bool:
        return await self.client.delete_product(external_id)

    async def get_orders(self, since=None, limit: int = 100):
        orders = await self.client.get_orders(per_page=limit)
        return [self.map_order_from_platform(o) for o in orders]

    async def update_order_status(self, external_id: str, status: str, tracking: dict = None):
        woo_status = self._map_status_to_platform(status)
        data = {"status": woo_status}
        if tracking:
            # WooCommerce uses meta data for tracking
            data["meta_data"] = [
                {"key": "_tracking_number", "value": tracking.get('number')},
                {"key": "_tracking_provider", "value": tracking.get('carrier')},
                {"key": "_tracking_link", "value": tracking.get('url')}
            ]
        return await self.client.update_order(external_id, data)

    async def get_inventory(self, product_ids=None):
        products = await self.client.get_products()
        return [{
            "external_id": str(p['id']),
            "quantity": p.get('stock_quantity', 0),
            "in_stock": p.get('in_stock', True)
        } for p in products]

    async def update_inventory(self, external_id: str, quantity: int):
        return await self.client.update_product(external_id, {
            "stock_quantity": quantity,
            "manage_stock": True
        })

    def map_product_to_platform(self, product: dict) -> dict:
        return {
            "name": product['name'],
            "description": product.get('description', ''),
            "short_description": product.get('short_description', ''),
            "regular_price": str(product['price_cents'] / 100),
            "sale_price": str(product.get('sale_price_cents', 0) / 100) if product.get('sale_price_cents') else "",
            "sku": product.get('sku', ''),
            "manage_stock": True,
            "stock_quantity": product.get('inventory_quantity', 0),
            "images": [{"src": img} for img in product.get('images', [])]
        }

    def map_product_from_platform(self, woo_product: dict) -> dict:
        return {
            "external_id": str(woo_product['id']),
            "name": woo_product['name'],
            "description": woo_product.get('description', ''),
            "price_cents": int(float(woo_product.get('regular_price', 0) or 0) * 100),
            "sku": woo_product.get('sku', ''),
            "inventory_quantity": woo_product.get('stock_quantity', 0),
            "images": [img['src'] for img in woo_product.get('images', [])],
            "external_url": woo_product.get('permalink', '')
        }

    def map_order_from_platform(self, woo_order: dict) -> dict:
        return {
            "external_id": str(woo_order['id']),
            "external_order_number": str(woo_order.get('number', '')),
            "email": woo_order.get('billing', {}).get('email'),
            "total_cents": int(float(woo_order.get('total', 0)) * 100),
            "status": self._map_status_from_platform(woo_order.get('status')),
            "shipping_address": woo_order.get('shipping'),
            "billing_address": woo_order.get('billing'),
            "line_items": [{
                "external_id": str(item['id']),
                "product_id": str(item.get('product_id')),
                "name": item['name'],
                "quantity": item['quantity'],
                "price_cents": int(float(item['total']) / item['quantity'] * 100)
            } for item in woo_order.get('line_items', [])],
            "created_at": woo_order.get('date_created')
        }

    def _map_status_to_platform(self, status: str) -> str:
        status_map = {
            'pending': 'pending',
            'processing': 'processing',
            'shipped': 'completed',
            'delivered': 'completed',
            'cancelled': 'cancelled',
            'refunded': 'refunded'
        }
        return status_map.get(status, 'processing')

    def _map_status_from_platform(self, woo_status: str) -> str:
        status_map = {
            'pending': 'pending',
            'processing': 'processing',
            'on-hold': 'pending',
            'completed': 'delivered',
            'cancelled': 'cancelled',
            'refunded': 'refunded',
            'failed': 'cancelled'
        }
        return status_map.get(woo_status, 'pending')
```

**3.3.3 Create WooCommerce webhooks**
- File: `engine/integrations/woocommerce/webhooks.py`
```python
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from ...database import get_db
import hmac
import hashlib
import base64

router = APIRouter()

def verify_woo_webhook(payload: bytes, signature: str, secret: str) -> bool:
    """Verify WooCommerce webhook signature"""
    expected = base64.b64encode(
        hmac.new(secret.encode(), payload, hashlib.sha256).digest()
    ).decode()
    return hmac.compare_digest(expected, signature)

@router.post("/orders/created")
async def handle_order_created(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get('X-WC-Webhook-Signature', '')
    # Verify and process...
    return {"status": "ok"}

@router.post("/orders/updated")
async def handle_order_updated(request: Request, db: Session = Depends(get_db)):
    # Similar implementation
    pass
```

### Files to Create
- `engine/integrations/woocommerce/__init__.py`
- `engine/integrations/woocommerce/client.py`
- `engine/integrations/woocommerce/integration.py`
- `engine/integrations/woocommerce/webhooks.py`

---

## 3.4 Integration API & Dashboard UI

### Tasks

**3.4.1 Create integration API endpoints**
- File: `engine/integration_api.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .integrations.factory import IntegrationFactory

router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.get("/")
async def list_integrations(db: Session = Depends(get_db)):
    """List all connected integrations"""
    pass

@router.get("/platforms")
async def list_platforms():
    """List supported platforms"""
    return IntegrationFactory.supported_platforms()

@router.post("/connect/{platform}")
async def connect_integration(platform: str, credentials: dict, db: Session = Depends(get_db)):
    """Connect new integration"""
    pass

@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: int, db: Session = Depends(get_db)):
    """Disconnect integration"""
    pass

@router.post("/{integration_id}/test")
async def test_integration(integration_id: int, db: Session = Depends(get_db)):
    """Test integration connection"""
    pass

@router.post("/{integration_id}/sync/products")
async def sync_products(integration_id: int, db: Session = Depends(get_db)):
    """Sync products to/from platform"""
    pass

@router.post("/{integration_id}/sync/orders")
async def sync_orders(integration_id: int, db: Session = Depends(get_db)):
    """Sync orders from platform"""
    pass

@router.post("/{integration_id}/sync/inventory")
async def sync_inventory(integration_id: int, db: Session = Depends(get_db)):
    """Sync inventory levels"""
    pass

@router.post("/products/{product_id}/publish/{platform}")
async def publish_product(product_id: int, platform: str, db: Session = Depends(get_db)):
    """Publish product to specific platform"""
    pass

@router.delete("/products/{product_id}/unpublish/{platform}")
async def unpublish_product(product_id: int, platform: str, db: Session = Depends(get_db)):
    """Remove product from platform"""
    pass
```

**3.4.2 Create integrations dashboard page**
- File: `web/src/app/dashboard/integrations/page.tsx`
- Layout:
  ```
  ┌─────────────────────────────────────────────────┐
  │ Connected Integrations                           │
  ├─────────────────────────────────────────────────┤
  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
  │ │  Shopify    │ │ WooCommerce │ │ TikTok Shop │ │
  │ │  Connected  │ │  Connect    │ │   Coming    │ │
  │ │  [Manage]   │ │  [Setup]    │ │   Soon      │ │
  │ └─────────────┘ └─────────────┘ └─────────────┘ │
  ├─────────────────────────────────────────────────┤
  │ Sync Status                                      │
  │ Products: 45/45 synced  │  Orders: 12 pending   │
  └─────────────────────────────────────────────────┘
  ```

**3.4.3 Create integration card component**
- File: `web/src/components/dashboard/IntegrationCard.tsx`
- States: not connected, connecting, connected, error
- Actions: connect, disconnect, sync, settings

**3.4.4 Create Shopify connect flow**
- File: `web/src/app/dashboard/integrations/shopify/page.tsx`
- Step 1: Enter store URL
- Step 2: Redirect to Shopify OAuth
- Step 3: Handle callback, store credentials
- Step 4: Initial sync

**3.4.5 Create WooCommerce connect flow**
- File: `web/src/app/dashboard/integrations/woocommerce/page.tsx`
- Step 1: Enter store URL
- Step 2: Enter API keys
- Step 3: Test connection
- Step 4: Initial sync

**3.4.6 Create sync status component**
- File: `web/src/components/dashboard/SyncStatus.tsx`
- Shows last sync time
- Sync progress bar
- Error messages
- Manual sync button

### Files to Create
- `engine/integration_api.py`
- `web/src/app/dashboard/integrations/page.tsx`
- `web/src/app/dashboard/integrations/shopify/page.tsx`
- `web/src/app/dashboard/integrations/shopify/callback/page.tsx`
- `web/src/app/dashboard/integrations/woocommerce/page.tsx`
- `web/src/components/dashboard/IntegrationCard.tsx`
- `web/src/components/dashboard/SyncStatus.tsx`

---

## 3.5 Order Aggregation

### Tasks

**3.5.1 Update order queue for multi-channel**
- Show channel badge on each order
- Filter by channel
- Unified fulfillment workflow

**3.5.2 Create order sync service**
- File: `engine/services/order_sync_service.py`
- Poll connected integrations for new orders
- Create internal orders with channel reference
- Handle duplicate detection

**3.5.3 Create fulfillment sync**
- When order marked shipped internally
- Push tracking to source channel
- Update customer notification

### Files to Create
- `engine/services/order_sync_service.py`

### Files to Modify
- `web/src/app/dashboard/orders/page.tsx` - Add channel filter
- `web/src/components/dashboard/OrderCard.tsx` - Add channel badge

---

## Testing Checklist

- [ ] Shopify OAuth flow works
- [ ] Shopify product sync (pull) works
- [ ] Shopify product publish (push) works
- [ ] Shopify order sync works
- [ ] Shopify fulfillment update works
- [ ] WooCommerce connection works
- [ ] WooCommerce product sync works
- [ ] WooCommerce order sync works
- [ ] Integration page shows status correctly
- [ ] Multi-channel order queue works
- [ ] Webhook verification works

---

## Environment Variables

```bash
# Add to engine/.env
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
ENCRYPTION_KEY=your_32_byte_encryption_key

# WooCommerce uses per-store API keys, no global env needed
```

---

## Dependencies to Install

```bash
# Backend
cd engine
pip install httpx cryptography

# Add to requirements.txt:
# httpx==0.27.0
# cryptography==42.0.0
```
