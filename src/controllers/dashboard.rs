#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unused_async)]
use crate::controllers::public::get_user_session;
use crate::models::backtest;
use crate::models::bot;
use crate::models::stock_research;
use crate::models::trade;
use crate::models::user;
use axum::{
    body::Body,
    http::{header, HeaderValue},
    response::IntoResponse,
};
use loco_rs::prelude::*;
use sea_orm::{
    ActiveValue::Set, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    QuerySelect,
};
use serde_json::json;
use std::collections::BTreeSet;
use tera::Tera;
use tokio_util::io::ReaderStream;

const RESEARCH_SHORTLIST: [(&str, &str, &str); 10] = [
    ("NVDA", "NVDA", "Alta cobertura y liquidez"),
    ("AAPL", "AAPL", "Alta cobertura y liquidez"),
    ("MSFT", "MSFT", "Alta cobertura y liquidez"),
    ("TSLA", "TSLA", "Alta cobertura y liquidez"),
    ("AMZN", "AMZN", "Alta cobertura y liquidez"),
    ("META", "META", "Alta cobertura y liquidez"),
    ("GOOGL", "GOOGL", "Alta cobertura y liquidez"),
    ("AMD", "AMD", "Alta cobertura y liquidez"),
    ("BTC-USD", "Bitcoin", "Cripto líder"),
    ("GC=F", "Gold", "Refugio macro"),
];

pub fn load_dashboard_templates() -> Tera {
    let mut tera = Tera::new("views/**/*.tera").expect("Dashboard templates must compile");

    let shared_base = concat!(env!("CARGO_MANIFEST_DIR"), "/shared/views/shared/");
    let shared_templates = [
        ("public_footer.html.tera", "shared/public_footer.html.tera"),
        ("public_header.html.tera", "shared/public_header.html.tera"),
    ];

    for (file, name) in shared_templates {
        let path = format!("{}{}", shared_base, file);
        if let Err(e) = tera.add_template_file(&path, Some(name)) {
            tracing::error!("Shared template load error for {}: {}", name, e);
        }
    }
    tera
}

/// GET /dashboard — Authenticated user trading dashboard (Tera template)
#[debug_handler]
pub async fn trading_dashboard(
    State(ctx): State<AppContext>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    eprintln!("LATINOS DASHBOARD HIT, PARAMS: {:?}", params);
    if let Some(token) = params.get("imaginos_infra_token").or_else(|| params.get("vilaros_infra_token")) {
        let mut response = axum::response::Redirect::temporary("/dashboard").into_response();
        let cookie = format!("imaginos_infra_token={}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400", token);
        if let Ok(header_val) = cookie.parse::<axum::http::HeaderValue>() {
            response.headers_mut().insert(axum::http::header::SET_COOKIE, header_val);
        }
        return Ok(response);
    }

    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    let bot_count = bot_count_for_email(&ctx, &email).await;

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("bot_count", &bot_count);
    context.insert("active_page", "dashboard");

    let rendered = tera
        .render("dashboard/terminal.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Dashboard template error: {:?}", e);
            loco_rs::Error::string(&format!("Template error: {:?}", e))
        })?;

    Ok(axum::response::Html(rendered).into_response())
}

use axum::{
    extract::Path,
    routing::{delete, post},
};

// NOTE: compile_bot and roast_bot removed — dead concepts with no backend

pub fn routes() -> Routes {
    Routes::new()
        .add("/dashboard", get(trading_dashboard))
        .add("/dashboard/consultant", get(consultant_dashboard))
        .add(
            "/dashboard/consultant/analyze",
            post(consultant_analyze_run),
        )
        .add(
            "/dashboard/consultant/{id}/refresh",
            post(consultant_refresh_research),
        )
        .add(
            "/dashboard/consultant/{id}/delete",
            post(delete_consultant_research),
        )
        .add("/dashboard/bots", get(bots_dashboard))
        .add("/dashboard/bots/{id}", get(bot_details))
        .add("/dashboard/bots/{id}/edit", post(update_bot_formula))
        .add("/dashboard/backtests", get(backtests_dashboard))
        .add("/dashboard/backtests/run", post(backtests_run))
        .add("/dashboard/backtests/{id}", delete(delete_backtest))
        .add("/dashboard/backtests/{id}/pdf", get(backtests_pdf))
        .add("/dashboard/trades", get(trades_dashboard))
        .add("/dashboard/opportunities", get(opportunities_dashboard))
        .add("/dashboard/settings", get(settings_dashboard))
}

