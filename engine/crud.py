"""CRUD operations for database models.

Provides create, read, update, and delete operations with proper
transaction handling and error management.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime
import models, schemas


# ============== Product Operations ==============

def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    """Get a single product by ID."""
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def get_product_by_slug(db: Session, slug: str) -> Optional[models.Product]:
    """Get a single product by slug."""
    return db.query(models.Product).filter(models.Product.slug == slug).first()


def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    min_trend_score: Optional[float] = None
) -> List[models.Product]:
    """
    Get products with optional filtering.

    Args:
        db: Database session
        skip: Number of records to skip (pagination offset)
        limit: Maximum number of records to return
        status: Filter by product status (LIVE, TESTING, etc.)
        min_trend_score: Filter by minimum trend score
    """
    query = db.query(models.Product)

    if status:
        query = query.filter(models.Product.status == status)

    if min_trend_score is not None:
        query = query.filter(models.Product.trend_score >= min_trend_score)

    # Sort by trend_score descending by default for the "Urgency Feed"
    return query.order_by(models.Product.trend_score.desc()).offset(skip).limit(limit).all()


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    """Create a new product."""
    db_product = models.Product(**product.dict())
    db.add(db_product)
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Product with slug '{product.slug}' already exists") from e


def update_product(
    db: Session,
    product_id: int,
    updates: Dict[str, Any]
) -> Optional[models.Product]:
    """
    Update a product with the given fields.

    Args:
        db: Database session
        product_id: ID of the product to update
        updates: Dictionary of field names and new values
    """
    product = get_product(db, product_id)
    if not product:
        return None

    # Define allowed fields for update
    allowed_fields = {
        "name", "description", "price_cents", "cost_cents",
        "main_image_url", "video_url", "status",
        "trend_score", "urgency_score",
        "supplier_url", "supplier_name", "supplier_cost_cents",
        "profit_margin", "import_source"
    }

    for key, value in updates.items():
        if key in allowed_fields and hasattr(product, key):
            setattr(product, key, value)

    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    return product


def update_product_scores(
    db: Session,
    product_id: int,
    trend_score: float,
    urgency_score: float
) -> Optional[models.Product]:
    """Update product trend and urgency scores."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product:
        product.trend_score = trend_score
        product.urgency_score = urgency_score
        product.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(product)
    return product


def update_product_status(
    db: Session,
    product_id: int,
    status: str
) -> Optional[models.Product]:
    """Update product status (TESTING, LIVE, PAUSED, KILLED)."""
    valid_statuses = ["testing", "live", "paused", "killed"]
    if status.lower() not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")

    product = get_product(db, product_id)
    if not product:
        return None

    product.status = status.lower()
    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int, soft: bool = True) -> bool:
    """
    Delete a product.

    Args:
        db: Database session
        product_id: ID of the product to delete
        soft: If True, sets status to 'killed'. If False, permanently deletes.
    """
    product = get_product(db, product_id)
    if not product:
        return False

    if soft:
        product.status = "killed"
        db.commit()
    else:
        db.delete(product)
        db.commit()

    return True


def batch_update_products(
    db: Session,
    product_ids: List[int],
    updates: Dict[str, Any]
) -> int:
    """
    Update multiple products at once.

    Returns the number of products updated.
    """
    count = 0
    for product_id in product_ids:
        result = update_product(db, product_id, updates)
        if result:
            count += 1
    return count


def search_products(
    db: Session,
    query: str,
    limit: int = 20
) -> List[models.Product]:
    """Search products by name or description."""
    search_term = f"%{query}%"
    return db.query(models.Product).filter(
        (models.Product.name.ilike(search_term)) |
        (models.Product.description.ilike(search_term))
    ).limit(limit).all()


# ============== Order Operations ==============

def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    """Get a single order by ID."""
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
) -> List[models.Order]:
    """Get orders with optional status filtering."""
    query = db.query(models.Order)

    if status:
        query = query.filter(models.Order.status == status)

    return query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()


def create_order(
    db: Session,
    product_id: int,
    email: str,
    amount_cents: int,
    shipping_address: Optional[str] = None
) -> models.Order:
    """Create a new order."""
    order = models.Order(
        product_id=product_id,
        email=email,
        amount_cents=amount_cents,
        status="pending",
        shipping_address=shipping_address
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def update_order_status(
    db: Session,
    order_id: int,
    status: str
) -> Optional[models.Order]:
    """Update order status with validation."""
    valid_statuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]
    if status.lower() not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")

    order = get_order(db, order_id)
    if not order:
        return None

    order.status = status.lower()
    db.commit()
    db.refresh(order)
    return order


def update_order_tracking(
    db: Session,
    order_id: int,
    tracking_number: str,
    tracking_url: Optional[str] = None,
    shipped_at: Optional[datetime] = None
) -> Optional[models.Order]:
    """Update order tracking information."""
    order = get_order(db, order_id)
    if not order:
        return None

    order.tracking_number = tracking_number
    order.tracking_url = tracking_url
    order.shipped_at = shipped_at or datetime.utcnow()
    order.status = "shipped"

    db.commit()
    db.refresh(order)
    return order


def update_order_fulfillment(
    db: Session,
    order_id: int,
    supplier_order_id: str
) -> Optional[models.Order]:
    """Update order with supplier fulfillment info."""
    order = get_order(db, order_id)
    if not order:
        return None

    order.supplier_order_id = supplier_order_id
    order.status = "processing"
    db.commit()
    db.refresh(order)
    return order


# Trend Signal operations
def create_trend_signal(db: Session, signal: schemas.TrendSignalCreate):
    db_signal = models.TrendSignal(**signal.dict())
    db.add(db_signal)
    db.commit()
    db.refresh(db_signal)
    return db_signal


def get_trend_signals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TrendSignal).order_by(
        models.TrendSignal.created_at.desc()
    ).offset(skip).limit(limit).all()


def get_trend_signals_by_source(db: Session, source: str, limit: int = 50):
    return db.query(models.TrendSignal).filter(
        models.TrendSignal.source == source
    ).order_by(models.TrendSignal.created_at.desc()).limit(limit).all()
