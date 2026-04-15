//! Opportunity scorer — maps real yfinance research data to actionable opportunities.
//!
//! Data structure comes from `market_research.py` which uses yfinance.
//! Top-level keys: ticker, asset_identity, quantitative_metrics,
//!                 technical_indicators, analyst_data, catalysts_and_news
//!
//! Scoring dimensions (each 0-20):
//! 1. Momentum   — trend + price vs moving averages
//! 2. Analyst    — recommendation_key + target upside
//! 3. Catalysts  — recent headlines count + quality
//! 4. Fundamentals — P/E, revenue growth, margins
//! 5. Risk profile — beta, short ratio

use serde_json::Value;

/// A scored opportunity derived from a research entry.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Opportunity {
    pub ticker: String,
    pub research_id: i32,
    pub score: u8,
    pub stance: String,
    pub thesis: String,
    pub catalysts: Vec<String>,
    pub risks: Vec<String>,
    pub key_metrics: OpportunityMetrics,
    pub disqualifier_flags: Vec<String>,
    pub catalyst_windows: Vec<String>,
    pub confidence_score: f64,
    pub research_date: String,
}

#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
pub struct OpportunityMetrics {
    pub pe_ratio: Option<f64>,
    pub market_cap: Option<String>,
    pub beta: Option<f64>,
    pub dividend_yield: Option<String>,
    pub revenue_growth: Option<String>,
    pub analyst_rating: Option<String>,
    pub target_price: Option<f64>,
    pub current_price: Option<f64>,
}

/// Primary entry point — score a ticker given its raw_data from stock_research.
pub fn score_opportunity(
    ticker: &str,
    research_id: i32,
    raw_data: &Value,
    research_date: &str,
) -> Opportunity {
    // Guard: skip if explicitly flagged as mock by Hera
    let is_mock = raw_data.get("is_mock").and_then(|v| v.as_bool()).unwrap_or(false);
    if is_mock {
        return Opportunity {
            ticker: ticker.to_string(),
            research_id,
            score: 0,
            stance: "hold".to_string(),
            thesis: "Research pending — no live data feed configured.".to_string(),
            catalysts: vec![],
            risks: vec!["Live data feed not configured.".to_string()],
            key_metrics: OpportunityMetrics::default(),
            disqualifier_flags: vec!["missing_data".to_string()],
            catalyst_windows: vec![],
            confidence_score: 0.0,
            research_date: research_date.to_string(),
        };
    }

    // ── Score each dimension ──────────────────────────────────────────────────
    let momentum     = score_momentum(raw_data);
    let analyst      = score_analyst_consensus(raw_data);
    let (cat_score, catalysts) = score_catalysts(raw_data);
    let fundamentals = score_fundamentals(raw_data);
    let risk_score   = score_risk(raw_data);

    let total = (momentum + analyst + cat_score + fundamentals + risk_score).clamp(0.0, 100.0);
    let clamped_score = total as u8;

    let stance       = determine_stance(clamped_score, raw_data);
    let thesis       = extract_thesis(raw_data, ticker);
    let risks        = extract_risks(raw_data);
    let key_metrics  = extract_metrics(raw_data);
    let disqualifier_flags = build_disqualifiers(&key_metrics, clamped_score);
    let catalyst_windows = extract_catalyst_windows(raw_data);

    // Confidence penalises missing fields
    let mut confidence_score = 100.0_f64;
    if key_metrics.pe_ratio.is_none()      { confidence_score -= 10.0; }
    if key_metrics.beta.is_none()          { confidence_score -= 5.0; }
    if key_metrics.current_price.is_none() { confidence_score -= 10.0; }
    if catalysts.is_empty()               { confidence_score -= 15.0; }

    Opportunity {
        ticker: ticker.to_string(),
        research_id,
        score: clamped_score,
        stance,
        thesis,
        catalysts,
        risks,
        key_metrics,
        disqualifier_flags,
        catalyst_windows,
        confidence_score: confidence_score.clamp(0.0, 100.0),
        research_date: research_date.to_string(),
    }
}