#[debug_handler]
pub async fn trades_dashboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };
    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    // ── Tenant isolation: only show trades for the user's bots ──
    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    let user_bot_ids: Vec<i32> = bot::Entity::find()
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .all(&ctx.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|b| b.id)
        .collect();

    let trades = if user_bot_ids.is_empty() {
        Vec::new()
    } else {
        trade::Entity::find()
            .filter(trade::Column::BotId.is_in(user_bot_ids))
            .order_by_desc(trade::Column::Timestamp)
            .all(&ctx.db)
            .await
            .unwrap_or_default()
    };

    let mut total_trades = 0;
    let mut total_pnl = 0.0;
    for trade in &trades {
        total_trades += 1;
        if let Some(pnl) = trade.pnl {
            total_pnl += pnl;
        }
    }

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "trades");
    context.insert("trades", &trades);
    context.insert("total_trades", &total_trades);
    context.insert("total_pnl", &total_pnl);

    let rendered = tera
        .render("dashboard/trades.html.tera", &context)
        .map_err(|e| loco_rs::Error::string(&format!("Template error: {:?}", e)))?;

    Ok(axum::response::Html(rendered).into_response())
}

#[debug_handler]
pub async fn opportunities_dashboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };
    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    use crate::models::{latinos_opportunities, latinos_users};
    use crate::models::_entities::latinos_opportunities::Column as OppColumn;
    use crate::models::_entities::latinos_users::Column as UserColumn;
    use sea_orm::{ColumnTrait, QueryFilter, QueryOrder, QuerySelect, EntityTrait};
    
    // Attempt to get the current user to find their user-scoped opportunities
    let current_user_id = if let Ok(Some(current_user)) = latinos_users::Entity::find()
        .filter(UserColumn::Email.eq(email.to_string()))
        .one(&ctx.db)
        .await
    {
        Some(current_user.id.to_string())
    } else {
        None
    };

    // Load opportunities that are either global_feed or match the current_user visibility_key
    let mut query = latinos_opportunities::Entity::find()
        .order_by_desc(OppColumn::Score)
        .limit(50);
        
    if let Some(uid) = current_user_id {
        use sea_orm::Condition;
        query = query.filter(
            Condition::any()
                .add(OppColumn::VisibilityScope.eq("global_feed"))
                .add(
                    Condition::all()
                        .add(OppColumn::VisibilityScope.eq("user_scoped"))
                        .add(OppColumn::VisibilityKey.eq(uid))
                )
        );
    } else {
        query = query.filter(OppColumn::VisibilityScope.eq("global_feed"));
    }

    let opportunities_models = query.all(&ctx.db).await.unwrap_or_default();

    let opportunities: Vec<crate::opportunity::Opportunity> = opportunities_models
        .into_iter()
        .map(|model| crate::opportunity::Opportunity {
            ticker: model.ticker,
            research_id: model.research_id,
            score: model.score as u8,
            confidence_score: model.confidence_score as f64,
            stance: model.stance,
            thesis: model.thesis,
            catalysts: serde_json::from_value(model.catalysts).unwrap_or_default(),
            risks: serde_json::from_value(model.risks).unwrap_or_default(),
            key_metrics: serde_json::from_value(model.key_metrics).unwrap_or_default(),
            disqualifier_flags: serde_json::from_value(model.disqualifier_flags).unwrap_or_default(),
            catalyst_windows: serde_json::from_value(model.catalyst_windows).unwrap_or_default(),
            research_date: model.research_date.clone(),
        })
        .collect();

    let mut grouped_map: std::collections::HashMap<String, Vec<crate::opportunity::Opportunity>> = std::collections::HashMap::new();
    let mut order: Vec<String> = Vec::new();

    for opp in opportunities.clone() {
        if !grouped_map.contains_key(&opp.ticker) {
            grouped_map.insert(opp.ticker.clone(), Vec::new());
            order.push(opp.ticker.clone());
        }
        grouped_map.get_mut(&opp.ticker).unwrap().push(opp);
    }

    #[derive(serde::Serialize)]
    struct GroupedOpportunity {
        ticker: String,
        latest: crate::opportunity::Opportunity,
        history: Vec<crate::opportunity::Opportunity>,
        history_count: usize,
    }

    let mut grouped_opportunities = Vec::new();
    for ticker in order {
        let mut group = grouped_map.remove(&ticker).unwrap();
        // Sort the group by research_id descending to get the true chronological latest as the face
        group.sort_by(|a, b| b.research_id.cmp(&a.research_id));
        
        let latest = group.remove(0); // The most recent one becomes the face
        let history_count = group.len();
        
        grouped_opportunities.push(GroupedOpportunity {
            ticker,
            latest,
            history: group,
            history_count,
        });
    }

    // Sort grouped opportunities by the latest score descending
    grouped_opportunities.sort_by(|a, b| b.latest.score.cmp(&a.latest.score));

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "opportunities");
    context.insert("grouped_opportunities", &grouped_opportunities);
    context.insert("total_opportunities", &opportunities.len());

    let rendered = tera
        .render("dashboard/opportunities.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Dashboard template error: {:?}", e);
            loco_rs::Error::string(&format!("Template error: {:?}", e))
        })?;

    Ok(axum::response::Html(rendered).into_response())
}

#[derive(serde::Serialize)]
pub struct TradeView {
    pub symbol: String,
    pub side: String,
    pub price: f64,
    pub amount: f64,
    pub status: String,
    pub broker: String,
    pub timestamp: String,
}

