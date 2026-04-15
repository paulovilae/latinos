#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use os_auth_kit::{
    clear_session_cookie, insert_public_shell_context as insert_shared_public_shell_context,
    public_page_links, session_from_headers, PublicShellConfig,
};
use std::time::Instant;
use tera::{Context, Tera};

/// Track server boot time for uptime calculation
static BOOT_TIME: std::sync::LazyLock<Instant> = std::sync::LazyLock::new(Instant::now);

fn load_templates() -> Tera {
    let mut tera = match Tera::new("views/**/*.tera") {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("Tera parsing error: {}", e);
            std::process::exit(1);
        }
    };

    // Load ALL shared OS-v3 templates — central repo for standardized pages
    let shared_base = concat!(env!("CARGO_MANIFEST_DIR"), "/shared/views/shared/");
    let shared_templates = [
        ("public_footer.html.tera", "shared/public_footer.html.tera"),
        ("public_header.html.tera", "shared/public_header.html.tera"),
        ("terms.html.tera", "shared/terms.html.tera"),
        ("privacy.html.tera", "shared/privacy.html.tera"),
        ("security.html.tera", "shared/security.html.tera"),
        ("faq.html.tera", "shared/faq.html.tera"),
        ("docs.html.tera", "shared/docs.html.tera"),
        ("status.html.tera", "shared/status.html.tera"),
        ("sitemap.html.tera", "shared/sitemap.html.tera"),
        ("api_docs.html.tera", "shared/api_docs.html.tera"),
    ];

    for (file, name) in shared_templates {
        let path = format!("{}{}", shared_base, file);
        tera.add_template_file(&path, Some(name))
            .unwrap_or_else(|error| {
                tracing::error!("Shared template load error for {}: {}", name, error);
                std::process::exit(1);
            });
    }

    tera
}

/// Returns the standard footer HTML for Latinos Trading
pub fn standard_footer_html(app_name: &str) -> String {
    format!(
        r#"<footer class="footer" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:0.5rem;background:#0b1120;color:rgba(255,255,255,.8);padding:2rem 1.5rem;text-align:center;font-size:.85rem;">
<p style="width:100%;text-align:center;margin:0;">© 2026 {app_name} — Todos los derechos reservados.</p>
<div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;justify-content:center;margin-top:0.25rem;">
<a href="/terms" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">Términos</a> ·
<a href="/privacy" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">Privacidad</a> ·
<a href="/sitemap" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">Sitemap</a> ·
<a href="/api/docs" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">API</a> ·
<a href="/docs" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">Docs</a> ·
<a href="/faq" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">FAQ</a> ·
<a href="/security" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">Security</a> ·
<a href="/status" style="color:rgba(255,255,255,.9);text-decoration:none;font-size:0.8rem;">Status</a>
<span style="margin:0 0.25rem;opacity:0.4;">|</span>
<button onclick="toggleTheme()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:0.375rem;padding:0.2rem 0.5rem;cursor:pointer;color:rgba(255,255,255,.8);font-size:0.75rem;" title="Toggle theme">🌓</button>
<button onclick="toggleLang()" id="footer-lang-btn" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:0.375rem;padding:0.2rem 0.5rem;cursor:pointer;color:rgba(255,255,255,.8);font-size:0.75rem;" title="Switch language">🌐 ES</button>
</div>
</footer>
<script>
(function(){{var s=localStorage.getItem('theme');if(s)document.documentElement.setAttribute('data-theme',s);else document.documentElement.setAttribute('data-theme','dark')}})();
function toggleTheme(){{var h=document.documentElement,c=h.getAttribute('data-theme')||'dark',n=c==='dark'?'light':'dark';h.setAttribute('data-theme',n);localStorage.setItem('theme',n)}}
function toggleLang(){{var c=localStorage.getItem('lang')||'es',n=c==='es'?'en':'es';localStorage.setItem('lang',n);var b=document.getElementById('footer-lang-btn');if(b)b.textContent='🌐 '+n.toUpperCase()}}
(function(){{var l=localStorage.getItem('lang')||'es';var b=document.getElementById('footer-lang-btn');if(b)b.textContent='🌐 '+l.toUpperCase()}})();
</script>"#,
        app_name = app_name
    )
}

/// Compile Tera once per process instead of reparsing on every request
static TEMPLATES: std::sync::LazyLock<Tera> = std::sync::LazyLock::new(load_templates);

/// Tera template engine
fn templates() -> &'static Tera {
    &TEMPLATES
}

