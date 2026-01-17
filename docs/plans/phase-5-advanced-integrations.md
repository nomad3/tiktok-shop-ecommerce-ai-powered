# Phase 5: Advanced Integrations

**Duration:** Week 5-6
**Goal:** Integrate TikTok Shop, Amazon Seller, and eBay for true multi-channel commerce

---

## 5.1 TikTok Shop Integration

### Overview
TikTok Shop allows selling directly within TikTok. This is strategic for the platform given the TikTok trend focus.

### Tasks

**5.1.1 Create TikTok Shop client**
- File: `engine/integrations/tiktok_shop/client.py`
```python
import httpx
import hmac
import hashlib
import time
from typing import List, Optional

class TikTokShopClient:
    """TikTok Shop API client"""

    BASE_URL = "https://open-api.tiktokglobalshop.com"

    def __init__(self, app_key: str, app_secret: str, access_token: str, shop_id: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.access_token = access_token
        self.shop_id = shop_id

    def _generate_signature(self, path: str, params: dict) -> str:
        """Generate API signature"""
        timestamp = str(int(time.time()))
        params['app_key'] = self.app_key
        params['timestamp'] = timestamp

        # Sort params and create sign string
        sorted_params = sorted(params.items())
        sign_string = self.app_secret + path
        for k, v in sorted_params:
            sign_string += f"{k}{v}"
        sign_string += self.app_secret

        signature = hmac.new(
            self.app_secret.encode(),
            sign_string.encode(),
            hashlib.sha256
        ).hexdigest()

        return signature

    async def _request(self, method: str, path: str, params: dict = None, data: dict = None) -> dict:
        params = params or {}
        params['access_token'] = self.access_token
        params['shop_id'] = self.shop_id
        params['sign'] = self._generate_signature(path, params)

        async with httpx.AsyncClient() as client:
            if method == 'GET':
                response = await client.get(f"{self.BASE_URL}{path}", params=params)
            else:
                response = await client.post(f"{self.BASE_URL}{path}", params=params, json=data)

            response.raise_for_status()
            return response.json()

    # Product methods
    async def get_products(self, page: int = 1, page_size: int = 50) -> dict:
        return await self._request('POST', '/api/products/search', data={
            "page_number": page,
            "page_size": page_size
        })

    async def create_product(self, product_data: dict) -> dict:
        return await self._request('POST', '/api/products', data=product_data)

    async def update_product(self, product_id: str, product_data: dict) -> dict:
        return await self._request('PUT', f'/api/products/{product_id}', data=product_data)

    async def get_categories(self) -> dict:
        return await self._request('GET', '/api/products/categories')

    # Order methods
    async def get_orders(self, status: str = None, page: int = 1) -> dict:
        data = {"page_number": page, "page_size": 50}
        if status:
            data["order_status"] = status
        return await self._request('POST', '/api/orders/search', data=data)

    async def get_order(self, order_id: str) -> dict:
        return await self._request('GET', f'/api/orders/{order_id}/detail')

    async def ship_order(self, order_id: str, tracking_number: str, carrier_id: str) -> dict:
        return await self._request('POST', f'/api/orders/{order_id}/packages', data={
            "tracking_number": tracking_number,
            "shipping_provider_id": carrier_id
        })

    # Inventory
    async def update_inventory(self, sku_id: str, quantity: int) -> dict:
        return await self._request('POST', '/api/products/stocks', data={
            "sku_id": sku_id,
            "available_stock": quantity
        })
```