#[debug_handler]
pub async fn settings_dashboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };
    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    // Fetch recent simulated paper trades, isolated to the current user!
    let raw_trades = if let Ok(Some(current_user)) = crate::models::_entities::latinos_users::Entity::find()
        .filter(crate::models::_entities::latinos_users::Column::Email.eq(email.to_string()))
        .one(&ctx.db)
        .await
    {
        crate::models::_entities::latinos_trades::Entity::find()
            .filter(crate::models::_entities::latinos_trades::Column::UserId.eq(current_user.id))
            .order_by_desc(crate::models::_entities::latinos_trades::Column::Timestamp)
            .limit(10)
            .all(&ctx.db)
            .await
            .unwrap_or_default()
    } else {
        vec![]
    };
        
    let trades: Vec<TradeView> = raw_trades.into_iter().map(|t| TradeView {
        symbol: t.symbol,
        side: t.side,
        price: t.price,
        amount: t.amount,
        status: t.status,
        broker: t.broker.unwrap_or_else(|| "System".to_string()),
        timestamp: t.timestamp.format("%Y-%m-%d %H:%M").to_string(),
    }).collect();

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "settings");
    context.insert("trades", &trades);
    
    // Broker Connection Status
    let alpaca_mode = std::env::var("ALPACA_MODE").unwrap_or_else(|_| "mock".to_string());
    let broker = crate::broker::alpaca::AlpacaClient::new();
    let mut is_connected = false;
    let mut buying_power = "N/A".to_string();
    if let Ok(account) = broker.get_account().await {
        is_connected = true;
        buying_power = account.buying_power;
    }
    context.insert("alpaca_mode", &alpaca_mode);
    context.insert("broker_connected", &is_connected);
    context.insert("buying_power", &buying_power);

    let rendered = tera
        .render("dashboard/settings.html.tera", &context)
        .map_err(|e| loco_rs::Error::string(&format!("Template error: {:?}", e)))?;

    Ok(axum::response::Html(rendered).into_response())
}

#[derive(serde::Serialize)]
pub struct BotView {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub tags: Option<serde_json::Value>,
}

#[derive(serde::Serialize)]
pub struct ResearchView {
    pub id: i32,
    pub ticker: String,
    pub research_date: String,
    pub research_sort_key: String,
    pub source: String,
    pub bot_id: Option<i32>,
    pub raw_data: Option<serde_json::Value>,
    pub analysis_summary: Option<String>,
}

#[derive(serde::Serialize)]
pub struct SuggestionView {
    pub ticker: String,
    pub label: String,
    pub reason: String,
}

fn normalize_research_payload(payload: serde_json::Value) -> serde_json::Value {
    payload.get("data").cloned().unwrap_or(payload)
}

fn strip_think_blocks(text: &str) -> String {
    let mut output = String::with_capacity(text.len());
    let mut rest = text;

    while let Some(start) = rest.find("<think>") {
        output.push_str(&rest[..start]);
        let after_start = &rest[start + "<think>".len()..];
        if let Some(end) = after_start.find("</think>") {
            rest = &after_start[end + "</think>".len()..];
        } else {
            rest = "";
            break;
        }
    }

    output.push_str(rest);
    output.trim().to_string()
}

fn is_invalid_research_summary(summary: &str) -> bool {
    let lower = summary.to_lowercase();
    lower.contains("imagineos service diagnostic report")
        || lower.contains("healthy (")
        || lower.contains("degraded (")
        || lower.contains("proposed fixes:")
        || lower.contains("root cause hypotheses:")
}

async fn generate_research_summary(
    ticker: &str,
    research_data: &serde_json::Value,
    app_name: &str,
) -> Option<String> {
    let prompt = format!(
        "Resume esta investigacion bursatil para el ticker {ticker}. Responde en espanol en un unico parrafo corto de 80 a 140 palabras. Incluye: tendencia actual, 1 a 2 riesgos, 1 a 2 catalizadores y una sugerencia educativa sobre que vigilar despues. Los catalizadores deben salir solo de catalysts_and_news.recent_headlines y no de ejemplos genericos. Si un titular no se relaciona de forma clara con el activo, ignoralo. No des consejo financiero. Datos: {research_data}",
    );

    match crate::hera_ipc::delegate_to_hera(
        "generate",
        json!({
            "prompt": prompt,
            "app": app_name,
            "max_tokens": 220,
            "temperature": 0.25,
            "permissions": ["__none__"],
        }),
    )
    .await
    {
        Ok(value) => value
            .get("result")
            .and_then(|v| v.as_str())
            .map(strip_think_blocks)
            .filter(|summary| !summary.is_empty() && !is_invalid_research_summary(summary)),
        Err(error) => {
            tracing::warn!(
                "Failed to generate market summary for {}: {}",
                ticker,
                error
            );
            None
        }
    }
}

