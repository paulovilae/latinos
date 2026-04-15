//! Universe Scanner — Background Worker
//!
//! Runs on a configurable interval, iterates over the research shortlist and
//! any tickers from active bots, requests market research from Hera IPC, and
//! persists the results to `stock_research` + `latinos_opportunities`.
//!
//! Architecture:
//!   - Platform-first: calls `analyze_market_research` via Hera IPC (no direct HTTP)
//!   - Fire-and-forget: launched via `tokio::spawn` from `app.rs`
//!   - Deduplication: skips tickers already researched in the last N hours

use sea_orm::{ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde_json::{json, Value};
use std::time::Duration;
use tracing::{info, warn};

use crate::hera_ipc;
use crate::models::{bot, stock_research};
use crate::models::latinos_opportunities;
use crate::opportunity::score_opportunity;

/// How often to re-scan the universe (in minutes)
const SCAN_INTERVAL_MINUTES: u64 = 60;

/// Minimum hours before re-researching the same ticker
const DEDUPE_HOURS: i64 = 4;

/// Core universe: high-liquidity, high-coverage assets
const CORE_UNIVERSE: &[(&str, &str)] = &[
    ("NVDA", "AI infrastructure leader"),
    ("AAPL", "Consumer tech & services"),
    ("MSFT", "Cloud & enterprise AI"),
    ("TSLA", "EV & energy storage"),
    ("AMZN", "Cloud + ecommerce"),
    ("META", "Social media + AI"),
    ("GOOGL", "Search + cloud + AI"),
    ("AMD", "Semiconductor challenger"),
    ("AVGO", "Network silicon & AI interconnect"),
    ("PLTR", "AI data analytics"),
    ("CRWD", "Cybersecurity AI"),
    ("BTC-USD", "Crypto market leader"),
    ("ETH-USD", "DeFi infrastructure"),
    ("GC=F", "Gold macro hedge"),
    ("CL=F", "Crude oil macro"),
];

/// Entry point: launch the scanner background loop.
/// Call this from `app.rs` after services are initialized.
pub async fn start_universe_scanner(db: DatabaseConnection) {
    tokio::spawn(async move {
        info!("[Scanner] Universe scanner started. Interval: {}m", SCAN_INTERVAL_MINUTES);
        loop {
            run_scan_cycle(&db).await;
            tokio::time::sleep(Duration::from_secs(SCAN_INTERVAL_MINUTES * 60)).await;
        }
    });
}

/// Run one full scan cycle over the universe.
async fn run_scan_cycle(db: &DatabaseConnection) {
    info!("[Scanner] Starting scan cycle...");

    // Build ticker list: Dynamic fetch via Alpaca API + any tickers from active bots
    let mut tickers: Vec<(String, String)> = Vec::new();
    let broker = crate::broker::alpaca::AlpacaClient::new();
    match broker.get_active_assets().await {
        Ok(assets) => {
            // Take the first 50 tradable assets as a dynamic universe sample
            for asset in assets.into_iter().filter(|a| a.tradable).take(50) {
                 tickers.push((asset.symbol.clone(), format!("Dynamic Scanner: {}", asset.name)));
            }
            info!("[Scanner] Fetched {} assets from Alpaca universe", tickers.len());
        },
        Err(e) => {
            warn!("[Scanner] Failed to fetch assets: {}, falling back to CORE_UNIVERSE", e);
            tickers = CORE_UNIVERSE.iter().map(|(t, r)| (t.to_string(), r.to_string())).collect();
        }
    }

    // Augment with tickers from active bots (via their signal manifests)
    if let Ok(bots) = bot::Entity::find()
        .filter(bot::Column::Status.eq("active"))
        .all(db)
        .await
    {
        for b in &bots {
            if let Some(manifest) = &b.signal_manifest {
                if let Some(ticker) = manifest.get("symbol").and_then(|v| v.as_str()) {
                    let reason = format!("Active bot: {}", b.name);
                    if !tickers.iter().any(|(t, _)| t == ticker) {
                        tickers.push((ticker.to_string(), reason));
                    }
                }
            }
        }
    }

    info!("[Scanner] Scanning {} tickers", tickers.len());

    for (ticker, reason) in &tickers {
        match scan_ticker(db, ticker, reason).await {
            Ok(true) => info!("[Scanner] ✅ Scanned {}", ticker),
            Ok(false) => info!("[Scanner] ⏭️  Skipped {} (recent data exists)", ticker),
            Err(e) => warn!("[Scanner] ❌ Failed {}: {}", ticker, e),
        }
        // Small delay between requests to avoid hammering Hera
        tokio::time::sleep(Duration::from_secs(3)).await;
    }

    info!("[Scanner] Scan cycle complete.");
}

/// Scan a single ticker. Returns Ok(true) if scanned, Ok(false) if skipped.
async fn scan_ticker(db: &DatabaseConnection, ticker: &str, reason: &str) -> Result<bool, String> {
    // Deduplication: skip if recently researched
    if is_recently_researched(db, ticker).await {
        return Ok(false);
    }

    // Fetch market research via Hera IPC (platform-first rule)
    let raw_data = fetch_market_research(ticker).await?;

    // Block mock/fake records
    let raw_str = raw_data.to_string().to_lowercase();
    let is_mock = raw_data.get("is_mock").and_then(|v| v.as_bool()).unwrap_or(false);
    if is_mock || raw_str.contains("fmp") || raw_str.contains("mocked") || raw_str.contains("general comprehensive fundamentals") {
        tracing::warn!("[Scanner] Skipping {} because Hera returned mocked/fake data", ticker);
        return Ok(false);
    }

    // Score the opportunity
    let now = chrono::Utc::now();
    let research_date = now.format("%b %d, %Y").to_string();

    // Persist raw research to stock_research table
    let research_record = stock_research::ActiveModel {
        ticker: Set(ticker.to_string()),
        owner_email: Set("scanner@latinos.ai".to_string()),
        source: Set(format!("scanner:{}", reason).chars().take(32).collect()),
        bot_id: Set(None),
        raw_data: Set(raw_data.clone()),
        analysis_summary: Set(extract_summary(&raw_data)),
        research_date: Set(now.into()),
        ..Default::default()
    };

    let inserted = research_record
        .insert(db)
        .await
        .map_err(|e| format!("Failed to insert research for {}: {}", ticker, e))?;

    let research_id = inserted.id;

    // Score and persist opportunity
    let opp = score_opportunity(ticker, research_id, &raw_data, &research_date);
    persist_opportunity(db, &opp).await?;

    Ok(true)
}

/// Check if a ticker was researched within DEDUPE_HOURS.
async fn is_recently_researched(db: &DatabaseConnection, ticker: &str) -> bool {
    let cutoff = chrono::Utc::now() - chrono::Duration::hours(DEDUPE_HOURS);

    stock_research::Entity::find()
        .filter(stock_research::Column::Ticker.eq(ticker))
        .filter(stock_research::Column::ResearchDate.gt(cutoff))
        .order_by_desc(stock_research::Column::ResearchDate)
        .one(db)
        .await
        .map(|r| r.is_some())
        .unwrap_or(false)
}

/// Fetch market research from Hera IPC using the analyze_market_research tool.
async fn fetch_market_research(ticker: &str) -> Result<Value, String> {
    hera_ipc::execute_tool(
        "consultant_report_analyzer",
        json!({
            "ticker": ticker,
            "focus": "General comprehensive fundamentals and technicals. Please explicitly outline key valuation hints (e.g. forward P/E, DCF margin bounds) and evaluate recent volume data trends."
        }),
    )
    .await
    .or_else(|e| {
        // Fallback: if Hera is down, return minimal skeleton so we don't fail entirely
        warn!("[Scanner] Hera IPC failed for {}: {}. Using skeleton.", ticker, e);
        Ok(json!({
            "ticker": ticker,
            "error": e,
            "source": "scanner_fallback"
        }))
    })
}

/// Extract a one-line summary from raw research data.
fn extract_summary(data: &Value) -> String {
    data.get("investment_thesis")
        .or_else(|| data.get("summary"))
        .or_else(|| data.get("analysis_summary"))
        .and_then(|v| v.as_str())
        .map(|s| s.chars().take(500).collect())
        .unwrap_or_else(|| "Auto-scanned opportunity".to_string())
}

/// Persist a scored opportunity to the latinos_opportunities table (upsert by ticker+date).
async fn persist_opportunity(
    db: &DatabaseConnection,
    opp: &crate::opportunity::Opportunity,
) -> Result<(), String> {
    use sea_orm::ActiveValue::Set;

    // Check for existing record for this ticker today
    let today = chrono::Utc::now().format("%b %d, %Y").to_string();

    let existing = latinos_opportunities::Entity::find()
        .filter(latinos_opportunities::Column::Ticker.eq(&opp.ticker))
        .filter(latinos_opportunities::Column::ResearchDate.eq(&today))
        .one(db)
        .await
        .ok()
        .flatten();

    if let Some(record) = existing {
        // Update existing
        let mut active: latinos_opportunities::ActiveModel = record.into();
        active.score = Set(opp.score as i32);
        active.confidence_score = Set(opp.confidence_score as f32);
        active.stance = Set(opp.stance.clone());
        active.thesis = Set(opp.thesis.clone());
        active.catalysts = Set(json!(opp.catalysts));
        active.risks = Set(json!(opp.risks));
        active.key_metrics = Set(serde_json::to_value(&opp.key_metrics).unwrap_or_default());
        active.disqualifier_flags = Set(json!(opp.disqualifier_flags));
        active.catalyst_windows = Set(json!(opp.catalyst_windows));
        active
            .update(db)
            .await
            .map_err(|e| format!("Failed to update opportunity for {}: {}", opp.ticker, e))?;
    } else {
        // Insert new
        latinos_opportunities::ActiveModel {
            ticker: Set(opp.ticker.clone()),
            research_id: Set(opp.research_id),
            score: Set(opp.score as i32),
            confidence_score: Set(opp.confidence_score as f32),
            stance: Set(opp.stance.clone()),
            thesis: Set(opp.thesis.clone()),
            catalysts: Set(json!(opp.catalysts)),
            risks: Set(json!(opp.risks)),
            key_metrics: Set(serde_json::to_value(&opp.key_metrics).unwrap_or_default()),
            disqualifier_flags: Set(json!(opp.disqualifier_flags)),
            catalyst_windows: Set(json!(opp.catalyst_windows)),
            research_date: Set(opp.research_date.clone()),
            ..Default::default()
        }
        .insert(db)
        .await
        .map_err(|e| format!("Failed to insert opportunity for {}: {}", opp.ticker, e))?;
    }

    Ok(())
}
