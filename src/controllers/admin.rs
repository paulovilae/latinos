#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unused_async)]
use crate::controllers::public::get_user_session;
use crate::models::user;
use loco_rs::prelude::*;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use tera::Tera;

fn load_admin_templates() -> Tera {
    Tera::new("views/**/*.tera").expect("Admin templates must compile")
}

/// Check whether the session user has the "admin" role in latinos_users.
async fn is_admin(ctx: &AppContext, email: &str) -> bool {
    user::Entity::find()
        .filter(user::Column::Email.eq(email.to_string()))
        .filter(user::Column::Role.eq("admin"))
        .one(&ctx.db)
        .await
        .ok()
        .flatten()
        .is_some()
}

/// GET /admin — Admin dashboard overview (auth-gated, admin role required)
#[debug_handler]
pub async fn admin_dashboard(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    // ── Auth gate ──
    let (email, _picture) = match get_user_session(&headers) {
        Some(s) => s,
        None => return Ok(axum::response::Redirect::temporary("/auth/login").into_response()),
    };

    if !is_admin(&ctx, &email).await {
        return Ok((
            axum::http::StatusCode::FORBIDDEN,
            axum::response::Html(
                "<h1>403 — Forbidden</h1><p>You do not have admin privileges.</p>",
            ),
        )
            .into_response());
    }

    let users = crate::memento_query::count_table("latinos", "latinos_users").await;
    let bots = crate::memento_query::count_table("latinos", "latinos_bots").await;
    let signals = crate::memento_query::count_table("latinos", "latinos_signals").await;
    let backtests = crate::memento_query::count_table("latinos", "latinos_backtests").await;
    let trades = crate::memento_query::count_table("latinos", "latinos_trades").await;

    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    let tera = load_admin_templates();
    let mut context = tera::Context::new();
    context.insert("app_name", &app_name);
    context.insert("version", env!("CARGO_PKG_VERSION"));
    context.insert("user_email", &email);
    context.insert("users", &users);
    context.insert("bots", &bots);
    context.insert("signals", &signals);
    context.insert("backtests", &backtests);
    context.insert("trades", &trades);

    // Footer links
    let footer_links = vec![
        serde_json::json!({"href": "/terms", "label": "Términos"}),
        serde_json::json!({"href": "/privacy", "label": "Privacidad"}),
        serde_json::json!({"href": "/security", "label": "Seguridad"}),
        serde_json::json!({"href": "/status", "label": "Estado"}),
    ];
    context.insert("footer_links", &footer_links);
    context.insert("footer_brand", &app_name);

    let rendered = tera
        .render("admin/dashboard.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Admin template error: {}", e);
            loco_rs::Error::string(&format!("Template error: {}", e))
        })?;

    Ok(axum::response::Html(rendered).into_response())
}

pub fn routes() -> Routes {
    Routes::new().prefix("admin").add("/", get(admin_dashboard))
}
