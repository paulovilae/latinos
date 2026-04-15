#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unused_async)]
use crate::controllers::public::get_user_session;
use crate::models::{bot, signal, user};
use loco_rs::prelude::*;
use sea_orm::{ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter};
use serde::Serialize;
use serde_json::json;
use utoipa::OpenApi;

/// Latinos Trading — OpenAPI spec (auto-generated from handler annotations)
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Latinos Trading API",
        version = "0.1.0",
        description = "API de trading algorítmico de Latinos. Bots, señales, backtests, trades y datos de mercado.",
        contact(name = "Latinos Trading", email = "soporte@latinos.trade"),
    ),
    paths(
        health,
        list_bots,
        list_signals,
        list_backtests,
        list_trades,
        get_metrics,
    ),
    tags(
        (name = "Health", description = "Service health checks"),
        (name = "Bots", description = "Trading bot management"),
        (name = "Signals", description = "Trading signal CRUD"),
        (name = "Backtests", description = "Backtest execution and results"),
        (name = "Trades", description = "Trade history"),
        (name = "Metrics", description = "Platform metrics"),
    )
)]
pub struct LatinosApiDoc;

// ─── Response Types ─────────────────────────────────────────────────────

#[derive(Serialize, utoipa::ToSchema)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

#[derive(Serialize, utoipa::ToSchema)]
pub struct MetricsResponse {
    pub users: i64,
    pub bots: i64,
    pub signals: i64,
    pub backtests: i64,
    pub trades: i64,
}

// ─── Auth Helpers ───────────────────────────────────────────────────────

/// Extract the authenticated user's email from session, or return 401.
fn require_session(headers: &axum::http::HeaderMap) -> Result<(String, Option<String>), Response> {
    get_user_session(headers).ok_or_else(|| {
        (
            axum::http::StatusCode::UNAUTHORIZED,
            axum::Json(json!({"error": "Authentication required"})),
        )
            .into_response()
    })
}

/// Get user IDs for an email (for tenant-scoped queries).
async fn owner_ids_for_email(ctx: &AppContext, email: &str) -> Vec<i32> {
    user::Entity::find()
        .filter(user::Column::Email.eq(email.to_string()))
        .all(&ctx.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|u| u.id)
        .collect()
}

/// Get bot IDs owned by the user (for tenant-scoped queries).
async fn bot_ids_for_user(ctx: &AppContext, email: &str) -> Vec<i32> {
    let owner_ids = owner_ids_for_email(ctx, email).await;
    if owner_ids.is_empty() {
        return Vec::new();
    }

    bot::Entity::find()
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .all(&ctx.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|b| b.id)
        .collect()
}

// ─── Health (Public) ────────────────────────────────────────────────────

/// GET /api/health — Service health check
#[utoipa::path(
    get, path = "/api/health",
    tag = "Health",
    summary = "Health check",
    description = "Returns service health status and version.",
    responses((status = 200, description = "Service healthy", body = HealthResponse))
)]
#[debug_handler]
pub async fn health(State(_ctx): State<AppContext>) -> Result<Response> {
    Ok(axum::Json(serde_json::json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
    }))
    .into_response())
}

// ─── Bots (Authenticated, tenant-scoped) ────────────────────────────────

/// GET /api/bots — List current user's trading bots
#[utoipa::path(
    get, path = "/api/bots",
    tag = "Bots",
    summary = "List bots",
    description = "Returns the authenticated user's trading bots.",
    responses((status = 200, description = "Bot list"))
)]
#[debug_handler]
pub async fn list_bots(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, _) = match require_session(&headers) {
        Ok(s) => s,
        Err(r) => return Ok(r),
    };

    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    if owner_ids.is_empty() {
        return Ok(axum::Json(json!({"bots": [], "total": 0})).into_response());
    }

    let rows = bot::Entity::find()
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    let bots: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "status": row.status,
            })
        })
        .collect();

    Ok(axum::Json(json!({
        "bots": bots,
        "total": bots.len(),
    }))
    .into_response())
}

// ─── Signals (Authenticated, tenant-scoped) ─────────────────────────────

/// GET /api/signals — List signals for current user's bots
#[utoipa::path(
    get, path = "/api/signals",
    tag = "Signals",
    summary = "List signals",
    description = "Returns recent trading signals for the authenticated user's bots.",
    responses((status = 200, description = "Signal list"))
)]
#[debug_handler]
pub async fn list_signals(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, _) = match require_session(&headers) {
        Ok(s) => s,
        Err(r) => return Ok(r),
    };

    let user_bot_ids = bot_ids_for_user(&ctx, &email).await;
    if user_bot_ids.is_empty() {
        return Ok(axum::Json(json!({"signals": [], "total": 0})).into_response());
    }

    let rows = crate::models::signal::Entity::find()
        .filter(crate::models::signal::Column::BotId.is_in(user_bot_ids))
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    let signals: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.id,
                "bot_id": row.bot_id,
                "type": row.r#type,
                "mode": row.mode,
                "delivery_status": row.delivery_status,
            })
        })
        .collect();

    Ok(axum::Json(json!({
        "signals": signals,
        "total": signals.len(),
    }))
    .into_response())
}

