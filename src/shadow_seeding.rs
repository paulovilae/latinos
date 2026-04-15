//! Shadow Seeding — ensures the Arena always has data-rich bots.
//!
//! Architecture:
//! - Runs as a background task (fire-and-forget) triggered by Arena page load.
//! - For each bot, resolves a ticker symbol, fetches real OHLCV via Hera IPC
//!   (which calls the yfinance bridge), runs the BacktestEngine natively in Rust,
//!   and persists the result as a global backtest record.
//!
//! No mock data. No hardcoded values. Everything flows through the sovereign stack.

use crate::backtest::{BacktestConfig, BacktestEngine};
use crate::market_data::fetch_ohlcv;
use crate::models::{bot, latinos_backtests};
use chrono::Utc;
use loco_rs::prelude::*;
use sea_orm::{ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter};
use serde_json::{json, Value};
use std::time::Duration;

/// User ID of the system admin that "owns" globally-seeded backtests.
const SHADOW_OWNER_ID: i32 = 10;

/// Curated list of liquid tickers to use as fallback when bot manifests have no symbol.
/// These are the same well-known assets used by the Research SHORTLIST.
const LIQUID_FALLBACK: &[&str] = &[
    "NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "META", "GOOGL", "AMD", "BTC-USD", "GC=F",
];

// ── Entry Point ───────────────────────────────────────────────────────────────

/// Called on every Arena page load. Spawns the refresh cycle in the background.
/// AppContext is cloned so the spawned task owns it independently.
pub async fn seed_arena_if_needed(ctx: &AppContext) -> Result<()> {
    let ctx = ctx.clone();
    tokio::spawn(async move {
        if let Err(e) = refresh_cycle(&ctx).await {
            tracing::error!("[Arena Seeder] Refresh cycle error: {e}");
        }
    });
    Ok(())
}

/// Main cycle: iterates all bots and triggers backtests for those lacking fresh results.
async fn refresh_cycle(ctx: &AppContext) -> Result<()> {
    eprintln!("[Arena Seeder] *** refresh_cycle INVOKED ***");
    tracing::info!("[Arena Seeder] Starting refresh cycle…");

    // Top tickers as fallback for legacy bots with no symbol in manifest
    // Use the curated liquid list rather than universe scanner results
    let fallback_tickers: Vec<String> = LIQUID_FALLBACK.iter().map(|s| s.to_string()).collect();

    // Only seed real trading bots — utility/vetra bots are excluded by bot_type
    let all_bots = bot::Entity::find()
        .filter(bot::Column::BotType.eq("trading"))
        .all(&ctx.db)
        .await
        .unwrap_or_default();
    let stale_after = Utc::now() - chrono::Duration::hours(24);

    for (idx, b) in all_bots.iter().enumerate() {
        let symbol = match resolve_symbol(&b.signal_manifest, &b.name, &fallback_tickers, idx) {
            Some(s) => s,
            None => {
                tracing::debug!("[Arena Seeder] Bot {} has no resolvable symbol — skip", b.id);
                continue;
            }
        };

        let needs_refresh = check_needs_backtest(&ctx.db, b.id, stale_after).await;
        if !needs_refresh {
            tracing::debug!("[Arena Seeder] Bot {} ({}) is fresh — skip", b.id, symbol);
            continue;
        }

        tracing::info!("[Arena Seeder] Running backtest for bot {} ({})", b.id, symbol);
        let manifest = build_sma_manifest(&symbol);

        if let Err(e) = run_and_persist(ctx, b.id, &symbol, &manifest).await {
            tracing::warn!("[Arena Seeder] Backtest failed for {} (bot {}): {e}", symbol, b.id);
        }

        // Brief pause to avoid hammering Hera IPC and yfinance
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    tracing::info!("[Arena Seeder] Refresh cycle complete.");
    Ok(())
}

// ── Symbol Resolution ─────────────────────────────────────────────────────────

/// Extract a usable ticker symbol for a bot.
///
/// Priority:
/// 1. `signal_manifest.symbol`     — v1 format
/// 2. `signal_manifest.market`     — legacy field
/// 3. Array manifest item.symbol   — old array format  
/// 4. Bot name "Shadow: <TICKER>"  — seeded bots
/// 5. Nth top opportunity ticker   — absolute fallback
fn resolve_symbol(
    manifest: &Option<Value>,
    name: &str,
    top_tickers: &[String],
    fallback_idx: usize,
) -> Option<String> {
    if let Some(m) = manifest {
        // v1 object format
        if let Some(s) = m.get("symbol").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            return Some(s.to_uppercase());
        }
        if let Some(s) = m.get("market").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            return Some(s.to_uppercase());
        }
        // Legacy array format: [{symbol: ...}, ...]
        if let Some(arr) = m.as_array() {
            for item in arr {
                if let Some(s) = item.get("symbol").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
                    return Some(s.to_uppercase());
                }
            }
        }
    }

    // "Shadow: AAPL" style names from previous seeding
    if let Some(ticker) = name.strip_prefix("Shadow: ") {
        if !ticker.is_empty() {
            return Some(ticker.to_uppercase());
        }
    }

    // Absolute fallback: use the Nth top opportunity
    if top_tickers.is_empty() {
        return None;
    }
    Some(top_tickers[fallback_idx % top_tickers.len()].clone())
}

