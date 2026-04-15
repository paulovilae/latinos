#![allow(clippy::missing_errors_doc)]
//! Bot Webhook Controller
//!
//! Provides a sovereign per-bot HTTP endpoint for receiving trading signals from
//! external platforms like TradingView, Alpaca, or any custom integration.
//!
//! Endpoint: POST /api/bots/:id/signal
//! Auth:     X-Bot-Token: <webhook_token>
//!
//! TradingView alert payload example:
//! ```json
//! {
//!   "action": "buy",
//!   "symbol": "{{ticker}}",
//!   "price": {{close}},
//!   "qty": 10,
//!   "comment": "RSI crossed 30 — entry signal"
//! }
//! ```

use crate::controllers::public::get_user_session;
use crate::models::{bot, signal, latinos_users};
use axum::{
    extract::{Path, State, Query},
    http::{HeaderMap, StatusCode},
    response::Json as AxumJson,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter};
use serde::Deserialize;
use serde_json::{json, Value};

// ── Request / Response shapes ─────────────────────────────────────────────────

/// Normalized signal payload accepted from any external source.
#[derive(Debug, Deserialize)]
pub struct WebhookPayload {
    /// "buy" | "sell" | "close" | "info"
    pub action: String,
    /// Ticker symbol, e.g. "NVDA" or "BTC-USD"
    pub symbol: Option<String>,
    /// Entry/exit price (optional — we record what the caller sends)
    pub price: Option<f64>,
    /// Number of shares/units (optional)
    pub qty: Option<f64>,
    /// Human-readable comment or strategy name
    pub comment: Option<String>,
    /// Pass-through extra fields from TradingView/Alpaca
    #[serde(flatten)]
    pub extra: Value,
}

#[derive(Debug, Deserialize)]
pub struct WebhookQuery {
    pub token: Option<String>,
}


// ── Handler ───────────────────────────────────────────────────────────────────

