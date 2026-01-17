"""Social content generation API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import Product
from services.social_content_service import social_content_service

router = APIRouter(prefix="/api/social", tags=["social"])


# ============== Request/Response Models ==============

class InstagramRequest(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    key_features: Optional[List[str]] = None
    style: str = "lifestyle"  # lifestyle, promotional, educational, ugc
    hashtag_count: int = 20


class TikTokRequest(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    hook: str = "Wait till you see this..."


class FacebookRequest(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    description: Optional[str] = None
    post_type: str = "product"  # product, story, question, promotion


class TwitterRequest(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    key_points: Optional[List[str]] = None
    tweet_count: int = 5


class PinterestRequest(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    category: str = "lifestyle"


class InstagramResponse(BaseModel):
    caption: str
    hashtags: List[str]
    suggested_image_style: str
    best_posting_time: str


class TikTokResponse(BaseModel):
    caption: str
    hashtags: List[str]
    trending_sounds: List[str]
    video_ideas: List[str]


class FacebookResponse(BaseModel):
    text: str
    call_to_action: str
    suggested_link_preview: str


class TwitterResponse(BaseModel):
    tweets: List[str]
    hashtags: List[str]


class PinterestResponse(BaseModel):
    title: str
    description: str
    board_suggestions: List[str]
    keywords: List[str]


class HashtagsResponse(BaseModel):
    platform: str
    category: str
    hashtags: List[str]


class PostingTimesResponse(BaseModel):
    platform: str
    times: List[dict]


# ============== Helpers ==============

def get_product_details(product_id: int, db: Session) -> Product:
    """Get product details from database."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ============== Endpoints ==============

@router.post("/generate/instagram", response_model=InstagramResponse)
async def generate_instagram(request: InstagramRequest, db: Session = Depends(get_db)):
    """Generate Instagram post content for a product."""
    product_name = request.product_name
    key_features = request.key_features or []

    if request.product_id:
        product = get_product_details(request.product_id, db)
        product_name = product.name
        if not key_features and product.description:
            # Extract features from description
            key_features = [product.description[:100]]

    if not product_name:
        raise HTTPException(status_code=400, detail="Product name or product_id required")

    result = await social_content_service.generate_instagram_post(
        product_name=product_name,
        key_features=key_features,
        style=request.style,
        hashtag_count=request.hashtag_count
    )

    return InstagramResponse(
        caption=result.caption,
        hashtags=result.hashtags,
        suggested_image_style=result.suggested_image_style,
        best_posting_time=result.best_posting_time
    )


@router.post("/generate/tiktok", response_model=TikTokResponse)
async def generate_tiktok(request: TikTokRequest, db: Session = Depends(get_db)):
    """Generate TikTok caption for a product."""
    product_name = request.product_name

    if request.product_id:
        product = get_product_details(request.product_id, db)
        product_name = product.name

    if not product_name:
        raise HTTPException(status_code=400, detail="Product name or product_id required")

    result = await social_content_service.generate_tiktok_caption(
        product_name=product_name,
        hook=request.hook
    )

    return TikTokResponse(
        caption=result.caption,
        hashtags=result.hashtags,
        trending_sounds=result.trending_sounds,
        video_ideas=result.video_ideas
    )


@router.post("/generate/facebook", response_model=FacebookResponse)
async def generate_facebook(request: FacebookRequest, db: Session = Depends(get_db)):
    """Generate Facebook post for a product."""
    product_name = request.product_name
    description = request.description or ""

    if request.product_id:
        product = get_product_details(request.product_id, db)
        product_name = product.name
        description = description or product.description or ""

    if not product_name:
        raise HTTPException(status_code=400, detail="Product name or product_id required")

    result = await social_content_service.generate_facebook_post(
        product_name=product_name,
        description=description,
        post_type=request.post_type
    )

    return FacebookResponse(
        text=result.text,
        call_to_action=result.call_to_action,
        suggested_link_preview=result.suggested_link_preview
    )


