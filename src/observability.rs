use std::sync::OnceLock;
use std::time::Instant;

use axum::extract::Request;
use axum::middleware::Next;
use axum::response::Response;
use serde_json::json;

static LOG_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn ingest_url() -> String {
    std::env::var("OS_LOG_INGEST_URL")
        .unwrap_or_else(|_| "http://127.0.0.1:5177/api/observability/logs/ingest".to_string())
}

fn should_skip_route(path: &str) -> bool {
    path.starts_with("/static")
        || path.starts_with("/imaginclaw")
        || path.starts_with("/favicon")
        || path.starts_with("/swagger-ui")
        || path.starts_with("/api-docs")
        || path == "/xmlrpc.php"
        || path == "/wp-login.php"
        || path == "/wp-admin"
        || path.starts_with("/wp-")
        || path.starts_with("/.env")
        || path.starts_with("/.git")
        || path.starts_with("/vendor/phpunit")
        || path.starts_with("/cgi-bin")
        || path.starts_with("/autodiscover")
}

fn client() -> &'static reqwest::Client {
    LOG_CLIENT.get_or_init(reqwest::Client::new)
}

pub async fn runtime_log_middleware(req: Request, next: Next) -> Response {
    let started_at = Instant::now();
    let method = req.method().to_string();
    let route = req.uri().path().to_string();
    let request_id = req
        .headers()
        .get("x-request-id")
        .and_then(|value| value.to_str().ok())
        .map(ToOwned::to_owned);
    let trace_id = req
        .headers()
        .get("x-trace-id")
        .and_then(|value| value.to_str().ok())
        .map(ToOwned::to_owned)
        .or_else(|| request_id.clone());

    let response = next.run(req).await;

    if should_skip_route(&route) {
        return response;
    }

    let status_code = response.status().as_u16();
    let duration_ms = started_at.elapsed().as_millis() as u64;
    let level = if status_code >= 500 {
        "error"
    } else if status_code >= 400 {
        "warn"
    } else {
        "info"
    };
    let payload = json!({
        "level": level,
        "service": "latinos",
        "app": "latinos-rust",
        "message": "http_request_completed",
        "request_id": request_id,
        "trace_id": trace_id,
        "route": route,
        "method": method,
        "status_code": status_code,
        "duration_ms": duration_ms,
        "resource_type": "http_request",
        "details": {
            "source": "app_middleware"
        }
    });

    tokio::spawn(async move {
        if let Err(error) = client().post(ingest_url()).json(&payload).send().await {
            tracing::debug!("OS-v3 log ingest failed for Latinos: {}", error);
        }
    });

    response
}