async fn generate_catalyst_summary(
    ticker: &str,
    headlines: &[serde_json::Value],
    app_name: &str,
) -> Option<String> {
    if headlines.is_empty() {
        return None;
    }

    let prompt = format!(
        "Resume los catalizadores recientes para {ticker} usando solo estos titulares ya filtrados por relevancia. Responde en espanol en 2 frases maximo. En la primera frase explica el tono dominante. En la segunda, liga ese tono al activo y di que deberia vigilar un operador. Si los titulares son mixtos o tangenciales, dilo explicitamente. No inventes datos fuera de los titulares. Titulares: {headlines:?}"
    );

    match crate::hera_ipc::delegate_to_hera(
        "generate",
        json!({
            "prompt": prompt,
            "app": app_name,
            "max_tokens": 140,
            "temperature": 0.2,
            "permissions": ["__none__"],
        }),
    )
    .await
    {
        Ok(value) => value
            .get("result")
            .and_then(|v| v.as_str())
            .map(strip_think_blocks)
            .filter(|summary| !summary.is_empty() && !is_invalid_research_summary(summary)),
        Err(error) => {
            tracing::warn!(
                "Failed to generate catalyst summary for {}: {}",
                ticker,
                error
            );
            None
        }
    }
}

fn fallback_catalyst_summary(headlines: &[serde_json::Value]) -> Option<String> {
    if headlines.is_empty() {
        return None;
    }

    let publishers: Vec<String> = headlines
        .iter()
        .filter_map(|item| item.get("publisher").and_then(|v| v.as_str()))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .take(3)
        .map(ToOwned::to_owned)
        .collect();

    let titles: Vec<String> = headlines
        .iter()
        .filter_map(|item| item.get("title").and_then(|v| v.as_str()))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .take(2)
        .map(ToOwned::to_owned)
        .collect();

    if titles.is_empty() {
        return None;
    }

    let source_text = if publishers.is_empty() {
        "fuentes financieras recientes".to_string()
    } else {
        publishers.join(", ")
    };

    Some(format!(
        "Este resumen se basa solo en titulares filtrados de {}. Los temas que realmente entran en el analisis son {}. Conviene vigilar si estos temas ganan traccion o se diluyen en la proxima sesion.",
        source_text,
        titles.join(" y ")
    ))
}

