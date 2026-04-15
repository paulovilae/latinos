//! Risk Engine
//! Provides pre-trade and intra-day risk controls for active bots.
//! Prevent over-exposure, enforce max drawdown limits, and stop duplicate trades.

use crate::manifest_eval::RiskConfig;

#[derive(Debug)]
pub enum RiskError {
    MaxExposureExceeded,
    DrawdownLimitHit(f64),
    ConcentrationLimitBreached,
    DuplicateOrder,
    InvalidOrderPrecision,
    InsufficientCapital(f64),
}

/// Context passed into the risk evaluation step
pub struct PortfolioContext {
    pub total_equity: f64,
    pub buying_power: f64,
    pub open_positions_count: usize,
    pub open_position_exposure: f64,
}

pub struct BotRiskContext {
    pub bot_id: i32,
    pub is_paused_by_drawdown: bool,
    pub daily_trade_count: usize,
    pub current_drawdown_pct: f64,
}

pub struct RiskEngine {
    pub max_portfolio_exposure_pct: f64, // Engine wide hard limit (can't allocate more than this to one symbol)
}

impl Default for RiskEngine {
    fn default() -> Self {
        Self {
            max_portfolio_exposure_pct: 0.20, // Max 20% equity per symbol globally
        }
    }
}

impl RiskEngine {
    pub fn new() -> Self {
        Self::default()
    }

    /// Evaluates if an order for a given bot passes risk constraints.
    pub fn evaluate_order(
        &self,
        _symbol: &str,
        side: &str,
        requested_qty: f64,
        price: f64,
        portfolio: &PortfolioContext,
        bot_ctx: &BotRiskContext,
        manifest_risk: Option<&RiskConfig>,
    ) -> Result<f64, RiskError> {
        if requested_qty <= 0.0 {
            return Err(RiskError::InvalidOrderPrecision);
        }

        // Check if bot is globally paused by drawdown
        if bot_ctx.is_paused_by_drawdown {
            return Err(RiskError::DrawdownLimitHit(bot_ctx.current_drawdown_pct));
        }

        let order_value = requested_qty * price;

        // Validation 1: Hard concentration limits (engine wide)
        let concentration = order_value / portfolio.total_equity.max(1.0);
        if concentration > self.max_portfolio_exposure_pct {
            return Err(RiskError::ConcentrationLimitBreached);
        }

        // Validation 2: Buying power check
        if order_value > portfolio.buying_power {
            return Err(RiskError::InsufficientCapital(order_value));
        }

        // Validation 3: Manifest defined risk rules
        if let Some(r) = manifest_risk {
            // Respect position sizing max dynamically
            if let Some(sizing_pct) = r.position_sizing_pct {
                let allowed_value = portfolio.total_equity * sizing_pct;
                if order_value > allowed_value {
                    return Err(RiskError::MaxExposureExceeded);
                }
            }

            if let Some(max_positions) = r.max_open_positions {
                // If it's a buy order and we're at or over the max_open_positions allowed by the manifest
                if side == "buy" && portfolio.open_positions_count >= max_positions {
                    return Err(RiskError::DuplicateOrder);
                }
            }

            if let Some(msl) = r.max_drawdown_pause_pct {
                if bot_ctx.current_drawdown_pct >= msl {
                    return Err(RiskError::DrawdownLimitHit(bot_ctx.current_drawdown_pct));
                }
            }

            if let Some(mdt) = r.max_daily_trades {
                if side == "buy" && bot_ctx.daily_trade_count >= mdt {
                    return Err(RiskError::DuplicateOrder); // Or a specific DailyLimitHit error
                }
            }
        }

        Ok(requested_qty)
    }
}