**5.1.2 Create TikTok Shop integration**
- File: `engine/integrations/tiktok_shop/integration.py`
```python
from ..base import BaseIntegration
from .client import TikTokShopClient

class TikTokShopIntegration(BaseIntegration):
    """TikTok Shop integration implementation"""

    def __init__(self, integration_id: int, credentials: dict):
        super().__init__(integration_id, credentials)
        self.client = TikTokShopClient(
            app_key=credentials['app_key'],
            app_secret=credentials['app_secret'],
            access_token=credentials['access_token'],
            shop_id=credentials['shop_id']
        )

    async def test_connection(self) -> bool:
        try:
            await self.client.get_categories()
            return True
        except Exception:
            return False

    async def get_products(self, limit: int = 100, cursor: str = None):
        page = int(cursor) if cursor else 1
        result = await self.client.get_products(page=page, page_size=limit)
        products = result.get('data', {}).get('products', [])
        return {
            "products": [self.map_product_from_platform(p) for p in products],
            "next_cursor": str(page + 1) if len(products) == limit else None
        }

    async def create_product(self, product_data: dict) -> dict:
        tiktok_product = self.map_product_to_platform(product_data)
        result = await self.client.create_product(tiktok_product)
        return self.map_product_from_platform(result.get('data', {}))

    async def update_product(self, external_id: str, product_data: dict) -> dict:
        tiktok_product = self.map_product_to_platform(product_data)
        result = await self.client.update_product(external_id, tiktok_product)
        return self.map_product_from_platform(result.get('data', {}))

    async def delete_product(self, external_id: str) -> bool:
        # TikTok Shop uses deactivation instead of deletion
        await self.client.update_product(external_id, {"is_activated": False})
        return True

    async def get_orders(self, since=None, limit: int = 100):
        result = await self.client.get_orders()
        orders = result.get('data', {}).get('orders', [])
        return [self.map_order_from_platform(o) for o in orders]

    async def update_order_status(self, external_id: str, status: str, tracking: dict = None):
        if status == 'shipped' and tracking:
            return await self.client.ship_order(
                external_id,
                tracking['number'],
                tracking.get('carrier_id', '')
            )
        return {}

    async def get_inventory(self, product_ids=None):
        products = await self.get_products()
        return [{
            "external_id": p['external_id'],
            "quantity": p.get('inventory_quantity', 0)
        } for p in products['products']]

    async def update_inventory(self, external_id: str, quantity: int):
        return await self.client.update_inventory(external_id, quantity)

    def map_product_to_platform(self, product: dict) -> dict:
        return {
            "product_name": product['name'],
            "description": product.get('description', ''),
            "category_id": product.get('category_id', ''),
            "brand_id": product.get('brand_id'),
            "images": [{"url": img} for img in product.get('images', [])],
            "skus": [{
                "original_price": str(product['price_cents'] / 100),
                "sales_attributes": [],
                "seller_sku": product.get('sku', ''),
                "stock_info": {
                    "available_stock": product.get('inventory_quantity', 0)
                }
            }],
            "is_cod_allowed": False,
            "package_weight": product.get('weight_grams', 500),
        }

    def map_product_from_platform(self, tiktok_product: dict) -> dict:
        skus = tiktok_product.get('skus', [{}])
        first_sku = skus[0] if skus else {}
        return {
            "external_id": str(tiktok_product.get('product_id', '')),
            "name": tiktok_product.get('product_name', ''),
            "description": tiktok_product.get('description', ''),
            "price_cents": int(float(first_sku.get('original_price', 0)) * 100),
            "sku": first_sku.get('seller_sku', ''),
            "inventory_quantity": first_sku.get('stock_info', {}).get('available_stock', 0),
            "images": [img['url'] for img in tiktok_product.get('images', [])],
        }

    def map_order_from_platform(self, tiktok_order: dict) -> dict:
        return {
            "external_id": str(tiktok_order.get('order_id', '')),
            "external_order_number": tiktok_order.get('order_id', ''),
            "email": tiktok_order.get('buyer_email', ''),
            "total_cents": int(float(tiktok_order.get('payment', {}).get('total_amount', 0)) * 100),
            "status": self._map_status_from_platform(tiktok_order.get('order_status')),
            "shipping_address": {
                "name": tiktok_order.get('recipient_address', {}).get('name'),
                "address1": tiktok_order.get('recipient_address', {}).get('address_line1'),
                "city": tiktok_order.get('recipient_address', {}).get('city'),
                "phone": tiktok_order.get('recipient_address', {}).get('phone'),
            },
            "line_items": [{
                "external_id": str(item.get('sku_id', '')),
                "name": item.get('product_name', ''),
                "quantity": item.get('quantity', 1),
                "price_cents": int(float(item.get('sku_original_price', 0)) * 100)
            } for item in tiktok_order.get('item_list', [])],
            "created_at": tiktok_order.get('create_time')
        }

    def _map_status_from_platform(self, status: str) -> str:
        status_map = {
            'AWAITING_SHIPMENT': 'processing',
            'AWAITING_COLLECTION': 'processing',
            'IN_TRANSIT': 'shipped',
            'DELIVERED': 'delivered',
            'CANCELLED': 'cancelled'
        }
        return status_map.get(status, 'pending')
```

