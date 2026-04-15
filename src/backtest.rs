use crate::manifest_eval::{LogicNode, ManifestV1, TargetRef};
use crate::market_data::Candle;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationResult {
    pub roi: String,
    pub win_rate: String,
    pub total_trades: i32,
    pub max_drawdown: String,
    pub sharpe_ratio: f64,
    pub sortino_ratio: f64,
    pub cagr: String,
    pub turnover: String,
    pub equity_curve: Vec<f64>,
}

#[derive(Debug, Clone)]
pub struct BacktestConfig {
    pub initial_capital: f64,
    pub commission_bps: f64,
    pub slippage_bps: f64,
    pub position_sizing_pct: f64,
    pub flat_commission: f64,
}

pub struct BacktestEngine {
    candles: Vec<Candle>,
    config: BacktestConfig,
}

impl BacktestEngine {
    pub fn new(candles: Vec<Candle>, config: BacktestConfig) -> Self {
        Self { candles, config }
    }

    /// Evaluates a specific LogicNode against the current state
    fn eval_node(
        &self,
        node: &LogicNode,
        current_idx: usize,
        indicators: &std::collections::HashMap<String, Vec<f64>>,
    ) -> bool {
        match node {
            LogicNode::Group { logic, nodes } => {
                if nodes.is_empty() {
                    return false;
                }
                if logic == "AND" {
                    nodes.iter().all(|n| self.eval_node(n, current_idx, indicators))
                } else if logic == "OR" {
                    nodes.iter().any(|n| self.eval_node(n, current_idx, indicators))
                } else {
                    false
                }
            }
            LogicNode::Condition { left, operator, right } => {
                let ind_a_str = ManifestV1::to_indicator_string(left);
                let val_a = if ind_a_str == "CLOSE" {
                    self.candles[current_idx].close
                } else if ind_a_str == "OPEN" {
                    self.candles[current_idx].open
                } else if ind_a_str == "HIGH" {
                    self.candles[current_idx].high
                } else if ind_a_str == "LOW" {
                    self.candles[current_idx].low
                } else if ind_a_str == "VOLUME" {
                    self.candles[current_idx].volume as f64
                } else {
                    match indicators.get(&ind_a_str) {
                        Some(data) => {
                            if !data[current_idx].is_nan() {
                                data[current_idx]
                            } else {
                                return false;
                            }
                        }
                        None => return false,
                    }
                };

                let val_b = match right {
                    TargetRef::Value { value } => *value,
                    TargetRef::Indicator(ind_b) => {
                        let ind_b_str = ManifestV1::to_indicator_string(ind_b);
                        if ind_b_str == "CLOSE" {
                            self.candles[current_idx].close
                        } else if ind_b_str == "OPEN" {
                            self.candles[current_idx].open
                        } else if ind_b_str == "HIGH" {
                            self.candles[current_idx].high
                        } else if ind_b_str == "LOW" {
                            self.candles[current_idx].low
                        } else if ind_b_str == "VOLUME" {
                            self.candles[current_idx].volume as f64
                        } else {
                            match indicators.get(&ind_b_str) {
                                Some(data) => {
                                    if !data[current_idx].is_nan() {
                                        data[current_idx]
                                    } else {
                                        return false;
                                    }
                                }
                                None => return false,
                            }
                        }
                    }
                };

                match operator.as_str() {
                    "gt" => val_a > val_b,
                    "gte" => val_a >= val_b,
                    "lt" => val_a < val_b,
                    "lte" => val_a <= val_b,
                    "eq" => (val_a - val_b).abs() < f64::EPSILON,
                    "cross_above" => {
                        if current_idx == 0 {
                            return false;
                        }
                        let prev_a = if ind_a_str == "CLOSE" {
                            self.candles[current_idx - 1].close
                        } else {
                            indicators.get(&ind_a_str).unwrap()[current_idx - 1]
                        };
                        let prev_b = match right {
                            TargetRef::Value { value } => *value,
                            TargetRef::Indicator(ind_b) => {
                                let b_str = ManifestV1::to_indicator_string(ind_b);
                                if b_str == "CLOSE" { self.candles[current_idx - 1].close } else { indicators.get(&b_str).unwrap()[current_idx - 1] }
                            }
                        };
                        prev_a <= prev_b && val_a > val_b
                    }
                    "cross_below" => {
                        if current_idx == 0 {
                            return false;
                        }
                        let prev_a = if ind_a_str == "CLOSE" {
                            self.candles[current_idx - 1].close
                        } else {
                            indicators.get(&ind_a_str).unwrap()[current_idx - 1]
                        };
                        let prev_b = match right {
                            TargetRef::Value { value } => *value,
                            TargetRef::Indicator(ind_b) => {
                                let b_str = ManifestV1::to_indicator_string(ind_b);
                                if b_str == "CLOSE" { self.candles[current_idx - 1].close } else { indicators.get(&b_str).unwrap()[current_idx - 1] }
                            }
                        };
                        prev_a >= prev_b && val_a < val_b
                    }
                    _ => false,
                }
            }
        }
    }