// ── Scoring functions ─────────────────────────────────────────────────────────

/// Momentum: price vs 50-day/200-day MA, recent price change.
fn score_momentum(data: &Value) -> f64 {
    let mut score = 10.0_f64;

    let tech = data.get("technical_indicators").or_else(|| data.get("technical_analysis"));

    if let Some(t) = tech {
        let price = t.get("current_price").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let ma50  = t.get("fifty_day_average").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let ma200 = t.get("two_hundred_day_average").and_then(|v| v.as_f64()).unwrap_or(0.0);

        if price > 0.0 && ma50 > 0.0 {
            if price > ma50 * 1.05 { score += 5.0; }
            else if price > ma50   { score += 2.0; }
            else if price < ma50 * 0.95 { score -= 4.0; }
        }
        if price > 0.0 && ma200 > 0.0 {
            if price > ma200 { score += 3.0; }
            else { score -= 2.0; }
        }

        // 52-week high proximity
        let high52 = t.get("fifty_two_week_high").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let low52  = t.get("fifty_two_week_low").and_then(|v| v.as_f64()).unwrap_or(0.0);
        if price > 0.0 && high52 > low52 {
            let range_pct = (price - low52) / (high52 - low52);
            if range_pct > 0.8 { score += 2.0; }  // Near 52w high = momentum
        }
    }

    score.clamp(0.0, 20.0)
}