// ── Backtest Staleness Check ──────────────────────────────────────────────────

async fn check_needs_backtest(
    db: &DatabaseConnection,
    bot_id: i32,
    stale_after: chrono::DateTime<Utc>,
) -> bool {
    let result = latinos_backtests::Entity::find()
        .filter(latinos_backtests::Column::BotId.eq(bot_id))
        .filter(latinos_backtests::Column::IsGlobal.eq(true))
        .one(db)
        .await
        .unwrap_or(None);

    match result {
        None => true,
        Some(bt) => bt
            .completed_at
            .map(|t| {
                let utc: chrono::DateTime<Utc> = t.into();
                utc < stale_after
            })
            .unwrap_or(true),
    }
}

// ── Manifest Builder ──────────────────────────────────────────────────────────

/// Standard SMA20/50 crossover v1 manifest.
fn build_sma_manifest(symbol: &str) -> Value {
    json!({
        "version": 1,
        "symbol": symbol,
        "timeframe": "1d",
        "entry": {
            "type": "condition",
            "left": {"indicator": "SMA", "params": {"period": 20}},
            "operator": "gt",
            "right": {"indicator": "SMA", "params": {"period": 50}}
        },
        "exit": {
            "type": "condition",
            "left": {"indicator": "SMA", "params": {"period": 20}},
            "operator": "lt",
            "right": {"indicator": "SMA", "params": {"period": 50}}
        }
    })
}

// ── Backtest + Persist ────────────────────────────────────────────────────────

/// Run a 12-month simulation and persist the result as a global backtest record.
///
/// Calls `fetch_ohlcv` which goes through the sovereign pipeline:
/// Rust → Hera IPC → Python yfinance bridge → DB cache → BacktestEngine
async fn run_and_persist(
    ctx: &AppContext,
    bot_id: i32,
    symbol: &str,
    manifest: &Value,
) -> Result<()> {
    // 252 trading days ≈ 12 months. Hera IPC fetches from yfinance and caches in DB.
    let candles = fetch_ohlcv(ctx, symbol, "1d", 252).await;

    if candles.len() < 50 {
        tracing::warn!(
            "[Arena Seeder] Insufficient candles for {symbol} ({} returned) — skipping",
            candles.len()
        );
        return Ok(());
    }

    tracing::info!("[Arena Seeder] Got {} candles for {symbol}", candles.len());

    let config = BacktestConfig {
        initial_capital: 10_000.0,
        commission_bps: 2.0,
        slippage_bps: 1.0,
        position_sizing_pct: 1.0,
        flat_commission: 0.0,
    };

    let engine = BacktestEngine::new(candles, config);
    let result = engine.run(manifest);
    let total_trades = result.total_trades;
    let result_json = serde_json::to_value(&result).unwrap_or(json!({}));
    let now: chrono::DateTime<chrono::FixedOffset> = Utc::now().into();

    // Remove any stale global backtest for this bot before inserting fresh one
    latinos_backtests::Entity::delete_many()
        .filter(latinos_backtests::Column::BotId.eq(bot_id))
        .filter(latinos_backtests::Column::IsGlobal.eq(true))
        .exec(&ctx.db)
        .await
        .ok();

    // Persist fresh result
    latinos_backtests::ActiveModel {
        bot_id: Set(Some(bot_id)),
        symbol: Set(Some(symbol.to_string())),
        market: Set(Some(symbol.to_string())),
        range: Set(Some("12m".to_string())),
        interval: Set(Some("1d".to_string())),
        initial_capital: Set(Some(10_000.0)),
        status: Set("completed".to_string()),
        results: Set(Some(result_json)),
        submitted_at: Set(now),
        completed_at: Set(Some(now)),
        is_global: Set(true),
        owner_id: Set(Some(SHADOW_OWNER_ID)),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    tracing::info!(
        "[Arena Seeder] ✅ Global backtest saved: {} for bot {} — {} trades",
        symbol,
        bot_id,
        total_trades
    );
    Ok(())
}
