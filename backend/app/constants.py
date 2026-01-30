import os
from . import schemas
from .market import MARKET_UNIVERSE
from cachetools import TTLCache

# Plans Configuration
PLANS: list[schemas.Plan] = [
    schemas.Plan(
        name="Starter",
        description="Simulation (Entrenamiento) sandbox for individuals validating a single strategy.",
        limits="1 live bot • 1 worker slot • 10k signal events/mo",
        price_monthly="$0",
        price_yearly="$0",
        features=[
            "Email support",
            "Simulation (Entrenamiento) only",
            "Basic dashboards",
            "Community webhooks",
        ],
    ),
    schemas.Plan(
        name="Pro",
        description="Serious algo teams that need parallel backtests and live execution.",
        limits="10 bots • 5 worker slots • 1M signal events/mo",
        price_monthly="$20", 
        price_yearly="$200",
        features=[
            "Live + simulation (entrenamiento)",
            "Priority compute",
            "Custom webhooks",
            "RBAC & MFA enforcement",
        ],
    ),
    schemas.Plan(
        name="Enterprise",
        description="Regulated desks that require dedicated infrastructure and SLAs.",
        limits="Unlimited bots • Dedicated workers • Custom event budgets",
        price_monthly="Contact sales",
        price_yearly="Contact sales",
        features=[
            "Dedicated support team",
            "SAML/SCIM",
            "Private VPC deployment",
            "Signed SLAs & audit trails",
        ],
    ),
]

# Caches
dashboard_cache = TTLCache(maxsize=100, ttl=60)
static_cache = TTLCache(maxsize=50, ttl=86400)