**5.1.3 Create TikTok Shop OAuth**
- File: `engine/integrations/tiktok_shop/oauth.py`
```python
import os
import httpx
from urllib.parse import urlencode

class TikTokShopOAuth:
    AUTH_URL = "https://auth.tiktok-shops.com/oauth/authorize"
    TOKEN_URL = "https://auth.tiktok-shops.com/api/v2/token/get"

    def __init__(self):
        self.app_key = os.environ.get('TIKTOK_SHOP_APP_KEY')
        self.app_secret = os.environ.get('TIKTOK_SHOP_APP_SECRET')

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        params = {
            'app_key': self.app_key,
            'state': state
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(self.TOKEN_URL, params={
                'app_key': self.app_key,
                'app_secret': self.app_secret,
                'auth_code': code,
                'grant_type': 'authorized_code'
            })
            response.raise_for_status()
            return response.json()

    async def refresh_token(self, refresh_token: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(self.TOKEN_URL, params={
                'app_key': self.app_key,
                'app_secret': self.app_secret,
                'refresh_token': refresh_token,
                'grant_type': 'refresh_token'
            })
            response.raise_for_status()
            return response.json()
```

### Files to Create
- `engine/integrations/tiktok_shop/__init__.py`
- `engine/integrations/tiktok_shop/client.py`
- `engine/integrations/tiktok_shop/integration.py`
- `engine/integrations/tiktok_shop/oauth.py`
- `engine/integrations/tiktok_shop/webhooks.py`
- `web/src/app/dashboard/integrations/tiktok-shop/page.tsx`

---

## 5.2 Amazon Seller Integration

### Overview
Amazon Seller Central integration via SP-API (Selling Partner API).

### Tasks

