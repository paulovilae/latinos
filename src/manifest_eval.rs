use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestV1 {
    pub version: i32,
    pub symbol: String,
    pub timeframe: String,
    pub direction: Option<String>, // "long_only", "short_only", "both"
    #[serde(default)]
    pub entry: Option<LogicNode>,
    #[serde(default)]
    pub exit: Option<LogicNode>,
    #[serde(default)]
    pub execution: Option<ExecutionConfig>,
    #[serde(default)]
    pub risk: Option<RiskConfig>,
    #[serde(default)]
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LogicNode {
    #[serde(rename = "group")]
    Group {
        logic: String, // "AND" or "OR"
        nodes: Vec<LogicNode>,
    },
    #[serde(rename = "condition")]
    Condition {
        left: IndicatorRef,
        operator: String, // gt, gte, lt, lte, eq, cross_above, cross_below
        right: TargetRef,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum TargetRef {
    Value { value: f64 },
    Indicator(IndicatorRef),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndicatorRef {
    pub indicator: String,
    #[serde(default)]
    pub params: Option<IndicatorParams>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndicatorParams {
    pub period: Option<usize>,
    pub fast: Option<usize>,
    pub slow: Option<usize>,
    pub signal: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionConfig {
    pub order_type: String, // "market", "limit"
    pub time_in_force: String, // "day", "gtc"
    pub cooldown_bars: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskConfig {
    pub position_sizing_pct: Option<f64>,
    pub stop_loss_pct: Option<f64>,
    pub take_profit_pct: Option<f64>,
    pub max_holding_bars: Option<usize>,
    pub max_open_positions: Option<usize>,
    pub max_daily_trades: Option<usize>,
    pub max_drawdown_pause_pct: Option<f64>,
}

impl ManifestV1 {
    pub fn parse_value(val: &Value) -> Result<Self, Vec<String>> {
        let mut errors = Vec::new();
        let parsed: Result<Self, _> = serde_json::from_value(val.clone());
        match parsed {
            Ok(manifest) => {
                if manifest.version != 1 {
                    errors.push(format!("Unsupported manifest version: {}", manifest.version));
                }
                
                // Validate Indicators & Operators
                if let Some(entry) = &manifest.entry {
                    manifest.validate_logic_node(entry, &mut errors);
                }
                if let Some(exit) = &manifest.exit {
                    manifest.validate_logic_node(exit, &mut errors);
                }

                if errors.is_empty() {
                    Ok(manifest)
                } else {
                    Err(errors)
                }
            },
            Err(e) => {
                tracing::warn!("[Manifest Eval] Failed to parse manifest structure: {}", e);
                Err(vec![format!("Structural JSON Error: {}", e)])
            },
        }
    }

    fn validate_logic_node(&self, node: &LogicNode, errors: &mut Vec<String>) {
        match node {
            LogicNode::Group { logic, nodes } => {
                let l = logic.to_uppercase();
                if l != "AND" && l != "OR" {
                    errors.push(format!("Invalid group logic operator: {}", logic));
                }
                for n in nodes {
                    self.validate_logic_node(n, errors);
                }
            },
            LogicNode::Condition { left, operator, right } => {
                let valid_operators = ["gt", "gte", "lt", "lte", "eq", "cross_above", "cross_below"];
                if !valid_operators.contains(&operator.as_str()) {
                    errors.push(format!("Invalid condition operator: {}", operator));
                }
                self.validate_indicator_ref(left, errors);
                
                if let TargetRef::Indicator(ind_ref) = right {
                    self.validate_indicator_ref(ind_ref, errors);
                }
            }
        }
    }

    fn validate_indicator_ref(&self, ind: &IndicatorRef, errors: &mut Vec<String>) {
        let valid_indicators = [
            "CLOSE", "OPEN", "HIGH", "LOW", "VOLUME", 
            "SMA", "EMA", "RSI", "MACD_LINE", "MACD_SIGNAL",
            "BOLLINGER_UPPER", "BOLLINGER_LOWER", "BOLLINGER_MID"
        ];
        if !valid_indicators.contains(&ind.indicator.trim().to_uppercase().as_str()) {
            errors.push(format!("Invalid indicator specified: {}", ind.indicator));
        }
    }

    pub fn to_indicator_string(ind: &IndicatorRef) -> String {
        let params = ind.params.as_ref();
        match ind.indicator.as_str() {
            "CLOSE" | "OPEN" | "HIGH" | "LOW" | "VOLUME" => ind.indicator.clone(),
            "SMA" | "EMA" | "RSI" => format!("{}_{}", ind.indicator, params.and_then(|p| p.period).unwrap_or(14)),
            "MACD_LINE" | "MACD_SIGNAL" => format!("{}_{}_{}_{}", ind.indicator, params.and_then(|p| p.fast).unwrap_or(12), params.and_then(|p| p.slow).unwrap_or(26), params.and_then(|p| p.signal).unwrap_or(9)),
            _ => ind.indicator.clone(),
        }
    }
}
