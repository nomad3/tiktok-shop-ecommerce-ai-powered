"""Fulfillment API endpoints for order automation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Order, Supplier, ProductSupplier, FulfillmentRule
from services.auto_fulfillment_service import (
    create_auto_fulfillment_service,
    create_fulfillment_rules_engine,
)

router = APIRouter(prefix="/api/fulfillment", tags=["fulfillment"])


# ============== Schemas ==============

class FulfillmentStatusResponse(BaseModel):
    eligible: bool
    reasons: List[str]
    order_value: Optional[int] = None
    product_id: Optional[int] = None


class FulfillmentResultResponse(BaseModel):
    success: bool
    order_id: int
    message: str
    supplier_order_id: Optional[str] = None
    tracking_number: Optional[str] = None


class SupplierCreate(BaseModel):
    name: str
    platform: str
    website_url: Optional[str] = None
    contact_email: Optional[str] = None
    auto_order_enabled: bool = False
    max_order_value_cents: int = 10000


class SupplierResponse(BaseModel):
    id: int
    name: str
    platform: str
    website_url: Optional[str]
    is_active: bool
    auto_order_enabled: bool
    reliability_score: float
    total_orders: int
    successful_orders: int

    class Config:
        from_attributes = True


class ProductSupplierCreate(BaseModel):
    product_id: int
    supplier_id: int
    supplier_product_url: Optional[str] = None
    supplier_sku: Optional[str] = None
    supplier_price_cents: Optional[int] = None
    shipping_cost_cents: Optional[int] = None
    is_primary: bool = True


class ProductSupplierResponse(BaseModel):
    id: int
    product_id: int
    supplier_id: int
    supplier_product_url: Optional[str]
    supplier_sku: Optional[str]
    supplier_price_cents: Optional[int]
    shipping_cost_cents: Optional[int]
    is_primary: bool
    is_available: bool

    class Config:
        from_attributes = True


class FulfillmentRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    condition_type: str
    condition_operator: str
    condition_value: str
    action: str
    priority: int = 1
    is_enabled: bool = True


class FulfillmentRuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    condition_type: str
    condition_operator: str
    condition_value: str
    action: str
    priority: int
    is_enabled: bool

    class Config:
        from_attributes = True


class TrackingUpdate(BaseModel):
    tracking_number: str
    tracking_url: Optional[str] = None


# ============== Order Fulfillment Endpoints ==============

@router.get("/orders/{order_id}/eligibility", response_model=FulfillmentStatusResponse)
async def check_fulfillment_eligibility(order_id: int, db: Session = Depends(get_db)):
    """Check if an order is eligible for auto-fulfillment."""
    service = create_auto_fulfillment_service(db)
    result = await service.check_auto_fulfill_eligibility(order_id)
    return result


@router.post("/orders/{order_id}/auto-fulfill", response_model=FulfillmentResultResponse)
async def auto_fulfill_order(order_id: int, db: Session = Depends(get_db)):
    """Automatically fulfill an order with supplier."""
    service = create_auto_fulfillment_service(db)
    result = await service.auto_order_from_supplier(order_id)
    return result.to_dict()


@router.post("/orders/{order_id}/tracking", response_model=dict)
async def update_order_tracking(
    order_id: int,
    tracking: TrackingUpdate,
    db: Session = Depends(get_db)
):
    """Update order tracking information."""
    service = create_auto_fulfillment_service(db)
    success = await service.update_tracking(
        order_id,
        tracking.tracking_number,
        tracking.tracking_url
    )
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "message": "Tracking updated"}


@router.post("/orders/{order_id}/mark-delivered", response_model=dict)
async def mark_order_delivered(order_id: int, db: Session = Depends(get_db)):
    """Mark an order as delivered."""
    service = create_auto_fulfillment_service(db)
    success = await service.mark_delivered(order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "message": "Order marked as delivered"}


@router.post("/process-queue", response_model=List[FulfillmentResultResponse])
async def process_fulfillment_queue(db: Session = Depends(get_db)):
    """Process all pending orders in the fulfillment queue."""
    service = create_auto_fulfillment_service(db)
    results = await service.process_fulfillment_queue()
    return [r.to_dict() for r in results]


@router.get("/orders/{order_id}/supplier-availability")
async def check_supplier_availability(order_id: int, db: Session = Depends(get_db)):
    """Check product availability at supplier for an order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or not order.product_id:
        raise HTTPException(status_code=404, detail="Order or product not found")

    service = create_auto_fulfillment_service(db)
    result = await service.check_supplier_availability(order.product_id)
    return result