**5.2.1 Create Amazon SP-API client**
- File: `engine/integrations/amazon/client.py`
```python
import httpx
import boto3
from datetime import datetime
import hashlib
import hmac

class AmazonSPAPIClient:
    """Amazon Selling Partner API client"""

    REGIONS = {
        'NA': 'https://sellingpartnerapi-na.amazon.com',
        'EU': 'https://sellingpartnerapi-eu.amazon.com',
        'FE': 'https://sellingpartnerapi-fe.amazon.com'
    }

    def __init__(self, credentials: dict, region: str = 'NA'):
        self.refresh_token = credentials['refresh_token']
        self.lwa_client_id = credentials['lwa_client_id']
        self.lwa_client_secret = credentials['lwa_client_secret']
        self.aws_access_key = credentials['aws_access_key']
        self.aws_secret_key = credentials['aws_secret_key']
        self.role_arn = credentials['role_arn']
        self.marketplace_id = credentials['marketplace_id']
        self.base_url = self.REGIONS.get(region, self.REGIONS['NA'])
        self._access_token = None

    async def _get_access_token(self) -> str:
        """Get LWA access token"""
        if self._access_token:
            return self._access_token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.amazon.com/auth/o2/token',
                data={
                    'grant_type': 'refresh_token',
                    'refresh_token': self.refresh_token,
                    'client_id': self.lwa_client_id,
                    'client_secret': self.lwa_client_secret
                }
            )
            response.raise_for_status()
            self._access_token = response.json()['access_token']
            return self._access_token

    def _sign_request(self, method: str, url: str, headers: dict, payload: str = '') -> dict:
        """Sign request with AWS Signature Version 4"""
        # Implementation of AWS SigV4 signing
        # This is complex - use boto3 or external library
        pass

    async def _request(self, method: str, path: str, params: dict = None, data: dict = None) -> dict:
        access_token = await self._get_access_token()
        headers = {
            'x-amz-access-token': access_token,
            'Content-Type': 'application/json'
        }

        url = f"{self.base_url}{path}"

        async with httpx.AsyncClient() as client:
            if method == 'GET':
                response = await client.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = await client.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = await client.put(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = await client.delete(url, headers=headers)

            response.raise_for_status()
            return response.json()

    # Catalog Items API
    async def search_catalog(self, keywords: str, marketplace_id: str = None) -> dict:
        return await self._request('GET', '/catalog/2022-04-01/items', params={
            'keywords': keywords,
            'marketplaceIds': marketplace_id or self.marketplace_id
        })

    async def get_catalog_item(self, asin: str) -> dict:
        return await self._request('GET', f'/catalog/2022-04-01/items/{asin}', params={
            'marketplaceIds': self.marketplace_id
        })

    # Listings API
    async def get_listings(self, seller_id: str) -> dict:
        return await self._request('GET', f'/listings/2021-08-01/items/{seller_id}')

    async def create_listing(self, seller_id: str, sku: str, listing_data: dict) -> dict:
        return await self._request('PUT', f'/listings/2021-08-01/items/{seller_id}/{sku}', data=listing_data)

    async def delete_listing(self, seller_id: str, sku: str) -> dict:
        return await self._request('DELETE', f'/listings/2021-08-01/items/{seller_id}/{sku}')

    # Orders API
    async def get_orders(self, created_after: str = None, order_statuses: list = None) -> dict:
        params = {'MarketplaceIds': self.marketplace_id}
        if created_after:
            params['CreatedAfter'] = created_after
        if order_statuses:
            params['OrderStatuses'] = ','.join(order_statuses)
        return await self._request('GET', '/orders/v0/orders', params=params)

    async def get_order(self, order_id: str) -> dict:
        return await self._request('GET', f'/orders/v0/orders/{order_id}')

    async def get_order_items(self, order_id: str) -> dict:
        return await self._request('GET', f'/orders/v0/orders/{order_id}/orderItems')

    # Fulfillment API
    async def create_shipment(self, shipment_data: dict) -> dict:
        return await self._request('POST', '/fba/outbound/2020-07-01/fulfillmentOrders', data=shipment_data)

    # Inventory API
    async def get_inventory_summary(self, seller_sku: str = None) -> dict:
        params = {'marketplaceIds': self.marketplace_id, 'granularityType': 'Marketplace'}
        if seller_sku:
            params['sellerSkus'] = seller_sku
        return await self._request('GET', '/fba/inventory/v1/summaries', params=params)
```