async fn owner_ids_for_email(ctx: &AppContext, email: &str) -> Vec<i32> {
    user::Entity::find()
        .select_only()
        .column(user::Column::Id)
        .filter(user::Column::Email.eq(email.to_string()))
        .order_by_asc(user::Column::Id)
        .limit(20)
        .into_json()
        .all(&ctx.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .filter_map(|row| row.get("id").and_then(|value| value.as_i64()))
        .filter_map(|id| i32::try_from(id).ok())
        .collect()
}

async fn bot_count_for_email(ctx: &AppContext, email: &str) -> u64 {
    let owner_ids = owner_ids_for_email(ctx, email).await;
    if owner_ids.is_empty() {
        return 0;
    }

    bot::Entity::find()
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .count(&ctx.db)
        .await
        .unwrap_or(0)
}

async fn suggestion_tickers_for_email(ctx: &AppContext, email: &str) -> Vec<String> {
    let owner_ids = owner_ids_for_email(ctx, email).await;
    if owner_ids.is_empty() {
        return Vec::new();
    }

    let bot_ids: Vec<i32> = bot::Entity::find()
        .select_only()
        .column(bot::Column::Id)
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .order_by_asc(bot::Column::Id)
        .into_json()
        .all(&ctx.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .filter_map(|row| row.get("id").and_then(|value| value.as_i64()))
        .filter_map(|id| i32::try_from(id).ok())
        .collect();

    if bot_ids.is_empty() {
        return Vec::new();
    }

    let markets: Vec<String> = backtest::Entity::find()
        .select_only()
        .column(backtest::Column::Market)
        .filter(backtest::Column::BotId.is_in(bot_ids))
        .order_by_asc(backtest::Column::Market)
        .into_json()
        .all(&ctx.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .filter_map(|row| {
            row.get("market")
                .and_then(|value| value.as_str())
                .map(ToOwned::to_owned)
        })
        .collect();

    let mut distinct = BTreeSet::new();
    for market in markets {
        let ticker = market.split('/').next().unwrap_or(&market).to_uppercase();
        if ticker.chars().all(|ch| ch.is_ascii_alphabetic()) && ticker.len() <= 6 {
            distinct.insert(ticker);
        }
        if distinct.len() >= 8 {
            break;
        }
    }

    distinct.into_iter().collect()
}

async fn build_stock_research_payload(
    ticker: &str,
    app_name: &str,
) -> Option<(serde_json::Value, String)> {
    let parsed_json = crate::hera_ipc::execute_tool("market_research", json!({ "ticker": ticker }))
        .await
        .ok()?;
    if parsed_json.get("error").is_some() {
        tracing::error!(
            "market_research tool returned structured error: {:?}",
            parsed_json
        );
        return None;
    }

    let normalized_payload = normalize_research_payload(parsed_json);
    let enriched_payload = if let Some(headlines) = normalized_payload
        .get("catalysts_and_news")
        .and_then(|news| news.get("recent_headlines"))
        .and_then(|items| items.as_array())
    {
        let mut payload = normalized_payload.clone();
        if let Some(summary) = generate_catalyst_summary(ticker, headlines, app_name)
            .await
            .or_else(|| fallback_catalyst_summary(headlines))
        {
            if let Some(catalysts) = payload.get_mut("catalysts_and_news") {
                catalysts["executive_summary"] = serde_json::Value::String(summary);
            }
        }
        payload
    } else {
        normalized_payload
    };
    let summary = generate_research_summary(ticker, &enriched_payload, app_name)
        .await
        .unwrap_or_else(|| {
            format!(
                "{} queda en observacion. Revisa tendencia, valuacion, volumen y catalizadores recientes antes de tomar decisiones. Este resumen es educativo y no constituye consejo financiero.",
                ticker
            )
        });

    Some((enriched_payload, summary))
}

async fn store_stock_research(
    ctx: &AppContext,
    email: &str,
    ticker: &str,
    bot_id: Option<i32>,
    app_name: &str,
    existing_id: Option<i32>,
) {
    let Some((normalized_payload, summary)) = build_stock_research_payload(ticker, app_name).await
    else {
        return;
    };

    let source = if bot_id.is_some() { "bot" } else { "manual" };
    let research_date = chrono::Utc::now().fixed_offset();

    let result = match existing_id {
        Some(id) => {
            match stock_research::Entity::find_by_id(id)
                .filter(stock_research::Column::OwnerEmail.eq(email.to_string()))
                .one(&ctx.db)
                .await
            {
                Ok(Some(model)) => {
                    let mut active: stock_research::ActiveModel = model.into();
                    active.ticker = Set(ticker.to_string());
                    active.owner_email = Set(email.to_string());
                    active.source = Set(source.to_string());
                    active.bot_id = Set(bot_id);
                    active.raw_data = Set(normalized_payload);
                    active.analysis_summary = Set(summary);
                    active.research_date = Set(research_date);
                    active.update(&ctx.db).await.map(|_| ())
                }
                Ok(None) => Ok(()),
                Err(error) => Err(error),
            }
        }
        None => stock_research::ActiveModel {
            ticker: Set(ticker.to_string()),
            owner_email: Set(email.to_string()),
            source: Set(source.to_string()),
            bot_id: Set(bot_id),
            raw_data: Set(normalized_payload),
            analysis_summary: Set(summary),
            research_date: Set(research_date),
            ..Default::default()
        }
        .insert(&ctx.db)
        .await
        .map(|_| ()),
    };

    if let Err(error) = result {
        tracing::error!("Failed to persist stock research: {:?}", error);
    }
}

#[debug_handler]
pub async fn consultant_dashboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());
    let rows = stock_research::Entity::find()
        .filter(stock_research::Column::OwnerEmail.eq(email.clone()))
        .order_by_desc(stock_research::Column::ResearchDate)
        .limit(50)
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    let mut researches: Vec<ResearchView> = vec![];
    for row in rows {
        researches.push(ResearchView {
            id: row.id,
            ticker: row.ticker,
            research_date: row.research_date.format("%b %d, %Y %H:%M").to_string(),
            research_sort_key: row.research_date.format("%Y-%m-%d %H:%M:%S").to_string(),
            source: row.source,
            bot_id: row.bot_id,
            raw_data: Some(row.raw_data),
            analysis_summary: Some(row.analysis_summary),
        });
    }

    let mut suggestions: Vec<SuggestionView> = suggestion_tickers_for_email(&ctx, &email)
        .await
        .into_iter()
        .map(|ticker| SuggestionView {
            label: ticker.clone(),
            ticker,
            reason: "Usado en tus backtests".to_string(),
        })
        .collect();

    for (ticker, label, reason) in RESEARCH_SHORTLIST {
        if suggestions.iter().any(|item| item.ticker == ticker) {
            continue;
        }
        suggestions.push(SuggestionView {
            ticker: ticker.to_string(),
            label: label.to_string(),
            reason: reason.to_string(),
        });
        if suggestions.len() >= 10 {
            break;
        }
    }

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "consultant");
    context.insert("researches", &researches);
    context.insert("suggestions", &suggestions);
    context.insert("research_count", &researches.len());
    context.insert(
        "latest_research",
        &researches
            .first()
            .map(|item| item.research_date.clone())
            .unwrap_or_else(|| "Sin historial".to_string()),
    );

    let rendered = tera
        .render("dashboard/consultant.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Dashboard template error: {:?}", e);
            loco_rs::Error::string(&format!("Template error: {:?}", e))
        })?;

    Ok(axum::response::Html(rendered).into_response())
}

