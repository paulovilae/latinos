"""Lightweight Celery-style worker stub to mirror the plan backlog.

This module intentionally avoids pulling celery as a dependency but exposes
function names that align with the jobs described in docs/plan.md so Docker
compose can run a long-lived worker container. Jobs simply log actions.
"""

from __future__ import annotations

import json
import time
from typing import Any, Dict


def process_backtest(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Simulate a backtest job and return deterministic results."""
    time.sleep(0.1)
    return {
        "status": "completed",
        "results": {
            "pnl": 42,
            "hit_rate": 0.73,
            "range": payload.get("range"),
            "market": payload.get("market"),
        },
    }


def dispatch_signal(payload: Dict[str, Any]) -> Dict[str, str]:
    time.sleep(0.05)
    return {"delivery_status": "sent", "bot_id": str(payload.get("bot_id"))}


def handle_stripe_webhook(event: Dict[str, Any]) -> Dict[str, str]:
    time.sleep(0.05)
    return {"status": "processed", "type": event.get("type", "unknown")}


def main() -> None:
    """Run a tiny loop that demonstrates workers ticking along."""
    print("Worker booted: waiting for jobs (simulated)…", flush=True)
    try:
        while True:
            demo = process_backtest({"range": "demo", "market": "TEST"})
            print(f"backtest complete -> {json.dumps(demo)}", flush=True)
            time.sleep(5)
    except KeyboardInterrupt:
        print("worker shutting down", flush=True)


if __name__ == "__main__":
    main()
