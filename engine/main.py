from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import crud, models, schemas
from database import SessionLocal, engine
from webhooks import router as webhooks_router
from services.tiktok_service import tiktok_service
from services.ai_service import ai_service

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TikTok Urgency Engine")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include webhook router
app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "online", "service": "TikTok Urgency Engine"}

@app.get("/products", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@app.get("/products/{slug}", response_model=schemas.Product)
def read_product(slug: str, db: Session = Depends(get_db)):
    db_product = crud.get_product_by_slug(db, slug=slug)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.post("/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

# Seed endpoint for demo purposes
@app.post("/seed")
def seed_db(db: Session = Depends(get_db)):
    # Check if empty
    if crud.get_products(db, limit=1):
        return {"message": "Database already seeded"}

    seed_data = [
        {
            "slug": "galaxy-projector",
            "name": "Astronaut Galaxy Projector 2.0",
            "description": "Transform your room into a galaxy. The viral TikTok sensation.",
            "price_cents": 2999,
            "main_image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
            "trend_score": 98.5,
            "urgency_score": 95.0
        },
        {
            "slug": "neck-fan",
            "name": "Portable Bladeless Neck Fan",
            "description": "Stay cool anywhere. Hands-free cooling for hot summer days.",
            "price_cents": 1999,
            "main_image_url": "https://images.unsplash.com/photo-1618360987523-288f986a438d?w=800&q=80",
            "trend_score": 92.0,
            "urgency_score": 88.0
        },
        {
            "slug": "cleaning-gel",
            "name": "Universal Dust Cleaning Gel",
            "description": "The satisfying way to clean your car and keyboard.",
            "price_cents": 899,
            "main_image_url": "https://images.unsplash.com/photo-1581557991964-125469da3b8a?w=800&q=80",
            "trend_score": 85.0,
            "urgency_score": 80.0
        }
    ]

    created = []
    for item in seed_data:
        p = schemas.ProductCreate(**item)
        created.append(crud.create_product(db, p))

    return {"message": "Seeded", "count": len(created)}

@app.post("/create-checkout-session", response_model=schemas.CheckoutSessionResponse)
def create_checkout_session(request: schemas.CheckoutSessionRequest, db: Session = Depends(get_db)):
    product = crud.get_product(db, request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    import stripe_service
    session = stripe_service.create_checkout_session(
        product_name=product.name,
        price_cents=product.price_cents,
        product_slug=product.slug
    )

    return {"checkout_url": session.url, "session_id": session.id}


# ============ TREND INGESTION ENDPOINTS ============

@app.post("/trends/ingest", response_model=schemas.IngestResponse)
def ingest_trends(db: Session = Depends(get_db)):
    """Fetch trending data from TikTok and score with AI."""
    # Fetch trending hashtags from TikTok
    trends = tiktok_service.fetch_trending_hashtags(count=20)

    signals_stored = 0
    products_created = 0

    for trend in trends:
        # Store as trend signal
        signal_data = schemas.TrendSignalCreate(
            source="tiktok",
            metric="trending_hashtag",
            value=trend.views,
            raw_data=json.dumps(trend.raw_data),
            product_id=None
        )
        crud.create_trend_signal(db, signal_data)
        signals_stored += 1

        # Score with AI
        score_result = ai_service.score_trend(
            hashtag=trend.hashtag,
            views=trend.views,
            growth_rate=trend.growth_rate,
            engagement=trend.engagement,
            video_count=trend.video_count
        )

        # If high potential, create a product candidate
        if score_result.trend_score >= 70 and score_result.suggested_name:
            # Check if product already exists
            existing = crud.get_product_by_slug(db, trend.hashtag.lower().replace(" ", "-"))
            if not existing:
                product_data = schemas.ProductCreate(
                    slug=trend.hashtag.lower().replace(" ", "-"),
                    name=score_result.suggested_name or f"Trending: {trend.hashtag}",
                    description=score_result.suggested_description or f"Viral product from #{trend.hashtag}",
                    price_cents=1999,  # Default price, to be updated
                    trend_score=score_result.trend_score,
                    urgency_score=score_result.urgency_score
                )
                crud.create_product(db, product_data)
                products_created += 1

    return {
        "trends_fetched": len(trends),
        "products_created": products_created,
        "signals_stored": signals_stored
    }


@app.get("/trends/signals", response_model=List[schemas.TrendSignal])
def get_trend_signals(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Get stored trend signals."""
    return crud.get_trend_signals(db, skip=skip, limit=limit)


@app.post("/trends/score", response_model=schemas.ScoringResponse)
def score_trend(request: schemas.ScoringRequest):
    """Score a single trend using AI."""
    result = ai_service.score_trend(
        hashtag=request.hashtag,
        views=request.views,
        growth_rate=request.growth_rate,
        engagement=request.engagement,
        video_count=request.video_count
    )

    return {
        "trend_score": result.trend_score,
        "urgency_score": result.urgency_score,
        "reasoning": result.reasoning,
        "suggested_name": result.suggested_name,
        "suggested_description": result.suggested_description
    }
