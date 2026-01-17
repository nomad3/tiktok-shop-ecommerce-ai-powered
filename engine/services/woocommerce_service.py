"""WooCommerce integration service for syncing products and orders."""

import httpx
import base64
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class WooProduct:
    """Represents a WooCommerce product."""
    id: int
    name: str
    description: str
    short_description: str
    sku: str
    price: str
    regular_price: str
    sale_price: str
    status: str
    stock_status: str
    stock_quantity: Optional[int]
    images: List[Dict[str, Any]]
    categories: List[Dict[str, Any]]
    created_at: str
    updated_at: str


@dataclass
class WooOrder:
    """Represents a WooCommerce order."""
    id: int
    order_number: str
    status: str
    total: str
    currency: str
    customer_email: str
    customer_name: str
    line_items: List[Dict[str, Any]]
    billing: Dict[str, Any]
    shipping: Dict[str, Any]
    created_at: str


@dataclass
class ConnectionResult:
    """Result of a connection test."""
    success: bool
    message: str
    store_name: Optional[str] = None
    wc_version: Optional[str] = None


class WooCommerceService:
    """Service for interacting with WooCommerce REST API."""

    API_VERSION = "wc/v3"

    def __init__(self, store_url: str, consumer_key: str, consumer_secret: str):
        """
        Initialize WooCommerce service.

        Args:
            store_url: The WooCommerce store URL (e.g., 'https://my-store.com')
            consumer_key: WooCommerce REST API consumer key
            consumer_secret: WooCommerce REST API consumer secret
        """
        # Ensure proper URL format
        self.store_url = store_url.rstrip("/")
        if not self.store_url.startswith(("http://", "https://")):
            self.store_url = f"https://{self.store_url}"

        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.base_url = f"{self.store_url}/wp-json/{self.API_VERSION}"

        # Create basic auth header
        credentials = f"{consumer_key}:{consumer_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        self.headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
        }

    async def test_connection(self) -> ConnectionResult:
        """Test the WooCommerce connection by fetching system status."""
        try:
            async with httpx.AsyncClient() as client:
                # Try to get system status
                response = await client.get(
                    f"{self.base_url}/system_status",
                    headers=self.headers,
                    timeout=15.0
                )

                if response.status_code == 200:
                    data = response.json()
                    env = data.get("environment", {})
                    return ConnectionResult(
                        success=True,
                        message="Successfully connected to WooCommerce",
                        store_name=env.get("site_url", self.store_url),
                        wc_version=env.get("version", "unknown")
                    )
                elif response.status_code == 401:
                    return ConnectionResult(
                        success=False,
                        message="Invalid consumer key or secret"
                    )
                elif response.status_code == 404:
                    # Try alternate endpoint
                    alt_response = await client.get(
                        f"{self.store_url}/wp-json/wc/v3/products",
                        headers=self.headers,
                        params={"per_page": 1},
                        timeout=10.0
                    )
                    if alt_response.status_code == 200:
                        return ConnectionResult(
                            success=True,
                            message="Connected to WooCommerce",
                            store_name=self.store_url
                        )
                    return ConnectionResult(
                        success=False,
                        message="WooCommerce API not found. Ensure REST API is enabled."
                    )
                else:
                    return ConnectionResult(
                        success=False,
                        message=f"Connection failed: HTTP {response.status_code}"
                    )
        except httpx.TimeoutException:
            return ConnectionResult(
                success=False,
                message="Connection timed out. Check your store URL."
            )
        except Exception as e:
            logger.error(f"WooCommerce connection error: {e}")
            return ConnectionResult(
                success=False,
                message=f"Connection error: {str(e)}"
            )

    async def fetch_products(
        self,
        per_page: int = 50,
        page: int = 1,
        status: str = "publish",
        search: Optional[str] = None
    ) -> List[WooProduct]:
        """
        Fetch products from WooCommerce.

        Args:
            per_page: Number of products per page (max 100)
            page: Page number
            status: Product status filter (publish, draft, pending, private)
            search: Search term

        Returns:
            List of WooProduct objects
        """
        params = {
            "per_page": min(per_page, 100),
            "page": page,
            "status": status
        }
        if search:
            params["search"] = search

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/products",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )

                if response.status_code == 200:
                    products = []
                    for p in response.json():
                        products.append(WooProduct(
                            id=p["id"],
                            name=p.get("name", ""),
                            description=p.get("description", ""),
                            short_description=p.get("short_description", ""),
                            sku=p.get("sku", ""),
                            price=p.get("price", "0"),
                            regular_price=p.get("regular_price", "0"),
                            sale_price=p.get("sale_price", ""),
                            status=p.get("status", ""),
                            stock_status=p.get("stock_status", ""),
                            stock_quantity=p.get("stock_quantity"),
                            images=p.get("images", []),
                            categories=p.get("categories", []),
                            created_at=p.get("date_created", ""),
                            updated_at=p.get("date_modified", "")
                        ))
                    return products
                else:
                    logger.error(f"Failed to fetch products: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching WooCommerce products: {e}")
            return []

    async def create_product(
        self,
        name: str,
        description: str,
        regular_price: float,
        image_url: Optional[str] = None,
        short_description: str = "",
        sku: str = "",
        stock_quantity: int = 100,
        categories: Optional[List[int]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new product in WooCommerce.

        Args:
            name: Product name
            description: Full product description
            regular_price: Product price
            image_url: URL of product image
            short_description: Short description
            sku: Product SKU
            stock_quantity: Initial stock quantity
            categories: List of category IDs

        Returns:
            Created product data or None if failed
        """
        product_data = {
            "name": name,
            "type": "simple",
            "description": description,
            "short_description": short_description,
            "regular_price": str(regular_price),
            "sku": sku,
            "manage_stock": True,
            "stock_quantity": stock_quantity,
            "status": "publish"
        }

        if image_url:
            product_data["images"] = [{"src": image_url}]

        if categories:
            product_data["categories"] = [{"id": cat_id} for cat_id in categories]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/products",
                    headers=self.headers,
                    json=product_data,
                    timeout=30.0
                )

                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Failed to create product: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error creating WooCommerce product: {e}")
            return None

    async def update_product(
        self,
        product_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing product in WooCommerce.

        Args:
            product_id: WooCommerce product ID
            updates: Dictionary of fields to update

        Returns:
            Updated product data or None if failed
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/products/{product_id}",
                    headers=self.headers,
                    json=updates,
                    timeout=30.0
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to update product: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error updating WooCommerce product: {e}")
            return None

    async def fetch_orders(
        self,
        per_page: int = 50,
        page: int = 1,
        status: str = "any",
        after: Optional[datetime] = None
    ) -> List[WooOrder]:
        """
        Fetch orders from WooCommerce.

        Args:
            per_page: Number of orders per page
            page: Page number
            status: Order status filter (pending, processing, on-hold, completed, etc.)
            after: Only return orders created after this date

        Returns:
            List of WooOrder objects
        """
        params = {
            "per_page": min(per_page, 100),
            "page": page
        }
        if status != "any":
            params["status"] = status
        if after:
            params["after"] = after.isoformat()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/orders",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )

                if response.status_code == 200:
                    orders = []
                    for o in response.json():
                        billing = o.get("billing", {})
                        orders.append(WooOrder(
                            id=o["id"],
                            order_number=str(o.get("number", o["id"])),
                            status=o.get("status", ""),
                            total=o.get("total", "0"),
                            currency=o.get("currency", "USD"),
                            customer_email=billing.get("email", ""),
                            customer_name=f"{billing.get('first_name', '')} {billing.get('last_name', '')}".strip(),
                            line_items=o.get("line_items", []),
                            billing=billing,
                            shipping=o.get("shipping", {}),
                            created_at=o.get("date_created", "")
                        ))
                    return orders
                else:
                    logger.error(f"Failed to fetch orders: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching WooCommerce orders: {e}")
            return []

    async def update_order_status(
        self,
        order_id: int,
        status: str
    ) -> Optional[Dict[str, Any]]:
        """
        Update an order's status.

        Args:
            order_id: WooCommerce order ID
            status: New status (pending, processing, on-hold, completed, cancelled, refunded, failed)

        Returns:
            Updated order data or None if failed
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/orders/{order_id}",
                    headers=self.headers,
                    json={"status": status},
                    timeout=30.0
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to update order: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error updating WooCommerce order: {e}")
            return None

    async def get_categories(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """
        Get product categories.

        Args:
            per_page: Number of categories to fetch

        Returns:
            List of category data
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/products/categories",
                    headers=self.headers,
                    params={"per_page": per_page},
                    timeout=15.0
                )
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as e:
            logger.error(f"Error fetching categories: {e}")
            return []

    async def get_product(self, product_id: int) -> Optional[WooProduct]:
        """
        Get a single product by ID.

        Args:
            product_id: WooCommerce product ID

        Returns:
            WooProduct object or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/products/{product_id}",
                    headers=self.headers,
                    timeout=15.0
                )

                if response.status_code == 200:
                    p = response.json()
                    return WooProduct(
                        id=p["id"],
                        name=p.get("name", ""),
                        description=p.get("description", ""),
                        short_description=p.get("short_description", ""),
                        sku=p.get("sku", ""),
                        price=p.get("price", "0"),
                        regular_price=p.get("regular_price", "0"),
                        sale_price=p.get("sale_price", ""),
                        status=p.get("status", ""),
                        stock_status=p.get("stock_status", ""),
                        stock_quantity=p.get("stock_quantity"),
                        images=p.get("images", []),
                        categories=p.get("categories", []),
                        created_at=p.get("date_created", ""),
                        updated_at=p.get("date_modified", "")
                    )
                return None
        except Exception as e:
            logger.error(f"Error fetching WooCommerce product: {e}")
            return None

    async def delete_product(self, product_id: int, force: bool = False) -> bool:
        """
        Delete a product from WooCommerce.

        Args:
            product_id: WooCommerce product ID
            force: If True, permanently delete. If False, move to trash.

        Returns:
            True if successful, False otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/products/{product_id}",
                    headers=self.headers,
                    params={"force": str(force).lower()},
                    timeout=15.0
                )
                return response.status_code in (200, 202)
        except Exception as e:
            logger.error(f"Error deleting WooCommerce product: {e}")
            return False

    async def update_inventory(
        self,
        product_id: int,
        quantity: int,
        stock_status: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update product inventory.

        Args:
            product_id: WooCommerce product ID
            quantity: New stock quantity
            stock_status: Stock status ('instock', 'outofstock', 'onbackorder')

        Returns:
            Updated product data or None if failed
        """
        updates = {
            "manage_stock": True,
            "stock_quantity": quantity
        }

        if stock_status:
            updates["stock_status"] = stock_status
        elif quantity <= 0:
            updates["stock_status"] = "outofstock"
        else:
            updates["stock_status"] = "instock"

        return await self.update_product(product_id, updates)

    async def add_order_note(
        self,
        order_id: int,
        note: str,
        customer_note: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Add a note to an order.

        Args:
            order_id: WooCommerce order ID
            note: Note content
            customer_note: If True, note is visible to customer

        Returns:
            Created note data or None if failed
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/orders/{order_id}/notes",
                    headers=self.headers,
                    json={
                        "note": note,
                        "customer_note": customer_note
                    },
                    timeout=15.0
                )
                if response.status_code == 201:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error adding order note: {e}")
            return None

    async def get_store_stats(self) -> Dict[str, Any]:
        """
        Get basic store statistics.

        Returns:
            Dictionary with product and order counts
        """
        stats = {
            "total_products": 0,
            "total_orders": 0,
            "pending_orders": 0,
            "processing_orders": 0
        }

        try:
            async with httpx.AsyncClient() as client:
                # Get product count
                prod_response = await client.get(
                    f"{self.base_url}/reports/products/totals",
                    headers=self.headers,
                    timeout=10.0
                )
                if prod_response.status_code == 200:
                    for item in prod_response.json():
                        if item.get("slug") == "external":
                            continue
                        stats["total_products"] += item.get("total", 0)

                # Get order counts
                order_response = await client.get(
                    f"{self.base_url}/reports/orders/totals",
                    headers=self.headers,
                    timeout=10.0
                )
                if order_response.status_code == 200:
                    for item in order_response.json():
                        slug = item.get("slug", "")
                        total = item.get("total", 0)
                        stats["total_orders"] += total
                        if slug == "pending":
                            stats["pending_orders"] = total
                        elif slug == "processing":
                            stats["processing_orders"] = total

        except Exception as e:
            logger.error(f"Error fetching store stats: {e}")

        return stats


# Singleton instance factory
def create_woocommerce_service(
    store_url: str,
    consumer_key: str,
    consumer_secret: str
) -> WooCommerceService:
    """Create a new WooCommerce service instance."""
    return WooCommerceService(store_url, consumer_key, consumer_secret)
