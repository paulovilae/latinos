use latinos_rust::risk_engine::{RiskEngine, BotRiskContext, RiskError};
use latinos_rust::manifest_eval::RiskConfig;

#[tokio::test]
async fn test_bot_context_risk_enforcement() {
    let risk_engine = RiskEngine::new(); // uses default max_portfolio_exposure_pct = 0.20

    // Healthy Bot context
    let healthy_ctx = BotRiskContext {
        bot_id: 1,
        is_paused_by_drawdown: false,
        daily_trade_count: 2,
        current_drawdown_pct: 0.02, // 2% 
    };

    let manifest_risk = RiskConfig {
        position_sizing_pct: Some(0.05),
        stop_loss_pct: Some(0.05),
        take_profit_pct: Some(0.10),
        max_holding_bars: None,
        max_open_positions: None,
        max_daily_trades: Some(5),
        max_drawdown_pause_pct: Some(0.10),
    };

    let p_ctx = latinos_rust::risk_engine::PortfolioContext {
        total_equity: 10_000.0,
        buying_power: 5_000.0,
        open_positions_count: 1,
        open_position_exposure: 1000.0,
    };

    let result = risk_engine.evaluate_order(
        "TSLA", 
        "buy", 
        3.0, // 3 shares = $450 value, allowed because it's < 5% of 10k (which is $500)
        150.0, // price
        &p_ctx,
        &healthy_ctx,
        Some(&manifest_risk)
    );
    
    match result {
        Ok(qty) => assert_eq!(qty, 3.0), // Request allowed
        Err(e) => panic!("Expected healthy bot to be allowed, got error: {:?}", e),
    }

    // Paused Bot context
    let paused_ctx = BotRiskContext {
        bot_id: 1,
        is_paused_by_drawdown: true,
        daily_trade_count: 1,
        current_drawdown_pct: 0.15, // 15%
    };

    let result = risk_engine.evaluate_order(
        "TSLA", 
        "buy", 
        3.0,
        150.0,
        &p_ctx,
        &paused_ctx,
        Some(&manifest_risk)
    );

    assert!(result.is_err(), "Expected paused bot to be rejected by risk engine.");
    if let Err(RiskError::DrawdownLimitHit(limit)) = result {
        assert!(limit > 0.0);
    } else {
        panic!("Incorrect error type returned. Expected DrawdownLimitHit, got: {:?}", result);
    }
}
