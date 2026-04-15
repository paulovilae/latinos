use axum::http::HeaderMap;
use axum::response::{IntoResponse, Redirect, Response};
use base64::Engine;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use loco_rs::prelude::{Error, Result};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tera::Context;

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL: &str = "https://openidconnect.googleapis.com/v1/userinfo";
const SESSION_TTL_SECS: u64 = 60 * 60 * 24 * 14;
const STATE_TTL_SECS: u64 = 60 * 10;

#[derive(Clone, Debug)]
pub struct SharedAuthConfig {
    pub app_name: &'static str,
    pub cookie_name: &'static str,
    pub callback_path: String,
    pub post_login_path: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AuthIdentity {
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub company: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct PublicNavLink {
    pub label: String,
    pub href: String,
}

impl PublicNavLink {
    pub fn new(label: impl Into<String>, href: impl Into<String>) -> Self {
        Self {
            label: label.into(),
            href: href.into(),
        }
    }
}

#[derive(Clone, Debug)]
pub struct PublicShellConfig {
    pub app_name: String,
    pub locale: String,
    pub header_home_href: String,
    pub header_logo_src: Option<String>,
    pub header_logo_alt: Option<String>,
    pub header_mark: String,
    pub header_brand: String,
    pub header_subtitle: String,
    pub header_nav_links: Vec<PublicNavLink>,
    pub header_action_links: Vec<PublicNavLink>,
    pub header_show_auth_actions: bool,
    pub header_dashboard_href: Option<String>,
    pub header_dashboard_label: Option<String>,
    pub header_guest_login_href: Option<String>,
    pub header_guest_login_label: Option<String>,
    pub header_guest_signup_href: Option<String>,
    pub header_guest_signup_label: Option<String>,
    pub footer_brand: String,
    pub footer_locale: String,
    pub footer_links: Vec<PublicNavLink>,
    pub footer_locale_switch_href: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleAuthCallback {
    pub code: Option<String>,
    pub state: Option<String>,
    pub error: Option<String>,
    pub error_description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct StateClaims {
    exp: usize,
    next: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SessionClaims {
    sub: String,
    email: String,
    name: Option<String>,
    picture: Option<String>,
    company: Option<String>,
    iss: String,
    iat: usize,
    exp: usize,
}

#[derive(Debug, Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct GoogleUserInfo {
    email: String,
    name: Option<String>,
    picture: Option<String>,
}

pub async fn begin_google_auth(headers: &HeaderMap, config: &SharedAuthConfig) -> Result<Response> {
    let client_id = require_env("GOOGLE_CLIENT_ID")?;
    let redirect_uri = callback_url(headers, &config.callback_path);
    let state = sign_state(&config.post_login_path)?;
    let auth_url = format!(
        "{GOOGLE_AUTH_URL}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=online&include_granted_scopes=true&prompt=select_account&state={}",
        urlencoding::encode(&client_id),
        urlencoding::encode(&redirect_uri),
        urlencoding::encode("openid email profile"),
        urlencoding::encode(&state)
    );

    Ok(Redirect::temporary(&auth_url).into_response())
}

pub async fn complete_google_auth(
    headers: &HeaderMap,
    query: GoogleAuthCallback,
    config: &SharedAuthConfig,
) -> Result<Response> {
    if let Some(error) = query.error {
        tracing::warn!(
            app = config.app_name,
            error = %error,
            description = ?query.error_description,
            "google auth rejected"
        );
        return Ok(Redirect::temporary(&config.post_login_path).into_response());
    }

    let code = query.code.ok_or_else(|| {
        tracing::error!(app = config.app_name, "missing google auth code");
        Error::InternalServerError
    })?;
    let state = query.state.ok_or_else(|| {
        tracing::error!(app = config.app_name, "missing google auth state");
        Error::InternalServerError
    })?;

    let next_path = verify_state(&state, &config.post_login_path)?;
    let redirect_uri = callback_url(headers, &config.callback_path);
    let access_token = exchange_google_code(&code, &redirect_uri).await?;
    let identity = fetch_google_identity(&access_token).await?;
    let session_token = sign_session(config.app_name, &identity)?;

    let mut response = Redirect::temporary(&next_path).into_response();
    response.headers_mut().append(
        axum::http::header::SET_COOKIE,
        cookie_header(config.cookie_name, &session_token, SESSION_TTL_SECS)
            .parse()
            .map_err(|_| Error::InternalServerError)?,
    );
    Ok(response)
}

pub fn session_from_headers(headers: &HeaderMap, cookie_names: &[&str]) -> Option<AuthIdentity> {
    for cookie_name in cookie_names {
        if let Some(raw) = cookie_value(headers, cookie_name) {
            if let Some(identity) = decode_signed_session(&raw) {
                return Some(identity);
            }
            if let Some(identity) = decode_legacy_session(&raw) {
                return Some(identity);
            }
        }
    }
    None
}

pub fn clear_session_cookie(cookie_name: &str) -> String {
    format!("{cookie_name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax")
}

pub fn issue_session_token(app_name: &str, identity: &AuthIdentity) -> Result<String> {
    sign_session(app_name, identity)
}

pub fn preferred_theme(headers: &HeaderMap, cookie_name: &str, default: &str) -> String {
    cookie_value(headers, cookie_name)
        .filter(|value| value == "light" || value == "dark")
        .unwrap_or_else(|| default.to_string())
}

pub fn public_page_links(locale: &str, base_prefix: &str) -> Vec<PublicNavLink> {
    let is_es = locale.eq_ignore_ascii_case("es");
    let prefix = normalize_prefix(base_prefix);

    vec![
        PublicNavLink::new(
            if is_es { "Términos" } else { "Terms" },
            format!("{prefix}/terms"),
        ),
        PublicNavLink::new(
            if is_es { "Privacidad" } else { "Privacy" },
            format!("{prefix}/privacy"),
        ),
        PublicNavLink::new("Sitemap", format!("{prefix}/sitemap")),
        PublicNavLink::new("API", format!("{prefix}/api/docs")),
        PublicNavLink::new(
            if is_es { "Docs" } else { "Docs" },
            format!("{prefix}/docs"),
        ),
        PublicNavLink::new("FAQ", format!("{prefix}/faq")),
        PublicNavLink::new(
            if is_es { "Seguridad" } else { "Security" },
            format!("{prefix}/security"),
        ),
        PublicNavLink::new(
            if is_es { "Estado" } else { "Status" },
            format!("{prefix}/status"),
        ),
    ]
}

pub fn insert_public_shell_context(
    context: &mut Context,
    headers: &HeaderMap,
    config: &PublicShellConfig,
    theme_cookie: &str,
    default_theme: &str,
    session_cookie_names: &[&str],
) {
    if let Some(identity) = session_from_headers(headers, session_cookie_names) {
        context.insert("user_email", &identity.email);
        if let Some(picture) = identity.picture {
            context.insert("user_picture", &picture);
        }
    }

    context.insert("app_name", &config.app_name);
    context.insert("locale", &config.locale);
    context.insert(
        "initial_theme",
        &preferred_theme(headers, theme_cookie, default_theme),
    );
    context.insert("header_home_href", &config.header_home_href);
    if let Some(value) = &config.header_logo_src {
        context.insert("header_logo_src", value);
    }
    if let Some(value) = &config.header_logo_alt {
        context.insert("header_logo_alt", value);
    }
    context.insert("header_mark", &config.header_mark);
    context.insert("header_brand", &config.header_brand);
    context.insert("header_subtitle", &config.header_subtitle);
    context.insert("header_nav_links", &config.header_nav_links);
    context.insert("header_action_links", &config.header_action_links);
    context.insert("header_show_auth_actions", &config.header_show_auth_actions);

    if let Some(value) = &config.header_dashboard_href {
        context.insert("header_dashboard_href", value);
    }
    if let Some(value) = &config.header_dashboard_label {
        context.insert("header_dashboard_label", value);
    }
    if let Some(value) = &config.header_guest_login_href {
        context.insert("header_guest_login_href", value);
    }
    if let Some(value) = &config.header_guest_login_label {
        context.insert("header_guest_login_label", value);
    }
    if let Some(value) = &config.header_guest_signup_href {
        context.insert("header_guest_signup_href", value);
    }
    if let Some(value) = &config.header_guest_signup_label {
        context.insert("header_guest_signup_label", value);
    }

    context.insert("footer_brand", &config.footer_brand);
    context.insert("footer_locale", &config.footer_locale);
    context.insert("footer_links", &config.footer_links);
    if let Some(value) = &config.footer_locale_switch_href {
        context.insert("footer_locale_switch_href", value);
    }
}

fn normalize_prefix(base_prefix: &str) -> String {
    let trimmed = base_prefix.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        String::new()
    } else if trimmed.starts_with('/') {
        trimmed.to_string()
    } else {
        format!("/{trimmed}")
    }
}

fn callback_url(headers: &HeaderMap, callback_path: &str) -> String {
    format!("{}{}", public_origin(headers), callback_path)
}

fn public_origin(headers: &HeaderMap) -> String {
    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get(axum::http::header::HOST))
        .and_then(|value| value.to_str().ok())
        .map(|value| value.split(',').next().unwrap_or(value).trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| std::env::var("APP_PUBLIC_HOST").ok())
        .unwrap_or_else(|| "localhost:3000".to_string());

    let proto = headers
        .get("x-forwarded-proto")
        .and_then(|value| value.to_str().ok())
        .map(|value| value.split(',').next().unwrap_or(value).trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| std::env::var("APP_PUBLIC_SCHEME").ok())
        .unwrap_or_else(|| {
            if host.starts_with("localhost") || host.starts_with("127.0.0.1") {
                "http".to_string()
            } else {
                "https".to_string()
            }
        });

    format!("{proto}://{host}")
}

fn require_env(key: &str) -> Result<String> {
    std::env::var(key).map_err(|_| {
        tracing::error!(%key, "missing auth env var");
        Error::InternalServerError
    })
}

fn jwt_secret() -> Result<String> {
    std::env::var("OS_AUTH_SHARED_SECRET")
        .or_else(|_| std::env::var("IMAGINOS_JWT_SECRET"))
        .or_else(|_| std::env::var("NEXTAUTH_SECRET"))
        .map_err(|_| {
            tracing::error!("missing shared auth secret");
            Error::InternalServerError
        })
}

fn sign_state(next: &str) -> Result<String> {
    let now = now_secs();
    let claims = StateClaims {
        exp: (now + STATE_TTL_SECS) as usize,
        next: sanitize_next_path(next),
    };
    let secret = jwt_secret()?;
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| Error::InternalServerError)
}

fn verify_state(token: &str, fallback: &str) -> Result<String> {
    let secret = jwt_secret()?;
    let claims = decode::<StateClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .map(|data| data.claims)
    .unwrap_or(StateClaims {
        exp: 0,
        next: sanitize_next_path(fallback),
    });

    Ok(sanitize_next_path(&claims.next))
}

fn sign_session(app_name: &str, identity: &AuthIdentity) -> Result<String> {
    let secret = jwt_secret()?;
    let now = now_secs() as usize;
    let claims = SessionClaims {
        sub: identity.email.clone(),
        email: identity.email.clone(),
        name: identity.name.clone(),
        picture: identity.picture.clone(),
        company: identity.company.clone(),
        iss: app_name.to_string(),
        iat: now,
        exp: now + SESSION_TTL_SECS as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| Error::InternalServerError)
}

fn decode_signed_session(token: &str) -> Option<AuthIdentity> {
    let secret = jwt_secret().ok()?;
    let claims = decode::<SessionClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .ok()?
    .claims;

    Some(AuthIdentity {
        email: claims.email,
        name: claims.name,
        picture: claims.picture,
        company: claims.company,
    })
}

fn decode_legacy_session(token: &str) -> Option<AuthIdentity> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }

    let mut b64 = parts[1].replace('-', "+").replace('_', "/");
    while b64.len() % 4 != 0 {
        b64.push('=');
    }

    let payload = base64::engine::general_purpose::STANDARD
        .decode(&b64)
        .ok()?;
    let claims: serde_json::Value = serde_json::from_slice(&payload).ok()?;

    Some(AuthIdentity {
        email: claims.get("email")?.as_str()?.to_string(),
        name: claims
            .get("name")
            .and_then(|value| value.as_str())
            .map(str::to_string),
        picture: claims
            .get("picture")
            .and_then(|value| value.as_str())
            .map(str::to_string),
        company: claims
            .get("company")
            .or_else(|| claims.get("org"))
            .and_then(|value| value.as_str())
            .map(str::to_string),
    })
}

