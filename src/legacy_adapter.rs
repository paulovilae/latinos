use crate::manifest_eval::{IndicatorParams, IndicatorRef, LogicNode, ManifestV1, TargetRef};
use crate::models::_entities::latinos_bots;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde_json::Value;
use tracing::{info, warn};

pub struct LegacyAdapter;

impl LegacyAdapter {
    pub async fn migrate_legacy_bots(db: &DatabaseConnection) {
        // Fetch bots with no manifest_version
        let legacy_bots = latinos_bots::Entity::find()
            .filter(latinos_bots::Column::ManifestVersion.is_null())
            .all(db)
            .await
            .unwrap_or_default();

        if legacy_bots.is_empty() {
            return;
        }

        info!("[Legacy Adapter] Found {} legacy bots to migrate.", legacy_bots.len());

        for bot in legacy_bots {
            let mut success = false;
            let mut note = "No manifest data present. Quarantined.".to_string();
            let mut new_manifest = None;

            if let Some(m) = bot.signal_manifest.clone() {
                // Try format bump
                if let Ok(_v1) = serde_json::from_value::<ManifestV1>(m.clone()) {
                    success = true;
                    note = "Automatically promoted to v1".to_string();
                    new_manifest = Some(m.clone());
                } else if m.is_array() {
                    success = false;
                    note = "Legacy array found. Cannot safely promote arrays in strict mode. Quarantined.".to_string();
                } else {
                    // Attempt string-based condition parsing whitelist (RSI, SMA, Price Cross)
                    let entry_strings = Self::extract_legacy_strings(&m, "entry");
                    let exit_strings = Self::extract_legacy_strings(&m, "exit");

                    if !entry_strings.is_empty() {
                        let entry_node = Self::build_group_from_strings(&entry_strings);
                        let exit_node = Self::build_group_from_strings(&exit_strings);

                        let v1 = ManifestV1 {
                            version: 1,
                            symbol: "NVDA".to_string(),
                            timeframe: "1d".to_string(),
                            direction: None,
                            entry: Some(entry_node),
                            exit: Some(exit_node),
                            execution: None,
                            risk: None,
                            metadata: None,
                        };

                        new_manifest = Some(serde_json::to_value(v1).unwrap());
                        success = true;
                        note = format!("Converted legacy strings. Found {} entry, {} exit conditions.", entry_strings.len(), exit_strings.len());
                    } else {
                        success = false;
                        note = "Failed to parse into structured V1 manifest. Quarantined.".to_string();
                    }
                }
            }

            let mut active_bot: latinos_bots::ActiveModel = bot.into();
            active_bot.manifest_version = Set(Some(1));
            active_bot.manifest_status = Set(Some(if success { "adapted_v1".to_string() } else { "invalid_legacy".to_string() }));
            active_bot.manifest_migration_note = Set(Some(note));
            
            if let Some(nm) = new_manifest {
                active_bot.signal_manifest = Set(Some(nm));
            }
            if !success {
                active_bot.live_trading = Set(false); // Disable live trading for quarantined bots
            }

            if let Err(e) = active_bot.update(db).await {
                warn!("[Legacy Adapter] Failed to save migration for bot: {}", e);
            }
        }
    }



    fn extract_legacy_strings(val: &Value, key_hint: &str) -> Vec<String> {
        let mut results = Vec::new();

        if let Some(arr) = val.as_array() {
            for v in arr {
                if let Some(s) = v.as_str() {
                    results.push(s.to_string());
                }
            }
        } else if let Some(obj) = val.as_object() {
            // Check specific keys like "entry_condition" or "entry"
            let target_keys = [key_hint, &format!("{}_condition", key_hint), &format!("{}_conditions", key_hint)];
            for k in target_keys {
                if let Some(v_arr) = obj.get(k).and_then(|v| v.as_array()) {
                    for v in v_arr {
                        if let Some(s) = v.as_str() {
                            results.push(s.to_string());
                        }
                    }
                } else if let Some(v_str) = obj.get(k).and_then(|v| v.as_str()) {
                    results.push(v_str.to_string());
                }
            }
        }
        results
    }

    fn build_group_from_strings(strings: &[String]) -> LogicNode {
        let mut conditions = Vec::new();

        for s in strings {
            if let Some(cond) = Self::parse_whitelist_string(s) {
                conditions.push(cond);
            }
        }

        if conditions.is_empty() {
            // Default safe condition if it's empty
            LogicNode::Group {
                logic: "AND".to_string(),
                nodes: vec![],
            }
        } else if conditions.len() == 1 {
            conditions.into_iter().next().unwrap()
        } else {
            LogicNode::Group {
                logic: "AND".to_string(),
                nodes: conditions,
            }
        }
    }

    fn parse_whitelist_string(s: &str) -> Option<LogicNode> {
        // Very basic parsing for "RSI < 30" or "SMA_50 > SMA_200"
        let s = s.replace(" ", ""); // remove spaces

        // support <, >, <=, >=, ==
        let operators = ["<=", ">=", "==", "<", ">"];
        let mut op_found = None;
        let mut split_idx = 0;
        let mut op_len = 0;

        for op in operators {
            if let Some(idx) = s.find(op) {
                op_found = Some(op);
                split_idx = idx;
                op_len = op.len();
                break;
            }
        }

        let op = op_found?;
        let left_str = &s[0..split_idx];
        let right_str = &s[split_idx + op_len..];

        let left_ind = Self::parse_indicator(left_str)?;
        let right_val = Self::parse_target_ref(right_str)?;

        let db_op = match op {
            "<" => "lt",
            ">" => "gt",
            "<=" => "lte",
            ">=" => "gte",
            "==" => "eq",
            _ => return None,
        };

        Some(LogicNode::Condition {
            left: left_ind,
            operator: db_op.to_string(),
            right: right_val,
        })
    }

    fn parse_indicator(s: &str) -> Option<IndicatorRef> {
        let mut parts = s.split('_');
        let name = parts.next()?;
        if ["RSI", "SMA", "EMA", "CLOSE", "OPEN", "HIGH", "LOW", "VOLUME"].contains(&name.to_uppercase().as_str()) {
            let period = parts.next().and_then(|p| p.parse::<usize>().ok());
            Some(IndicatorRef {
                indicator: name.to_uppercase(),
                params: if period.is_some() {
                    Some(IndicatorParams {
                        period,
                        fast: None,
                        slow: None,
                        signal: None,
                    })
                } else {
                    None
                },
            })
        } else {
            None
        }
    }

    fn parse_target_ref(s: &str) -> Option<TargetRef> {
        if let Ok(v) = s.parse::<f64>() {
            Some(TargetRef::Value { value: v })
        } else if let Some(ind) = Self::parse_indicator(s) {
            Some(TargetRef::Indicator(ind))
        } else {
            None
        }
    }
}
