// Deterministic Benchmark of the Trading Scanner
use latinos_rust::risk_engine::{RiskEngine, BotRiskContext, PortfolioContext};
use latinos_rust::manifest_eval::RiskConfig;

#[test]
fn test_scanner_performance() {
    let start = std::time::Instant::now();
    
    // Create a mock workload:
    let engine = RiskEngine::new();
    let mut passed = 0;
    
    let portfolio_ctx = PortfolioContext {
        total_equity: 10000.0,
        buying_power: 5000.0,
        open_positions_count: 2,
        open_position_exposure: 0.0,
    };

    let manifest_risk = RiskConfig {
        position_sizing_pct: Some(10.0),
        stop_loss_pct: Some(5.0),
        take_profit_pct: Some(10.0),
        max_holding_bars: None,
        max_open_positions: Some(5),
        max_daily_trades: Some(50),
        max_drawdown_pause_pct: None,
    };
    
    for i in 0..10_000 {
        let ctx = BotRiskContext {
            bot_id: i as i32,
            daily_trade_count: (i % 10) as usize,
            current_drawdown_pct: if i % 100 == 0 { -10.0 } else { 1.0 },
            is_paused_by_drawdown: false,
        };
        
        let decision = engine.evaluate_order(
            "long",
            "AAPL",
            10.0,
            100.0,
            &portfolio_ctx,
            &ctx,
            Some(&manifest_risk),
        );
        
        if decision.is_ok() {
            passed += 1;
        }
    }
    
    let duration = start.elapsed();
    println!("Scanner benchmark evaluated 10,000 bots in {:?}", duration);
    assert!(duration.as_millis() < 500, "Performance degradation detected!");
}
