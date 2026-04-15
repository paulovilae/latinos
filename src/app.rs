use async_trait::async_trait;
use axum::http::{header, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::Router;
use latinos_migration::Migrator;
use loco_rs::{
    app::{AppContext, Hooks, Initializer},
    bgworker::Queue,
    boot::{create_app, BootResult, StartMode},
    config::Config,
    controller::AppRoutes,
    environment::Environment,
    task::Tasks,
    Result,
};
use std::path::Path;
use tower_http::compression::CompressionLayer;
use tower_http::services::ServeDir;
use tower_http::set_header::SetResponseHeaderLayer;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::controllers;
use crate::controllers::api::LatinosApiDoc;
use crate::observability::runtime_log_middleware;
use crate::universe_scanner;
use crate::bot_engine;
use crate::shadow_seeding;

/// Custom 404 page — trading-themed dark UI
async fn custom_404() -> impl IntoResponse {
    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());
    let html = format!(
        r#"<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 — {app_name}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root {{
    --primary: #60a5fa;
    --bg: #0f172a;
    --bg-card: #1e293b;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --border: #334155;
    --buy: #22c55e;
    --sell: #ef4444;
    --footer-bg: #0b1120;
    --footer-text: rgba(255,255,255,.8);
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; display:flex; flex-direction:column; }}
.content {{ flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2rem; }}
.code {{ font-family:'JetBrains Mono',monospace; font-size:8rem; font-weight:700; background:linear-gradient(135deg,var(--sell),#f97316); -webkit-background-clip:text; -webkit-text-fill-color:transparent; line-height:1; }}
h1 {{ font-size:1.5rem; margin:.5rem 0; }}
p {{ color:var(--text-muted); margin:1rem 0; max-width:400px; line-height:1.6; }}
.back-btn {{ display:inline-block; margin-top:1rem; padding:.75rem 2rem; background:linear-gradient(135deg,var(--primary),#7c3aed); color:white; border-radius:.5rem; text-decoration:none; font-weight:600; transition:transform .2s; }}
.back-btn:hover {{ transform:translateY(-2px); }}
footer {{ background:var(--footer-bg); color:var(--footer-text); padding:1.5rem; text-align:center; font-size:.8rem; }}
footer a {{ color:rgba(255,255,255,.9); text-decoration:none; }}
</style>
</head><body>
<div class="content">
<div class="code">404</div>
<h1>Página no encontrada</h1>
<p>El recurso que buscas no existe o fue movido. Verifica el URL o regresa al inicio.</p>
<a href="/" class="back-btn">← Terminal</a>
</div>
<footer>
<p>© 2026 {app_name}</p>
</footer>
</body></html>"#,
        app_name = app_name
    );

    (StatusCode::NOT_FOUND, axum::response::Html(html))
}

pub struct App;

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    fn app_version() -> String {
        format!(
            "{} ({})",
            env!("CARGO_PKG_VERSION"),
            option_env!("BUILD_SHA")
                .or(option_env!("GITHUB_SHA"))
                .unwrap_or("dev")
        )
    }

    async fn boot(
        mode: StartMode,
        environment: &Environment,
        config: Config,
    ) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    async fn initializers(ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
        // Safe Legacy Strategy Migration (run on boot)
        crate::legacy_adapter::LegacyAdapter::migrate_legacy_bots(&ctx.db).await;

        // Start the universe scanner background worker
        universe_scanner::start_universe_scanner(ctx.db.clone()).await;
        // Start the paper trading bot engine
        bot_engine::start_bot_engine(ctx.db.clone()).await;

        // Seed Arena backtests at startup (fire-and-forget)
        // Fetches real OHLCV via Hera → yfinance bridge → runs Rust BacktestEngine
        let seed_ctx = ctx.clone();
        tokio::spawn(async move {
            // Small delay to let DB connections settle
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            if let Err(e) = shadow_seeding::seed_arena_if_needed(&seed_ctx).await {
                tracing::error!("[Startup] Arena seeder error: {e}");
            }
        });

        Ok(vec![])
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::empty()
            .add_route(controllers::public::routes())
            .add_route(controllers::api::routes())
            .add_route(controllers::admin::routes())
            .add_route(controllers::arena::routes())
            .add_route(controllers::dashboard::routes())
            .add_route(controllers::webhook::routes())
    }

    async fn after_routes(router: Router, _ctx: &AppContext) -> Result<Router> {
        let router = router.route("/health", axum::routing::get(|| async { (axum::http::StatusCode::OK, "ok") }));
        // Serve static files from media/ with 1-day browser cache
        let static_service = ServeDir::new("media");
        let router = router.nest_service(
            "/static",
            tower::ServiceBuilder::new()
                .layer(SetResponseHeaderLayer::overriding(
                    header::CACHE_CONTROL,
                    HeaderValue::from_static("public, max-age=31536000, immutable"),
                ))
                .service(static_service),
        );
        let router = router.nest_service(
            "/imaginclaw",
            tower::ServiceBuilder::new()
                .layer(SetResponseHeaderLayer::overriding(
                    header::CACHE_CONTROL,
                    HeaderValue::from_static("public, max-age=31536000, immutable"),
                ))
                .service(ServeDir::new(concat!(
                    env!("CARGO_MANIFEST_DIR"),
                    "/../../Imaginclaw/workspace"
                ))),
        );

        // Swagger UI — auto-generated from utoipa annotations
        let router = router.merge(
            SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", LatinosApiDoc::openapi()),
        );

        // Custom 404 fallback
        let router = router.fallback(custom_404);

        // Compression (gzip / brotli) for all responses
        let router = router.layer(CompressionLayer::new());
        let router = router.layer(axum::middleware::from_fn(runtime_log_middleware));

        Ok(router)
    }

    async fn connect_workers(_ctx: &AppContext, _queue: &Queue) -> Result<()> {
        Ok(())
    }

    #[allow(unused_variables)]
    fn register_tasks(tasks: &mut Tasks) {
        // tasks-inject (do not remove)
    }

    async fn truncate(_ctx: &AppContext) -> Result<()> {
        Ok(())
    }

    async fn seed(_ctx: &AppContext, _base: &Path) -> Result<()> {
        Ok(())
    }
}