# ============== Supplier Management Endpoints ==============

@router.get("/suppliers", response_model=List[SupplierResponse])
async def list_suppliers(
    platform: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all suppliers."""
    query = db.query(Supplier)
    if platform:
        query = query.filter(Supplier.platform == platform)
    if active_only:
        query = query.filter(Supplier.is_active == True)
    return query.all()


@router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    """Create a new supplier."""
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get supplier details."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    updates: SupplierCreate,
    db: Session = Depends(get_db)
):
    """Update supplier details."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for key, value in updates.model_dump().items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Deactivate a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    supplier.is_active = False
    db.commit()
    return {"success": True, "message": "Supplier deactivated"}


# ============== Product-Supplier Links ==============

@router.get("/products/{product_id}/suppliers", response_model=List[ProductSupplierResponse])
async def get_product_suppliers(product_id: int, db: Session = Depends(get_db)):
    """Get all suppliers for a product."""
    links = (
        db.query(ProductSupplier)
        .filter(ProductSupplier.product_id == product_id)
        .order_by(ProductSupplier.priority)
        .all()
    )
    return links


@router.post("/products/{product_id}/suppliers", response_model=ProductSupplierResponse)
async def link_product_supplier(
    product_id: int,
    link: ProductSupplierCreate,
    db: Session = Depends(get_db)
):
    """Link a supplier to a product."""
    # Verify product_id matches
    if link.product_id != product_id:
        raise HTTPException(status_code=400, detail="Product ID mismatch")

    # If this is primary, unset other primaries
    if link.is_primary:
        db.query(ProductSupplier).filter(
            ProductSupplier.product_id == product_id
        ).update({"is_primary": False})

    # Calculate total cost
    total_cost = None
    if link.supplier_price_cents is not None:
        total_cost = link.supplier_price_cents + (link.shipping_cost_cents or 0)

    db_link = ProductSupplier(
        **link.model_dump(),
        total_cost_cents=total_cost
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link


@router.delete("/products/{product_id}/suppliers/{supplier_id}")
async def unlink_product_supplier(
    product_id: int,
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Remove supplier link from product."""
    link = (
        db.query(ProductSupplier)
        .filter(
            ProductSupplier.product_id == product_id,
            ProductSupplier.supplier_id == supplier_id
        )
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(link)
    db.commit()
    return {"success": True, "message": "Supplier unlinked from product"}


# ============== Fulfillment Rules ==============

@router.get("/rules", response_model=List[FulfillmentRuleResponse])
async def list_fulfillment_rules(db: Session = Depends(get_db)):
    """List all fulfillment rules."""
    rules = db.query(FulfillmentRule).order_by(FulfillmentRule.priority).all()
    return rules


@router.post("/rules", response_model=FulfillmentRuleResponse)
async def create_fulfillment_rule(rule: FulfillmentRuleCreate, db: Session = Depends(get_db)):
    """Create a new fulfillment rule."""
    db_rule = FulfillmentRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.put("/rules/{rule_id}", response_model=FulfillmentRuleResponse)
async def update_fulfillment_rule(
    rule_id: int,
    updates: FulfillmentRuleCreate,
    db: Session = Depends(get_db)
):
    """Update a fulfillment rule."""
    rule = db.query(FulfillmentRule).filter(FulfillmentRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for key, value in updates.model_dump().items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.post("/rules/{rule_id}/toggle")
async def toggle_fulfillment_rule(rule_id: int, db: Session = Depends(get_db)):
    """Enable/disable a fulfillment rule."""
    rule = db.query(FulfillmentRule).filter(FulfillmentRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.is_enabled = not rule.is_enabled
    db.commit()
    return {"success": True, "is_enabled": rule.is_enabled}


@router.delete("/rules/{rule_id}")
async def delete_fulfillment_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete a fulfillment rule."""
    rule = db.query(FulfillmentRule).filter(FulfillmentRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return {"success": True, "message": "Rule deleted"}


@router.post("/evaluate/{order_id}")
async def evaluate_order_rules(order_id: int, db: Session = Depends(get_db)):
    """Evaluate fulfillment rules for an order."""
    engine = create_fulfillment_rules_engine(db)
    result = await engine.evaluate_order(order_id)
    return result
