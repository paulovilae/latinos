//! Market data service — fetches and stores OHLCV candle data via Hera IPC.
//!
//! Uses the `load_market_data` Hera tool to pull real OHLCV from data providers,
//! then upserts into `latinos_market_data` with deduplication on (symbol, interval, ts).

use crate::models::market_data;
use loco_rs::prelude::*;
use sea_orm::{ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect};
use serde_json::json;

/// Represents a single OHLCV candle returned from the fetcher.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Candle {
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
    pub ts: String,
}

/// Fetch recent OHLCV data for a symbol via Hera IPC tool, fallback to DB cache.
///
/// This function:
/// 1. Tries to call the `load_market_data` Hera tool for fresh data
/// 2. If Hera returns data, stores it in the DB (upsert)
/// 3. If Hera fails, falls back to cached DB data
/// 4. Returns a vector of candles ordered by timestamp ascending
pub async fn fetch_ohlcv(
    ctx: &AppContext,
    symbol: &str,
    interval: &str,
    limit: u64,
) -> Vec<Candle> {
    // Try Hera tool first
    let sym_upper = symbol.to_uppercase();
    match crate::hera_ipc::execute_tool(
        "load_market_data",
        json!({
            "symbol": sym_upper,
            "interval": interval,
            "limit": limit,
        }),
    )
    .await
    {
        Ok(data) => {
            // Hera returns result as a JSON *string* — parse it into a Value first
            let parsed_value: serde_json::Value = if let Some(s) = data.as_str() {
                serde_json::from_str(s).unwrap_or(data.clone())
            } else {
                data.clone()
            };

            if let Some(candles_array) = parsed_value.as_array() {
                let parsed: Vec<Candle> = candles_array
                    .iter()
                    .filter_map(|item| serde_json::from_value(item.clone()).ok())
                    .collect();
                if !parsed.is_empty() {
                    // Store in DB for caching (fire-and-forget)
                    let db = ctx.db.clone();
                    let sym = sym_upper.clone();
                    let intv = interval.to_string();
                    let candles = parsed.clone();
                    tokio::spawn(async move {
                        store_candles(&db, &sym, &intv, &candles).await;
                    });
                    return parsed;
                }
            }
            tracing::warn!(
                "load_market_data returned unparseable data for {} (raw: {:?})",
                sym_upper,
                data.as_str().map(|s| &s[..s.len().min(100)])
            );

        }
        Err(error) => {
            tracing::warn!(
                "Hera load_market_data failed for {}: {} — trying direct bridge",
                sym_upper,
                error
            );
        }
    }

    // Secondary: direct Python bridge subprocess (bypasses Hera when IPC is slow/down)
    if let Some(candles) = fetch_via_bridge(&sym_upper, interval, limit).await {
        if !candles.is_empty() {
            let db = ctx.db.clone();
            let sym = sym_upper.clone();
            let intv = interval.to_string();
            let c = candles.clone();
            tokio::spawn(async move { store_candles(&db, &sym, &intv, &c).await });
            return candles;
        }
    }

    // Fallback: read from DB cache
    load_cached_candles(ctx, &sym_upper, interval, limit).await
}

/// Load cached candles from the database.
async fn load_cached_candles(
    ctx: &AppContext,
    symbol: &str,
    interval: &str,
    limit: u64,
) -> Vec<Candle> {
    let rows = market_data::Entity::find()
        .filter(market_data::Column::Symbol.eq(symbol))
        .filter(market_data::Column::Interval.eq(interval))
        .order_by_desc(market_data::Column::Ts)
        .limit(limit)
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    rows.into_iter()
        .rev() // Reverse so oldest is first
        .map(|row| Candle {
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            ts: row.ts.to_rfc3339(),
        })
        .collect()
}

/// DB-only candle fetch — does NOT call Hera. Used by shadow_seeding to avoid
/// circular dependencies when a full AppContext is not available.
pub async fn fetch_ohlcv_db_only(
    db: &sea_orm::DatabaseConnection,
    symbol: &str,
    interval: &str,
    limit: u64,
) -> Vec<Candle> {
    let sym_upper = symbol.to_uppercase();
    let rows = market_data::Entity::find()
        .filter(market_data::Column::Symbol.eq(&sym_upper))
        .filter(market_data::Column::Interval.eq(interval))
        .order_by_desc(market_data::Column::Ts)
        .limit(limit)
        .all(db)
        .await
        .unwrap_or_default();

    rows.into_iter()
        .rev()
        .map(|row| Candle {
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            ts: row.ts.to_rfc3339(),
        })
        .collect()
}

