"""AI Customer Support Chatbot Service.

Provides intelligent responses to customer inquiries about orders,
products, shipping, and policies using Claude AI.
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass
import anthropic


@dataclass
class ChatResponse:
    """Chatbot response structure."""
    response: str
    suggested_actions: List[str]
    needs_human: bool
    confidence: float
    intent: str


@dataclass
class OrderInfo:
    """Order information for chatbot context."""
    order_id: str
    status: str
    total: str
    created_at: str
    items: List[str]
    tracking_number: Optional[str]
    estimated_delivery: Optional[str]


@dataclass
class ProductInfo:
    """Product information for chatbot context."""
    product_id: int
    name: str
    price: str
    description: str
    in_stock: bool


class ChatbotService:
    """AI-powered customer support chatbot."""

    SYSTEM_PROMPT = """You are a friendly and helpful customer support assistant for TikTok Shop,
an AI-powered e-commerce platform that showcases trending products.

Your capabilities:
- Answer questions about order status (if order info is provided in context)
- Provide product information
- Explain shipping and delivery timelines
- Handle return and refund inquiries
- Answer general store questions

Guidelines:
1. Be warm, professional, and concise
2. If you don't have specific order/product info, ask for details
3. For complex issues (refunds over $100, damaged items, account issues), suggest escalating to human support
4. Never make up order statuses or tracking numbers
5. Always acknowledge the customer's concern before providing solutions

Store Policies:
- Shipping: Free shipping on orders over $50. Standard delivery 5-7 business days, Express 2-3 days
- Returns: 30-day return policy for unused items in original packaging
- Refunds: Processed within 5-7 business days after item receipt
- Support Hours: 24/7 chat support, human agents available 9 AM - 6 PM EST