/// POST /api/bots/:id/signal
///
/// Accepts a trading signal for the given bot ID. Validates the `X-Bot-Token`
/// header against the bot's stored webhook_token. On success, persists to
/// `latinos_signals` and returns the signal ID.
pub async fn receive_signal(
    State(ctx): State<AppContext>,
    Path(bot_id): Path<i32>,
    Query(query): Query<WebhookQuery>,
    headers: HeaderMap,
    AxumJson(payload): AxumJson<WebhookPayload>,
) -> Result<(StatusCode, AxumJson<Value>)> {
    // 1. Authenticate via X-Bot-Token header or ?token= param
    let provided_token = query.token.unwrap_or_else(|| {
        headers
            .get("x-bot-token")
            .or_else(|| headers.get("X-Bot-Token"))
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string()
    });

    if provided_token.is_empty() {
        return Ok((
            StatusCode::UNAUTHORIZED,
            AxumJson(json!({ "error": "Missing X-Bot-Token header" })),
        ));
    }

    // 2. Load the bot
    let bot = bot::Entity::find_by_id(bot_id)
        .one(&ctx.db)
        .await
        .map_err(|e| {
            tracing::error!("[Webhook] DB error: {e}");
            loco_rs::Error::string("DB error")
        })?;

    let bot = match bot {
        Some(b) => b,
        None => {
            return Ok((
                StatusCode::NOT_FOUND,
                AxumJson(json!({ "error": "Bot not found" })),
            ));
        }
    };

    // 3. Token validation
    let expected = bot.webhook_token.as_deref().unwrap_or("");
    if expected.is_empty() || expected != provided_token {
        tracing::warn!(
            "[Webhook] Invalid token for bot {} ({})",
            bot_id,
            bot.name
        );
        return Ok((
            StatusCode::FORBIDDEN,
            AxumJson(json!({ "error": "Invalid webhook token" })),
        ));
    }

    // 4. Build the signal payload (normalised + raw passthrough)
    let normalized = json!({
        "action": payload.action,
        "symbol": payload.symbol,
        "price": payload.price,
        "qty": payload.qty,
        "comment": payload.comment,
        "raw": payload.extra,
    });

    // 5. Persist to latinos_signals
    let signal_type = classify_action(&payload.action);
    let inserted = signal::ActiveModel {
        bot_id: Set(Some(bot_id)),
        r#type: Set(signal_type.to_string()),
        name: Set(Some(format!(
            "{} — {}",
            payload.action.to_uppercase(),
            payload.symbol.as_deref().unwrap_or("N/A")
        ))),
        payload: Set(Some(normalized)),
        mode: Set("live".to_string()),
        delivery_status: Set("received".to_string()),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await
    .map_err(|e| {
        tracing::error!("[Webhook] Insert error: {e}");
        loco_rs::Error::string("Failed to persist signal")
    })?;

    tracing::info!(
        "[Webhook] ✅ Signal #{} accepted for bot {} ({}) — action: {}",
        inserted.id, bot_id, bot.name, payload.action
    );

    Ok((
        StatusCode::OK,
        AxumJson(json!({
            "status": "accepted",
            "signal_id": inserted.id,
            "bot_id": bot_id,
            "action": payload.action,
            "message": format!("Signal received for {}", bot.name)
        })),
    ))
}

/// GET /api/bots/:id/webhook-info
///
/// Returns webhook configuration for the authenticated user's bot.
/// Used by the dashboard Settings page to show the webhook URL + token.
pub async fn webhook_info(
    State(ctx): State<AppContext>,
    Path(bot_id): Path<i32>,
    headers: HeaderMap,
) -> Result<AxumJson<Value>> {

    let (email, _) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Err(loco_rs::Error::Unauthorized("Login required".to_string())),
    };

    // Verify ownership
    let user = latinos_users::Entity::find()
        .filter(
            crate::models::_entities::latinos_users::Column::Email.eq(&email)
        )
        .one(&ctx.db)
        .await?
        .ok_or_else(|| loco_rs::Error::Unauthorized("User not found".to_string()))?;

    let bot = bot::Entity::find_by_id(bot_id)
        .one(&ctx.db)
        .await?
        .ok_or_else(|| loco_rs::Error::NotFound)?;

    if bot.owner_id != user.id {
        return Err(loco_rs::Error::Unauthorized(
            "You do not own this bot".to_string(),
        ));
    }

    let base_url = std::env::var("APP_URL")
        .unwrap_or_else(|_| "https://latinos.paulovila.org".to_string());

    Ok(AxumJson(json!({
        "bot_id": bot.id,
        "bot_name": bot.name,
        "webhook_url": format!("{}/api/bots/{}/signal?token={}", base_url, bot.id, bot.webhook_token.as_deref().unwrap_or("")),
        "token": bot.webhook_token,
        "headers_accepted": [ "X-Bot-Token", "?token=" ],
        "example_payload_tradingview": {
            "action": "{{strategy.order.action}}",
            "symbol": "{{ticker}}",
            "price": "{{close}}",
            "qty": 10,
            "comment": "{{strategy.order.comment}}"
        },
        "example_payload_alpaca": {
            "action": "buy",
            "symbol": bot.signal_manifest
                .as_ref()
                .and_then(|m| m.get("symbol"))
                .and_then(|v| v.as_str())
                .unwrap_or("NVDA"),
            "price": 450.0,
            "qty": 5
        }
    })))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn classify_action(action: &str) -> &'static str {
    match action.to_lowercase().as_str() {
        "buy" | "long" | "enter_long" => "entry",
        "sell" | "short" | "enter_short" => "entry",
        "close" | "exit" | "flatten" => "exit",
        _ => "info",
    }
}

// ── Route Registration ────────────────────────────────────────────────────────

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/bots")
        .add("/{id}/signal", axum::routing::post(receive_signal))
        .add("/{id}/webhook-info", axum::routing::get(webhook_info))
}