/// Direct Python bridge call — bypasses Hera IPC entirely.
///
/// Calls `latinos_bridge.py load_market_data` as a subprocess.
/// Used as a secondary fallback when Hera is unavailable or slow.
async fn fetch_via_bridge(symbol: &str, interval: &str, limit: u64) -> Option<Vec<Candle>> {
    let script = "/home/paulo/Programs/apps/OS/Tools/apps/latinos/scripts/latinos_bridge.py";
    let sym = symbol.to_string();
    let intv = interval.to_string();

    let result = tokio::task::spawn_blocking(move || {
        std::process::Command::new("python3")
            .args([
                script,
                "load_market_data",
                "--symbol", &sym,
                "--interval", &intv,
                "--limit", &limit.to_string(),
            ])
            .output()
    })
    .await;

    let output = match result {
        Ok(Ok(out)) => out,
        Ok(Err(e)) => {
            tracing::warn!("[Bridge] IO error for {}: {}", symbol, e);
            return None;
        }
        Err(e) => {
            tracing::warn!("[Bridge] spawn_blocking JoinError for {}: {}", symbol, e);
            return None;
        }
    };

    if output.status.success() {
        let raw = String::from_utf8_lossy(&output.stdout);
        match serde_json::from_str::<Vec<Candle>>(raw.trim()) {
            Ok(candles) => {
                tracing::info!(
                    "[Bridge] Fetched {} candles for {} via direct subprocess",
                    candles.len(), symbol
                );
                Some(candles)
            }
            Err(e) => {
                tracing::warn!("[Bridge] Parse error for {}: {}", symbol, e);
                None
            }
        }
    } else {
        let err = String::from_utf8_lossy(&output.stderr);
        tracing::warn!("[Bridge] Script error for {}: {}", symbol, &err[..err.len().min(200)]);
        None
    }
}


/// Store candles in the database with upsert semantics.
async fn store_candles(
    db: &sea_orm::DatabaseConnection,
    symbol: &str,
    interval: &str,
    candles: &[Candle],
) {
    for candle in candles {
        let ts = match chrono::DateTime::parse_from_rfc3339(&candle.ts) {
            Ok(parsed) => parsed.fixed_offset(),
            Err(_) => {
                tracing::warn!("Skipping candle with invalid timestamp: {}", candle.ts);
                continue;
            }
        };

        // Check if exists
        let exists = market_data::Entity::find()
            .filter(market_data::Column::Symbol.eq(symbol))
            .filter(market_data::Column::Interval.eq(interval))
            .filter(market_data::Column::Ts.eq(ts))
            .one(db)
            .await
            .ok()
            .flatten();

        if let Some(existing) = exists {
            // Update existing candle
            let mut active: market_data::ActiveModel = existing.into();
            active.open = Set(candle.open);
            active.high = Set(candle.high);
            active.low = Set(candle.low);
            active.close = Set(candle.close);
            active.volume = Set(candle.volume);
            let _ = active.update(db).await;
        } else {
            // Insert new candle
            let _ = market_data::ActiveModel {
                symbol: Set(symbol.to_string()),
                interval: Set(interval.to_string()),
                open: Set(candle.open),
                high: Set(candle.high),
                low: Set(candle.low),
                close: Set(candle.close),
                volume: Set(candle.volume),
                ts: Set(ts),
                ..Default::default()
            }
            .insert(db)
            .await;
        }
    }
}

/// Quick technical snapshot for a symbol — computes from recent candles.
///
/// Returns: (price, change_pct, avg_volume, volatility_pct, trend_label)
pub fn compute_technical_snapshot(candles: &[Candle]) -> TechnicalSnapshot {
    if candles.is_empty() {
        return TechnicalSnapshot::default();
    }

    let last = candles.last().unwrap();
    let price = last.close;

    // Change % over period
    let first = candles.first().unwrap();
    let change_pct = if first.close > 0.0 {
        ((price - first.close) / first.close) * 100.0
    } else {
        0.0
    };

    // Average volume
    let avg_volume = if !candles.is_empty() {
        candles.iter().map(|c| c.volume).sum::<f64>() / candles.len() as f64
    } else {
        0.0
    };

    // Simple volatility (std dev of daily returns)
    let daily_returns: Vec<f64> = candles
        .windows(2)
        .filter_map(|window| {
            if window[0].close > 0.0 {
                Some((window[1].close - window[0].close) / window[0].close)
            } else {
                None
            }
        })
        .collect();

    let volatility_pct = if daily_returns.len() > 1 {
        let mean = daily_returns.iter().sum::<f64>() / daily_returns.len() as f64;
        let variance =
            daily_returns.iter().map(|r| (r - mean).powi(2)).sum::<f64>()
                / (daily_returns.len() - 1) as f64;
        variance.sqrt() * 100.0
    } else {
        0.0
    };

    // Trend detection via simple moving average crossover
    let trend = if candles.len() >= 20 {
        let sma_short: f64 = candles[candles.len() - 5..].iter().map(|c| c.close).sum::<f64>() / 5.0;
        let sma_long: f64 = candles[candles.len() - 20..].iter().map(|c| c.close).sum::<f64>() / 20.0;
        if sma_short > sma_long * 1.01 {
            "bullish".to_string()
        } else if sma_short < sma_long * 0.99 {
            "bearish".to_string()
        } else {
            "neutral".to_string()
        }
    } else {
        if change_pct > 2.0 {
            "bullish".to_string()
        } else if change_pct < -2.0 {
            "bearish".to_string()
        } else {
            "neutral".to_string()
        }
    };

    TechnicalSnapshot {
        price,
        change_pct,
        avg_volume,
        volatility_pct,
        trend,
    }
}

#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct TechnicalSnapshot {
    pub price: f64,
    pub change_pct: f64,
    pub avg_volume: f64,
    pub volatility_pct: f64,
    pub trend: String,
}