**5.2.2 Create Amazon integration**
- File: `engine/integrations/amazon/integration.py`
```python
from ..base import BaseIntegration
from .client import AmazonSPAPIClient

class AmazonIntegration(BaseIntegration):
    """Amazon Seller Central integration"""

    def __init__(self, integration_id: int, credentials: dict):
        super().__init__(integration_id, credentials)
        self.client = AmazonSPAPIClient(credentials, credentials.get('region', 'NA'))
        self.seller_id = credentials['seller_id']

    async def test_connection(self) -> bool:
        try:
            await self.client.get_orders()
            return True
        except Exception:
            return False

    async def get_products(self, limit: int = 100, cursor: str = None):
        result = await self.client.get_listings(self.seller_id)
        # Map and return products
        pass

    async def create_product(self, product_data: dict) -> dict:
        amazon_listing = self.map_product_to_platform(product_data)
        sku = product_data.get('sku', f"SKU-{product_data['id']}")
        result = await self.client.create_listing(self.seller_id, sku, amazon_listing)
        return self.map_product_from_platform(result)

    async def update_product(self, external_id: str, product_data: dict) -> dict:
        amazon_listing = self.map_product_to_platform(product_data)
        result = await self.client.create_listing(self.seller_id, external_id, amazon_listing)
        return self.map_product_from_platform(result)

    async def delete_product(self, external_id: str) -> bool:
        await self.client.delete_listing(self.seller_id, external_id)
        return True

    async def get_orders(self, since=None, limit: int = 100):
        params = {}
        if since:
            params['created_after'] = since.isoformat()
        result = await self.client.get_orders(**params)
        orders = result.get('Orders', [])
        return [self.map_order_from_platform(o) for o in orders]

    async def update_order_status(self, external_id: str, status: str, tracking: dict = None):
        # Amazon MFN orders - update shipping
        if status == 'shipped' and tracking:
            # Use Merchant Fulfillment API
            pass
        return {}

    async def get_inventory(self, product_ids=None):
        result = await self.client.get_inventory_summary()
        return [{
            "external_id": item['sellerSku'],
            "quantity": item.get('totalQuantity', 0)
        } for item in result.get('inventorySummaries', [])]

    async def update_inventory(self, external_id: str, quantity: int):
        # Update via Listings API
        return await self.client.create_listing(self.seller_id, external_id, {
            'quantity': quantity
        })

    def map_product_to_platform(self, product: dict) -> dict:
        return {
            "productType": product.get('amazon_product_type', 'PRODUCT'),
            "attributes": {
                "item_name": [{"value": product['name'], "marketplace_id": self.client.marketplace_id}],
                "brand": [{"value": product.get('brand', 'Generic')}],
                "bullet_point": [{"value": bp} for bp in product.get('bullet_points', [])],
                "product_description": [{"value": product.get('description', '')}],
                "list_price": [{"value": product['price_cents'] / 100, "currency": "USD"}],
                "main_product_image_locator": [{"value": product.get('images', [''])[0]}]
            }
        }

    def map_product_from_platform(self, amazon_product: dict) -> dict:
        attrs = amazon_product.get('attributes', {})
        return {
            "external_id": amazon_product.get('sku', ''),
            "name": attrs.get('item_name', [{}])[0].get('value', ''),
            "description": attrs.get('product_description', [{}])[0].get('value', ''),
            "price_cents": int(attrs.get('list_price', [{}])[0].get('value', 0) * 100),
        }

    def map_order_from_platform(self, amazon_order: dict) -> dict:
        return {
            "external_id": amazon_order.get('AmazonOrderId', ''),
            "external_order_number": amazon_order.get('AmazonOrderId', ''),
            "email": amazon_order.get('BuyerInfo', {}).get('BuyerEmail', ''),
            "total_cents": int(float(amazon_order.get('OrderTotal', {}).get('Amount', 0)) * 100),
            "status": self._map_status_from_platform(amazon_order.get('OrderStatus')),
            "shipping_address": amazon_order.get('ShippingAddress'),
            "created_at": amazon_order.get('PurchaseDate')
        }

    def _map_status_from_platform(self, status: str) -> str:
        status_map = {
            'Pending': 'pending',
            'Unshipped': 'processing',
            'PartiallyShipped': 'processing',
            'Shipped': 'shipped',
            'Canceled': 'cancelled'
        }
        return status_map.get(status, 'pending')
```

### Files to Create
- `engine/integrations/amazon/__init__.py`
- `engine/integrations/amazon/client.py`
- `engine/integrations/amazon/integration.py`
- `engine/integrations/amazon/feeds.py` (for bulk operations)
- `web/src/app/dashboard/integrations/amazon/page.tsx`

---

## 5.3 eBay Integration

### Tasks