fn public_shell_config() -> PublicShellConfig {
    let app_name = std::env::var("APP_NAME").unwrap_or_else(|_| "Latinos Trading".to_string());

    PublicShellConfig {
        app_name: app_name.clone(),
        locale: "es".to_string(),
        header_home_href: "/".to_string(),
        header_logo_src: Some("/static/images/latinos_mark.svg".to_string()),
        header_logo_alt: Some("Latinos Trading".to_string()),
        header_mark: "LT".to_string(),
        header_brand: app_name.clone(),
        header_subtitle: "Algorithmic trading platform".to_string(),
        header_nav_links: vec![],
        header_action_links: vec![],
        header_show_auth_actions: true,
        header_dashboard_href: Some("/dashboard".to_string()),
        header_dashboard_label: Some("Dashboard".to_string()),
        header_guest_login_href: Some("/auth/login".to_string()),
        header_guest_login_label: Some("Ingresar".to_string()),
        header_guest_signup_href: Some("/auth/signup".to_string()),
        header_guest_signup_label: Some("Crear cuenta".to_string()),
        footer_brand: app_name,
        footer_locale: "ES".to_string(),
        footer_links: public_page_links("es", ""),
        footer_locale_switch_href: None,
    }
}

fn insert_public_shell_context(context: &mut Context, headers: &axum::http::HeaderMap) {
    let config = public_shell_config();
    insert_shared_public_shell_context(
        context,
        headers,
        &config,
        "latinos_theme",
        "dark",
        &["os_session", "vilaros_infra_token", "imaginos_infra_token"],
    );
}

/// Extract user email from vilaros_infra_token cookie (JWT payload decode)
pub fn get_user_session(headers: &axum::http::HeaderMap) -> Option<(String, Option<String>)> {
    let identity = session_from_headers(headers, &["os_session", "vilaros_infra_token", "imaginos_infra_token"])?;
    let email = identity.email;
    let picture = identity.picture;

    tracing::debug!(
        "Session detected: {:?} (Picture: {:?})",
        email,
        picture.is_some()
    );
    Some((email, picture))
}

/// Insert standard legal context variables for Terms and Privacy pages
fn insert_legal_context(context: &mut Context, headers: &axum::http::HeaderMap) {
    insert_public_shell_context(context, headers);
    context.insert(
        "legal_entity",
        &std::env::var("LEGAL_ENTITY")
            .unwrap_or_else(|_| "Latinos Trading / ImagineOS".to_string()),
    );
    context.insert(
        "legal_address",
        &std::env::var("LEGAL_ADDRESS")
            .unwrap_or_else(|_| "Cra 102 #14-101, Cali, Valle del Cauca, Colombia".to_string()),
    );
    context.insert(
        "contact_email",
        &std::env::var("CONTACT_EMAIL").unwrap_or_else(|_| "vilapaulo@gmail.com".to_string()),
    );
    context.insert("service_description", &std::env::var("SERVICE_DESCRIPTION").unwrap_or_else(|_| "plataforma de trading algorítmico que permite a usuarios crear, probar y ejecutar estrategias de inversión automatizadas".to_string()));
    context.insert("last_updated", "17 de marzo de 2026");
}

/// Generic static page renderer — renders a Tera template with auth context
fn render_static_page_with_auth(
    template: &str,
    headers: &axum::http::HeaderMap,
) -> Result<Response> {
    let mut context = Context::new();
    insert_public_shell_context(&mut context, headers);

    let html = templates().render(template, &context).map_err(|e| {
        tracing::error!("Tera render error for {}: {}", template, e);
        Error::InternalServerError
    })?;

    Ok(axum::response::Html(html).into_response())
}

/// GET / — Latinos Trading Landing Page
#[debug_handler]
pub async fn landing(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let mut context = Context::new();
    insert_public_shell_context(&mut context, &headers);

    context.insert(
        "hero",
        &serde_json::json!({
            "title": "Latinos Trading",
            "subtitle": "Plataforma de Trading Algorítmico"
        }),
    );

    let html = templates()
        .render("public/landing.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Tera render error: {}", e);
            Error::InternalServerError
        })?;

    Ok(axum::response::Html(html).into_response())
}

fn public_origin(headers: &axum::http::HeaderMap) -> String {
    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get(axum::http::header::HOST))
        .and_then(|value| value.to_str().ok())
        .map(|value| value.split(',').next().unwrap_or(value).trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| std::env::var("APP_PUBLIC_HOST").ok())
        .unwrap_or_else(|| "latinos.paulovila.org".to_string());

    let proto = headers
        .get("x-forwarded-proto")
        .and_then(|value| value.to_str().ok())
        .map(|value| value.split(',').next().unwrap_or(value).trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| std::env::var("APP_PUBLIC_SCHEME").ok())
        .unwrap_or_else(|| "https".to_string());

    format!("{proto}://{host}")
}