    fn collect_needed_indicators(node: &LogicNode, needed: &mut std::collections::HashSet<String>) {
        match node {
            LogicNode::Group { nodes, .. } => {
                for n in nodes {
                    Self::collect_needed_indicators(n, needed);
                }
            }
            LogicNode::Condition { left, right, .. } => {
                let a = ManifestV1::to_indicator_string(left);
                if a != "CLOSE" && a != "OPEN" && a != "HIGH" && a != "LOW" && a != "VOLUME" {
                    needed.insert(a);
                }
                if let TargetRef::Indicator(b_ref) = right {
                    let b = ManifestV1::to_indicator_string(b_ref);
                    if b != "CLOSE" && b != "OPEN" && b != "HIGH" && b != "LOW" && b != "VOLUME" {
                        needed.insert(b);
                    }
                }
            }
        }
    }

    /// Pre-compute indicators needed for the strategy
    fn compute_indicators(&self, evaluator: &ManifestV1) -> std::collections::HashMap<String, Vec<f64>> {
        let mut map = std::collections::HashMap::new();
        let closes: Vec<f64> = self.candles.iter().map(|c| c.close).collect();

        // Collect all distinct indicator names
        let mut needed = std::collections::HashSet::new();
        if let Some(entry) = &evaluator.entry {
            Self::collect_needed_indicators(entry, &mut needed);
        }
        if let Some(exit) = &evaluator.exit {
            Self::collect_needed_indicators(exit, &mut needed);
        }

        // Parse strings back (simple for now since we format them deterministically)
        for ind_str in needed {
            let parts: Vec<&str> = ind_str.split('_').collect();
            if parts.is_empty() {
                continue;
            }
            match parts[0] {
                "RSI" => {
                    let period = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(14);
                    map.insert(ind_str.clone(), crate::indicators::rsi(&closes, period));
                }
                "SMA" => {
                    let period = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(50);
                    map.insert(ind_str.clone(), crate::indicators::sma(&closes, period));
                }
                "MACD" => {
                    if ind_str.starts_with("MACD_LINE") || ind_str.starts_with("MACD_SIGNAL") {
                        let fast = parts.get(2).and_then(|s| s.parse().ok()).unwrap_or(12);
                        let slow = parts.get(3).and_then(|s| s.parse().ok()).unwrap_or(26);
                        let sig = parts.get(4).and_then(|s| s.parse().ok()).unwrap_or(9);
                        let (macd_line, signal_line, _) = crate::indicators::macd(&closes, fast, slow, sig);
                        
                        let line_name = format!("MACD_LINE_{}_{}_{}", fast, slow, sig);
                        let sig_name = format!("MACD_SIGNAL_{}_{}_{}", fast, slow, sig);
                        
                        map.insert(line_name, macd_line);
                        map.insert(sig_name, signal_line);
                    }
                }
                _ => {}
            }
        }

        map
    }