**5.3.1 Create eBay client**
- File: `engine/integrations/ebay/client.py`
```python
import httpx
from typing import Optional

class eBayClient:
    """eBay REST API client"""

    SANDBOX_URL = "https://api.sandbox.ebay.com"
    PRODUCTION_URL = "https://api.ebay.com"

    def __init__(self, access_token: str, sandbox: bool = False):
        self.access_token = access_token
        self.base_url = self.SANDBOX_URL if sandbox else self.PRODUCTION_URL

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def _request(self, method: str, endpoint: str, params: dict = None, data: dict = None) -> dict:
        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method, url,
                headers=self.headers,
                params=params,
                json=data
            )
            response.raise_for_status()
            return response.json() if response.text else {}

    # Inventory API
    async def get_inventory_items(self, limit: int = 100, offset: int = 0) -> dict:
        return await self._request('GET', '/sell/inventory/v1/inventory_item', params={
            'limit': limit, 'offset': offset
        })

    async def create_inventory_item(self, sku: str, item_data: dict) -> dict:
        return await self._request('PUT', f'/sell/inventory/v1/inventory_item/{sku}', data=item_data)

    async def delete_inventory_item(self, sku: str) -> bool:
        await self._request('DELETE', f'/sell/inventory/v1/inventory_item/{sku}')
        return True

    # Offer API
    async def create_offer(self, offer_data: dict) -> dict:
        return await self._request('POST', '/sell/inventory/v1/offer', data=offer_data)

    async def publish_offer(self, offer_id: str) -> dict:
        return await self._request('POST', f'/sell/inventory/v1/offer/{offer_id}/publish')

    # Order API
    async def get_orders(self, filter: str = None, limit: int = 50) -> dict:
        params = {'limit': limit}
        if filter:
            params['filter'] = filter
        return await self._request('GET', '/sell/fulfillment/v1/order', params=params)

    async def get_order(self, order_id: str) -> dict:
        return await self._request('GET', f'/sell/fulfillment/v1/order/{order_id}')

    async def create_shipping_fulfillment(self, order_id: str, fulfillment_data: dict) -> dict:
        return await self._request(
            'POST',
            f'/sell/fulfillment/v1/order/{order_id}/shipping_fulfillment',
            data=fulfillment_data
        )
```

