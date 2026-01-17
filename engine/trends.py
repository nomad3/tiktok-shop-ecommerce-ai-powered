"""Trends API endpoints for discovering and importing trending products."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import random

from database import get_db
from models import TrendProduct, Product, TrendVelocity, AIRecommendation

router = APIRouter(prefix="/api/trends", tags=["trends"])


# ============== Schemas ==============

class TrendProductResponse(BaseModel):
    id: int
    external_id: str
    title: str
    description: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    source: str
    category: Optional[str]
    trend_score: float
    trend_velocity: str
    view_count: int
    like_count: int
    supplier_url: Optional[str]
    supplier_price_cents: Optional[int]
    suggested_price_cents: Optional[int]
    estimated_margin: Optional[float]
    ai_recommendation: Optional[str]
    ai_reasoning: Optional[str]
    is_imported: bool

    class Config:
        from_attributes = True


class TrendProductListResponse(BaseModel):
    products: List[TrendProductResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class ImportTrendProductRequest(BaseModel):
    trend_product_id: int
    custom_name: Optional[str] = None
    custom_description: Optional[str] = None
    custom_price_cents: Optional[int] = None


class ImportTrendProductResponse(BaseModel):
    success: bool
    product_id: Optional[int] = None
    message: str


# ============== Endpoints ==============

@router.get("/products", response_model=TrendProductListResponse)
async def list_trend_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None, description="Minimum price in cents"),
    max_price: Optional[int] = Query(None, description="Maximum price in cents"),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    velocity: Optional[List[str]] = Query(None),
    sort_by: str = Query("trend_score", regex="^(trend_score|price_low|price_high|newest|margin)$"),
    db: Session = Depends(get_db),
):
    """List trending products with filters and pagination."""
    query = db.query(TrendProduct)

    # Apply filters
    if category and category != "all":
        query = query.filter(TrendProduct.category == category)

    if min_price is not None:
        query = query.filter(TrendProduct.suggested_price_cents >= min_price)

    if max_price is not None:
        query = query.filter(TrendProduct.suggested_price_cents <= max_price)

    if min_score is not None:
        query = query.filter(TrendProduct.trend_score >= min_score)

    if velocity:
        query = query.filter(TrendProduct.trend_velocity.in_(velocity))

    # Apply sorting
    if sort_by == "trend_score":
        query = query.order_by(desc(TrendProduct.trend_score))
    elif sort_by == "price_low":
        query = query.order_by(asc(TrendProduct.suggested_price_cents))
    elif sort_by == "price_high":
        query = query.order_by(desc(TrendProduct.suggested_price_cents))
    elif sort_by == "newest":
        query = query.order_by(desc(TrendProduct.discovered_at))
    elif sort_by == "margin":
        query = query.order_by(desc(TrendProduct.estimated_margin))

    # Get total count
    total = query.count()

    # Paginate
    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()

    return TrendProductListResponse(
        products=[TrendProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(products)) < total,
    )


@router.get("/products/{product_id}", response_model=TrendProductResponse)
async def get_trend_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    """Get a single trend product by ID."""
    product = db.query(TrendProduct).filter(TrendProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Trend product not found")
    return TrendProductResponse.model_validate(product)


@router.post("/import", response_model=ImportTrendProductResponse)
async def import_trend_product(
    request: ImportTrendProductRequest,
    db: Session = Depends(get_db),
):
    """Import a trend product into the store catalog."""
    trend_product = db.query(TrendProduct).filter(TrendProduct.id == request.trend_product_id).first()
    if not trend_product:
        raise HTTPException(status_code=404, detail="Trend product not found")

    if trend_product.is_imported:
        raise HTTPException(status_code=400, detail="Product already imported")

    # Create slug from title
    import re
    base_slug = re.sub(r'[^a-z0-9]+', '-', (request.custom_name or trend_product.title).lower()).strip('-')
    slug = base_slug[:50]

    # Check for duplicate slug and append number if needed
    existing = db.query(Product).filter(Product.slug == slug).first()
    if existing:
        counter = 1
        while db.query(Product).filter(Product.slug == f"{slug}-{counter}").first():
            counter += 1
        slug = f"{slug}-{counter}"

    # Create the product
    new_product = Product(
        slug=slug,
        name=request.custom_name or trend_product.title,
        description=request.custom_description or trend_product.description,
        price_cents=request.custom_price_cents or trend_product.suggested_price_cents or 1999,
        cost_cents=trend_product.supplier_price_cents,
        main_image_url=trend_product.image_url,
        video_url=trend_product.video_url,
        trend_score=trend_product.trend_score,
        supplier_url=trend_product.supplier_url,
        supplier_cost_cents=trend_product.supplier_price_cents,
        profit_margin=trend_product.estimated_margin,
        import_source=trend_product.source,
    )

    db.add(new_product)
    db.flush()  # Get the ID

    # Mark trend product as imported
    trend_product.is_imported = True
    trend_product.imported_product_id = new_product.id

    db.commit()

    return ImportTrendProductResponse(
        success=True,
        product_id=new_product.id,
        message=f"Successfully imported product: {new_product.name}",
    )


@router.post("/seed")
async def seed_trend_products(db: Session = Depends(get_db)):
    """Seed demo trend products for testing."""
    # Check if we already have trend products
    existing = db.query(TrendProduct).count()
    if existing > 0:
        return {"message": f"Already have {existing} trend products", "seeded": 0}

    demo_products = [
        {
            "external_id": "tiktok_viral_001",
            "title": "LED Cloud Light - Viral TikTok Room Decor",
            "description": "The cloud light that broke TikTok! DIY thunderstorm ambiance with remote control. 16 colors, 4 lightning modes.",
            "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400",
            "source": "tiktok",
            "category": "home",
            "trend_score": 92,
            "trend_velocity": "rising",
            "view_count": 45_000_000,
            "like_count": 8_200_000,
            "supplier_url": "https://aliexpress.com/item/cloud-light",
            "supplier_price_cents": 1299,
            "suggested_price_cents": 4999,
            "estimated_margin": 74,
            "ai_recommendation": "import",
            "ai_reasoning": "Extremely high engagement with 45M views. Room decor trending among Gen Z. High margin potential at suggested price. Low supplier cost enables competitive pricing while maintaining profitability.",
        },
        {
            "external_id": "tiktok_viral_002",
            "title": "Sunset Projection Lamp - Aesthetic Room Vibes",
            "description": "360° rotating sunset lamp creating golden hour anytime. USB powered, perfect for content creation and cozy vibes.",
            "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "source": "tiktok",
            "category": "home",
            "trend_score": 88,
            "trend_velocity": "rising",
            "view_count": 32_000_000,
            "like_count": 5_800_000,
            "supplier_url": "https://aliexpress.com/item/sunset-lamp",
            "supplier_price_cents": 899,
            "suggested_price_cents": 3499,
            "estimated_margin": 74,
            "ai_recommendation": "import",
            "ai_reasoning": "Content creator favorite - drives organic UGC. Consistent demand with evergreen appeal. Compact and lightweight = low shipping costs.",
        },
        {
            "external_id": "tiktok_viral_003",
            "title": "Mini Portable Blender - Protein Shake On-The-Go",
            "description": "Rechargeable USB blender, 6 blades, BPA-free. Makes smoothies in 30 seconds. Gym bag essential!",
            "image_url": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400",
            "source": "tiktok",
            "category": "electronics",
            "trend_score": 85,
            "trend_velocity": "stable",
            "view_count": 28_000_000,
            "like_count": 4_100_000,
            "supplier_url": "https://aliexpress.com/item/mini-blender",
            "supplier_price_cents": 1199,
            "suggested_price_cents": 3999,
            "estimated_margin": 70,
            "ai_recommendation": "import",
            "ai_reasoning": "Fitness trend alignment. Year-round demand with peaks in January and summer. Strong reviews across platforms.",
        },
        {
            "external_id": "tiktok_viral_004",
            "title": "Phone Camera Lens Kit - Pro Photos Anywhere",
            "description": "3-in-1 lens kit: Wide angle, Macro, Fisheye. Universal clip fits all phones. TikTok photography hack!",
            "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
            "source": "tiktok",
            "category": "electronics",
            "trend_score": 76,
            "trend_velocity": "stable",
            "view_count": 15_000_000,
            "like_count": 2_100_000,
            "supplier_url": "https://aliexpress.com/item/phone-lens-kit",
            "supplier_price_cents": 599,
            "suggested_price_cents": 2499,
            "estimated_margin": 76,
            "ai_recommendation": "watch",
            "ai_reasoning": "Good margin but competitive market. Consider unique packaging or bundle deals to differentiate.",
        },
        {
            "external_id": "tiktok_viral_005",
            "title": "Magnetic Phone Mount - MagSafe Car Holder",
            "description": "Super strong magnets, 360° rotation. Works with all MagSafe cases. Clean dashboard look.",
            "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
            "source": "tiktok",
            "category": "electronics",
            "trend_score": 72,
            "trend_velocity": "stable",
            "view_count": 12_000_000,
            "like_count": 1_800_000,
            "supplier_url": "https://aliexpress.com/item/magsafe-mount",
            "supplier_price_cents": 499,
            "suggested_price_cents": 1999,
            "estimated_margin": 75,
            "ai_recommendation": "watch",
            "ai_reasoning": "Steady demand but saturated market. MagSafe compatibility is a plus. Might need premium positioning.",
        },
        {
            "external_id": "tiktok_viral_006",
            "title": "Wireless Earbuds - AirPod Pro Alternative",
            "description": "Active noise cancellation, 30hr battery, transparent mode. Looks just like the $250 version!",
            "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
            "source": "aliexpress",
            "category": "electronics",
            "trend_score": 65,
            "trend_velocity": "declining",
            "view_count": 8_000_000,
            "like_count": 1_200_000,
            "supplier_url": "https://aliexpress.com/item/wireless-earbuds",
            "supplier_price_cents": 1599,
            "suggested_price_cents": 4999,
            "estimated_margin": 68,
            "ai_recommendation": "skip",
            "ai_reasoning": "High return rate potential for electronics. Quality concerns with clones. Trademark risk with 'AirPod' comparison marketing.",
        },
        {
            "external_id": "tiktok_viral_007",
            "title": "Ice Roller Face Massager - Skincare Viral",
            "description": "Stainless steel ice roller for morning depuff. Reduces pores, calms skin. Celebrity-approved skincare hack!",
            "image_url": "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400",
            "source": "tiktok",
            "category": "beauty",
            "trend_score": 89,
            "trend_velocity": "rising",
            "view_count": 38_000_000,
            "like_count": 6_900_000,
            "supplier_url": "https://aliexpress.com/item/ice-roller",
            "supplier_price_cents": 299,
            "suggested_price_cents": 1499,
            "estimated_margin": 80,
            "ai_recommendation": "import",
            "ai_reasoning": "Beauty/skincare is hot category. Extremely high margin, low shipping cost. Easy to demonstrate value in short videos.",
        },
        {
            "external_id": "tiktok_viral_008",
            "title": "Portable Ring Light - Content Creator Essential",
            "description": "10-inch ring light with phone holder. 3 color modes, 10 brightness levels. Tripod included!",
            "image_url": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400",
            "source": "tiktok",
            "category": "electronics",
            "trend_score": 78,
            "trend_velocity": "stable",
            "view_count": 22_000_000,
            "like_count": 3_100_000,
            "supplier_url": "https://aliexpress.com/item/ring-light",
            "supplier_price_cents": 899,
            "suggested_price_cents": 2999,
            "estimated_margin": 70,
            "ai_recommendation": "import",
            "ai_reasoning": "Evergreen product for growing creator economy. Self-marketing - buyers create content showing the product. Bundle potential with tripod/accessories.",
        },
        {
            "external_id": "tiktok_viral_009",
            "title": "Acupressure Mat Set - Wellness TikTok Trend",
            "description": "Spike mat and pillow set for back pain relief. 10 minutes a day for better sleep and relaxation.",
            "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
            "source": "tiktok",
            "category": "sports",
            "trend_score": 81,
            "trend_velocity": "rising",
            "view_count": 25_000_000,
            "like_count": 4_500_000,
            "supplier_url": "https://aliexpress.com/item/acupressure-mat",
            "supplier_price_cents": 799,
            "suggested_price_cents": 3499,
            "estimated_margin": 77,
            "ai_recommendation": "import",
            "ai_reasoning": "Wellness trend continues to grow. Demonstrable results drive testimonial content. Gift-giving potential.",
        },
        {
            "external_id": "tiktok_viral_010",
            "title": "Retro Pixel Art Frame - Digital Photo Display",
            "description": "16x16 LED pixel display. Create custom art or upload photos. Perfect desk decor for gamers!",
            "image_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400",
            "source": "tiktok",
            "category": "electronics",
            "trend_score": 83,
            "trend_velocity": "rising",
            "view_count": 19_000_000,
            "like_count": 3_800_000,
            "supplier_url": "https://aliexpress.com/item/pixel-frame",
            "supplier_price_cents": 1899,
            "suggested_price_cents": 5999,
            "estimated_margin": 68,
            "ai_recommendation": "import",
            "ai_reasoning": "Unique product with gaming/nostalgia appeal. High perceived value. Customization feature encourages sharing = free marketing.",
        },
        {
            "external_id": "tiktok_viral_011",
            "title": "Pet GPS Tracker - Never Lose Your Fur Baby",
            "description": "Real-time GPS tracking, waterproof, 7-day battery. Works worldwide with app. Peace of mind for pet parents.",
            "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
            "source": "instagram",
            "category": "pets",
            "trend_score": 74,
            "trend_velocity": "stable",
            "view_count": 11_000_000,
            "like_count": 1_900_000,
            "supplier_url": "https://aliexpress.com/item/pet-gps",
            "supplier_price_cents": 1499,
            "suggested_price_cents": 4499,
            "estimated_margin": 67,
            "ai_recommendation": "watch",
            "ai_reasoning": "Pet market is lucrative but requires ongoing app/service support. Verify supplier reliability before committing.",
        },
        {
            "external_id": "tiktok_viral_012",
            "title": "Foldable Laptop Stand - WFH Essential",
            "description": "Ergonomic aluminum stand, 6 height levels. Folds flat for travel. Compatible with all laptops up to 17\".",
            "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
            "source": "tiktok",
            "category": "electronics",
            "trend_score": 69,
            "trend_velocity": "stable",
            "view_count": 9_000_000,
            "like_count": 1_400_000,
            "supplier_url": "https://aliexpress.com/item/laptop-stand",
            "supplier_price_cents": 699,
            "suggested_price_cents": 2499,
            "estimated_margin": 72,
            "ai_recommendation": "watch",
            "ai_reasoning": "Remote work trend is steady. Competitive market but consistent demand. Good for bundling with other desk accessories.",
        },
    ]

    seeded = 0
    for product_data in demo_products:
        trend_product = TrendProduct(**product_data)
        db.add(trend_product)
        seeded += 1

    db.commit()

    return {"message": f"Seeded {seeded} trend products", "seeded": seeded}


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get list of unique categories from trend products."""
    categories = db.query(TrendProduct.category).distinct().all()
    return {
        "categories": [
            {"value": "all", "label": "All Categories"},
            *[{"value": c[0], "label": c[0].title()} for c in categories if c[0]],
        ]
    }


@router.get("/stats")
async def get_trend_stats(db: Session = Depends(get_db)):
    """Get statistics about trend products."""
    total = db.query(TrendProduct).count()
    imported = db.query(TrendProduct).filter(TrendProduct.is_imported == True).count()
    rising = db.query(TrendProduct).filter(TrendProduct.trend_velocity == "rising").count()
    recommended = db.query(TrendProduct).filter(TrendProduct.ai_recommendation == "import").count()

    return {
        "total_products": total,
        "imported_products": imported,
        "rising_trends": rising,
        "ai_recommended": recommended,
    }