/// Analyst consensus: uses yfinance recommendation_key + target upside.
fn score_analyst_consensus(data: &Value) -> f64 {
    let mut score = 10.0_f64;

    let analyst = data.get("analyst_data");

    if let Some(a) = analyst {
        // recommendation_key values: "strong_buy", "buy", "hold", "sell", "strong_sell"
        let key = a.get("recommendation_key").and_then(|v| v.as_str()).unwrap_or("hold");
        score = match key {
            "strong_buy"  => 18.0,
            "buy"         => 15.0,
            "hold"        => 10.0,
            "underperform"=> 6.0,
            "sell"        | "strong_sell" => 3.0,
            _ => 10.0,
        };

        // Target price upside
        let current = data
            .get("technical_indicators")
            .and_then(|t| t.get("current_price"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let target  = a.get("target_mean_price").and_then(|v| v.as_f64()).unwrap_or(0.0);
        if current > 0.0 && target > 0.0 {
            let upside = (target - current) / current * 100.0;
            score += (upside * 0.15).clamp(-3.0, 3.0);
        }
    }

    score.clamp(0.0, 20.0)
}

/// Catalysts: count of real recent headlines from yfinance news.
fn score_catalysts(data: &Value) -> (f64, Vec<String>) {
    let mut catalysts = Vec::new();
    let mut score = 5.0_f64;

    if let Some(can) = data.get("catalysts_and_news") {
        // recent_headlines is an array of objects with title, publisher, etc.
        if let Some(headlines) = can.get("recent_headlines").and_then(|h| h.as_array()) {
            let count = headlines.len();
            score = (5.0 + count as f64 * 2.5).min(16.0);

            for item in headlines.iter().take(5) {
                if let Some(title) = item.get("title").and_then(|t| t.as_str()) {
                    catalysts.push(title.to_string());
                }
            }
        }
    }

    (score.clamp(0.0, 20.0), catalysts)
}

/// Fundamentals: P/E, revenue growth, profit margins from quantitative_metrics.
fn score_fundamentals(data: &Value) -> f64 {
    let mut score = 10.0_f64;

    if let Some(qm) = data.get("quantitative_metrics") {
        // Trailing P/E
        let pe = qm.get("trailing_pe")
            .or_else(|| qm.get("forward_pe"))
            .and_then(|v| v.as_f64());

        if let Some(p) = pe {
            if p > 0.0 && p < 15.0      { score += 4.0; }  // Value
            else if p < 25.0            { score += 2.0; }  // Fair
            else if p >= 50.0           { score -= 3.0; }  // Very expensive
        }

        // Revenue growth (yfinance returns fraction: 0.732 = 73.2%)
        let rev_growth = qm.get("revenue_growth").and_then(|v| v.as_f64());
        if let Some(g) = rev_growth {
            let pct = g * 100.0;
            score += (pct * 0.08).clamp(-4.0, 6.0);
        }

        // Profit margins
        let margins = qm.get("profit_margins").and_then(|v| v.as_f64());
        if let Some(m) = margins {
            if m > 0.20 { score += 2.0; }
            else if m < 0.0 { score -= 2.0; }
        }
    }

    score.clamp(0.0, 20.0)
}

/// Risk: beta from technical_indicators + earnings growth for upside confidence.
fn score_risk(data: &Value) -> f64 {
    let mut score = 14.0_f64;

    let beta = data
        .get("technical_indicators")
        .and_then(|t| t.get("beta"))
        .and_then(|v| v.as_f64());

    if let Some(b) = beta {
        if b < 0.0       { score -= 4.0; }  // Inverse — unpredictable
        else if b < 0.8  { score += 4.0; }  // Defensive
        else if b < 1.2  { score += 1.0; }  // Moderate
        else if b > 1.5  { score -= 4.0; }  // High volatility
        else if b > 1.2  { score -= 2.0; }
    }

    // Short ratio: high = crowded short, could squeeze or collapse
    let short_ratio = data
        .get("technical_indicators")
        .and_then(|t| t.get("short_ratio"))
        .and_then(|v| v.as_f64());

    if let Some(sr) = short_ratio {
        if sr > 5.0 { score -= 2.0; }
    }

    score.clamp(0.0, 20.0)
}

// ── Extraction helpers ────────────────────────────────────────────────────────

fn determine_stance(score: u8, _data: &Value) -> String {
    match score {
        75..=100 => "strong_buy".to_string(),
        60..=74  => "buy".to_string(),
        45..=59  => "hold".to_string(),
        30..=44  => "underperform".to_string(),
        _        => "sell".to_string(),
    }
}

fn extract_thesis(data: &Value, ticker: &str) -> String {
    // Try asset_identity.business_summary (real company description)
    if let Some(summary) = data
        .get("asset_identity")
        .and_then(|a| a.get("business_summary"))
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
    {
        let short: String = summary.chars().take(400).collect();
        return short;
    }

    // Fall back to analyst overview if summary missing
    if let Some(analyst) = data.get("analyst_data") {
        let rec = analyst.get("recommendation_key").and_then(|v| v.as_str()).unwrap_or("hold");
        let opinions = analyst.get("number_of_analyst_opinions").and_then(|v| v.as_i64()).unwrap_or(0);
        if opinions > 0 {
            return format!("{ticker}: {rec} consensus across {opinions} analysts.");
        }
    }

    format!("{ticker}: Market intelligence available — see full research.")
}

fn extract_risks(data: &Value) -> Vec<String> {
    let mut risks = Vec::new();

    // Build real risk signals from quantitative data
    if let Some(qm) = data.get("quantitative_metrics") {
        let pe = qm.get("trailing_pe").and_then(|v| v.as_f64());
        if pe.map(|p| p > 50.0).unwrap_or(false) {
            risks.push("High P/E ratio — premium valuation at risk from earnings miss.".to_string());
        }
    }

    if let Some(t) = data.get("technical_indicators") {
        let beta = t.get("beta").and_then(|v| v.as_f64());
        if beta.map(|b| b > 1.5).unwrap_or(false) {
            risks.push("High beta — above-average sensitivity to market drawdowns.".to_string());
        }
        let price = t.get("current_price").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let high52 = t.get("fifty_two_week_high").and_then(|v| v.as_f64()).unwrap_or(0.0);
        if price > 0.0 && high52 > 0.0 && (price / high52) < 0.8 {
            risks.push("Trading significantly below 52-week high — momentum deterioration.".to_string());
        }
    }

    // Short ratio risk
    if let Some(sr) = data
        .get("technical_indicators")
        .and_then(|t| t.get("short_ratio"))
        .and_then(|v| v.as_f64())
    {
        if sr > 5.0 {
            risks.push(format!("Short ratio of {sr:.1} days — elevated short interest."));
        }
    }

    if risks.is_empty() {
        risks.push("No major risk signals detected from available data.".to_string());
    }

    risks
}

fn extract_metrics(data: &Value) -> OpportunityMetrics {
    let qm = data.get("quantitative_metrics");
    let ti = data.get("technical_indicators");
    let ad = data.get("analyst_data");

    let market_cap_str = qm.and_then(|q| q.get("market_cap")).and_then(|v| v.as_f64()).map(|mc| {
        if mc >= 1_000_000_000_000.0 {
            format!("{:.1}T", mc / 1_000_000_000_000.0)
        } else if mc >= 1_000_000_000.0 {
            format!("{:.1}B", mc / 1_000_000_000.0)
        } else if mc >= 1_000_000.0 {
            format!("{:.0}M", mc / 1_000_000.0)
        } else {
            format!("{mc:.0}")
        }
    });

    let dividend_yield_str = qm.and_then(|q| q.get("dividend_yield")).and_then(|v| v.as_f64()).map(|dy| {
        // yfinance returns fraction: 0.012 = 1.2%
        let pct = if dy > 1.0 { dy } else { dy * 100.0 };
        format!("{pct:.1}%")
    });

    let revenue_growth_str = qm.and_then(|q| q.get("revenue_growth")).and_then(|v| v.as_f64()).map(|rg| {
        let pct = if rg.abs() > 1.0 { rg } else { rg * 100.0 };
        format!("{pct:.1}%")
    });

    OpportunityMetrics {
        pe_ratio: qm.and_then(|q| {
            q.get("trailing_pe").or_else(|| q.get("forward_pe")).and_then(|v| v.as_f64())
        }),
        market_cap: market_cap_str,
        beta: ti.and_then(|t| t.get("beta")).and_then(|v| v.as_f64()),
        dividend_yield: dividend_yield_str,
        revenue_growth: revenue_growth_str,
        analyst_rating: ad.and_then(|a| {
            a.get("recommendation_key").and_then(|v| v.as_str()).map(|s| s.replace('_', " ").to_uppercase())
        }),
        target_price: ad.and_then(|a| a.get("target_mean_price")).and_then(|v| v.as_f64()),
        current_price: ti.and_then(|t| t.get("current_price")).and_then(|v| v.as_f64()),
    }
}

fn build_disqualifiers(metrics: &OpportunityMetrics, score: u8) -> Vec<String> {
    let mut flags = Vec::new();
    if let Some(mc) = &metrics.market_cap {
        if mc.contains('M') && !mc.contains("00M") {
            flags.push("market_cap_under_500m".to_string());
        }
    }
    if score < 30 {
        flags.push("below_minimum_score".to_string());
    }
    flags
}

fn extract_catalyst_windows(data: &Value) -> Vec<String> {
    let mut windows = Vec::new();

    if let Some(can) = data.get("catalysts_and_news") {
        if let Some(events) = can.get("upcoming_events").and_then(|v| v.as_array()) {
            for d in events.iter().take(5) {
                let date = d.get("date").and_then(|v| v.as_str()).unwrap_or("");
                let desc = d.get("description").and_then(|v| v.as_str()).unwrap_or("Event");
                if !date.is_empty() {
                    windows.push(format!("{date}: {desc}"));
                }
            }
        }
    }

    windows
}
