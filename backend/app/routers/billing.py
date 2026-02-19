import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from .. import schemas, models, crud
from ..db import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/billing",
    tags=["billing"],
)

# Limiter for billing endpoints
limiter = Limiter(key_func=get_remote_address)

# Stripe Configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
STRIPE_PRICE_ID_ANNUAL = os.getenv("STRIPE_PRICE_ID_ANNUAL")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3306")

@router.post("/checkout", response_model=schemas.BillingCheckoutResponse)
@limiter.limit("5/minute")
def billing_checkout(
    request: Request,
    billing_period: str = "monthly",
    tier: str = "pro",
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    tier = tier.lower()
    
    # Map tier to ENV variables
    price_env_key = f"STRIPE_PRICE_{tier.upper()}_{billing_period.upper()}"
    price_id = os.getenv(price_env_key)

    # Fallback to old env vars if not set
    if not price_id:
        if billing_period == "annual":
            price_id = STRIPE_PRICE_ID_ANNUAL
        else:
            price_id = STRIPE_PRICE_ID
    
    if not stripe.api_key or not price_id or "..." in stripe.api_key:
        user.subscription_tier = tier
        user.subscription_status = "active"
        db.commit()
        return schemas.BillingCheckoutResponse(checkout_url=f"/dashboard?upgrade=success&tier={tier}")
        
    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=user.email,
            client_reference_id=str(user.id),
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/dashboard?upgrade=success",
            cancel_url=f"{FRONTEND_URL}/dashboard",
            metadata={'user_id': str(user.id), 'billing_period': billing_period, 'tier': tier}
        )
        return schemas.BillingCheckoutResponse(checkout_url=checkout_session.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating checkout session: {str(e)}")

@router.get("/portal", response_model=schemas.BillingPortalResponse)
def billing_portal(user: models.User = Depends(get_current_user)):
    if not stripe.api_key or "..." in stripe.api_key:
         return schemas.BillingPortalResponse(portal_url="/dashboard?portal=mock_session_active")
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")
    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{FRONTEND_URL}/dashboard"
        )
        return schemas.BillingPortalResponse(portal_url=portal_session.url)
    except Exception as e:
         raise HTTPException(status_code=400, detail="Error accessing billing portal")

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: Session = Depends(get_db)):
    payload = await request.body()
    if not STRIPE_WEBHOOK_SECRET:
         raise HTTPException(status_code=500, detail="Webhook secret not configured")
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id') or session.get('metadata', {}).get('user_id')
        customer_id = session.get('customer')
        tier = session.get('metadata', {}).get('tier', 'pro')
        if user_id:
            user = crud.get_user(db, int(user_id))
            if user:
                user.stripe_customer_id = customer_id
                user.subscription_status = "active"
                user.subscription_tier = tier
                db.commit()
    elif event['type'] in ['customer.subscription.updated', 'customer.subscription.deleted']:
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        status_ = subscription.get('status')
        tier = subscription.get('metadata', {}).get('tier')
        user = db.query(models.User).filter(models.User.stripe_customer_id == customer_id).first()
        if user:
            user.subscription_status = status_
            if status_ == 'active':
                if tier:
                    user.subscription_tier = tier
            else:
                user.subscription_tier = "free"
            db.commit()
    return {"status": "success"}
