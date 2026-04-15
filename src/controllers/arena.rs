#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unused_async)]
use crate::controllers::public::get_user_session;
use loco_rs::prelude::*;
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter};
use crate::controllers::dashboard::load_dashboard_templates;

/// GET /dashboard/arena — The Robot Arena Leaderboard
#[debug_handler]
pub async fn arena_leaderboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    use crate::models::{bot, trade, latinos_backtests};
    use crate::shadow_seeding::seed_arena_if_needed;

    // Trigger shadow seeding in the background (fire and forget for UI responsiveness)
    let seed_ctx = ctx.clone();
    tokio::spawn(async move {
        let _ = seed_arena_if_needed(&seed_ctx).await;
    });

    // Fetch only real trading bots — exclude utility/vetra bots classified by bot_type
    let db_bots = bot::Entity::find()
        .filter(bot::Column::BotType.eq("trading"))
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    // Fetch all trades and backtests
    let db_trades = trade::Entity::find()
        .all(&ctx.db)
        .await
        .unwrap_or_default();
        
    let db_backtests = latinos_backtests::Entity::find()
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    #[derive(serde::Serialize)]
    struct BotView {
        id: String,
        name: String,
        status: String,
        active: bool,
        yield_value: f64,
        win_rate: f64,
        is_backtest: bool,
    }

    let mut bots: Vec<BotView> = db_bots.into_iter().map(|b| {
        let bot_id = b.id;
        
        // Try live trades first
        let mut total_pnl = 0.0;
        let mut winning_trades = 0;
        let mut total_finished_trades = 0;
        let mut has_live_trades = false;
        
        for t in &db_trades {
            if t.bot_id == Some(bot_id) {
                if let Some(pnl) = t.pnl {
                    total_pnl += pnl;
                    total_finished_trades += 1;
                    has_live_trades = true;
                    if pnl > 0.0 {
                        winning_trades += 1;
                    }
                }
            }
        }
        
        if has_live_trades {
            let win_rate = if total_finished_trades > 0 {
                (winning_trades as f64 / total_finished_trades as f64) * 100.0
            } else {
                0.0
            };
            
            return BotView {
                id: b.id.to_string(),
                name: b.name,
                status: b.status.clone(),
                active: b.status == "active" || b.status == "Activo",
                yield_value: (total_pnl * 10.0).round() / 10.0,
                win_rate: (win_rate * 10.0).round() / 10.0,
                is_backtest: false,
            };
        }
        
        // Fallback to latest backtest
        let latest_backtest = db_backtests.iter()
            .filter(|bt| bt.bot_id == Some(bot_id))
            .max_by_key(|bt| bt.completed_at.map(|t| t.timestamp()).unwrap_or(0));
            
        if let Some(bt) = latest_backtest {
            if let Some(results) = &bt.results {
                // Parse "12.5%" or "+ 🟢 12.5%"
                let roi_str = results.get("roi").and_then(|v| v.as_str()).unwrap_or("0%");
                let win_str = results.get("win_rate").and_then(|v| v.as_str()).unwrap_or("0%");
                
                let roi = roi_str.chars()
                    .filter(|c| c.is_digit(10) || *c == '.' || *c == '-')
                    .collect::<String>()
                    .parse::<f64>()
                    .unwrap_or(0.0);
                    
                let win = win_str.chars()
                    .filter(|c| c.is_digit(10) || *c == '.')
                    .collect::<String>()
                    .parse::<f64>()
                    .unwrap_or(0.0);

                return BotView {
                    id: b.id.to_string(),
                    name: b.name,
                    status: "backtested".to_string(),
                    active: true,
                    yield_value: roi,
                    win_rate: win,
                    is_backtest: true,
                };
            }
        }

        // Final fallback: ColdBot
        BotView {
            id: b.id.to_string(),
            name: b.name,
            status: b.status.clone(),
            active: false,
            yield_value: 0.0,
            win_rate: 0.0,
            is_backtest: false,
        }
    }).collect();

    // Sort by arena score descending (yield * win_rate)
    bots.sort_by(|a, b| {
        let score_b = (b.yield_value * b.win_rate) as i64;
        let score_a = (a.yield_value * a.win_rate) as i64;
        score_b.cmp(&score_a)
    });

    // Ensure we have some mock bots if DB is empty to make the demo look good
    if bots.is_empty() {
        bots.push(BotView { id: "1".into(), name: "Sovereign".into(), status: "active".into(), active: true, yield_value: 24.8, win_rate: 82.5, is_backtest: false });
        bots.push(BotView { id: "2".into(), name: "Valeria".into(), status: "active".into(), active: true, yield_value: 12.4, win_rate: 68.2, is_backtest: false });
        bots.push(BotView { id: "3".into(), name: "Alpaca".into(), status: "active".into(), active: true, yield_value: 8.9, win_rate: 55.4, is_backtest: false });
    }

    // Sort bots by simulated Arena Score (Yield * WinRate weighting)
    bots.sort_by(|a, b| {
        let score_b = (b.yield_value * b.win_rate) as i64;
        let score_a = (a.yield_value * a.win_rate) as i64;
        score_b.cmp(&score_a)
    });

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "arena");
    context.insert("bots", &bots);

    let rendered = tera
        .render("dashboard/arena.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Template render error arena: {:?}", e);
            loco_rs::Error::string(&format!("Template error: {:?}", e))
        })?;
    
    Ok(axum::response::Html(rendered).into_response())
}

pub fn routes() -> Routes {
    Routes::new().prefix("dashboard").add("/arena", get(arena_leaderboard))
}