When responding, classify your confidence as:
- HIGH (0.9+): Direct answer from provided context or clear policy question
- MEDIUM (0.7-0.9): General guidance that may need verification
- LOW (<0.7): Uncertain, recommend human escalation"""

    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = anthropic.Anthropic(api_key=self.api_key)
            except Exception:
                pass

    def _detect_intent(self, message: str) -> str:
        """Detect the user's intent from their message."""
        message_lower = message.lower()

        if any(word in message_lower for word in ["order", "tracking", "shipped", "delivery", "where is"]):
            return "order_status"
        elif any(word in message_lower for word in ["return", "refund", "money back", "exchange"]):
            return "return_refund"
        elif any(word in message_lower for word in ["product", "item", "price", "available", "stock"]):
            return "product_inquiry"
        elif any(word in message_lower for word in ["shipping", "delivery time", "how long"]):
            return "shipping_info"
        elif any(word in message_lower for word in ["cancel", "cancelled"]):
            return "cancellation"
        elif any(word in message_lower for word in ["payment", "charge", "bill"]):
            return "payment_issue"
        elif any(word in message_lower for word in ["help", "support", "agent", "human", "person"]):
            return "escalation_request"
        elif any(word in message_lower for word in ["hi", "hello", "hey", "good morning", "good afternoon"]):
            return "greeting"
        elif any(word in message_lower for word in ["thank", "thanks", "bye", "goodbye"]):
            return "closing"
        else:
            return "general"

    def _get_suggested_actions(self, intent: str) -> List[str]:
        """Get suggested quick reply actions based on intent."""
        actions = {
            "order_status": ["Track my order", "Check delivery date", "Contact shipping carrier"],
            "return_refund": ["Start a return", "Check refund status", "Talk to agent"],
            "product_inquiry": ["View product details", "Check availability", "See similar items"],
            "shipping_info": ["View shipping options", "Track order", "Estimate delivery"],
            "cancellation": ["Cancel order", "Modify order", "Talk to agent"],
            "payment_issue": ["View order details", "Check payment status", "Talk to agent"],
            "escalation_request": ["Talk to agent", "Request callback", "Email support"],
            "greeting": ["Track my order", "Browse products", "Get help"],
            "closing": ["Continue shopping", "Rate our service", "Get more help"],
            "general": ["Track order", "Product help", "Talk to agent"],
        }
        return actions.get(intent, ["Talk to agent"])

    async def get_response(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        customer_context: Optional[Dict[str, Any]] = None
    ) -> ChatResponse:
        """
        Get AI response to customer message.

        Args:
            message: The customer's message
            conversation_history: Previous messages in the conversation
            customer_context: Additional context like order info, customer details

        Returns:
            ChatResponse with response text, suggested actions, and metadata
        """
        intent = self._detect_intent(message)
        suggested_actions = self._get_suggested_actions(intent)

        # Build context for the AI
        context_parts = []
        if customer_context:
            if customer_context.get("order"):
                order = customer_context["order"]
                context_parts.append(f"""
Customer Order Information:
- Order ID: {order.get('order_id', 'Unknown')}
- Status: {order.get('status', 'Unknown')}
- Total: {order.get('total', 'Unknown')}
- Items: {', '.join(order.get('items', []))}
- Tracking: {order.get('tracking_number', 'Not available yet')}
- Estimated Delivery: {order.get('estimated_delivery', 'Calculating...')}
""")
            if customer_context.get("product"):
                product = customer_context["product"]
                context_parts.append(f"""
Product Information:
- Name: {product.get('name', 'Unknown')}
- Price: {product.get('price', 'Unknown')}
- In Stock: {'Yes' if product.get('in_stock', True) else 'Out of stock'}
- Description: {product.get('description', 'No description')}
""")
            if customer_context.get("customer_name"):
                context_parts.append(f"Customer Name: {customer_context['customer_name']}")

        context_str = "\n".join(context_parts) if context_parts else "No specific customer context available."

        # Check for immediate escalation needs
        needs_human = False
        if intent == "escalation_request":
            needs_human = True
        elif intent == "return_refund" and customer_context:
            # Escalate high-value refunds
            if customer_context.get("order", {}).get("total_cents", 0) > 10000:  # $100
                needs_human = True

        # Generate response
        if self.client:
            try:
                # Build messages for Claude
                messages = []

                # Add conversation history
                for msg in conversation_history[-10:]:  # Last 10 messages for context
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })

                # Add current message
                messages.append({
                    "role": "user",
                    "content": f"Customer Context:\n{context_str}\n\nCustomer Message: {message}"
                })

                response = self.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=500,
                    system=self.SYSTEM_PROMPT,
                    messages=messages
                )

                response_text = response.content[0].text

                # Determine confidence based on response content
                confidence = 0.85  # Default medium-high
                if needs_human or "I'm not sure" in response_text or "human" in response_text.lower():
                    confidence = 0.6
                elif any(word in response_text.lower() for word in ["definitely", "your order", "the status is"]):
                    confidence = 0.95

                return ChatResponse(
                    response=response_text,
                    suggested_actions=suggested_actions,
                    needs_human=needs_human,
                    confidence=confidence,
                    intent=intent
                )

            except Exception as e:
                print(f"Claude API error: {e}")
                # Fall through to fallback response

        # Fallback responses when AI is not available
        fallback_responses = {
            "greeting": "Hello! Welcome to TikTok Shop support. How can I help you today? You can ask about orders, products, shipping, or returns.",
            "order_status": "I'd be happy to help you check your order status! Please provide your order number or the email used during checkout, and I'll look it up for you.",
            "return_refund": "I can help with returns and refunds. Our policy allows returns within 30 days for unused items. Would you like to start a return, or do you have questions about an existing refund?",
            "product_inquiry": "I'd be glad to help with product information! What product are you interested in? You can share the product name or link, and I'll get you the details.",
            "shipping_info": "We offer free standard shipping (5-7 days) on orders over $50, and express shipping (2-3 days) for an additional fee. Would you like tracking info for an existing order?",
            "cancellation": "I understand you'd like to cancel an order. If your order hasn't shipped yet, I can help with that. Please provide your order number so I can check the status.",
            "payment_issue": "I'm sorry to hear you're having payment issues. Let me connect you with our support team who can securely review your account. Would you like to speak with an agent?",
            "escalation_request": "Of course! I'll connect you with a human support agent right away. They'll be able to help with your specific situation. Please hold for a moment.",
            "closing": "You're welcome! Thanks for shopping with TikTok Shop. Is there anything else I can help you with before you go?",
            "general": "Thanks for reaching out! I'm here to help with orders, products, shipping, returns, and general questions. What can I assist you with today?",
        }

        response_text = fallback_responses.get(intent, fallback_responses["general"])

        # Add context-specific info if available
        if customer_context and customer_context.get("order") and intent == "order_status":
            order = customer_context["order"]
            response_text = f"I found your order #{order.get('order_id', '')}! Here's the status:\n\n"
            response_text += f"Status: {order.get('status', 'Processing')}\n"
            response_text += f"Total: {order.get('total', 'N/A')}\n"
            if order.get('tracking_number'):
                response_text += f"Tracking: {order['tracking_number']}\n"
            if order.get('estimated_delivery'):
                response_text += f"Estimated Delivery: {order['estimated_delivery']}\n"
            response_text += "\nIs there anything else you'd like to know about this order?"

        return ChatResponse(
            response=response_text,
            suggested_actions=suggested_actions,
            needs_human=needs_human,
            confidence=0.75,
            intent=intent
        )

    async def lookup_order_status(self, order_id: str, db_session=None) -> Optional[Dict[str, Any]]:
        """
        Look up order status from database.

        Args:
            order_id: The order ID to look up
            db_session: Database session

        Returns:
            Order information dict or None if not found
        """
        if not db_session:
            return None

        try:
            from models import Order
            order = db_session.query(Order).filter(Order.id == int(order_id)).first()
            if not order:
                return None

            return {
                "order_id": str(order.id),
                "status": order.status or "processing",
                "total": f"${(order.total_cents or 0) / 100:.2f}",
                "total_cents": order.total_cents or 0,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "items": [],  # Would need to join with order items
                "tracking_number": None,  # Would come from fulfillment
                "estimated_delivery": None
            }
        except Exception as e:
            print(f"Error looking up order: {e}")
            return None

    async def get_product_info(self, product_id: int, db_session=None) -> Optional[Dict[str, Any]]:
        """
        Get product details for chatbot context.

        Args:
            product_id: The product ID
            db_session: Database session

        Returns:
            Product information dict or None if not found
        """
        if not db_session:
            return None

        try:
            from models import Product
            product = db_session.query(Product).filter(Product.id == product_id).first()
            if not product:
                return None

            return {
                "product_id": product.id,
                "name": product.name,
                "price": f"${(product.price_cents or 0) / 100:.2f}",
                "description": product.description or "",
                "in_stock": product.status == "LIVE"
            }
        except Exception as e:
            print(f"Error looking up product: {e}")
            return None

    async def create_support_ticket(
        self,
        customer_email: str,
        subject: str,
        conversation_history: List[Dict[str, str]],
        priority: str = "medium"
    ) -> Dict[str, Any]:
        """
        Create a support ticket when escalating to human support.

        Args:
            customer_email: Customer's email
            subject: Ticket subject
            conversation_history: Chat history for context
            priority: Ticket priority (low, medium, high, urgent)

        Returns:
            Ticket information
        """
        ticket_id = f"TKT-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Format conversation for ticket
        conversation_text = "\n".join([
            f"{msg.get('role', 'unknown').upper()}: {msg.get('content', '')}"
            for msg in conversation_history
        ])

        return {
            "ticket_id": ticket_id,
            "customer_email": customer_email,
            "subject": subject,
            "priority": priority,
            "status": "open",
            "conversation_summary": conversation_text[:1000],  # First 1000 chars
            "created_at": datetime.utcnow().isoformat()
        }

    def get_faq_response(self, topic: str) -> Optional[str]:
        """Get pre-defined FAQ response for common topics."""
        faqs = {
            "shipping_cost": "Shipping is FREE on all orders over $50! For orders under $50, standard shipping is $4.99 and express shipping is $9.99.",
            "delivery_time": "Standard delivery takes 5-7 business days. Express delivery takes 2-3 business days. International orders may take 10-14 days.",
            "return_policy": "You can return most unused items within 30 days of delivery for a full refund. Items must be in original packaging. Some items like personalized products are final sale.",
            "refund_time": "Once we receive your return, refunds are processed within 5-7 business days. It may take an additional 3-5 days to appear on your statement.",
            "track_order": "You can track your order by logging into your account and viewing your order history, or by using the tracking number sent to your email.",
            "cancel_order": "Orders can be cancelled within 1 hour of placement or before shipping. After that, you'll need to initiate a return once you receive the item.",
            "contact": "You can reach us via chat 24/7, or email support@tiktokshop.com. Human agents are available 9 AM - 6 PM EST.",
            "payment_methods": "We accept all major credit cards (Visa, Mastercard, Amex, Discover), PayPal, Apple Pay, and Google Pay.",
        }
        return faqs.get(topic)


# Singleton instance
chatbot_service = ChatbotService()
