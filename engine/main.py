from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, models, schemas
from database import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TikTok Urgency Engine")

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
