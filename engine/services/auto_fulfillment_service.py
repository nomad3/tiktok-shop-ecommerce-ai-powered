"""Auto-fulfillment service for automated order processing.

Handles automatic order placement with suppliers and fulfillment tracking.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from models import Order, Product
from database import get_db

logger = logging.getLogger(__name__)


class FulfillmentResult:
    """Result of a fulfillment attempt."""

    def __init__(
        self,
        success: bool,
        order_id: int,
        message: str,
        supplier_order_id: Optional[str] = None,
        tracking_number: Optional[str] = None,
        estimated_delivery: Optional[datetime] = None,
    ):
        self.success = success
        self.order_id = order_id
        self.message = message
        self.supplier_order_id = supplier_order_id
        self.tracking_number = tracking_number
        self.estimated_delivery = estimated_delivery

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "order_id": self.order_id,
            "message": self.message,
            "supplier_order_id": self.supplier_order_id,
            "tracking_number": self.tracking_number,
            "estimated_delivery": self.estimated_delivery.isoformat() if self.estimated_delivery else None,
        }


class AutoFulfillmentService:
    """Service for automatic order fulfillment."""

    def __init__(self, db: Session):
        self.db = db
        self.max_auto_order_value = 10000  # $100 in cents
        self.auto_fulfill_enabled = True

    async def check_auto_fulfill_eligibility(self, order_id: int) -> Dict[str, Any]:
        """
        Check if an order is eligible for auto-fulfillment.

        Returns eligibility status and reasons if not eligible.
        """
        order = self.db.query(Order).filter(Order.id == order_id).first()

        if not order:
            return {"eligible": False, "reasons": ["Order not found"]}

        reasons = []

        # Check order status
        if order.status != "pending":
            reasons.append(f"Order status is '{order.status}', must be 'pending'")

        # Check order value
        if order.amount_cents > self.max_auto_order_value:
            reasons.append(f"Order value ${order.amount_cents/100:.2f} exceeds auto-fulfill limit ${self.max_auto_order_value/100:.2f}")

        # Check if product has supplier info
        if order.product:
            if not order.product.supplier_url:
                reasons.append("Product does not have supplier information")
        else:
            reasons.append("Order has no associated product")

        # Check if auto-fulfill is enabled
        if not self.auto_fulfill_enabled:
            reasons.append("Auto-fulfillment is disabled")

        return {
            "eligible": len(reasons) == 0,
            "reasons": reasons,
            "order_value": order.amount_cents,
            "product_id": order.product_id,
        }

    async def auto_order_from_supplier(self, order_id: int) -> FulfillmentResult:
        """
        Automatically place order with supplier.

        1. Get order details
        2. Get supplier info for products
        3. Place order via supplier API (if supported)
        4. Store supplier order reference
        5. Update order status
        """
        order = self.db.query(Order).filter(Order.id == order_id).first()

        if not order:
            return FulfillmentResult(
                success=False,
                order_id=order_id,
                message="Order not found",
            )

        # Check eligibility
        eligibility = await self.check_auto_fulfill_eligibility(order_id)
        if not eligibility["eligible"]:
            return FulfillmentResult(
                success=False,
                order_id=order_id,
                message=f"Not eligible: {', '.join(eligibility['reasons'])}",
            )

        try:
            # Get product and supplier info
            product = order.product
            supplier_url = product.supplier_url
            supplier_name = product.supplier_name or "Unknown Supplier"

            # In a real implementation, this would:
            # 1. Connect to supplier API (AliExpress, CJ Dropshipping, etc.)
            # 2. Place the order with shipping address
            # 3. Get supplier order ID and tracking

            # For now, simulate the process
            supplier_order_id = f"SUP-{order_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

            # Update order with supplier info
            order.supplier_order_id = supplier_order_id
            order.status = "processing"
            self.db.commit()

            logger.info(f"Auto-fulfilled order {order_id} with supplier order {supplier_order_id}")

            return FulfillmentResult(
                success=True,
                order_id=order_id,
                message=f"Order placed with {supplier_name}",
                supplier_order_id=supplier_order_id,
            )

        except Exception as e:
            logger.error(f"Auto-fulfillment failed for order {order_id}: {e}")
            return FulfillmentResult(
                success=False,
                order_id=order_id,
                message=f"Fulfillment error: {str(e)}",
            )

    async def process_fulfillment_queue(self) -> List[FulfillmentResult]:
        """
        Process all pending orders in the fulfillment queue.

        Returns list of fulfillment results.
        """
        results = []

        # Get pending orders
        pending_orders = (
            self.db.query(Order)
            .filter(Order.status == "pending")
            .filter(Order.amount_cents <= self.max_auto_order_value)
            .all()
        )

        for order in pending_orders:
            result = await self.auto_order_from_supplier(order.id)
            results.append(result)

        return results

    async def check_supplier_availability(self, product_id: int) -> Dict[str, Any]:
        """
        Check if product is available at supplier.

        In a real implementation, this would query supplier APIs.
        """
        product = self.db.query(Product).filter(Product.id == product_id).first()

        if not product:
            return {
                "available": False,
                "quantity": 0,
                "message": "Product not found",
            }

        if not product.supplier_url:
            return {
                "available": False,
                "quantity": 0,
                "message": "No supplier configured",
            }

        # Simulated response - in reality would query supplier API
        return {
            "available": True,
            "quantity": 100,  # Simulated stock
            "price_cents": product.supplier_cost_cents or int(product.price_cents * 0.4),
            "estimated_shipping_days": 7,
            "supplier_name": product.supplier_name or "Default Supplier",
        }

    async def update_tracking(self, order_id: int, tracking_number: str, tracking_url: Optional[str] = None) -> bool:
        """Update order with tracking information."""
        order = self.db.query(Order).filter(Order.id == order_id).first()

        if not order:
            return False

        order.tracking_number = tracking_number
        if tracking_url:
            order.tracking_url = tracking_url
        order.status = "shipped"
        order.shipped_at = datetime.utcnow()
        self.db.commit()

        logger.info(f"Updated tracking for order {order_id}: {tracking_number}")
        return True

    async def mark_delivered(self, order_id: int) -> bool:
        """Mark order as delivered."""
        order = self.db.query(Order).filter(Order.id == order_id).first()

        if not order:
            return False

        order.status = "delivered"
        order.delivered_at = datetime.utcnow()
        self.db.commit()

        logger.info(f"Order {order_id} marked as delivered")
        return True


class FulfillmentRulesEngine:
    """Configure and execute fulfillment rules."""

    def __init__(self, db: Session):
        self.db = db
        self.rules = self._load_default_rules()

    def _load_default_rules(self) -> List[Dict[str, Any]]:
        """Load default fulfillment rules."""
        return [
            {
                "id": "auto_fulfill_low_value",
                "name": "Auto-fulfill low value orders",
                "condition": "order_value < 5000",  # < $50
                "action": "auto_fulfill",
                "enabled": True,
                "priority": 1,
            },
            {
                "id": "hold_high_value",
                "name": "Hold high value orders for review",
                "condition": "order_value >= 10000",  # >= $100
                "action": "hold_for_review",
                "enabled": True,
                "priority": 2,
            },
            {
                "id": "hold_first_time",
                "name": "Hold first-time customer orders",
                "condition": "is_first_order",
                "action": "hold_for_review",
                "enabled": False,
                "priority": 3,
            },
        ]

    async def evaluate_order(self, order_id: int) -> Dict[str, Any]:
        """
        Apply rules to determine fulfillment action.

        Returns recommended action and matched rules.
        """
        order = self.db.query(Order).filter(Order.id == order_id).first()

        if not order:
            return {"action": "error", "message": "Order not found"}

        matched_rules = []
        recommended_action = "process"  # Default

        # Evaluate each rule
        for rule in sorted(self.rules, key=lambda r: r["priority"]):
            if not rule["enabled"]:
                continue

            # Simple condition evaluation
            if rule["condition"] == "order_value < 5000":
                if order.amount_cents < 5000:
                    matched_rules.append(rule)
                    recommended_action = rule["action"]

            elif rule["condition"] == "order_value >= 10000":
                if order.amount_cents >= 10000:
                    matched_rules.append(rule)
                    recommended_action = rule["action"]

        return {
            "order_id": order_id,
            "order_value": order.amount_cents,
            "action": recommended_action,
            "matched_rules": [r["name"] for r in matched_rules],
        }

    def get_rules(self) -> List[Dict[str, Any]]:
        """Get all fulfillment rules."""
        return self.rules

    def update_rule(self, rule_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a fulfillment rule."""
        for rule in self.rules:
            if rule["id"] == rule_id:
                rule.update(updates)
                return rule
        return None

    def toggle_rule(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """Enable/disable a rule."""
        for rule in self.rules:
            if rule["id"] == rule_id:
                rule["enabled"] = not rule["enabled"]
                return rule
        return None


def create_auto_fulfillment_service(db: Session) -> AutoFulfillmentService:
    """Factory function to create AutoFulfillmentService."""
    return AutoFulfillmentService(db)


def create_fulfillment_rules_engine(db: Session) -> FulfillmentRulesEngine:
    """Factory function to create FulfillmentRulesEngine."""
    return FulfillmentRulesEngine(db)
