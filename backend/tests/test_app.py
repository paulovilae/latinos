import pathlib
import sys

# Ensure the local stub packages are importable even when running pytest from this
# directory instead of the repository root.
ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def register_user(email: str, password: str, name: str, role: str = "user"):
    response = client.post(
        "/auth/register",
        json={"email": email, "password": password, "name": name, "role": role},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_auth_and_profile_flow():
    token = register_user("user@example.com", "secret123", "Trader")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/users/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "user@example.com"

    resp = client.put("/users/me", headers=headers, json={"name": "New Name", "mfa_enabled": True})
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["name"] == "New Name"
    assert payload["mfa_enabled"] is True

    refresh_resp = client.post("/auth/refresh", json={"token": token})
    assert refresh_resp.status_code == 200
    assert refresh_resp.json()["access_token"] != token



def test_admin_user_management_and_billing():
    admin_token = register_user("admin@example.com", "secret123", "Admin", role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create additional user via admin endpoint
    resp = client.post(
        "/users",
        headers=headers,
        json={"email": "second@example.com", "password": "secret123", "name": "Second", "role": "user"},
    )
    assert resp.status_code == 201
    second_user = resp.json()

    # List users should include both
    resp = client.get("/users", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

    # Billing endpoints return URLs
    checkout = client.post("/billing/checkout", headers=headers)
    assert checkout.status_code == 200
    assert str(admin_token) in checkout.json()["checkout_url"]

    portal = client.get("/billing/portal", headers=headers)
    assert portal.status_code == 200
    assert "portal" in portal.json()["portal_url"]

    # Admin can delete user
    delete_resp = client.delete(f"/users/{second_user['id']}", headers=headers)
    assert delete_resp.status_code == 204



def test_bots_formulas_backtests_and_signals():
    token = register_user("builder@example.com", "secret123", "Builder")
    headers = {"Authorization": f"Bearer {token}"}

    # Create bot
    bot_resp = client.post(
        "/bots",
        headers=headers,
        json={"name": "Momentum Bot", "description": "Trades breakouts", "tags": ["momentum"]},
    )
    assert bot_resp.status_code == 201
    bot_id = bot_resp.json()["id"]

    # Deploy and pause transitions
    deploy_resp = client.post(f"/bots/{bot_id}/deploy", headers=headers)
    assert deploy_resp.status_code == 200
    assert deploy_resp.json()["status"] == "running"

    pause_resp = client.post(f"/bots/{bot_id}/pause", headers=headers)
    assert pause_resp.status_code == 200
    assert pause_resp.json()["status"] == "paused"

    # Formulas
    formula_resp = client.post(
        f"/bots/{bot_id}/formulas",
        headers=headers,
        json={"payload": {"rules": ["buy on breakout"]}, "assets": ["AAPL"], "notes": "Initial draft"},
    )
    assert formula_resp.status_code == 201
    formula_id = formula_resp.json()["id"]
    assert formula_resp.json()["assets"] == ["AAPL"]

    publish_resp = client.post(
        f"/formulas/{formula_id}/publish",
        headers=headers,
        json={"published": True},
    )
    assert publish_resp.status_code == 200
    assert publish_resp.json()["published"] is True

    update_resp = client.put(
        f"/formulas/{formula_id}",
        headers=headers,
        json={"assets": ["AAPL", "MSFT"], "notes": "Target mega-cap tech"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["assets"] == ["AAPL", "MSFT"]
    assert update_resp.json()["notes"] == "Target mega-cap tech"

    history_resp = client.get(f"/formulas/{formula_id}/history", headers=headers)
    assert history_resp.status_code == 200
    assert len(history_resp.json()["history"]) == 1
    formula_list = client.get(f"/bots/{bot_id}/formulas", headers=headers)
    assert formula_list.status_code == 200
    assert any(item["id"] == formula_id for item in formula_list.json())

    # Signals
    signal_resp = client.post(
        "/signals",
        headers=headers,
        json={"bot_id": bot_id, "type": "buy", "payload": {"price": 100}, "mode": "paper"},
    )
    assert signal_resp.status_code == 201
    assert signal_resp.json()["type"] == "buy"

    signals_list = client.get("/signals", headers=headers)
    assert signals_list.status_code == 200
    assert any(item["id"] == signal_resp.json()["id"] for item in signals_list.json())

    # Backtests
    backtest_resp = client.post(
        "/backtests",
        headers=headers,
        json={
            "bot_id": bot_id,
            "formula_version_id": formula_id,
            "range": "2020-2021",
            "market": "NASDAQ",
        },
    )
    assert backtest_resp.status_code == 201
    assert backtest_resp.json()["status"] == "completed"

    backtest_detail = client.get(f"/backtests/{backtest_resp.json()['id']}", headers=headers)
    assert backtest_detail.status_code == 200
    assert backtest_detail.json()["results"]["pnl"] == 42

    # Metrics
    metrics_resp = client.get("/admin/metrics")
    assert metrics_resp.status_code == 200
    assert metrics_resp.json()["bots"] >= 1


def test_market_data_endpoints():
    universe_resp = client.get("/market-data/universe")
    assert universe_resp.status_code == 200
    data = universe_resp.json()
    assert "universe" in data
    assert any(item["symbol"] == "AAPL" for item in data["universe"])

    chart_resp = client.get("/market-data/AAPL")
    assert chart_resp.status_code == 200
    chart_payload = chart_resp.json()
    assert chart_payload["symbol"] == "AAPL"
    assert len(chart_payload["points"]) > 0


def test_dashboard_summary_and_universe_admin():
    admin_token = register_user("dash-admin@example.com", "secret123", "Dashboard Admin", role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    summary_resp = client.get("/dashboard/summary", headers=headers)
    assert summary_resp.status_code == 200
    payload = summary_resp.json()
    assert payload["metrics"]["bots"] >= 1
    assert len(payload["bots"]) >= 1
    assert len(payload["plans"]) >= 1
    assert len(payload["market_universe"]) >= 1

    add_resp = client.post(
        "/market-data/universe",
        headers=headers,
        json={"symbol": "NEW", "name": "New Asset", "sector": "Test"},
    )
    assert add_resp.status_code == 201

    universe_resp = client.get("/market-data/universe")
    assert any(item["symbol"] == "NEW" for item in universe_resp.json()["universe"])

    delete_resp = client.delete("/market-data/universe/NEW", headers=headers)
    assert delete_resp.status_code == 204

    universe_after = client.get("/market-data/universe")
    assert not any(item["symbol"] == "NEW" for item in universe_after.json()["universe"])


def test_plans_and_openapi_stub():
    plans_resp = client.get("/plans")
    assert plans_resp.status_code == 200
    plans = plans_resp.json()
    assert len(plans) >= 3
    assert "price_monthly" in plans[0]

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    payload = openapi_resp.json()
    assert "detail" in payload or "info" in payload
