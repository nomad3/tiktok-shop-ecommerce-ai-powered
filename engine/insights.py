"""AI Insights API endpoints for business intelligence."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models import Product, Order
from services.insights_service import insights_service

router = APIRouter(prefix="/api/insights", tags=["insights"])


# ============== Response Models ==============

class MetricsResponse(BaseModel):
    revenue_cents: int
    orders: int
    conversion_rate: float
    avg_order_value_cents: int


class DailyDigestResponse(BaseModel):
    summary: str
    key_metrics: Dict[str, Any]
    highlights: List[str]
    concerns: List[str]
    recommendations: List[str]
    generated_at: datetime


class ProductInsightResponse(BaseModel):
    product_id: int
    product_name: str
    summary: str
    metrics: Dict[str, Any]
    recommendation: str
    reasoning: str


class AnomalyResponse(BaseModel):
    type: str
    severity: str
    message: str
    product_id: Optional[int]
    suggested_action: str
    detected_at: datetime


class TrendPredictionResponse(BaseModel):
    product_id: Optional[int]
    product_name: str
    predicted_score: float
    confidence: float
    reasoning: str


class PricingSuggestionResponse(BaseModel):
    product_id: int
    product_name: str
    current_price_cents: int
    suggested_price_cents: int
    expected_impact: str
    reasoning: str


# ============== Helper Functions ==============

def get_metrics_for_period(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Calculate metrics for a given period."""
    orders = db.query(Order).filter(
        Order.created_at >= start_date,
        Order.created_at < end_date,
        Order.status != 'cancelled'
    ).all()

    total_revenue = sum(o.total_cents or 0 for o in orders)
    order_count = len(orders)
    avg_order_value = total_revenue // order_count if order_count > 0 else 0

    # Estimate conversion rate (would need actual traffic data)
    estimated_visits = order_count * 50 if order_count > 0 else 100  # Rough estimate
    conversion_rate = (order_count / estimated_visits) * 100 if estimated_visits > 0 else 0

    return {
        "revenue_cents": total_revenue,
        "orders": order_count,
        "conversion_rate": round(conversion_rate, 2),
        "avg_order_value_cents": avg_order_value
    }


def get_top_products(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
    """Get top performing products."""
    products = db.query(Product).filter(
        Product.status == 'LIVE'
    ).order_by(Product.trend_score.desc()).limit(limit).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "units_sold": 10,  # Would come from orders in production
            "revenue_cents": p.price_cents * 10,  # Estimated
            "trend_score": p.trend_score or 50
        }
        for p in products
    ]


def get_products_with_metrics(db: Session) -> List[Dict[str, Any]]:
    """Get products with performance metrics."""
    products = db.query(Product).filter(Product.status == 'LIVE').all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "price_cents": p.price_cents or 0,
            "cost_cents": (p.price_cents or 0) * 0.4,  # Estimated 60% margin
            "inventory_quantity": 50,  # Would come from inventory tracking
            "views": 100 + (p.trend_score or 0) * 2,  # Simulated
            "purchases": max(1, ((p.trend_score or 50) // 10)),  # Simulated
            "trend_score": p.trend_score or 50,
            "trend_velocity": (p.trend_score or 50) / 20 - 2  # Simulated velocity
        }
        for p in products
    ]


# ============== Endpoints ==============

