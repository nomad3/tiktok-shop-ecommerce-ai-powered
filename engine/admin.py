from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
import models
import schemas
from database import SessionLocal

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/stats", response_model=schemas.AdminStats)
def get_admin_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Orders today
    orders_today = db.query(func.count(models.Order.id)).filter(
        models.Order.created_at >= today,
        models.Order.status == "paid"
    ).scalar() or 0

    # Revenue today
    revenue_today = db.query(func.sum(models.Order.amount_cents)).filter(
        models.Order.created_at >= today,
        models.Order.status == "paid"
    ).scalar() or 0

    # Products
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    live_products = db.query(func.count(models.Product.id)).filter(
        models.Product.status == "live"
    ).scalar() or 0

    # Pending suggestions
    pending_suggestions = db.query(func.count(models.TrendSuggestion.id)).filter(
        models.TrendSuggestion.status == "pending"
    ).scalar() or 0

    # Views today
    views_today = db.query(func.count(models.ProductView.id)).filter(
        models.ProductView.viewed_at >= today
    ).scalar() or 0

    # Conversion rate (orders / views) - last 7 days for meaningful data
    week_ago = today - timedelta(days=7)
    week_views = db.query(func.count(models.ProductView.id)).filter(
        models.ProductView.viewed_at >= week_ago
    ).scalar() or 0
    week_orders = db.query(func.count(models.Order.id)).filter(
        models.Order.created_at >= week_ago,
        models.Order.status == "paid"
    ).scalar() or 0

    conversion_rate = (week_orders / week_views * 100) if week_views > 0 else 0.0

    return {
        "orders_today": orders_today,
        "revenue_today_cents": revenue_today,
        "total_products": total_products,
        "live_products": live_products,
        "pending_suggestions": pending_suggestions,
        "views_today": views_today,
        "conversion_rate": round(conversion_rate, 2)
    }


@router.get("/queue", response_model=List[schemas.TrendSuggestion])
def get_suggestion_queue(
    status: str = "pending",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get AI suggestion queue."""
    query = db.query(models.TrendSuggestion)

    if status:
        query = query.filter(models.TrendSuggestion.status == status)

    return query.order_by(
        models.TrendSuggestion.trend_score.desc()
    ).offset(skip).limit(limit).all()


@router.post("/queue/{suggestion_id}/approve", response_model=schemas.Product)
def approve_suggestion(
    suggestion_id: int,
    request: schemas.ApproveRequest = None,
    db: Session = Depends(get_db)
):
    """Approve a suggestion and create a product."""
    suggestion = db.query(models.TrendSuggestion).filter(
        models.TrendSuggestion.id == suggestion_id
    ).first()

    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    if suggestion.status != "pending":
        raise HTTPException(status_code=400, detail="Suggestion already processed")

    # Create product from suggestion
    slug = suggestion.hashtag.lower().replace(" ", "-").replace("#", "")
    name = (request and request.name) or suggestion.suggested_name or f"Trending: {suggestion.hashtag}"
    price = (request and request.price_cents) or suggestion.suggested_price_cents or 1999

    # Check if slug exists
    existing = db.query(models.Product).filter(models.Product.slug == slug).first()
    if existing:
        slug = f"{slug}-{suggestion.id}"

    product = models.Product(
        slug=slug,
        name=name,
        description=suggestion.suggested_description or f"Viral product inspired by #{suggestion.hashtag}",
        price_cents=price,
        trend_score=suggestion.trend_score,
        urgency_score=suggestion.urgency_score,
        status="testing"
    )
    db.add(product)
    db.flush()

    # Update suggestion
    suggestion.status = "approved"
    suggestion.reviewed_at = datetime.utcnow()
    suggestion.product_id = product.id

    db.commit()
    db.refresh(product)

    return product


@router.post("/queue/{suggestion_id}/reject")
def reject_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    """Reject a suggestion."""
    suggestion = db.query(models.TrendSuggestion).filter(
        models.TrendSuggestion.id == suggestion_id
    ).first()

    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    suggestion.status = "rejected"
    suggestion.reviewed_at = datetime.utcnow()
    db.commit()

    return {"status": "rejected", "id": suggestion_id}


@router.get("/orders", response_model=List[schemas.Order])
def get_orders(
    status: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all orders."""
    query = db.query(models.Order)

    if status:
        query = query.filter(models.Order.status == status)

    orders = query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

    # Enrich with product names
    result = []
    for order in orders:
        order_dict = {
            "id": order.id,
            "product_id": order.product_id,
            "email": order.email,
            "amount_cents": order.amount_cents,
            "status": order.status,
            "stripe_session_id": order.stripe_session_id,
            "created_at": order.created_at,
            "product_name": order.product.name if order.product else None
        }
        result.append(order_dict)

    return result


@router.patch("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    update: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)

    return product


@router.post("/products/{slug}/view")
def record_view(slug: str, session_id: str = None, db: Session = Depends(get_db)):
    """Record a product page view."""
    product = db.query(models.Product).filter(models.Product.slug == slug).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    view = models.ProductView(
        product_id=product.id,
        session_id=session_id
    )
    db.add(view)
    db.commit()

    return {"status": "recorded"}


@router.get("/orders/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get a single order by ID."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "id": order.id,
        "product_id": order.product_id,
        "email": order.email,
        "amount_cents": order.amount_cents,
        "status": order.status,
        "stripe_session_id": order.stripe_session_id,
        "created_at": order.created_at,
        "product_name": order.product.name if order.product else None,
        "tracking_number": getattr(order, 'tracking_number', None),
        "tracking_url": getattr(order, 'tracking_url', None),
    }


@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update order status."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = ["pending", "paid", "processing", "shipped", "delivered", "fulfilled", "cancelled", "refunded", "abandoned"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order.status = update.status
    db.commit()

    return {"status": order.status, "id": order_id}


@router.post("/orders/{order_id}/tracking")
def add_order_tracking(
    order_id: int,
    tracking: schemas.OrderTrackingUpdate,
    db: Session = Depends(get_db)
):
    """Add tracking information to an order."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Set tracking fields if they exist on the model
    if hasattr(order, 'tracking_number'):
        order.tracking_number = tracking.tracking_number
    if hasattr(order, 'tracking_url') and tracking.tracking_url:
        order.tracking_url = tracking.tracking_url

    db.commit()

    return {
        "id": order_id,
        "tracking_number": tracking.tracking_number,
        "tracking_url": tracking.tracking_url
    }
