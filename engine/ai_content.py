"""AI Content Generation API endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from services.ai_service import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai-content"])


# ============== Request/Response Schemas ==============

class DescriptionRequest(BaseModel):
    product_name: str
    category: Optional[str] = None
    features: Optional[List[str]] = None
    target_audience: Optional[str] = None
    tone: str = "engaging"  # engaging, professional, fun, luxurious, urgent
    length: str = "medium"  # short, medium, long


class DescriptionResponse(BaseModel):
    success: bool
    description: str
    variations: List[str]
    tokens_used: int


class AdCopyRequest(BaseModel):
    product_name: str
    product_description: str
    platform: str = "tiktok"  # tiktok, instagram, facebook
    goal: str = "conversions"  # awareness, engagement, conversions


class AdCopyResponse(BaseModel):
    headline: str
    body: str
    cta: str
    hashtags: List[str]
    variations: List[dict]


class PricingRequest(BaseModel):
    product_name: str
    supplier_cost_cents: int
    category: Optional[str] = None
    competitor_prices: Optional[List[int]] = None
    target_margin: float = 0.5


class PricingResponse(BaseModel):
    suggested_price_cents: int
    min_price_cents: int
    max_price_cents: int
    confidence: float
    reasoning: str
    competitor_analysis: Optional[str] = None


class BulkContentRequest(BaseModel):
    product_name: str
    category: Optional[str] = None
    features: Optional[List[str]] = None
    supplier_cost_cents: Optional[int] = None
    generate_description: bool = True
    generate_ad_copy: bool = True
    generate_pricing: bool = True


class BulkContentResponse(BaseModel):
    description: Optional[DescriptionResponse] = None
    ad_copy: Optional[AdCopyResponse] = None
    pricing: Optional[PricingResponse] = None


# ============== Endpoints ==============

@router.post("/generate-description", response_model=DescriptionResponse)
async def generate_description(request: DescriptionRequest):
    """Generate a product description using AI."""
    result = ai_service.generate_product_description(
        product_name=request.product_name,
        category=request.category,
        features=request.features,
        target_audience=request.target_audience,
        tone=request.tone,
        length=request.length
    )

    return DescriptionResponse(
        success=result.success,
        description=result.content,
        variations=result.variations,
        tokens_used=result.tokens_used
    )


@router.post("/generate-ad-copy", response_model=AdCopyResponse)
async def generate_ad_copy(request: AdCopyRequest):
    """Generate ad copy for social media platforms."""
    result = ai_service.generate_ad_copy(
        product_name=request.product_name,
        product_description=request.product_description,
        platform=request.platform,
        goal=request.goal
    )

    return AdCopyResponse(
        headline=result.headline,
        body=result.body,
        cta=result.cta,
        hashtags=result.hashtags,
        variations=result.variations
    )


@router.post("/recommend-pricing", response_model=PricingResponse)
async def recommend_pricing(request: PricingRequest):
    """Get AI-powered pricing recommendations."""
    if request.supplier_cost_cents <= 0:
        raise HTTPException(status_code=400, detail="Supplier cost must be positive")

    result = ai_service.recommend_pricing(
        product_name=request.product_name,
        supplier_cost_cents=request.supplier_cost_cents,
        category=request.category,
        competitor_prices=request.competitor_prices,
        target_margin=request.target_margin
    )

    return PricingResponse(
        suggested_price_cents=result.suggested_price_cents,
        min_price_cents=result.min_price_cents,
        max_price_cents=result.max_price_cents,
        confidence=result.confidence,
        reasoning=result.reasoning,
        competitor_analysis=result.competitor_analysis
    )


@router.post("/generate-bulk", response_model=BulkContentResponse)
async def generate_bulk_content(request: BulkContentRequest):
    """Generate all content types for a product in one request."""
    response = BulkContentResponse()

    if request.generate_description:
        desc_result = ai_service.generate_product_description(
            product_name=request.product_name,
            category=request.category,
            features=request.features
        )
        response.description = DescriptionResponse(
            success=desc_result.success,
            description=desc_result.content,
            variations=desc_result.variations,
            tokens_used=desc_result.tokens_used
        )

    if request.generate_ad_copy and response.description:
        ad_result = ai_service.generate_ad_copy(
            product_name=request.product_name,
            product_description=response.description.description
        )
        response.ad_copy = AdCopyResponse(
            headline=ad_result.headline,
            body=ad_result.body,
            cta=ad_result.cta,
            hashtags=ad_result.hashtags,
            variations=ad_result.variations
        )

    if request.generate_pricing and request.supplier_cost_cents:
        pricing_result = ai_service.recommend_pricing(
            product_name=request.product_name,
            supplier_cost_cents=request.supplier_cost_cents,
            category=request.category
        )
        response.pricing = PricingResponse(
            suggested_price_cents=pricing_result.suggested_price_cents,
            min_price_cents=pricing_result.min_price_cents,
            max_price_cents=pricing_result.max_price_cents,
            confidence=pricing_result.confidence,
            reasoning=pricing_result.reasoning,
            competitor_analysis=pricing_result.competitor_analysis
        )

    return response


@router.get("/health")
async def ai_health_check():
    """Check if AI service is available."""
    has_api_key = ai_service.client is not None
    return {
        "status": "available" if has_api_key else "fallback",
        "ai_enabled": has_api_key,
        "message": "AI service is ready" if has_api_key else "Running in fallback mode (no API key)"
    }