    /// Executes the trading logic and returns simulation results
    pub fn run(&self, manifest: &Value) -> SimulationResult {
        let total_candles = self.candles.len();
        if total_candles == 0 {
            return SimulationResult {
                roi: "+0.00%".to_string(),
                win_rate: "0.0%".to_string(),
                total_trades: 0,
                max_drawdown: "-0.00%".to_string(),
                sharpe_ratio: 0.0,
                sortino_ratio: 0.0,
                cagr: "0.0%".to_string(),
                turnover: "0.0x".to_string(),
                equity_curve: vec![],
            };
        }

        let evaluator = ManifestV1::parse_value(manifest);
        if evaluator.is_err() {
            // Cannot parse manifest, return flat
            return SimulationResult {
                roi: "+0.00%".to_string(),
                win_rate: "0.0%".to_string(),
                total_trades: 0,
                max_drawdown: "-0.00%".to_string(),
                sharpe_ratio: 0.0,
                sortino_ratio: 0.0,
                cagr: "0.0%".to_string(),
                turnover: "0.0x".to_string(),
                equity_curve: vec![],
            };
        }
        let evaluator = evaluator.unwrap();
        let indicators = self.compute_indicators(&evaluator);
        
        // Use risk config if provided
        let pos_sizing = evaluator.risk.as_ref().and_then(|r| r.position_sizing_pct).unwrap_or(self.config.position_sizing_pct);

        let mut balance = self.config.initial_capital;
        let mut position = 0.0;
        let mut entry_price = 0.0;

        let mut trades_won = 0;
        let mut trades_total = 0;
        let mut peak_balance = self.config.initial_capital;
        let mut max_drawdown_amount = 0.0;
        let mut total_traded_volume = 0.0;

        let mut is_in_trade = false;
        let mut equity_curve: Vec<f64> = Vec::with_capacity(total_candles);

        // Warmup: Wait for SMA50 or largest period
        let warmup = 50;

        for i in warmup..total_candles {
            let current_price = self.candles[i].close;

            let mut try_entry_eval = false;
            let mut try_exit_eval = false;

            // Evaluate Entry
            if let Some(entry) = &evaluator.entry {
                try_entry_eval = self.eval_node(entry, i, &indicators);
            }

            // Evaluate Exit
            if let Some(exit) = &evaluator.exit {
                try_exit_eval = self.eval_node(exit, i, &indicators);
            }

            if match evaluator.direction.as_deref() {
                Some("both") => true, // handled manually in a more complex engine
                Some("short_only") => false, // fallback, short not implemented yet
                _ => true // Default long_only
            } {
                if !is_in_trade && try_entry_eval {
                    let cost = balance * pos_sizing;
                    let commission = (cost * self.config.commission_bps / 10000.0) + self.config.flat_commission;
                    let execution_price = current_price * (1.0 + self.config.slippage_bps / 10000.0);
                    
                    let qty = (cost - commission) / execution_price;
                    position = qty;
                    balance -= cost;
                    entry_price = execution_price;
                    is_in_trade = true;
                    total_traded_volume += cost;
                } else if is_in_trade && try_exit_eval {
                    let gross_proceeds = position * current_price * (1.0 - self.config.slippage_bps / 10000.0);
                    let commission = (gross_proceeds * self.config.commission_bps / 10000.0) + self.config.flat_commission;
                    let net_proceeds = gross_proceeds - commission;
                    
                    let entry_cost = position * entry_price;
                    
                    trades_total += 1;
                    if net_proceeds > entry_cost {
                        trades_won += 1;
                    }
                    balance += net_proceeds;
                    total_traded_volume += gross_proceeds;
                    position = 0.0;
                    is_in_trade = false;
                }
            }
            
            // Mark to market
            let current_equity = if is_in_trade {
                balance + (position * current_price)
            } else {
                balance
            };
            
            if current_equity > peak_balance {
                peak_balance = current_equity;
            } else {
                let current_dd = peak_balance - current_equity;
                if current_dd > max_drawdown_amount {
                    max_drawdown_amount = current_dd;
                }
            }
            
            equity_curve.push(current_equity);
        }

        // Close any open position at the end
        if is_in_trade {
            let final_price = self.candles[total_candles - 1].close;
            let gross_proceeds = position * final_price * (1.0 - self.config.slippage_bps / 10000.0);
            let commission = (gross_proceeds * self.config.commission_bps / 10000.0) + self.config.flat_commission;
            let net_proceeds = gross_proceeds - commission;
            
            let entry_cost = position * entry_price;
            
            trades_total += 1;
            if net_proceeds > entry_cost {
                trades_won += 1;
            }
            balance += net_proceeds;
            total_traded_volume += gross_proceeds;
        }

        let profit = balance - self.config.initial_capital;
        let roi_pct = (profit / self.config.initial_capital) * 100.0;

        let win_rate = if trades_total > 0 {
            (trades_won as f64 / trades_total as f64) * 100.0
        } else {
            0.0
        };

        let max_dd_pct = if peak_balance > 0.0 {
            (max_drawdown_amount / peak_balance) * 100.0
        } else {
            0.0
        };

        // Calculate Returns from equity curve for Sharpe & Sortino
        let mut returns = Vec::new();
        let mut down_returns = Vec::new();
        for i in 1..equity_curve.len() {
            let ret = if equity_curve[i - 1] > 0.0 {
                (equity_curve[i] - equity_curve[i - 1]) / equity_curve[i - 1]
            } else {
                0.0
            };
            returns.push(ret);
            if ret < 0.0 {
                down_returns.push(ret);
            }
        }

        let mean_return = if returns.is_empty() { 0.0 } else { returns.iter().sum::<f64>() / returns.len() as f64 };
        let std_dev = if returns.len() < 2 { 0.0 } else {
            let variance = returns.iter().map(|&x| (x - mean_return).powi(2)).sum::<f64>() / (returns.len() - 1) as f64;
            variance.sqrt()
        };

        let down_std_dev = if down_returns.len() < 2 { 0.0 } else {
            let down_variance = down_returns.iter().map(|&x| x.powi(2)).sum::<f64>() / down_returns.len() as f64;
            down_variance.sqrt()
        };

        let annualized_return = mean_return * 252.0;
        let annualized_std_dev = std_dev * 252.0_f64.sqrt();
        let annualized_down_std_dev = down_std_dev * 252.0_f64.sqrt();

        let sharpe = if annualized_std_dev > 0.0 { annualized_return / annualized_std_dev } else { 0.0 };
        let sortino = if annualized_down_std_dev > 0.0 { annualized_return / annualized_down_std_dev } else { 0.0 };

        let years = total_candles as f64 / 252.0;
        let cagr_pct = if years > 0.0 && balance > 0.0 {
            ((balance / self.config.initial_capital).powf(1.0 / years) - 1.0) * 100.0
        } else {
            0.0
        };

        let turnover_val = if years > 0.0 {
            (total_traded_volume / years) / self.config.initial_capital
        } else {
            total_traded_volume / self.config.initial_capital
        };

        SimulationResult {
            roi: format!(
                "{}{} {:.2}%",
                if roi_pct >= 0.0 { "+" } else { "" },
                if roi_pct >= 0.0 { "🟢" } else { "🔴" },
                roi_pct
            ),
            win_rate: format!("{:.1}%", win_rate),
            total_trades: trades_total,
            max_drawdown: format!("-{:.2}%", max_dd_pct),
            sharpe_ratio: (sharpe * 100.0).round() / 100.0,
            sortino_ratio: (sortino * 100.0).round() / 100.0,
            cagr: format!("{:.2}%", cagr_pct),
            turnover: format!("{:.2}x", turnover_val),
            equity_curve,
        }
    }

    /// Evaluates the manifest entirely over the last candle in the dataset.
    /// Returns (should_entry, should_exit) booleans.
    pub fn eval_latest(&self, manifest: &Value) -> (bool, bool) {
        if self.candles.is_empty() { return (false, false); }
        let current_idx = self.candles.len() - 1;
        let evaluator = ManifestV1::parse_value(manifest);
        if evaluator.is_err() {
            return (false, false);
        }
        let evaluator = evaluator.unwrap();
        let indicators = self.compute_indicators(&evaluator);
        
        let mut try_entry_eval = false;
        let mut try_exit_eval = false;

        if let Some(entry) = &evaluator.entry {
            try_entry_eval = self.eval_node(entry, current_idx, &indicators);
        }

        if let Some(exit) = &evaluator.exit {
            try_exit_eval = self.eval_node(exit, current_idx, &indicators);
        }
        
        (try_entry_eval, try_exit_eval)
    }
}
