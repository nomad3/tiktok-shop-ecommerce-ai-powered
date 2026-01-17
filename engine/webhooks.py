import os
import stripe
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
import crud
import models

router = APIRouter()

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # Verify webhook signature
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Development mode: parse without verification
        import json
        event = json.loads(payload)

    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        await handle_checkout_completed(data, db)
    elif event_type == "checkout.session.expired":
        await handle_checkout_expired(data, db)

    return {"status": "received"}


async def handle_checkout_completed(session: dict, db: Session):
    """Handle successful checkout completion."""
    session_id = session.get("id")
    customer_email = session.get("customer_details", {}).get("email", "")
    amount_total = session.get("amount_total", 0)
    metadata = session.get("metadata", {})

    product_slug = metadata.get("product_slug")

    # Find the product
    product = None
    if product_slug:
        product = crud.get_product_by_slug(db, product_slug)

    # Create order record
    order = models.Order(
        product_id=product.id if product else None,
        email=customer_email,
        amount_cents=amount_total,
        status="paid",
        stripe_session_id=session_id
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    print(f"Order created: {order.id} for {customer_email}")
    return order


async def handle_checkout_expired(session: dict, db: Session):
    """Handle expired/abandoned checkout sessions."""
    session_id = session.get("id")

    # Find existing order by session ID and mark as abandoned
    order = db.query(models.Order).filter(
        models.Order.stripe_session_id == session_id
    ).first()

    if order:
        order.status = "abandoned"
        db.commit()
        print(f"Order {order.id} marked as abandoned")

    return order