pub fn cookie_value(headers: &HeaderMap, cookie_name: &str) -> Option<String> {
    let cookie_header = headers.get(axum::http::header::COOKIE)?.to_str().ok()?;
    cookie_header.split(';').map(str::trim).find_map(|entry| {
        let (name, value) = entry.split_once('=')?;
        (name == cookie_name).then(|| value.to_string())
    })
}

fn cookie_header(cookie_name: &str, token: &str, max_age: u64) -> String {
    format!("{cookie_name}={token}; Path=/; Max-Age={max_age}; HttpOnly; Secure; SameSite=Lax")
}

fn sanitize_next_path(path: &str) -> String {
    if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{}", path.trim_start_matches('/'))
    }
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

async fn exchange_google_code(code: &str, redirect_uri: &str) -> Result<String> {
    let client_id = require_env("GOOGLE_CLIENT_ID")?;
    let client_secret = require_env("GOOGLE_CLIENT_SECRET")?;

    let response = reqwest::Client::new()
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("code", code),
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("redirect_uri", redirect_uri),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|error| {
            tracing::error!(?error, "google token exchange failed");
            Error::InternalServerError
        })?;

    if response.status() != StatusCode::OK {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        tracing::error!(%status, %body, "google token exchange returned non-200");
        return Err(Error::InternalServerError);
    }

    let token: GoogleTokenResponse = response.json().await.map_err(|error| {
        tracing::error!(?error, "invalid google token response");
        Error::InternalServerError
    })?;

    Ok(token.access_token)
}

async fn fetch_google_identity(access_token: &str) -> Result<AuthIdentity> {
    let response = reqwest::Client::new()
        .get(GOOGLE_USERINFO_URL)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|error| {
            tracing::error!(?error, "google userinfo failed");
            Error::InternalServerError
        })?;

    if response.status() != StatusCode::OK {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        tracing::error!(%status, %body, "google userinfo returned non-200");
        return Err(Error::InternalServerError);
    }

    let user: GoogleUserInfo = response.json().await.map_err(|error| {
        tracing::error!(?error, "invalid google userinfo payload");
        Error::InternalServerError
    })?;

    Ok(AuthIdentity {
        email: user.email,
        name: user.name,
        picture: user.picture,
        company: None,
    })
}