#[derive(serde::Deserialize)]
pub struct AnalyzePayload {
    pub ticker: String,
    pub bot_id: Option<i32>,
}

#[debug_handler]
pub async fn consultant_analyze_run(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
    axum::extract::Form(payload): axum::extract::Form<AnalyzePayload>,
) -> Result<Response> {
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let ticker_upper = payload.ticker.trim().to_uppercase();
    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    if ticker_upper.is_empty() {
        return Ok(axum::response::Redirect::to("/dashboard/consultant").into_response());
    }

    store_stock_research(&ctx, &email, &ticker_upper, payload.bot_id, &app_name, None).await;

    Ok(axum::response::Redirect::to("/dashboard/consultant").into_response())
}

#[debug_handler]
pub async fn consultant_refresh_research(
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    if let Ok(Some(row)) = stock_research::Entity::find_by_id(id)
        .filter(stock_research::Column::OwnerEmail.eq(email.clone()))
        .one(&ctx.db)
        .await
    {
        let ticker = row.ticker;
        let bot_id = row.bot_id;
        if !ticker.is_empty() {
            store_stock_research(&ctx, &email, &ticker, bot_id, &app_name, Some(id)).await;
        }
    }

    Ok(axum::response::Redirect::to("/dashboard/consultant").into_response())
}

#[debug_handler]
pub async fn delete_consultant_research(
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let _ = stock_research::Entity::delete_many()
        .filter(stock_research::Column::Id.eq(id))
        .filter(stock_research::Column::OwnerEmail.eq(email))
        .exec(&ctx.db)
        .await;

    Ok(axum::response::Redirect::to("/dashboard/consultant").into_response())
}

#[debug_handler]
pub async fn bots_dashboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());
    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    let rows = bot::Entity::find()
        .filter(bot::Column::OwnerId.is_in(owner_ids.clone()))
        .order_by_asc(bot::Column::Name)
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    let mut bots: Vec<BotView> = vec![];
    let mut active_count = 0;

    for row in rows {
        if row.status == "active" {
            active_count += 1;
        }

        bots.push(BotView {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            tags: row.tags,
        });
    }

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "bots");
    context.insert("bots", &bots);
    context.insert("total_bots", &bots.len());
    context.insert("active_count", &active_count);

    let rendered = tera
        .render("dashboard/bots.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Dashboard template error: {:?}", e);
            loco_rs::Error::string(&format!("Template error: {:?}", e))
        })?;

    Ok(axum::response::Html(rendered).into_response())
}

#[derive(serde::Deserialize)]
pub struct UpdateFormulaPayload {
    pub signal_manifest: String,
}

#[debug_handler]
pub async fn bot_details(
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    let row = bot::Entity::find_by_id(id)
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .one(&ctx.db)
        .await
        .unwrap_or(None);

    let row = match row {
        Some(r) => r,
        None => return Ok(axum::response::Redirect::temporary("/dashboard/bots").into_response()),
    };

    let name = row.name;
    let description = row.description;
    let status = row.status;
    let signal_manifest = row.signal_manifest;

    let is_wasm = row.is_wasm;
    let live_trading = row.live_trading;
    let bot_type = row.bot_type.clone();
    let webhook_token = row.webhook_token.clone().unwrap_or_default();
    let app_url = std::env::var("APP_URL")
        .unwrap_or_else(|_| "https://latinos.paulovila.org".to_string());
    let webhook_url = format!(
        "{}/api/bots/{}/signal?token={}",
        app_url, id, webhook_token
    );

    let manifest_str = match signal_manifest {
        Some(val) => serde_json::to_string_pretty(&val).unwrap_or_else(|_| "[]".to_string()),
        None => "[]".to_string(),
    };

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert(
        "app_name",
        &std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string()),
    );
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "bots");

    // Pass bot data
    context.insert("bot_id", &id);
    context.insert("bot_name", &name);
    context.insert("bot_description", &description);
    context.insert("bot_status", &status);
    context.insert("bot_signal_manifest", &manifest_str);
    context.insert("bot_is_wasm", &is_wasm);
    context.insert("bot_live_trading", &live_trading);
    context.insert("bot_type", &bot_type);
    context.insert("webhook_token", &webhook_token);
    context.insert("webhook_url", &webhook_url);

    let rendered = tera
        .render("dashboard/bot_details.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Dashboard template error: {:?}", e);
            loco_rs::Error::string(&format!("Template error: {:?}", e))
        })?;

    Ok(axum::response::Html(rendered).into_response())
}

#[debug_handler]
pub async fn update_bot_formula(
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
    axum::extract::Form(payload): axum::extract::Form<UpdateFormulaPayload>,
) -> Result<Response> {
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let json_val: serde_json::Value =
        serde_json::from_str(&payload.signal_manifest).unwrap_or_else(|_| serde_json::json!([]));

    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    if let Ok(Some(model)) = bot::Entity::find_by_id(id)
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .one(&ctx.db)
        .await
    {
        let mut active: bot::ActiveModel = model.into();
        active.signal_manifest = Set(Some(json_val));
        let _ = active.update(&ctx.db).await;
    }

    // Redirect to same page
    Ok(axum::response::Redirect::to(&format!("/dashboard/bots/{}", id)).into_response())
}

