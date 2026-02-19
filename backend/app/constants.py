import os
from . import schemas
from .market import MARKET_UNIVERSE
from cachetools import TTLCache

# Plans Configuration
PLANS: list[schemas.Plan] = [
    schemas.Plan(
        name="Starter",
        description="Perfect for getting started with automated trading.",
        limits="1 Live Bot • Unlimited Paper Trading • Standard Chat",
        price_monthly="$20",
        price_yearly="$200",
        features=[
            "1 Live Bot Execution",
            "Unlimited Paper Trading",
            "Access to Basic Marketplace Bots",
            "Standard Market Data",
        ],
    ),
    schemas.Plan(
        name="Pro",
        description="For serious traders looking to diversify across multiple strategies.",
        limits="5 Live Bots • Priority Execution • Email Support",
        price_monthly="$90", 
        price_yearly="$900",
        features=[
            "5 Live Bots Execution",
            "Priority Routing Engine",
            "Access to Pro Marketplace Bots",
            "Discord Private Channel Support",
        ],
    ),
    schemas.Plan(
        name="Whale",
        description="Maximum scale for running entire quant portfolios.",
        limits="100 Live Bots • Dedicated Node • 24/7 Phone Support",
        price_monthly="$1500",
        price_yearly="$15000",
        features=[
            "100 Live Bots Execution",
            "Dedicated Worker Node",
            "Unlimited Marketplace Access",
            "24/7 Dedicated Support",
        ],
    ),
]

# Caches
dashboard_cache = TTLCache(maxsize=100, ttl=60)
static_cache = TTLCache(maxsize=50, ttl=86400)
