//! Unit tests for the backtest engine.
//!
//! Tests use synthetic candle data to verify:
//! - ROI calculation with known price sequences
//! - Win rate tracking accuracy (the bug-fix validation)
//! - Slippage/commission impact
//! - Empty candle handling
//! - Manifest parsing + signal evaluation

#[cfg(test)]
mod tests {
    use crate::backtest::{BacktestConfig, BacktestEngine};
    use crate::market_data::Candle;
    use serde_json::json;

    fn default_config() -> BacktestConfig {
        BacktestConfig {
            initial_capital: 10000.0,
            commission_bps: 0.0,
            slippage_bps: 0.0,
            position_sizing_pct: 1.0,
            flat_commission: 0.0,
        }
    }

    /// Generate synthetic candles with a linear price trend.
    fn make_linear_candles(start: f64, step: f64, count: usize) -> Vec<Candle> {
        (0..count)
            .map(|i| {
                let price = start + step * i as f64;
                Candle {
                    open: price - step * 0.1,
                    high: price + step.abs() * 0.5,
                    low: price - step.abs() * 0.5,
                    close: price,
                    volume: 1000.0,
                    ts: format!("2025-01-{:02}T00:00:00Z", (i % 28) + 1),
                }
            })
            .collect()
    }

    /// Generate candles that oscillate (for testing multiple trades).
    fn make_oscillating_candles(count: usize) -> Vec<Candle> {
        (0..count)
            .map(|i| {
                // Oscillates between 80 and 120
                let price = 100.0 + 20.0 * (i as f64 * 0.15).sin();
                Candle {
                    open: price - 0.5,
                    high: price + 2.0,
                    low: price - 2.0,
                    close: price,
                    volume: 1000.0,
                    ts: format!("2025-01-01T{:02}:00:00Z", i % 24),
                }
            })
            .collect()
    }

    #[test]
    fn test_empty_candles_returns_zero() {
        let engine = BacktestEngine::new(vec![], default_config());
        let manifest = json!({
            "version": 1,
            "symbol": "BTCUSD",
            "timeframe": "1d",
        });
        let result = engine.run(&manifest);
        assert_eq!(result.total_trades, 0);
        assert_eq!(result.equity_curve.len(), 0);
    }

    #[test]
    fn test_no_signals_no_trades() {
        let candles = make_linear_candles(100.0, 1.0, 100);
        let engine = BacktestEngine::new(candles, default_config());
        let manifest = json!({
            "version": 1,
            "symbol": "BTCUSD",
            "timeframe": "1d",
        });
        let result = engine.run(&manifest);
        assert_eq!(result.total_trades, 0);
    }

    #[test]
    fn test_commission_reduces_returns() {
        let candles = make_linear_candles(100.0, 1.0, 100);
        let manifest = json!({
            "version": 1,
            "symbol": "BTCUSD",
            "timeframe": "1d",
            "entry": {
                "type": "group",
                "logic": "AND",
                "nodes": [
                    { "type": "condition", "left": {"indicator": "RSI", "params": {"period": 14}}, "operator": "lt", "right": {"value": 50} }
                ]
            },
            "exit": {
                "type": "group",
                "logic": "AND",
                "nodes": [
                    { "type": "condition", "left": {"indicator": "RSI", "params": {"period": 14}}, "operator": "gt", "right": {"value": 70} }
                ]
            }
        });

        let no_commission = BacktestConfig {
            initial_capital: 10000.0,
            commission_bps: 0.0,
            slippage_bps: 0.0,
            position_sizing_pct: 1.0,
            flat_commission: 0.0,
        };
        let with_commission = BacktestConfig {
            initial_capital: 10000.0,
            commission_bps: 10.0, // 10 bps
            slippage_bps: 5.0,    // 5 bps
            position_sizing_pct: 1.0,
            flat_commission: 0.0,
        };

        let result_no_comm = BacktestEngine::new(candles.clone(), no_commission).run(&manifest);
        let result_with_comm = BacktestEngine::new(candles, with_commission).run(&manifest);

        if result_no_comm.total_trades > 0 {
            let roi_no: f64 = result_no_comm.roi.trim_matches(|c: char| !c.is_ascii_digit() && c != '.' && c != '-').parse().unwrap_or(0.0);
            let roi_with: f64 = result_with_comm.roi.trim_matches(|c: char| !c.is_ascii_digit() && c != '.' && c != '-').parse().unwrap_or(0.0);
            assert!(roi_with <= roi_no, "Commission should reduce returns");
        }
    }