// NOTE: signals_preview (Dify redirect) removed — dead concept
#[derive(serde::Deserialize)]
pub struct RunBacktestPayload {
    pub bot_id: i32,
    pub market: String,
    pub range: String,
}

#[debug_handler]
pub async fn backtests_run(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
    axum::extract::Form(payload): axum::extract::Form<RunBacktestPayload>,
) -> Result<Response> {
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };
    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    let bot_exists = bot::Entity::find_by_id(payload.bot_id)
        .filter(bot::Column::OwnerId.is_in(owner_ids.clone()))
        .filter(bot::Column::ManifestVersion.eq(1))
        .one(&ctx.db)
        .await
        .ok()
        .flatten()
        .is_some();

    if !bot_exists {
        tracing::warn!("Rejecting backtest request for bot {} due to missing permissions or incompatible manifest version.", payload.bot_id);
        return Ok(axum::response::Redirect::to("/dashboard/backtests").into_response());
    }

    let backtest_id = backtest::ActiveModel {
        bot_id: Set(Some(payload.bot_id)),
        market: Set(payload.market.clone()),
        range: Set(Some(payload.range.clone())),
        status: Set("queued".to_string()),
        submitted_at: Set(chrono::Utc::now().fixed_offset()),
        results: Set(None),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await
    .map(|row| row.id)
    .unwrap_or(0);

    if backtest_id > 0 {
        let db = ctx.db.clone();
        let bot_id = payload.bot_id;
        let market = payload.market.clone();
        
        // Clone ctx so we can run market_data fetch inside the spawn
        // We'll just clone the db and create a minimal wrapper or use the tool logic if we had to, 
        //, but actually `fetch_ohlcv` requires `&AppContext`. 
        // Looking at Loco, AppContext includes db, config, mailer. We can clone ctx entirely!
        let ctx_clone = std::sync::Arc::new(ctx.clone());

        tokio::spawn(async move {
            let bot_manifest: serde_json::Value =
                match bot::Entity::find_by_id(bot_id).one(&db).await {
                    Ok(Some(row)) => row.signal_manifest.unwrap_or(serde_json::json!([])),
                    _ => serde_json::json!([]),
                };

            // Fetch actual candles! Default to 2000 candles for deeper backtests
            let candles = crate::market_data::fetch_ohlcv(&ctx_clone, &market, &payload.range, 2000)
                .await;

            if candles.is_empty() {
                tracing::warn!("Backtest {} failed: No market data found for {} @ {}", backtest_id, market, payload.range);
                let _ = backtest::Entity::find_by_id(backtest_id).one(&db).await.map(|opt| {
                    if let Some(row) = opt {
                        let mut active: backtest::ActiveModel = row.into();
                        active.status = Set("failed".to_string());
                        tokio::spawn(async move {
                            let _ = active.update(&db).await;
                        });
                    }
                });
                return;
            }

            let engine = crate::backtest::BacktestEngine::new(
                candles,
                crate::backtest::BacktestConfig {
                    initial_capital: 10000.0,
                    commission_bps: 2.0, // 2 basis points
                    slippage_bps: 5.0,   // 5 basis points 
                    position_sizing_pct: 1.0, // 100% position sizing
                    flat_commission: 1.0,     // $1 flat fee
                },
            );

            let sim_res = engine.run(&bot_manifest);

            let real_results = serde_json::json!({
                "roi": sim_res.roi,
                "win_rate": sim_res.win_rate,
                "total_trades": sim_res.total_trades,
                "max_drawdown": sim_res.max_drawdown,
                "sharpe_ratio": sim_res.sharpe_ratio,
                "sortino_ratio": sim_res.sortino_ratio,
                "cagr": sim_res.cagr,
                "turnover": sim_res.turnover,
                "equity_curve": sim_res.equity_curve
            });

            match backtest::Entity::find_by_id(backtest_id).one(&db).await {
                Ok(Some(model)) => {
                    let mut active: backtest::ActiveModel = model.into();
                    active.status = Set("completed".to_string());
                    active.results = Set(Some(real_results));
                    match active.update(&db).await {
                        Ok(_) => tracing::info!("Backtest {} simulated successfully.", backtest_id),
                        Err(e) => {
                            tracing::error!("Failed to update simulation {}: {:?}", backtest_id, e)
                        }
                    }
                }
                Ok(None) => tracing::warn!(
                    "Backtest {} disappeared before completion update.",
                    backtest_id
                ),
                Err(e) => tracing::error!("Failed to load simulation {}: {:?}", backtest_id, e),
            }
        });
    }

    Ok(axum::response::Redirect::to("/dashboard/backtests").into_response())
}