fn imaginos_bridge_url(headers: &axum::http::HeaderMap, mode: &str) -> String {
    let redirect_target = format!("{}/dashboard", public_origin(headers));
    let redirect_back = urlencoding::encode(&redirect_target);
    format!("https://imaginos.ai/api/auth/bridge?redirect={redirect_back}&mode={mode}&force=1")
}

#[debug_handler]
pub async fn auth_login(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    Ok(
        axum::response::Redirect::temporary(&imaginos_bridge_url(&headers, "signin"))
            .into_response(),
    )
}

#[debug_handler]
pub async fn auth_signup(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    Ok(
        axum::response::Redirect::temporary(&imaginos_bridge_url(&headers, "signup"))
            .into_response(),
    )
}

#[debug_handler]
pub async fn auth_logout(State(_ctx): State<AppContext>) -> Result<Response> {
    let mut response = axum::response::Redirect::temporary("/").into_response();
    response.headers_mut().insert(
        axum::http::header::SET_COOKIE,
        clear_session_cookie("os_session").parse().unwrap(),
    );
    response.headers_mut().append(
        axum::http::header::SET_COOKIE,
        clear_session_cookie("vilaros_infra_token").parse().unwrap(),
    );
    Ok(response)
}

/// GET /terms — Legal terms
#[debug_handler]
pub async fn terms_page(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let mut context = Context::new();
    insert_legal_context(&mut context, &headers);
    let html = templates()
        .render("public/standard/terms.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Terms render error: {}", e);
            Error::InternalServerError
        })?;
    Ok(axum::response::Html(html).into_response())
}

/// GET /privacy — Privacy policy
#[debug_handler]
pub async fn privacy_page(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let mut context = Context::new();
    insert_legal_context(&mut context, &headers);
    let html = templates()
        .render("public/standard/privacy.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Privacy render error: {}", e);
            Error::InternalServerError
        })?;
    Ok(axum::response::Html(html).into_response())
}

/// GET /security — Security page
#[debug_handler]
pub async fn security_page(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    render_static_page_with_auth("public/standard/security.html.tera", &headers)
}

/// GET /faq — FAQ
#[debug_handler]
pub async fn faq_page(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    render_static_page_with_auth("public/standard/faq.html.tera", &headers)
}

/// GET /docs — Documentation
#[debug_handler]
pub async fn docs_page(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    render_static_page_with_auth("public/standard/docs.html.tera", &headers)
}

/// GET /status — Status page
#[debug_handler]
pub async fn status_page(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let mut context = Context::new();
    insert_public_shell_context(&mut context, &headers);
    let elapsed = BOOT_TIME.elapsed().as_secs();
    let uptime = if elapsed >= 86400 {
        format!("{}d {}h", elapsed / 86400, (elapsed % 86400) / 3600)
    } else if elapsed >= 3600 {
        format!("{}h {}m", elapsed / 3600, (elapsed % 3600) / 60)
    } else {
        format!("{}m {}s", elapsed / 60, elapsed % 60)
    };
    context.insert("uptime_display", &uptime);
    context.insert("version", env!("CARGO_PKG_VERSION"));
    let html = templates()
        .render("public/standard/status.html.tera", &context)
        .map_err(|e| {
            tracing::error!("Status render error: {}", e);
            Error::InternalServerError
        })?;
    Ok(axum::response::Html(html).into_response())
}

/// GET /sitemap — redirects to docs as sitemap is not standalone
#[debug_handler]
pub async fn sitemap_page(
    State(_ctx): State<AppContext>,
    _headers: axum::http::HeaderMap,
) -> Result<Response> {
    Ok(axum::response::Redirect::permanent("/docs").into_response())
}

/// GET /api/docs — API documentation page with Swagger UI
#[debug_handler]
pub async fn api_docs_page(
    State(_ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
) -> Result<Response> {
    let mut context = Context::new();
    insert_public_shell_context(&mut context, &headers);
    context.insert("swagger_url", "/swagger-ui/");
    let html = templates()
        .render("public/standard/api_docs.html.tera", &context)
        .map_err(|e| {
            tracing::error!("API docs render error: {}", e);
            Error::InternalServerError
        })?;
    Ok(axum::response::Html(html).into_response())
}

pub fn routes() -> Routes {
    Routes::new()
        .add("/", get(landing))
        .add("/es", get(landing))
        .add("/en", get(landing))
        .add("/auth/login", get(auth_login))
        .add("/auth/signup", get(auth_signup))
        .add("/auth/logout", get(auth_logout))
        .add("/terms", get(terms_page))
        .add("/privacy", get(privacy_page))
        .add("/security", get(security_page))
        .add("/faq", get(faq_page))
        .add("/docs", get(docs_page))
        .add("/status", get(status_page))
        .add("/sitemap", get(sitemap_page))
        .add("/api/docs", get(api_docs_page))
}