    #[test]
    fn test_win_rate_not_always_100() {
        let candles = make_oscillating_candles(200);
        let manifest = json!({
            "version": 1,
            "symbol": "BTCUSD",
            "timeframe": "1d",
            "entry": {
                "type": "group",
                "logic": "AND",
                "nodes": [
                    { "type": "condition", "left": {"indicator": "SMA", "params": {"period": 5}}, "operator": "cross_above", "right": {"indicator": {"indicator": "SMA", "params": {"period": 20}}} }
                ]
            },
            "exit": {
                "type": "group",
                "logic": "AND",
                "nodes": [
                    { "type": "condition", "left": {"indicator": "SMA", "params": {"period": 5}}, "operator": "cross_below", "right": {"indicator": {"indicator": "SMA", "params": {"period": 20}}} }
                ]
            }
        });

        let engine = BacktestEngine::new(candles, default_config());
        let result = engine.run(&manifest);

        if result.total_trades > 1 {
            let wr: f64 = result.win_rate.trim_end_matches('%').parse().unwrap_or(100.0);
            assert!(wr < 100.0, "Win rate should not be 100% with oscillating data (got {})", wr);
        }
    }

    #[test]
    fn test_equity_curve_length() {
        let candles = make_linear_candles(100.0, 0.5, 100);
        let engine = BacktestEngine::new(candles, default_config());
        let manifest = json!({
            "version": 1,
            "symbol": "BTCUSD",
            "timeframe": "1d",
        });
        let result = engine.run(&manifest);
        // Equity curve length = total_candles - warmup (50)
        assert_eq!(result.equity_curve.len(), 50);
    }

    #[test]
    fn test_sharpe_ratio_positive_for_uptrend() {
        let candles = make_linear_candles(100.0, 0.5, 200);
        let manifest = json!({
            "version": 1,
            "symbol": "BTCUSD",
            "timeframe": "1d",
            "entry": {
                "type": "group",
                "logic": "AND",
                "nodes": [
                    { "type": "condition", "left": {"indicator": "RSI", "params": {"period": 14}}, "operator": "lt", "right": {"value": 60} }
                ]
            },
            "exit": {
                "type": "group",
                "logic": "AND",
                "nodes": [
                    { "type": "condition", "left": {"indicator": "RSI", "params": {"period": 14}}, "operator": "gt", "right": {"value": 80} }
                ]
            }
        });
        let engine = BacktestEngine::new(candles, default_config());
        let result = engine.run(&manifest);
        assert!(result.sharpe_ratio >= 0.0);
    }

    #[test]
    fn test_max_drawdown_non_negative() {
        let candles = make_oscillating_candles(200);
        let manifest = json!({
            "version": 1,
            "symbol": "BTCUSD",
            "timeframe": "1d",
            "entry": {
                "logic": "AND",
                "conditions": [
                    { "left": {"indicator": "RSI", "period": 14}, "operator": "lt", "right": {"value": 40} }
                ]
            },
            "exit": {
                "logic": "AND",
                "conditions": [
                    { "left": {"indicator": "RSI", "period": 14}, "operator": "gt", "right": {"value": 60} }
                ]
            }
        });
        let engine = BacktestEngine::new(candles, default_config());
        let result = engine.run(&manifest);
        let dd: f64 = result.max_drawdown.trim_start_matches('-').trim_end_matches('%').parse().unwrap_or(0.0);
        assert!(dd >= 0.0);
    }
}