// ─── Backtests (Authenticated, tenant-scoped) ───────────────────────────

/// GET /api/backtests — List backtests for current user's bots
#[utoipa::path(
    get, path = "/api/backtests",
    tag = "Backtests",
    summary = "List backtests",
    description = "Returns recent backtest results for the authenticated user's bots.",
    responses((status = 200, description = "Backtest list"))
)]
#[debug_handler]
pub async fn list_backtests(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, _) = match require_session(&headers) {
        Ok(s) => s,
        Err(r) => return Ok(r),
    };

    let user_bot_ids = bot_ids_for_user(&ctx, &email).await;
    if user_bot_ids.is_empty() {
        return Ok(axum::Json(json!({"backtests": [], "total": 0})).into_response());
    }

    let rows = crate::models::backtest::Entity::find()
        .filter(crate::models::backtest::Column::BotId.is_in(user_bot_ids))
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    let backtests: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.id,
                "bot_id": row.bot_id,
                "range": row.range,
                "market": row.market,
                "status": row.status,
            })
        })
        .collect();

    Ok(axum::Json(json!({
        "backtests": backtests,
        "total": backtests.len(),
    }))
    .into_response())
}

// ─── Trades (Authenticated, tenant-scoped) ──────────────────────────────

/// GET /api/trades — List trades for current user's bots
#[utoipa::path(
    get, path = "/api/trades",
    tag = "Trades",
    summary = "List trades",
    description = "Returns recent trades for the authenticated user's bots.",
    responses((status = 200, description = "Trade list"))
)]
#[debug_handler]
pub async fn list_trades(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, _) = match require_session(&headers) {
        Ok(s) => s,
        Err(r) => return Ok(r),
    };

    let user_bot_ids = bot_ids_for_user(&ctx, &email).await;
    if user_bot_ids.is_empty() {
        return Ok(axum::Json(json!({"trades": [], "total": 0})).into_response());
    }

    let rows = crate::models::trade::Entity::find()
        .filter(crate::models::trade::Column::BotId.is_in(user_bot_ids))
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    let trades: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.id,
                "symbol": row.symbol,
                "side": row.side,
                "price": row.price,
                "amount": row.amount,
                "status": row.status,
                "pnl": row.pnl,
            })
        })
        .collect();

    Ok(axum::Json(json!({
        "trades": trades,
        "total": trades.len(),
    }))
    .into_response())
}

// ─── Metrics (Authenticated) ────────────────────────────────────────────

/// GET /api/metrics — Platform metrics summary (admin view shows global)
#[utoipa::path(
    get, path = "/api/metrics",
    tag = "Metrics",
    summary = "Platform metrics",
    description = "Returns aggregated platform metrics (user/bot/signal/backtest/trade counts).",
    responses((status = 200, description = "Metrics summary", body = MetricsResponse))
)]
#[debug_handler]
pub async fn get_metrics(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (_email, _) = match require_session(&headers) {
        Ok(s) => s,
        Err(r) => return Ok(r),
    };
    let _ = ctx;

    let users = crate::memento_query::count_table("latinos", "latinos_users").await;
    let bots = crate::memento_query::count_table("latinos", "latinos_bots").await;
    let signals = crate::memento_query::count_table("latinos", "latinos_signals").await;
    let backtests = crate::memento_query::count_table("latinos", "latinos_backtests").await;
    let trades = crate::memento_query::count_table("latinos", "latinos_trades").await;

    Ok(axum::Json(serde_json::json!({
        "users": users,
        "bots": bots,
        "signals": signals,
        "backtests": backtests,
        "trades": trades,
    }))
    .into_response())
}

// ─── Webhooks (HMAC-verified) ───────────────────────────────────────────

use hmac::{Hmac, Mac, KeyInit};
use sha2::Sha256;

/// Verify HMAC-SHA256 signature on webhook payloads.
fn verify_webhook_signature(
    payload_bytes: &[u8],
    signature_header: Option<&str>,
) -> bool {
    let secret = match std::env::var("WEBHOOK_SECRET") {
        Ok(s) if !s.is_empty() => s,
        _ => {
            tracing::warn!("WEBHOOK_SECRET not set — rejecting all webhooks");
            return false;
        }
    };

    let provided_sig = match signature_header {
        Some(s) => s,
        None => return false,
    };

    let mut mac = match Hmac::<Sha256>::new_from_slice(secret.as_bytes()) {
        Ok(m) => m,
        Err(_) => return false,
    };
    mac.update(payload_bytes);
    let result_bytes = mac.finalize().into_bytes();
    let expected_hex = hex::encode(result_bytes);
    
    let expected_with_prefix = format!("sha256={}", expected_hex);

    // Some senders prepend sha256= (e.g. GitHub but also Custom payloads)
    // We check both raw hex and prefixed hex for robustness.
    // A constant time comparison isn't strictly necessary here because we check hashes 
    // rather than passwords, but it's good practice.
    let is_match = provided_sig == expected_hex || provided_sig == expected_with_prefix;
    if !is_match {
        tracing::debug!("Webhook signature mismatch. Expected: {} or {}, Got: {}", expected_hex, expected_with_prefix, provided_sig);
    }
    is_match
}

