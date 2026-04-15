use crate::broker::alpaca::AlpacaClient;
use crate::models::_entities::latinos_trades;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use tracing::{info, warn};

pub async fn reconcile_local_vs_broker(db: &DatabaseConnection, broker: &AlpacaClient) -> Result<(), String> {
    // 1. Fetch current open positions from Broker
    let broker_positions = match broker.get_open_positions().await {
        Ok(pos) => pos,
        Err(e) => {
            warn!("[Reconciliation] Could not fetch open positions from broker: {}", e);
            return Err(e);
        }
    };
    
    let broker_symbols: Vec<String> = broker_positions.into_iter().map(|p| p.symbol).collect();

    // 2. Fetch all local open trades
    let local_open_trades = latinos_trades::Entity::find()
        .filter(latinos_trades::Column::Status.eq("open"))
        .all(db)
        .await
        .map_err(|e| e.to_string())?;
        
    let mut synced_count = 0;

    for trade in local_open_trades {
        // If local trade is 'open' but not in broker's open positions, it must have been closed (e.g. SL/TP hit)
        if !broker_symbols.contains(&trade.symbol) {
            info!("[Reconciliation] Local trade {} for {} is open but missing from broker positions. Marking as closed.", trade.id, trade.symbol);
            
            let trade_id = trade.id;
            let mut active_trade: latinos_trades::ActiveModel = trade.into();
            active_trade.status = Set("closed".to_string());
            // Realistically we'd fetch the closure execution details (price, PNL) from Alpaca account activities
            // For now, cleanly close it out to free up margin context.
            if let Err(e) = active_trade.update(db).await {
                warn!("[Reconciliation] Failed to update trade {}: {}", trade_id, e);
            } else {
                synced_count += 1;
            }
        }
    }
    
    if synced_count > 0 {
        info!("[Reconciliation] Successfully reconciled {} locally open trades mapped to closed broker positions.", synced_count);
    }
    
    Ok(())
}
