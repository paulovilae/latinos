import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime
from .db import SessionLocal
from .models import Bot, FormulaVersion, User
from .signals import BacktestEngine
from .constants import SUPPORTED_ASSETS

logger = logging.getLogger(__name__)

def run_daily_backtests():
    logger.info("Starting run_daily_backtests...")
    db = SessionLocal()
    try:
        # Evaluate all running bots
        bots = db.query(Bot).filter(Bot.status == "running").all()
        engine = BacktestEngine(db)
        
        for bot in bots:
            try:
                logger.info(f"Running daily matrix backtest for Bot {bot.name}...")
                
                # Extract stack_ids from signal_manifest
                manifest = bot.signal_manifest or []
                stack_ids = []
                for entry in manifest:
                    if isinstance(entry, dict):
                        stack_ids.append(int(entry.get("id", 0)))
                    else:
                        stack_ids.append(int(entry))
                        
                if not stack_ids:
                    # Fallback to relationship if manifest is empty
                    stack_ids = [s.id for s in bot.signals]
                    
                if not stack_ids:
                    logger.warning(f"Skipping backtest for {bot.name}: No signals found in manifest.")
                    continue
                
                new_metrics = {}
                matrix_symbols = SUPPORTED_ASSETS
                matrix_timeframes = {"7d": 7, "15d": 15, "30d": 30, "90d": 90, "180d": 180, "365d": 365}
                
                for asset in matrix_symbols:
                    new_metrics[asset] = {}
                    for period_label, days in matrix_timeframes.items():
                        try:
                            result = engine.run(
                                stack_ids=stack_ids,
                                symbol=asset,
                                days=days,
                                take_profit=0, 
                                stop_loss=0,
                                initial_capital=10000
                            )
                            new_metrics[asset][period_label] = {
                                "sharpe": result.sharpe_ratio,
                                "win_rate": result.win_rate,
                                "max_drawdown": result.max_drawdown,
                                "total_return": result.total_return_pct,
                                "symbol": asset,
                                "updated_at": datetime.utcnow().isoformat()
                            }
                        except Exception as inner_e:
                            logger.error(f"Error backtesting {bot.name} on {asset} ({period_label}): {inner_e}")
                            
                # Fallback backward-compatibility field for current UI while it refreshes
                primary_target = bot.tags[0].upper() if bot.tags and len(bot.tags) > 0 else "BTC-USD"
                if primary_target not in matrix_symbols:
                    primary_target = "BTC-USD"
                    
                if primary_target in new_metrics and "30d" in new_metrics[primary_target]:
                    new_metrics["trailing_30d"] = new_metrics[primary_target]["30d"]
                
                bot.live_metrics = new_metrics
                db.add(bot)
                
            except Exception as e:
                logger.error(f"Error backtesting bot {bot.id}: {e}")
                
        db.commit()
        logger.info("Successfully completed daily bot metrics update.")

    except Exception as e:
        logger.error(f"Failed to run daily backtests: {e}")
    finally:
        db.close()


def init_scheduler():
    scheduler = BackgroundScheduler()
    # Run at midnight UTC daily
    scheduler.add_job(
        run_daily_backtests,
        CronTrigger(hour=0, minute=0),
        id="run_daily_backtests_midnight",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("APScheduler initialized for Automated Daily Backtests.")
