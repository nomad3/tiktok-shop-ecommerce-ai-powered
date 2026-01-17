"""Shopify integration service for syncing products and orders."""

import httpx
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class ShopifyProduct:
    """Represents a Shopify product."""
    id: int
    title: str
    description: str
    vendor: str
    product_type: str
    status: str
    images: List[Dict[str, Any]]
    variants: List[Dict[str, Any]]
    created_at: str
    updated_at: str


@dataclass
class ShopifyOrder:
    """Represents a Shopify order."""
    id: int
    order_number: int
    email: str
    total_price: str
    currency: str
    financial_status: str
    fulfillment_status: Optional[str]
    line_items: List[Dict[str, Any]]
    created_at: str


@dataclass
class ConnectionResult:
    """Result of a connection test."""
    success: bool
    message: str
    shop_name: Optional[str] = None
    shop_domain: Optional[str] = None


class ShopifyService:
    """Service for interacting with Shopify Admin API."""

    API_VERSION = "2024-01"

    def __init__(self, store_url: str, access_token: str):
        """
        Initialize Shopify service.

        Args:
            store_url: The Shopify store URL (e.g., 'my-store.myshopify.com')
            access_token: Shopify Admin API access token
        """
        # Clean up store URL
        self.store_url = store_url.replace("https://", "").replace("http://", "").rstrip("/")
        if not self.store_url.endswith(".myshopify.com"):
            self.store_url = f"{self.store_url}.myshopify.com"

        self.access_token = access_token
        self.base_url = f"https://{self.store_url}/admin/api/{self.API_VERSION}"
        self.headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
        }

    async def test_connection(self) -> ConnectionResult:
        """Test the Shopify connection by fetching shop info."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/shop.json",
                    headers=self.headers,
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    shop = data.get("shop", {})
                    return ConnectionResult(
                        success=True,
                        message="Successfully connected to Shopify",
                        shop_name=shop.get("name"),
                        shop_domain=shop.get("domain")
                    )
                elif response.status_code == 401:
                    return ConnectionResult(
                        success=False,
                        message="Invalid access token"
                    )
                elif response.status_code == 404:
                    return ConnectionResult(
                        success=False,
                        message="Store not found. Check your store URL."
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
            logger.error(f"Shopify connection error: {e}")
            return ConnectionResult(
                success=False,
                message=f"Connection error: {str(e)}"
            )

    async def fetch_products(
        self,
        limit: int = 50,
        since_id: Optional[int] = None,
        status: str = "active"
    ) -> List[ShopifyProduct]:
        """
        Fetch products from Shopify.

        Args:
            limit: Maximum number of products to fetch (max 250)
            since_id: Only return products after this ID
            status: Product status filter (active, draft, archived)

        Returns:
            List of ShopifyProduct objects
        """
        params = {"limit": min(limit, 250), "status": status}
        if since_id:
            params["since_id"] = since_id

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/products.json",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    products = []
                    for p in data.get("products", []):
                        products.append(ShopifyProduct(
                            id=p["id"],
                            title=p["title"],
                            description=p.get("body_html", ""),
                            vendor=p.get("vendor", ""),
                            product_type=p.get("product_type", ""),
                            status=p.get("status", ""),
                            images=p.get("images", []),
                            variants=p.get("variants", []),
                            created_at=p.get("created_at", ""),
                            updated_at=p.get("updated_at", "")
                        ))
                    return products
                else:
                    logger.error(f"Failed to fetch products: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching Shopify products: {e}")
            return []

    async def create_product(
        self,
        title: str,
        description: str,
        price: float,
        image_url: Optional[str] = None,
        vendor: str = "",
        product_type: str = "",
        inventory_quantity: int = 100
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new product in Shopify.

        Args:
            title: Product title
            description: Product description (HTML)
            price: Product price
            image_url: URL of product image
            vendor: Product vendor
            product_type: Product type/category
            inventory_quantity: Initial inventory quantity

        Returns:
            Created product data or None if failed
        """
        product_data = {
            "product": {
                "title": title,
                "body_html": description,
                "vendor": vendor,
                "product_type": product_type,
                "status": "active",
                "variants": [
                    {
                        "price": str(price),
                        "inventory_quantity": inventory_quantity,
                        "inventory_management": "shopify"
                    }
                ]
            }
        }

        if image_url:
            product_data["product"]["images"] = [{"src": image_url}]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/products.json",
                    headers=self.headers,
                    json=product_data,
                    timeout=30.0
                )

                if response.status_code == 201:
                    return response.json().get("product")
                else:
                    logger.error(f"Failed to create product: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error creating Shopify product: {e}")
            return None

    async def update_product(
        self,
        product_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing product in Shopify.

        Args:
            product_id: Shopify product ID
            updates: Dictionary of fields to update

        Returns:
            Updated product data or None if failed
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/products/{product_id}.json",
                    headers=self.headers,
                    json={"product": updates},
                    timeout=30.0
                )

                if response.status_code == 200:
                    return response.json().get("product")
                else:
                    logger.error(f"Failed to update product: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error updating Shopify product: {e}")
            return None

    async def fetch_orders(
        self,
        limit: int = 50,
        status: str = "any",
        since_id: Optional[int] = None,
        created_at_min: Optional[datetime] = None
    ) -> List[ShopifyOrder]:
        """
        Fetch orders from Shopify.

        Args:
            limit: Maximum number of orders to fetch
            status: Order status filter (open, closed, cancelled, any)
            since_id: Only return orders after this ID
            created_at_min: Only return orders created after this date

        Returns:
            List of ShopifyOrder objects
        """
        params = {"limit": min(limit, 250), "status": status}
        if since_id:
            params["since_id"] = since_id
        if created_at_min:
            params["created_at_min"] = created_at_min.isoformat()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/orders.json",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    orders = []
                    for o in data.get("orders", []):
                        orders.append(ShopifyOrder(
                            id=o["id"],
                            order_number=o.get("order_number", 0),
                            email=o.get("email", ""),
                            total_price=o.get("total_price", "0.00"),
                            currency=o.get("currency", "USD"),
                            financial_status=o.get("financial_status", ""),
                            fulfillment_status=o.get("fulfillment_status"),
                            line_items=o.get("line_items", []),
                            created_at=o.get("created_at", "")
                        ))
                    return orders
                else:
                    logger.error(f"Failed to fetch orders: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching Shopify orders: {e}")
            return []

    async def get_inventory_levels(self, location_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get inventory levels for products.

        Args:
            location_id: Optional location ID to filter by

        Returns:
            List of inventory level data
        """
        try:
            async with httpx.AsyncClient() as client:
                # First get locations if not provided
                if not location_id:
                    loc_response = await client.get(
                        f"{self.base_url}/locations.json",
                        headers=self.headers,
                        timeout=10.0
                    )
                    if loc_response.status_code == 200:
                        locations = loc_response.json().get("locations", [])
                        if locations:
                            location_id = locations[0]["id"]

                if location_id:
                    response = await client.get(
                        f"{self.base_url}/inventory_levels.json",
                        headers=self.headers,
                        params={"location_ids": location_id},
                        timeout=30.0
                    )
                    if response.status_code == 200:
                        return response.json().get("inventory_levels", [])
                return []
        except Exception as e:
            logger.error(f"Error fetching inventory levels: {e}")
            return []


# Singleton instance factory
def create_shopify_service(store_url: str, access_token: str) -> ShopifyService:
    """Create a new Shopify service instance."""
    return ShopifyService(store_url, access_token)
