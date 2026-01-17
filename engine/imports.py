"""Product Import API endpoints for parsing URLs and creating products."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import re
import hashlib

from database import get_db
from models import Product

router = APIRouter(prefix="/api/import", tags=["import"])


# ============== Schemas ==============

class ParseUrlRequest(BaseModel):
    url: str


class ParsedProductData(BaseModel):
    title: str
    description: str
    images: List[str]
    price_cents: int
    supplier_cost_cents: int
    supplier_url: str
    supplier_name: str
    category: Optional[str] = None


class ParseUrlResponse(BaseModel):
    success: bool
    data: Optional[ParsedProductData] = None
    error: Optional[str] = None


class CreateFromImportRequest(BaseModel):
    title: str
    description: str
    price_cents: int
    supplier_cost_cents: int
    supplier_url: str
    supplier_name: str
    main_image_url: Optional[str] = None


class CreateFromImportResponse(BaseModel):
    success: bool
    product_id: Optional[int] = None
    slug: Optional[str] = None
    message: str


# ============== Helper Functions ==============

def detect_source(url: str) -> str:
    """Detect the source platform from URL."""
    url_lower = url.lower()
    if "aliexpress" in url_lower:
        return "aliexpress"
    if "cjdropshipping" in url_lower:
        return "cjdropshipping"
    if "alibaba" in url_lower:
        return "alibaba"
    if "amazon" in url_lower:
        return "amazon"
    return "unknown"


def generate_slug(title: str) -> str:
    """Generate a URL-friendly slug from title."""
    # Remove special characters and convert to lowercase
    slug = re.sub(r'[^a-z0-9\s-]', '', title.lower())
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Remove multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    # Trim to reasonable length
    slug = slug[:50].strip('-')
    return slug


def parse_aliexpress_demo(url: str) -> ParsedProductData:
    """Demo parser for AliExpress URLs - returns sample data."""
    # In production, this would scrape or use API
    # For demo, return mock data based on URL hash

    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]

    return ParsedProductData(
        title=f"Trending Product {url_hash}",
        description="This is a high-quality product imported from AliExpress. Features premium materials and modern design. Perfect for everyday use.",
        images=[
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
        ],
        price_cents=2999,
        supplier_cost_cents=899,
        supplier_url=url,
        supplier_name="AliExpress",
        category="electronics"
    )


def parse_cj_demo(url: str) -> ParsedProductData:
    """Demo parser for CJ Dropshipping URLs."""
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]

    return ParsedProductData(
        title=f"CJ Product {url_hash}",
        description="Premium quality product from CJ Dropshipping. Fast shipping and reliable supplier.",
        images=[
            "https://images.unsplash.com/photo-1491553895911-0055uj8e1414f?w=400",
            "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400",
        ],
        price_cents=3499,
        supplier_cost_cents=1199,
        supplier_url=url,
        supplier_name="CJ Dropshipping",
        category="fashion"
    )


def parse_generic_demo(url: str, source: str) -> ParsedProductData:
    """Demo parser for other URLs."""
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]

    return ParsedProductData(
        title=f"Imported Product {url_hash}",
        description="Product imported from external source. Edit details before publishing.",
        images=[
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
        ],
        price_cents=1999,
        supplier_cost_cents=599,
        supplier_url=url,
        supplier_name=source.title() if source != "unknown" else "External",
        category="general"
    )


# ============== Endpoints ==============

@router.post("/parse-url", response_model=ParseUrlResponse)
async def parse_url(request: ParseUrlRequest):
    """Parse a product URL and extract product data."""
    url = request.url.strip()

    if not url:
        return ParseUrlResponse(success=False, error="URL is required")

    # Validate URL format
    if not url.startswith(("http://", "https://")):
        return ParseUrlResponse(success=False, error="Invalid URL format")

    source = detect_source(url)

    try:
        # In production, implement actual parsing/scraping
        # For now, return demo data
        if source == "aliexpress":
            data = parse_aliexpress_demo(url)
        elif source == "cjdropshipping":
            data = parse_cj_demo(url)
        else:
            data = parse_generic_demo(url, source)

        return ParseUrlResponse(success=True, data=data)

    except Exception as e:
        return ParseUrlResponse(
            success=False,
            error=f"Failed to parse URL: {str(e)}"
        )


@router.post("/create-product", response_model=CreateFromImportResponse)
async def create_from_import(
    request: CreateFromImportRequest,
    db: Session = Depends(get_db)
):
    """Create a product from imported data."""

    # Generate slug
    base_slug = generate_slug(request.title)
    slug = base_slug

    # Ensure unique slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Calculate profit margin
    margin = 0.0
    if request.supplier_cost_cents > 0:
        margin = ((request.price_cents - request.supplier_cost_cents) / request.price_cents) * 100

    # Create product
    new_product = Product(
        slug=slug,
        name=request.title,
        description=request.description,
        price_cents=request.price_cents,
        cost_cents=request.supplier_cost_cents,
        main_image_url=request.main_image_url,
        supplier_url=request.supplier_url,
        supplier_name=request.supplier_name,
        supplier_cost_cents=request.supplier_cost_cents,
        profit_margin=margin,
        import_source=detect_source(request.supplier_url),
        status="testing",
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return CreateFromImportResponse(
        success=True,
        product_id=new_product.id,
        slug=new_product.slug,
        message=f"Successfully created product: {new_product.name}"
    )


@router.get("/supported-platforms")
async def get_supported_platforms():
    """Get list of supported import platforms."""
    return {
        "platforms": [
            {
                "name": "AliExpress",
                "domain": "aliexpress.com",
                "status": "supported",
                "features": ["product_info", "images", "pricing"]
            },
            {
                "name": "CJ Dropshipping",
                "domain": "cjdropshipping.com",
                "status": "supported",
                "features": ["product_info", "images", "pricing", "shipping"]
            },
            {
                "name": "Alibaba",
                "domain": "alibaba.com",
                "status": "supported",
                "features": ["product_info", "images", "pricing"]
            },
            {
                "name": "Amazon",
                "domain": "amazon.com",
                "status": "limited",
                "features": ["product_info", "images"]
            }
        ]
    }