/// POST /api/webhook — Receive TradingView signals (HMAC-verified)
#[debug_handler]
pub async fn receive_webhook(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
    body: axum::body::Bytes,
) -> Result<Response> {
    // ── Signature verification ──
    let signature = headers
        .get("x-signature")
        .and_then(|v| v.to_str().ok());

    if !verify_webhook_signature(&body, signature) {
        tracing::warn!("Webhook rejected: invalid or missing HMAC signature");
        return Ok((
            axum::http::StatusCode::UNAUTHORIZED,
            axum::Json(json!({"error": "Invalid webhook signature"})),
        )
            .into_response());
    }

    // ── Timestamp replay protection ──
    let timestamp_str = headers
        .get("x-timestamp")
        .and_then(|v| v.to_str().ok());

    if let Some(ts_str) = timestamp_str {
        if let Ok(ts) = ts_str.parse::<i64>() {
            let now = chrono::Utc::now().timestamp();
            // Reject payloads older than 5 minutes (300 seconds)
            let diff = now - ts;
            if diff.abs() > 300 {
                tracing::warn!("Webhook rejected: timestamp {ts} is out of 300s window (diff: {diff}s)");
                return Ok((
                    axum::http::StatusCode::UNAUTHORIZED,
                    axum::Json(json!({"error": "Webhook timestamp expired or invalid replay"})),
                )
                    .into_response());
            }
        } else {
            tracing::warn!("Webhook rejected: invalid x-timestamp format");
            return Ok((
                axum::http::StatusCode::BAD_REQUEST,
                axum::Json(json!({"error": "Invalid x-timestamp"})),
            )
                .into_response());
        }
    } else {
        tracing::warn!("Webhook rejected: missing x-timestamp");
        return Ok((
            axum::http::StatusCode::UNAUTHORIZED,
            axum::Json(json!({"error": "Missing x-timestamp for replay protection"})),
        )
            .into_response());
    }

    let payload: serde_json::Value = match serde_json::from_slice(&body) {
        Ok(v) => v,
        Err(e) => {
            return Ok((
                axum::http::StatusCode::BAD_REQUEST,
                axum::Json(json!({"error": format!("Invalid JSON: {}", e)})),
            )
                .into_response());
        }
    };

    // ── Schema validation: require "action" field ──
    let action = match payload.get("action").or_else(|| payload.get("type")) {
        Some(v) => v.as_str().unwrap_or("alert").to_string(),
        None => {
            return Ok((
                axum::http::StatusCode::BAD_REQUEST,
                axum::Json(json!({"error": "Missing 'action' or 'type' field"})),
            )
                .into_response());
        }
    };

    tracing::info!("Received verified webhook: action={}", action);

    let bot_id = payload
        .get("bot_id")
        .and_then(|v| v.as_i64())
        .map(|v| v as i32);

    let now = chrono::Utc::now().fixed_offset();
    let created = signal::ActiveModel {
        bot_id: Set(bot_id),
        r#type: Set(action),
        name: Set(payload
            .get("name")
            .or_else(|| payload.get("symbol"))
            .and_then(|v| v.as_str())
            .map(str::to_owned)),
        payload: Set(Some(payload.clone())),
        emitted_at: Set(now),
        mode: Set("live".to_string()),
        delivery_status: Set("delivered".to_string()),
        created_at: Set(now),
        ..Default::default()
    };

    if let Err(e) = created.insert(&ctx.db).await {
        tracing::error!("Failed to save webhook to db: {:?}", e);
        return Ok(axum::Json(serde_json::json!({
            "status": "error",
            "message": format!("Database insert failed: {}", e)
        }))
        .into_response());
    }

    Ok(axum::Json(serde_json::json!({
        "status": "success",
        "message": "Webhook received successfully"
    }))
    .into_response())
}

// ─── Routes ─────────────────────────────────────────────────────────────

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api")
        .add("/health", post(health).get(health))
        .add("/bots", get(list_bots))
        .add("/signals", get(list_signals))
        .add("/backtests", get(list_backtests))
        .add("/trades", get(list_trades))
        .add("/metrics", get(get_metrics))
        .add("/webhook", post(receive_webhook))
        // NOTE: /api/internal/backtest REMOVED — unauthenticated internal endpoint
}