@router.post("/generate/twitter", response_model=TwitterResponse)
async def generate_twitter_thread(request: TwitterRequest, db: Session = Depends(get_db)):
    """Generate Twitter thread for a product."""
    product_name = request.product_name
    key_points = request.key_points or []

    if request.product_id:
        product = get_product_details(request.product_id, db)
        product_name = product.name
        if not key_points and product.description:
            # Extract key points from description
            key_points = [product.description[:100]]

    if not product_name:
        raise HTTPException(status_code=400, detail="Product name or product_id required")

    result = await social_content_service.generate_twitter_thread(
        product_name=product_name,
        key_points=key_points,
        tweet_count=request.tweet_count
    )

    return TwitterResponse(
        tweets=result.tweets,
        hashtags=result.hashtags
    )


@router.post("/generate/pinterest", response_model=PinterestResponse)
async def generate_pinterest(request: PinterestRequest, db: Session = Depends(get_db)):
    """Generate Pinterest pin content for a product."""
    product_name = request.product_name

    if request.product_id:
        product = get_product_details(request.product_id, db)
        product_name = product.name

    if not product_name:
        raise HTTPException(status_code=400, detail="Product name or product_id required")

    result = await social_content_service.generate_pinterest_pin(
        product_name=product_name,
        category=request.category
    )

    return PinterestResponse(
        title=result.title,
        description=result.description,
        board_suggestions=result.board_suggestions,
        keywords=result.keywords
    )


@router.get("/trending-hashtags", response_model=HashtagsResponse)
async def get_trending_hashtags(
    platform: str = "instagram",
    category: str = "default",
    count: int = 20
):
    """Get trending hashtags for a platform and category."""
    hashtags = social_content_service.get_trending_hashtags(
        platform=platform,
        category=category,
        count=count
    )

    return HashtagsResponse(
        platform=platform,
        category=category,
        hashtags=hashtags
    )


@router.get("/best-times", response_model=PostingTimesResponse)
async def get_best_posting_times(
    platform: str = "instagram",
    timezone: str = "America/New_York"
):
    """Get best posting times for a platform."""
    times = social_content_service.get_best_posting_times(
        platform=platform,
        audience_timezone=timezone
    )

    return PostingTimesResponse(
        platform=platform,
        times=times
    )


@router.post("/generate/all")
async def generate_all_platforms(
    product_id: int,
    style: str = "lifestyle",
    hook: str = "Wait till you see this...",
    db: Session = Depends(get_db)
):
    """Generate content for all platforms at once."""
    product = get_product_details(product_id, db)
    key_features = [product.description[:100]] if product.description else []

    instagram = await social_content_service.generate_instagram_post(
        product_name=product.name,
        key_features=key_features,
        style=style
    )

    tiktok = await social_content_service.generate_tiktok_caption(
        product_name=product.name,
        hook=hook
    )

    facebook = await social_content_service.generate_facebook_post(
        product_name=product.name,
        description=product.description or "",
        post_type="product"
    )

    twitter = await social_content_service.generate_twitter_thread(
        product_name=product.name,
        key_points=key_features,
        tweet_count=5
    )

    pinterest = await social_content_service.generate_pinterest_pin(
        product_name=product.name,
        category="lifestyle"
    )

    return {
        "product": {
            "id": product.id,
            "name": product.name
        },
        "instagram": {
            "caption": instagram.caption,
            "hashtags": instagram.hashtags,
            "suggested_image_style": instagram.suggested_image_style,
            "best_posting_time": instagram.best_posting_time
        },
        "tiktok": {
            "caption": tiktok.caption,
            "hashtags": tiktok.hashtags,
            "trending_sounds": tiktok.trending_sounds,
            "video_ideas": tiktok.video_ideas
        },
        "facebook": {
            "text": facebook.text,
            "call_to_action": facebook.call_to_action,
            "suggested_link_preview": facebook.suggested_link_preview
        },
        "twitter": {
            "tweets": twitter.tweets,
            "hashtags": twitter.hashtags
        },
        "pinterest": {
            "title": pinterest.title,
            "description": pinterest.description,
            "board_suggestions": pinterest.board_suggestions,
            "keywords": pinterest.keywords
        }
    }