**5.3.2 Create eBay integration**
- File: `engine/integrations/ebay/integration.py`
```python
from ..base import BaseIntegration
from .client import eBayClient

class eBayIntegration(BaseIntegration):
    """eBay integration implementation"""

    def __init__(self, integration_id: int, credentials: dict):
        super().__init__(integration_id, credentials)
        self.client = eBayClient(
            access_token=credentials['access_token'],
            sandbox=credentials.get('sandbox', False)
        )
        self.marketplace_id = credentials.get('marketplace_id', 'EBAY_US')

    async def test_connection(self) -> bool:
        try:
            await self.client.get_inventory_items(limit=1)
            return True
        except Exception:
            return False

    async def get_products(self, limit: int = 100, cursor: str = None):
        offset = int(cursor) if cursor else 0
        result = await self.client.get_inventory_items(limit=limit, offset=offset)
        items = result.get('inventoryItems', [])
        return {
            "products": [self.map_product_from_platform(i) for i in items],
            "next_cursor": str(offset + limit) if len(items) == limit else None
        }

    async def create_product(self, product_data: dict) -> dict:
        ebay_item = self.map_product_to_platform(product_data)
        sku = product_data.get('sku', f"SKU-{product_data['id']}")

        # Create inventory item
        await self.client.create_inventory_item(sku, ebay_item)

        # Create and publish offer
        offer = {
            "sku": sku,
            "marketplaceId": self.marketplace_id,
            "format": "FIXED_PRICE",
            "listingDescription": product_data.get('description', ''),
            "pricingSummary": {
                "price": {
                    "value": str(product_data['price_cents'] / 100),
                    "currency": "USD"
                }
            },
            "quantityLimitPerBuyer": 10
        }
        offer_result = await self.client.create_offer(offer)
        offer_id = offer_result.get('offerId')

        if offer_id:
            await self.client.publish_offer(offer_id)

        return {"external_id": sku, "offer_id": offer_id}

    async def update_product(self, external_id: str, product_data: dict) -> dict:
        ebay_item = self.map_product_to_platform(product_data)
        await self.client.create_inventory_item(external_id, ebay_item)
        return {"external_id": external_id}

    async def delete_product(self, external_id: str) -> bool:
        return await self.client.delete_inventory_item(external_id)

    async def get_orders(self, since=None, limit: int = 100):
        filter_str = None
        if since:
            filter_str = f"creationdate:[{since.isoformat()}Z..]"
        result = await self.client.get_orders(filter=filter_str, limit=limit)
        orders = result.get('orders', [])
        return [self.map_order_from_platform(o) for o in orders]

    async def update_order_status(self, external_id: str, status: str, tracking: dict = None):
        if status == 'shipped' and tracking:
            return await self.client.create_shipping_fulfillment(external_id, {
                "lineItems": [{"lineItemId": "all", "quantity": 1}],
                "shippedDate": tracking.get('shipped_date', ''),
                "shippingCarrierCode": tracking.get('carrier', 'Other'),
                "trackingNumber": tracking.get('number', '')
            })
        return {}

    async def get_inventory(self, product_ids=None):
        result = await self.client.get_inventory_items()
        return [{
            "external_id": item['sku'],
            "quantity": item.get('availability', {}).get('shipToLocationAvailability', {}).get('quantity', 0)
        } for item in result.get('inventoryItems', [])]

    async def update_inventory(self, external_id: str, quantity: int):
        return await self.client.create_inventory_item(external_id, {
            "availability": {
                "shipToLocationAvailability": {
                    "quantity": quantity
                }
            }
        })

    def map_product_to_platform(self, product: dict) -> dict:
        return {
            "availability": {
                "shipToLocationAvailability": {
                    "quantity": product.get('inventory_quantity', 0)
                }
            },
            "condition": "NEW",
            "product": {
                "title": product['name'],
                "description": product.get('description', ''),
                "imageUrls": product.get('images', []),
                "aspects": {}
            }
        }

    def map_product_from_platform(self, ebay_item: dict) -> dict:
        product = ebay_item.get('product', {})
        return {
            "external_id": ebay_item.get('sku', ''),
            "name": product.get('title', ''),
            "description": product.get('description', ''),
            "images": product.get('imageUrls', []),
            "inventory_quantity": ebay_item.get('availability', {}).get('shipToLocationAvailability', {}).get('quantity', 0)
        }

    def map_order_from_platform(self, ebay_order: dict) -> dict:
        return {
            "external_id": ebay_order.get('orderId', ''),
            "external_order_number": ebay_order.get('orderId', ''),
            "email": ebay_order.get('buyer', {}).get('buyerRegistrationAddress', {}).get('email'),
            "total_cents": int(float(ebay_order.get('pricingSummary', {}).get('total', {}).get('value', 0)) * 100),
            "status": self._map_status_from_platform(ebay_order.get('orderFulfillmentStatus')),
            "shipping_address": ebay_order.get('fulfillmentStartInstructions', [{}])[0].get('shippingStep', {}).get('shipTo'),
            "line_items": [{
                "external_id": item.get('lineItemId'),
                "name": item.get('title', ''),
                "quantity": item.get('quantity', 1),
                "price_cents": int(float(item.get('lineItemCost', {}).get('value', 0)) * 100)
            } for item in ebay_order.get('lineItems', [])],
            "created_at": ebay_order.get('creationDate')
        }

    def _map_status_from_platform(self, status: str) -> str:
        status_map = {
            'NOT_STARTED': 'pending',
            'IN_PROGRESS': 'processing',
            'FULFILLED': 'delivered'
        }
        return status_map.get(status, 'pending')
```

**5.3.3 Create eBay OAuth**
- File: `engine/integrations/ebay/oauth.py`
```python
import os
import httpx
import base64
from urllib.parse import urlencode

class eBayOAuth:
    SANDBOX_AUTH_URL = "https://auth.sandbox.ebay.com/oauth2/authorize"
    PRODUCTION_AUTH_URL = "https://auth.ebay.com/oauth2/authorize"
    SANDBOX_TOKEN_URL = "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    PRODUCTION_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"

    def __init__(self, sandbox: bool = False):
        self.client_id = os.environ.get('EBAY_CLIENT_ID')
        self.client_secret = os.environ.get('EBAY_CLIENT_SECRET')
        self.sandbox = sandbox
        self.auth_url = self.SANDBOX_AUTH_URL if sandbox else self.PRODUCTION_AUTH_URL
        self.token_url = self.SANDBOX_TOKEN_URL if sandbox else self.PRODUCTION_TOKEN_URL
        self.scopes = [
            'https://api.ebay.com/oauth/api_scope',
            'https://api.ebay.com/oauth/api_scope/sell.inventory',
            'https://api.ebay.com/oauth/api_scope/sell.fulfillment'
        ]

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        params = {
            'client_id': self.client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': ' '.join(self.scopes),
            'state': state
        }
        return f"{self.auth_url}?{urlencode(params)}"

    async def exchange_code(self, code: str, redirect_uri: str) -> dict:
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': f'Basic {encoded_credentials}'
                },
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': redirect_uri
                }
            )
            response.raise_for_status()
            return response.json()

    async def refresh_token(self, refresh_token: str) -> dict:
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': f'Basic {encoded_credentials}'
                },
                data={
                    'grant_type': 'refresh_token',
                    'refresh_token': refresh_token,
                    'scope': ' '.join(self.scopes)
                }
            )
            response.raise_for_status()
            return response.json()
```

