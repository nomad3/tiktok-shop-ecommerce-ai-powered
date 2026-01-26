import stripe
import os
import uuid
from fastapi import HTTPException

# Initialize Stripe
stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
stripe.api_key = stripe_key

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Check if we have a valid Stripe key (starts with sk_test_ or sk_live_)
DEMO_MODE = not stripe_key or not stripe_key.startswith(("sk_test_", "sk_live_"))


class MockCheckoutSession:
    """Mock session object for demo mode"""
    def __init__(self, product_slug: str):
        self.id = f"demo_session_{uuid.uuid4().hex[:16]}"
        self.url = f"{FRONTEND_URL}/checkout/success?session_id={self.id}&demo=true"


def create_checkout_session(product_name: str, price_cents: int, product_slug: str):
    # In demo mode, return a mock session that redirects to success page
    if DEMO_MODE:
        print(f"[Demo Mode] Creating mock checkout for: {product_name}")
        return MockCheckoutSession(product_slug)

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': product_name,
                    },
                    'unit_amount': price_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{FRONTEND_URL}/p/{product_slug}',
            metadata={
                'product_slug': product_slug
            }
        )
        return session
    except Exception as e:
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
