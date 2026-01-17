import stripe
import os
from fastapi import HTTPException

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

def create_checkout_session(product_name: str, price_cents: int, product_slug: str):
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
