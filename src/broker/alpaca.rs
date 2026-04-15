use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const ALPACA_PAPER_URL: &str = "https://paper-api.alpaca.markets/v2";
const ALPACA_DATA_URL: &str = "https://data.alpaca.markets/v2";

#[derive(Debug, Clone, PartialEq)]
pub enum AlpacaMode {
    Mock,
    Paper,
}

#[derive(Debug, Clone)]
pub struct AlpacaClient {
    api_key: String,
    api_secret: String,
    mode: AlpacaMode,
    client: Client,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AlpacaBar {
    pub t: String,
    pub o: f64,
    pub h: f64,
    pub l: f64,
    pub c: f64,
    pub v: f64,
    pub n: usize,
    pub vw: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AlpacaBarsResponse {
    pub bars: std::collections::HashMap<String, Vec<AlpacaBar>>,
    pub next_page_token: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AlpacaAsset {
    pub id: String,
    pub class: String,
    pub exchange: String,
    pub symbol: String,
    pub name: String,
    pub status: String,
    pub tradable: bool,
    pub marginable: bool,
    pub shortable: bool,
    pub easy_to_borrow: bool,
    pub fractionable: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OrderRequest {
    pub symbol: String,
    pub qty: f64,
    pub side: String, // "buy" or "sell"
    pub type_: String, // "market", "limit", etc.
    pub time_in_force: String, // "day", "gtc"
}

impl AlpacaClient {
    pub fn new() -> Self {
        let mode_str = std::env::var("ALPACA_MODE").unwrap_or_else(|_| "paper".to_string());
        let mode = if mode_str.to_lowercase() == "mock" {
            AlpacaMode::Mock
        } else {
            AlpacaMode::Paper
        };

        let key = std::env::var("ALPACA_KEY_ID").unwrap_or_else(|_| {
            if mode == AlpacaMode::Paper {
                panic!("[Alpaca] ALPACA_KEY_ID is required when ALPACA_MODE is paper!");
            }
            "PK_MOCK_KEY".to_string()
        });
        let secret = std::env::var("ALPACA_SECRET_KEY").unwrap_or_else(|_| {
            if mode == AlpacaMode::Paper {
                panic!("[Alpaca] ALPACA_SECRET_KEY is required when ALPACA_MODE is paper!");
            }
            "SK_MOCK_SECRET".to_string()
        });

        tracing::info!("[Alpaca] Client initialized in {:?} mode", mode);

        Self {
            api_key: key,
            api_secret: secret,
            mode,
            client: Client::new(),
        }
    }

    /// Fetch historical OHLCV data for backtesting.
    pub async fn get_historical_bars(
        &self,
        symbol: &str,
        timeframe: &str,
        start: &str,
        end: &str,
    ) -> Result<Vec<AlpacaBar>, String> {
        let url = format!("{}/stocks/bars", ALPACA_DATA_URL);
        
        // Let's mock the response if mode is Mock
        if self.mode == AlpacaMode::Mock {
            tracing::warn!("[Alpaca] Using mock mode. Falling back to synthetic historical bars for {}", symbol);
            return Ok(vec![
                AlpacaBar { t: start.to_string(), o: 100.0, h: 105.0, l: 99.0, c: 104.0, v: 1000.0, n: 10, vw: 102.5 },
                AlpacaBar { t: end.to_string(), o: 104.0, h: 110.0, l: 103.0, c: 109.0, v: 1500.0, n: 15, vw: 106.0 },
            ]);
        }

        let resp = self
            .client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .query(&[
                ("symbols", symbol),
                ("timeframe", timeframe),
                ("start", start),
                ("end", end),
                ("limit", "10000"), // Pull as much as we can
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to call Alpaca data API: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Alpaca API error: {}", resp.status()));
        }

        let parsed: AlpacaBarsResponse = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Alpaca response: {}", e))?;

        if let Some(bars) = parsed.bars.get(symbol) {
            Ok(bars.clone())
        } else {
            Ok(vec![])
        }
    }

    /// Submit an order to the Paper API
    pub async fn submit_order(&self, req: &OrderRequest) -> Result<Value, String> {
        let url = format!("{}/orders", ALPACA_PAPER_URL);

        if self.mode == AlpacaMode::Mock {
            tracing::warn!("[Alpaca] Mocking order submission: {:?} {} {}", req.side, req.qty, req.symbol);
            return Ok(serde_json::json!({
                "id": uuid::Uuid::new_v4().to_string(),
                "status": "accepted",
                "symbol": req.symbol,
                "qty": req.qty,
                "side": req.side
            }));
        }

        // Must serialize the inner `type_` field to `type` in the API payload.
        let payload = serde_json::json!({
            "symbol": req.symbol,
            "qty": req.qty,
            "side": req.side,
            "type": req.type_,
            "time_in_force": req.time_in_force
        });

        let resp = self
            .client
            .post(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed paper order request: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Alpaca Order error: {} - {}", status, body));
        }

        let parsed: Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Alpaca order response: {}", e))?;

        Ok(parsed)
    }

    /// Fetch active US equity assets from Alpaca to build universe scans
    pub async fn get_active_assets(&self) -> Result<Vec<AlpacaAsset>, String> {
        let url = format!("{}/assets", ALPACA_PAPER_URL);

        if self.mode == AlpacaMode::Mock {
            tracing::warn!("[Alpaca] Using mock mode. Falling back to synthetic universe assets");
            let mock_asset = AlpacaAsset {
                id: "uuid-mock".to_string(),
                class: "us_equity".to_string(),
                exchange: "NASDAQ".to_string(),
                symbol: "NVDA".to_string(),
                name: "Nvidia Corp".to_string(),
                status: "active".to_string(),
                tradable: true,
                marginable: true,
                shortable: true,
                easy_to_borrow: true,
                fractionable: true,
            };
            return Ok(vec![mock_asset]);
        }

        let resp = self
            .client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .query(&[
                ("status", "active"),
                ("asset_class", "us_equity"),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to call Alpaca assets API: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Alpaca API assets error: {} - {}", status, body));
        }

        let parsed: Vec<AlpacaAsset> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Alpaca assets response: {}", e))?;

        Ok(parsed)
    }

    /// Fetch open positions from Alpaca to reconcile with our local trades table
    pub async fn get_open_positions(&self) -> Result<Vec<AlpacaPosition>, String> {
        let url = format!("{}/positions", ALPACA_PAPER_URL);

        if self.mode == AlpacaMode::Mock {
            // Mock empty positions
            return Ok(vec![]);
        }

        let resp = self
            .client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| format!("Failed to call Alpaca positions API: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Alpaca API positions error: {} - {}", status, body));
        }

        let parsed: Vec<AlpacaPosition> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Alpaca positions response: {}", e))?;

        Ok(parsed)
    }

    /// Fetch account details from Alpaca (buying power, equity, etc)
    pub async fn get_account(&self) -> Result<AlpacaAccount, String> {
        let url = format!("{}/account", ALPACA_PAPER_URL);

        if self.mode == AlpacaMode::Mock {
            tracing::warn!("[Alpaca] Using mock mode. Falling back to synthetic account details.");
            return Ok(AlpacaAccount {
                id: "mock-account-id".to_string(),
                account_number: "MOCK123456".to_string(),
                status: "ACTIVE".to_string(),
                currency: "USD".to_string(),
                buying_power: "100000.0".to_string(),
                regt_buying_power: "100000.0".to_string(),
                daytrading_buying_power: "100000.0".to_string(),
                non_marginable_buying_power: "100000.0".to_string(),
                cash: "100000.0".to_string(),
                portfolio_value: "100000.0".to_string(),
                pattern_day_trader: false,
                trading_blocked: false,
                transfers_blocked: false,
                account_blocked: false,
                created_at: "2024-01-01T00:00:00Z".to_string(),
                trade_suspended_by_user: false,
                multiplier: "1".to_string(),
                shorting_enabled: false,
                equity: "100000.0".to_string(),
                last_equity: "100000.0".to_string(),
                long_market_value: "0.0".to_string(),
                short_market_value: "0.0".to_string(),
                initial_margin: "0.0".to_string(),
                maintenance_margin: "0.0".to_string(),
                last_maintenance_margin: "0.0".to_string(),
                sma: "0.0".to_string(),
                daytrade_count: 0,
            });
        }

        let resp = self
            .client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| format!("Failed to call Alpaca account API: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Alpaca API account error: {} - {}", status, body));
        }

        let parsed: AlpacaAccount = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Alpaca account response: {}", e))?;

        Ok(parsed)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AlpacaPosition {
    pub asset_id: String,
    pub symbol: String,
    pub exchange: String,
    pub asset_class: String,
    pub avg_entry_price: String,
    pub qty: String,
    pub side: String,
    pub market_value: String,
    pub cost_basis: String,
    pub unrealized_pl: String,
    pub unrealized_plpc: String,
    pub unrealized_intraday_pl: String,
    pub unrealized_intraday_plpc: String,
    pub current_price: String,
    pub lastday_price: String,
    pub change_today: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AlpacaAccount {
    pub id: String,
    pub account_number: String,
    pub status: String,
    pub currency: String,
    pub buying_power: String,
    pub regt_buying_power: String,
    pub daytrading_buying_power: String,
    pub non_marginable_buying_power: String,
    pub cash: String,
    pub portfolio_value: String,
    pub pattern_day_trader: bool,
    pub trading_blocked: bool,
    pub transfers_blocked: bool,
    pub account_blocked: bool,
    pub created_at: String,
    pub trade_suspended_by_user: bool,
    pub multiplier: String,
    pub shorting_enabled: bool,
    pub equity: String,
    pub last_equity: String,
    pub long_market_value: String,
    pub short_market_value: String,
    pub initial_margin: String,
    pub maintenance_margin: String,
    pub last_maintenance_margin: String,
    pub sma: String,
    pub daytrade_count: i32,
}