@router.get("/daily-digest", response_model=DailyDigestResponse)
async def get_daily_digest(db: Session = Depends(get_db)):
    """Get AI-generated daily business digest."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    # Get metrics
    today_metrics = get_metrics_for_period(db, today_start, now)
    yesterday_metrics = get_metrics_for_period(db, yesterday_start, today_start)
    top_products = get_top_products(db)

    # Generate digest
    digest = await insights_service.generate_daily_digest(
        metrics=today_metrics,
        yesterday_metrics=yesterday_metrics,
        top_products=top_products
    )

    return DailyDigestResponse(
        summary=digest.summary,
        key_metrics=digest.key_metrics,
        highlights=digest.highlights,
        concerns=digest.concerns,
        recommendations=digest.recommendations,
        generated_at=now
    )


@router.get("/product/{product_id}", response_model=ProductInsightResponse)
async def get_product_insights(product_id: int, db: Session = Depends(get_db)):
    """Get AI insights for a specific product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Simulated metrics (would come from analytics in production)
    views = 100 + (product.trend_score or 0) * 3
    add_to_cart = views // 5
    purchases = max(1, add_to_cart // 3)
    revenue_cents = purchases * (product.price_cents or 0)

    insight = await insights_service.analyze_product(
        product_id=product.id,
        product_name=product.name,
        price_cents=product.price_cents or 0,
        cost_cents=int((product.price_cents or 0) * 0.4),
        views=views,
        add_to_cart=add_to_cart,
        purchases=purchases,
        revenue_cents=revenue_cents
    )

    return ProductInsightResponse(
        product_id=insight.product_id,
        product_name=insight.product_name,
        summary=insight.summary,
        metrics=insight.metrics,
        recommendation=insight.recommendation,
        reasoning=insight.reasoning
    )


@router.get("/anomalies", response_model=List[AnomalyResponse])
async def get_anomalies(db: Session = Depends(get_db)):
    """Get detected anomalies and alerts."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today_start - timedelta(days=7)

    # Get current and historical metrics
    current_metrics = get_metrics_for_period(db, today_start, now)

    # Calculate 7-day average
    total_metrics = {"revenue_cents": 0, "orders": 0}
    for i in range(7):
        start = week_ago + timedelta(days=i)
        end = start + timedelta(days=1)
        day_metrics = get_metrics_for_period(db, start, end)
        total_metrics["revenue_cents"] += day_metrics["revenue_cents"]
        total_metrics["orders"] += day_metrics["orders"]

    historical_avg = {
        "revenue_cents": total_metrics["revenue_cents"] // 7,
        "orders": total_metrics["orders"] // 7
    }

    # Get products for inventory checks
    products = get_products_with_metrics(db)

    # Detect anomalies
    anomalies = await insights_service.detect_anomalies(
        current_metrics=current_metrics,
        historical_avg=historical_avg,
        products=products
    )

    return [
        AnomalyResponse(
            type=a.type,
            severity=a.severity,
            message=a.message,
            product_id=a.product_id,
            suggested_action=a.suggested_action,
            detected_at=a.detected_at
        )
        for a in anomalies
    ]


@router.get("/predictions", response_model=List[TrendPredictionResponse])
async def get_trend_predictions(db: Session = Depends(get_db)):
    """Get trend predictions for products."""
    products = get_products_with_metrics(db)

    predictions = await insights_service.predict_trends(products=products)

    return [
        TrendPredictionResponse(
            product_id=p.product_id,
            product_name=p.product_name,
            predicted_score=p.predicted_score,
            confidence=p.confidence,
            reasoning=p.reasoning
        )
        for p in predictions
    ]


@router.get("/price-optimization", response_model=List[PricingSuggestionResponse])
async def get_price_suggestions(db: Session = Depends(get_db)):
    """Get pricing optimization suggestions."""
    products = get_products_with_metrics(db)

    suggestions = await insights_service.suggest_price_optimizations(products=products)

    return [
        PricingSuggestionResponse(
            product_id=s.product_id,
            product_name=s.product_name,
            current_price_cents=s.current_price_cents,
            suggested_price_cents=s.suggested_price_cents,
            expected_impact=s.expected_impact,
            reasoning=s.reasoning
        )
        for s in suggestions
    ]


@router.get("/summary")
async def get_insights_summary(db: Session = Depends(get_db)):
    """Get a quick summary of all insights."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Get metrics
    metrics = get_metrics_for_period(db, today_start, now)
    products = get_products_with_metrics(db)

    # Get counts
    anomalies = await insights_service.detect_anomalies(
        current_metrics=metrics,
        historical_avg=metrics,  # Simplified
        products=products
    )

    critical_count = len([a for a in anomalies if a.severity == "critical"])
    warning_count = len([a for a in anomalies if a.severity == "warning"])

    predictions = await insights_service.predict_trends(products=products[:5])
    trending_up = len([p for p in predictions if p.predicted_score > 70])

    price_suggestions = await insights_service.suggest_price_optimizations(products=products)

    return {
        "alerts": {
            "critical": critical_count,
            "warning": warning_count,
            "info": len(anomalies) - critical_count - warning_count
        },
        "predictions": {
            "trending_up": trending_up,
            "total_analyzed": len(predictions)
        },
        "optimizations": {
            "price_suggestions": len(price_suggestions)
        },
        "last_updated": now
    }
