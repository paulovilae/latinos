//! Top-level Bot Engine runner
//! Manages active trading bots, evaluates their signals, and triggers paper/live executions.

use sea_orm::{DatabaseConnection, QueryFilter, ColumnTrait, EntityTrait};
use std::time::Duration;
use tracing::{info, error};

use crate::models::_entities::{latinos_bots, latinos_trades};
use crate::broker::alpaca::{AlpacaClient, OrderRequest};
use crate::risk_engine::{RiskEngine, RiskError};

const SCAN_INTERVAL_SECONDS: u64 = 60; // 1-minute paper trading sweep

pub async fn start_bot_engine(db: DatabaseConnection) {
    tokio::spawn(async move {
        info!("[Bot Engine] Started master trading loop.");
        
        let mut loop_count = 0;
        loop {
            loop_count += 1;
            
            // Only run heavy logic every 5 minutes if no immediate logic is required, 
            // but we sweep every minute.
            if loop_count % 5 == 0 {
                if let Err(e) = run_paper_trading_tick(&db).await {
                    error!("[Bot Engine] Tick failed: {}", e);
                }
            }
            
            tokio::time::sleep(Duration::from_secs(SCAN_INTERVAL_SECONDS)).await;
        }
    });
}

async fn run_paper_trading_tick(db: &DatabaseConnection) -> Result<(), String> {
    // 1. Fetch live bots
    let live_bots = latinos_bots::Entity::find()
        .filter(latinos_bots::Column::LiveTrading.eq(true))
        .all(db)
        .await
        .map_err(|e| format!("DB Error: {}", e))?;

    if live_bots.is_empty() {
        return Ok(());
    }

    info!("[Bot Engine] Evaluating {} live bots for paper trades", live_bots.len());

    let broker = AlpacaClient::new();
    
    // Fetch global portfolio state from broker
    let account = match broker.get_account().await {
        Ok(acc) => acc,
        Err(e) => {
            error!("[Bot Engine] Failed to sync broker account: {}", e);
            return Err(e);
        }
    };
    
    let total_equity_f = account.equity.parse::<f64>().unwrap_or(10_000.0);
    let buying_power_f = account.buying_power.parse::<f64>().unwrap_or(10_000.0);

    // Synchronize open orders with broker to handle stop loss / take profit triggers that happened natively.
    if let Err(e) = sync_broker_positions(db, &broker).await {
         error!("[Bot Engine] Position sync failed: {}", e);
    }

    let risk = RiskEngine::new();

    // In a real scenario, we would evaluate `manifest_eval` over the last 1min of OHLCV data.
    // For Phase 5 architecture integration, we'll process the evaluation block.
    
    for bot in live_bots {
        // Enforce strict manifest structural execution and manifest quarantine
        if bot.manifest_version != Some(1) {
            error!("[Bot Engine] Bot {} has invalid or unsupported manifest_version {:?}. Skipping execution for safety.", bot.name, bot.manifest_version);
            continue;
        }

        let manifest = match &bot.signal_manifest {
            Some(m) => m,
            None => {
                error!("[Bot Engine] Bot {} has no manifest. Skipping.", bot.name);
                continue;
            }
        };
        
        let manifest_obj = match crate::manifest_eval::ManifestV1::parse_value(manifest) {
            Ok(m) => m,
            Err(e) => {
                error!("[Bot Engine] Bot {} has invalid manifest structure: {:?}. Skipping execution.", bot.name, e);
                continue;
            }
        };
        let manifest_risk = manifest_obj.risk.clone();
        let execution_config = manifest_obj.execution.clone();

        let symbol = manifest_obj.symbol.clone();

        // Fetch recent market data
        // For a quick backtest, fetch the last 100 days
        let end = chrono::Utc::now();
        let start = end - chrono::Duration::days(150);
        let end_str = end.to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
        let start_str = start.to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        let bars = broker.get_historical_bars(&symbol, "1D", &start_str, &end_str).await.unwrap_or_default();
        if bars.is_empty() {
             error!("[Bot Engine] Failed to fetch market data for {}.", symbol);
             continue;
        }

        let candles: Vec<crate::market_data::Candle> = bars.into_iter().map(|b| crate::market_data::Candle {
            open: b.o,
            high: b.h,
            low: b.l,
            close: b.c,
            volume: b.v,
            ts: b.t,
        }).collect();

        let config = crate::backtest::BacktestConfig {
            initial_capital: 10000.0,
            flat_commission: 0.0,
            commission_bps: 0.0,
            position_sizing_pct: 1.0,
            slippage_bps: 0.0,
        };

        let current_price = candles.last().map(|c| c.close).unwrap_or(0.0);
        let engine = crate::backtest::BacktestEngine::new(candles, config);
        let (should_entry, should_exit) = engine.eval_latest(manifest);
        
        let mut side = if should_entry {
            "buy".to_string()
        } else if should_exit {
            "sell".to_string()
        } else {
            "".to_string()
        };

        // Enforce Direction from Manifest
        if let Some(direction) = &manifest_obj.direction {
            if side == "buy" && direction == "short_only" {
                side = "".to_string();
                tracing::debug!("[Bot Engine] Blocked long entry due to short_only direction restriction for {}", bot.name);
            }
            // Add short selling logic here when supported by the strategy engine
        }

        // Enforce SL/TP and prevent duplicate buys if currently in trade
        let open_trades = latinos_trades::Entity::find()
            .filter(latinos_trades::Column::BotId.eq(bot.id))
            .filter(latinos_trades::Column::Status.eq("open"))
            .all(db)
            .await
            .unwrap_or_default();
            
        let portfolio_context = crate::risk_engine::PortfolioContext {
            total_equity: total_equity_f,
            buying_power: buying_power_f,
            open_positions_count: open_trades.len(),
            open_position_exposure: open_trades.iter().map(|t| t.amount * t.price).sum(),
        };

        if !open_trades.is_empty() {
            if let Some(r) = manifest_risk.clone() {
                for trade in &open_trades {
                    let entry_price = trade.price;
                    if entry_price > 0.0 && current_price > 0.0 {
                        let unrealized_return = (current_price - entry_price) / entry_price;
                        if let Some(sl) = r.stop_loss_pct {
                            if unrealized_return <= -(sl / 100.0) {
                                side = "sell".to_string();
                            }
                        }
                        if let Some(tp) = r.take_profit_pct {
                            if unrealized_return >= (tp / 100.0) {
                                side = "sell".to_string();
                            }
                        }
                    }
                }
            }
        }

        if side.is_empty() {
            continue;
        };
        let side = &side;
        
        let amount = if let Some(r) = &manifest_risk {
            if let Some(pct) = r.position_sizing_pct {
                (portfolio_context.total_equity * pct) / current_price.max(1.0)
            } else {
                10.0 // Fallback
            }
        } else {
            10.0 // Fallback
        };

        // Determine daily trade count
        let today_start = chrono::Utc::now().date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc().fixed_offset();
        let daily_trades = latinos_trades::Entity::find()
            .filter(latinos_trades::Column::BotId.eq(bot.id))
            .filter(latinos_trades::Column::Timestamp.gte(today_start))
            .all(db)
            .await
            .unwrap_or_default();
            
        // Calculate Drawdown (Approximation here: checking if bot metrics contain it, or defaulting)
        let mut current_drawdown_pct = 0.0;
        let mut is_paused = false;
        if let Some(metrics) = &bot.live_metrics {
            if let Some(md) = metrics.get("max_drawdown").and_then(|v| v.as_f64()) {
                current_drawdown_pct = md;
            }
            if let Some(paused) = metrics.get("is_paused").and_then(|v| v.as_bool()) {
                is_paused = paused;
            }
        }

        let bot_ctx = crate::risk_engine::BotRiskContext {
            bot_id: bot.id,
            is_paused_by_drawdown: is_paused,
            daily_trade_count: daily_trades.len(),
            current_drawdown_pct,
        };

        let risk_check = risk.evaluate_order(&symbol, side, amount, current_price, &portfolio_context, &bot_ctx, manifest_risk.as_ref());
        
        match risk_check {
            Ok(qty) => {
                // Read Order Properties from Manifest
                let order_type = execution_config.as_ref().map(|e| e.order_type.clone()).unwrap_or_else(|| "market".to_string());
                let time_in_force = execution_config.as_ref().map(|e| e.time_in_force.clone()).unwrap_or_else(|| "day".to_string());

                let req = OrderRequest {
                    symbol: symbol.to_string(),
                    qty,
                    side: side.to_string(),
                    type_: order_type,
                    time_in_force,
                };
                
                match broker.submit_order(&req).await {
                    Ok(resp) => {
                        info!("[Bot Engine] Executed paper trade for {}: {:?}", bot.name, resp);
                        let order_id = resp["id"].as_str().unwrap_or("").to_string();
                        let filled_price = resp["filled_avg_price"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(current_price);
                        
                        use sea_orm::{ActiveModelTrait, Set};
                        
                        if side == "buy" {
                            let trade = latinos_trades::ActiveModel {
                                user_id: Set(Some(bot.owner_id)),
                                bot_id: Set(Some(bot.id)),
                                symbol: Set(symbol.to_string()),
                                side: Set(side.to_string()),
                                price: Set(filled_price),
                                amount: Set(qty),
                                status: Set("open".to_string()),
                                broker: Set(Some("alpaca_paper".to_string())),
                                broker_order_id: Set(Some(order_id)),
                                pnl: Set(None),
                                timestamp: Set(chrono::Utc::now().into()),
                                ..Default::default()
                            };
                            if let Err(err) = latinos_trades::Entity::insert(trade).exec(db).await {
                                 error!("[Bot Engine] Failed to record paper trade entry: {}", err);
                            }
                        } else if side == "sell" {
                            // Find the open trade and close it
                            let open_trade_opt = latinos_trades::Entity::find()
                                .filter(latinos_trades::Column::BotId.eq(bot.id))
                                .filter(latinos_trades::Column::Status.eq("open"))
                                .one(db)
                                .await
                                .unwrap_or(None);
                                
                            if let Some(open_trade) = open_trade_opt {
                                let pnl = (filled_price - open_trade.price) * open_trade.amount;
                                let mut active_trade: latinos_trades::ActiveModel = open_trade.into();
                                active_trade.status = Set("closed".to_string());
                                active_trade.pnl = Set(Some(pnl));
                                if let Err(err) = active_trade.update(db).await {
                                    error!("[Bot Engine] Failed to update paper trade exit: {}", err);
                                }
                            }
                        }
                    },
                    Err(e) => {
                        error!("[Bot Engine] Paper trade rejected by broker for {}: {}", bot.name, e);
                    }
                }
            },
            Err(RiskError::DrawdownLimitHit(pct)) => {
                error!("[Bot Engine] Risk Block: Bot {} exceeds drawdown config at {}%", bot.name, pct);
            },
            Err(e) => {
                error!("[Bot Engine] Risk Block: Bot {} prevented by risk rule: {:?}", bot.name, e);
            }
        }
    }
    
    Ok(())
}

async fn sync_broker_positions(db: &DatabaseConnection, broker: &AlpacaClient) -> Result<(), String> {
    let open_trades = latinos_trades::Entity::find()
        .filter(latinos_trades::Column::Status.eq("open"))
        .all(db)
        .await
        .map_err(|e| format!("DB Error: {}", e))?;

    if open_trades.is_empty() {
        return Ok(());
    }

    let live_positions = broker.get_open_positions().await?;
    
    for trade in open_trades {
        let is_live = live_positions.iter().any(|pos| {
            pos.symbol == trade.symbol && pos.side == (if trade.side == "buy" { "long".to_string() } else { "short".to_string() })
        });
        
        if !is_live {
            use sea_orm::{ActiveModelTrait, Set};
            tracing::warn!("[Bot Engine] Discrepancy found. Local open trade {} does not exist in Alpaca. Closing it locally.", trade.id);
            let mut active: latinos_trades::ActiveModel = trade.into();
            active.status = Set("closed_manual".to_string());
            active.pnl = Set(Some(0.0)); // Assume closed at breakeven for lack of better data
            if let Err(e) = active.update(db).await {
                tracing::error!("[Bot Engine] Failed to close discrepant trade: {}", e);
            }
        }
    }
    
    Ok(())
}