#[derive(serde::Serialize)]
pub struct BotPreview {
    pub id: i32,
    pub name: String,
}

#[derive(serde::Serialize)]
pub struct BacktestView {
    pub id: i32,
    pub symbol: String,
    pub interval: Option<String>,
    pub status: String,
    pub results: Option<serde_json::Value>,
}

#[debug_handler]
pub async fn backtests_dashboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());
    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    let user_bots_rows = bot::Entity::find()
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .order_by_asc(bot::Column::Name)
        .all(&ctx.db)
        .await
        .unwrap_or_default();
    let bot_ids: Vec<i32> = user_bots_rows.iter().map(|bot| bot.id).collect();
    let rows = backtest::Entity::find()
        .filter(backtest::Column::BotId.is_in(bot_ids))
        .order_by_desc(backtest::Column::SubmittedAt)
        .all(&ctx.db)
        .await
        .unwrap_or_default();

    let mut backtests: Vec<BacktestView> = vec![];
    for row in rows {
        backtests.push(BacktestView {
            id: row.id,
            symbol: row.market,
            interval: row.range,
            status: row.status,
            results: row.results,
        });
    }

    let mut user_bots: Vec<BotPreview> = vec![];
    for row in user_bots_rows {
        user_bots.push(BotPreview {
            id: row.id,
            name: row.name,
        });
    }

    let tera = load_dashboard_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("user_email", &email);
    context.insert("user_picture", &picture);
    context.insert("active_page", "backtests");
    context.insert("backtests", &backtests);
    context.insert("total_backtests", &backtests.len());
    context.insert("user_bots", &user_bots);

    let rendered = tera
        .render("dashboard/backtests.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Dashboard template error: {:?}", e);
            loco_rs::Error::string(&format!("Template error: {:?}", e))
        })?;

    Ok(axum::response::Html(rendered).into_response())
}

#[debug_handler]
pub async fn delete_backtest(
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };
    let owner_ids = owner_ids_for_email(&ctx, &email).await;
    let allowed_bot_ids: Vec<i32> = bot::Entity::find()
        .filter(bot::Column::OwnerId.is_in(owner_ids))
        .all(&ctx.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|bot| bot.id)
        .collect();

    let _ = backtest::Entity::delete_many()
        .filter(backtest::Column::Id.eq(id))
        .filter(backtest::Column::BotId.is_in(allowed_bot_ids))
        .exec(&ctx.db)
        .await;

    // Return empty response so HTMX successfully removes the element
    Ok(axum::response::Html("").into_response())
}

#[debug_handler]
pub async fn backtests_pdf(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
    Path(id): Path<i32>,
) -> Result<Response> {
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };
    let owner_ids = owner_ids_for_email(&ctx, &email).await;

    // Fetch backtest
    let backtest = backtest::Entity::find_by_id(id)
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    // Check ownership via the bot
    let user_bot = if let Some(bot_id) = backtest.bot_id {
        bot::Entity::find_by_id(bot_id)
            .filter(bot::Column::OwnerId.is_in(owner_ids))
            .one(&ctx.db)
            .await?
    } else {
        None
    };

    if user_bot.is_none() {
        return Ok((axum::http::StatusCode::FORBIDDEN, "Access denied").into_response());
    }

    if backtest.status != "completed" || backtest.results.is_none() {
        return Ok((
            axum::http::StatusCode::BAD_REQUEST,
            "Simulation is not completed yet.",
        )
            .into_response());
    }

    let bot_name = user_bot.map(|b| b.name).unwrap_or_else(|| "Quantitative Strategy".to_string());

    // Construct data for bridge
    let bridge_payload = json!({
        "id": id,
        "symbol": backtest.market,
        "bot_name": bot_name,
        "results": backtest.results.clone().unwrap()
    });

    // Call bridge to generate PDF
    let bridge_res = match crate::hera_ipc::execute_tool(
        "generate_pdf",
        json!({
            "data": bridge_payload.to_string()
        }),
    )
    .await
    {
        Ok(res) => res,
        Err(e) => {
            return Ok((
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("PDF Generation Failed: {}", e),
            )
                .into_response())
        }
    };

    let pdf_path = bridge_res["pdf_path"]
        .as_str()
        .ok_or_else(|| Error::Any(anyhow::anyhow!("No PDF path returned").into()))?;

    // Serve file
    let file = match tokio::fs::File::open(pdf_path).await {
        Ok(f) => f,
        Err(e) => {
            return Ok((
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to read generated PDF: {}", e),
            )
                .into_response())
        }
    };

    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);

    let content_disposition = format!("attachment; filename=\"backtest_{}_{}.pdf\"", id, backtest.market);

    Ok((
        [
            (header::CONTENT_TYPE, HeaderValue::from_static("application/pdf")),
            (
                header::CONTENT_DISPOSITION,
                HeaderValue::from_str(&content_disposition).unwrap(),
            ),
        ],
        body,
    )
        .into_response())
}