### Files to Create
- `engine/integrations/ebay/__init__.py`
- `engine/integrations/ebay/client.py`
- `engine/integrations/ebay/integration.py`
- `engine/integrations/ebay/oauth.py`
- `web/src/app/dashboard/integrations/ebay/page.tsx`

---

## 5.4 Bulk Operations Across Channels

### Tasks

**5.4.1 Create bulk operations service**
- File: `engine/services/bulk_operations.py`
```python
from typing import List
from ..integrations.factory import IntegrationFactory

class BulkOperationsService:
    async def publish_to_all_channels(
        self,
        product_id: int,
        channel_ids: List[int] = None,
        pricing: dict = None  # Optional per-channel pricing
    ) -> dict:
        """
        Publish product to all or specified channels
        Returns: {
            success: list of channel_ids,
            failed: [{channel_id, error}]
        }
        """
        pass

    async def unpublish_from_all_channels(
        self,
        product_id: int,
        channel_ids: List[int] = None
    ) -> dict:
        """Remove product from channels"""
        pass

    async def sync_inventory_all_channels(
        self,
        product_id: int,
        quantity: int
    ) -> dict:
        """Update inventory across all channels"""
        pass

    async def bulk_price_update(
        self,
        product_id: int,
        base_price: int,
        channel_adjustments: dict = None  # {channel_id: adjustment_percent}
    ) -> dict:
        """Update prices across channels"""
        pass
```

**5.4.2 Create bulk operations UI**
- File: `web/src/app/dashboard/products/[id]/channels/page.tsx`
- Show all channels with publish status
- Per-channel pricing editor
- Bulk publish/unpublish buttons
- Inventory sync controls

**5.4.3 Create channel status component**
- File: `web/src/components/dashboard/ProductChannelStatus.tsx`
- List of channels with status badges
- Quick actions per channel
- Sync status and last sync time

### Files to Create
- `engine/services/bulk_operations.py`
- `web/src/app/dashboard/products/[id]/channels/page.tsx`
- `web/src/components/dashboard/ProductChannelStatus.tsx`
- `web/src/components/dashboard/BulkPublishModal.tsx`

---

## Testing Checklist

- [ ] TikTok Shop OAuth flow works
- [ ] TikTok Shop product sync works
- [ ] TikTok Shop order sync works
- [ ] Amazon connection with credentials works
- [ ] Amazon listing creation works
- [ ] Amazon order fetch works
- [ ] eBay OAuth flow works
- [ ] eBay inventory item creation works
- [ ] eBay offer publishing works
- [ ] eBay order sync works
- [ ] Bulk publish to all channels works
- [ ] Inventory sync across channels works

---

## Environment Variables

```bash
# TikTok Shop
TIKTOK_SHOP_APP_KEY=your_app_key
TIKTOK_SHOP_APP_SECRET=your_app_secret

# Amazon SP-API
AMAZON_LWA_CLIENT_ID=your_client_id
AMAZON_LWA_CLIENT_SECRET=your_client_secret
AMAZON_AWS_ACCESS_KEY=your_aws_key
AMAZON_AWS_SECRET_KEY=your_aws_secret
AMAZON_ROLE_ARN=arn:aws:iam::...

# eBay
EBAY_CLIENT_ID=your_client_id
EBAY_CLIENT_SECRET=your_client_secret
```

---

## Dependencies

```bash
cd engine
pip install boto3  # For Amazon AWS signing

# Add to requirements.txt:
# boto3==1.34.0
```
