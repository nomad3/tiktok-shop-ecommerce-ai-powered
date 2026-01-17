from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from typing import List, Optional
from database import SessionLocal
import models

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/overview")
def get_overview(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get overview statistics for the analytics dashboard."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    prev_start = start_date - timedelta(days=days)

    # Current period metrics
    current_orders = db.query(models.Order).filter(
        models.Order.created_at >= start_date,
        models.Order.status.in_(["paid", "fulfilled", "shipped", "delivered"])
    ).all()

    current_revenue = sum(o.amount_cents for o in current_orders)
    current_count = len(current_orders)

    # Previous period for comparison
    prev_orders = db.query(models.Order).filter(
        models.Order.created_at >= prev_start,
        models.Order.created_at < start_date,
        models.Order.status.in_(["paid", "fulfilled", "shipped", "delivered"])
    ).all()

    prev_revenue = sum(o.amount_cents for o in prev_orders)
    prev_count = len(prev_orders)

    # Calculate changes
    revenue_change = 0.0
    if prev_revenue > 0:
        revenue_change = ((current_revenue - prev_revenue) / prev_revenue) * 100

    orders_change = 0.0
    if prev_count > 0:
        orders_change = ((current_count - prev_count) / prev_count) * 100

    # Conversion rate
    total_views = db.query(func.count(models.ProductView.id)).filter(
        models.ProductView.viewed_at >= start_date
    ).scalar() or 0

    conversion_rate = 0.0
    if total_views > 0:
        conversion_rate = (current_count / total_views) * 100

    # Average order value
    avg_order_value = 0
    if current_count > 0:
        avg_order_value = current_revenue // current_count

    return {
        "total_revenue_cents": current_revenue,
        "total_orders": current_count,
        "conversion_rate": round(conversion_rate, 2),
        "avg_order_value_cents": avg_order_value,
        "revenue_change": round(revenue_change, 1),
        "orders_change": round(orders_change, 1),
    }


@router.get("/revenue")
def get_revenue_timeseries(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get revenue time series data for charts."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    # Get orders grouped by date
    orders = db.query(models.Order).filter(
        models.Order.created_at >= start_date,
        models.Order.status.in_(["paid", "fulfilled", "shipped", "delivered"])
    ).all()

    # Group by date
    revenue_by_date = {}
    for order in orders:
        date_str = order.created_at.strftime("%Y-%m-%d")
        revenue_by_date[date_str] = revenue_by_date.get(date_str, 0) + order.amount_cents

    # Fill in missing dates
    result = []
    current = start_date
    while current <= now:
        date_str = current.strftime("%Y-%m-%d")
        result.append({
            "date": date_str,
            "revenue": revenue_by_date.get(date_str, 0) / 100  # Convert to dollars
        })
        current += timedelta(days=1)

    return result


@router.get("/orders")
def get_orders_timeseries(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get orders time series data grouped by status for charts."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    orders = db.query(models.Order).filter(
        models.Order.created_at >= start_date
    ).all()

    # Group by date and status
    data_by_date = {}
    for order in orders:
        date_str = order.created_at.strftime("%Y-%m-%d")
        if date_str not in data_by_date:
            data_by_date[date_str] = {"paid": 0, "pending": 0, "cancelled": 0}

        status = order.status
        if status in ["paid", "fulfilled", "shipped", "delivered"]:
            data_by_date[date_str]["paid"] += 1
        elif status in ["pending", "processing"]:
            data_by_date[date_str]["pending"] += 1
        elif status in ["cancelled", "refunded", "abandoned"]:
            data_by_date[date_str]["cancelled"] += 1

    # Fill in missing dates
    result = []
    current = start_date
    while current <= now:
        date_str = current.strftime("%Y-%m-%d")
        day_data = data_by_date.get(date_str, {"paid": 0, "pending": 0, "cancelled": 0})
        result.append({
            "date": date_str,
            "paid": day_data["paid"],
            "pending": day_data["pending"],
            "cancelled": day_data["cancelled"],
        })
        current += timedelta(days=1)

    return result


@router.get("/top-products")
def get_top_products(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get top selling products by revenue."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    # Get orders with products
    orders = db.query(models.Order).filter(
        models.Order.created_at >= start_date,
        models.Order.status.in_(["paid", "fulfilled", "shipped", "delivered"]),
        models.Order.product_id.isnot(None)
    ).all()

    # Group by product
    product_stats = {}
    for order in orders:
        if order.product_id not in product_stats:
            product_stats[order.product_id] = {"units_sold": 0, "revenue": 0}
        product_stats[order.product_id]["units_sold"] += 1
        product_stats[order.product_id]["revenue"] += order.amount_cents

    # Sort by revenue and get top products
    sorted_products = sorted(
        product_stats.items(),
        key=lambda x: x[1]["revenue"],
        reverse=True
    )[:limit]

    # Get product details
    result = []
    for product_id, stats in sorted_products:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if product:
            result.append({
                "id": product.id,
                "name": product.name,
                "main_image_url": product.main_image_url,
                "units_sold": stats["units_sold"],
                "revenue": stats["revenue"],
            })

    return result


@router.get("/conversion-funnel")
def get_conversion_funnel(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """Get conversion funnel data."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)

    # Total views
    views = db.query(func.count(models.ProductView.id)).filter(
        models.ProductView.viewed_at >= start_date
    ).scalar() or 0

    # Cart additions (approximated by pending orders)
    carts = db.query(func.count(models.Order.id)).filter(
        models.Order.created_at >= start_date
    ).scalar() or 0

    # Completed purchases
    purchases = db.query(func.count(models.Order.id)).filter(
        models.Order.created_at >= start_date,
        models.Order.status.in_(["paid", "fulfilled", "shipped", "delivered"])
    ).scalar() or 0

    return {
        "views": views,
        "cart_adds": carts,
        "purchases": purchases,
        "view_to_cart_rate": round((carts / views * 100) if views > 0 else 0, 2),
        "cart_to_purchase_rate": round((purchases / carts * 100) if carts > 0 else 0, 2),
        "overall_conversion": round((purchases / views * 100) if views > 0 else 0, 2),
    }
