from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, crud, worker
from ..db import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/bots",
    tags=["bots"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.BotOut, status_code=status.HTTP_201_CREATED)
def create_bot(payload: schemas.BotCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Define limits based on subscription tier
    limits = {
        "free": 1,
        "starter": 1,
        "pro": 5,
        "whale": 100
    }

    # Admins bypass limits
    if user.role == "admin":
        return crud.create_bot(db, payload, user.id)

    # Check user limit
    tier = (user.subscription_tier or "free").lower()
    limit = limits.get(tier, 1) # Default to 1 (Starter/Free)

    bot_count = db.query(models.Bot).filter(models.Bot.owner_id == user.id).count()

    if bot_count >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"Plan limit reached. Your {tier.title()} plan allows {limit} bots. Upgrade to add more."
        )

    return crud.create_bot(db, payload, user.id)

@router.get("/", response_model=List[schemas.BotOut])
def list_bots(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "admin":
        return db.query(models.Bot).all()
    return db.query(models.Bot).filter(models.Bot.owner_id == user.id).all()

@router.put("/{bot_id}", response_model=schemas.BotOut)
def update_bot(
    bot_id: int,
    payload: schemas.BotUpdate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    
    if payload.name: bot.name = payload.name
    if payload.description: bot.description = payload.description
    if payload.tags is not None: bot.tags = payload.tags
    if payload.status: bot.status = payload.status
    if payload.script is not None: bot.script = payload.script
    
    trigger_arena_refresh = False
    if payload.signal_ids is not None: 
        bot.signal_manifest = payload.signal_ids
        trigger_arena_refresh = True
        
    db.commit()
    db.refresh(bot)
    
    if trigger_arena_refresh:
        from ..scheduler import run_daily_backtests
        background_tasks.add_task(run_daily_backtests)
        
    return bot

@router.delete("/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bot(
    bot_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    db.delete(bot)
    db.commit()
    return None

@router.post("/{bot_id}/deploy", response_model=schemas.BotOut)
def deploy_bot(bot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")

    # Enforce Running Bot Limits
    if user.role != "admin":
        limits = {
            "free": 1,
            "starter": 1,
            "pro": 5,
            "whale": 100
        }
        tier = (user.subscription_tier or "free").lower()
        limit = limits.get(tier, 1)

        # Count currently running bots (excluding this one if it's already running, though deploy usually implies start)
        running_count = db.query(models.Bot).filter(
            models.Bot.owner_id == user.id,
            models.Bot.status == "running"
        ).count()

        if running_count >= limit:
             raise HTTPException(
                status_code=403,
                detail=f"Live bot limit reached. Your {tier.title()} plan allows {limit} active bots."
            )

    bot.status = "running"
    db.commit()
    return bot

@router.post("/{bot_id}/pause", response_model=schemas.BotOut)
def pause_bot(bot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    bot.status = "paused"
    db.commit()
    return bot

@router.post("/refresh_arena_all")
def refresh_all_arena(
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Manually triggers a Robot Arena matrix recalculation for ALL bots globally."""
    from ..scheduler import run_daily_backtests
    background_tasks.add_task(run_daily_backtests)
    return {"status": "queued", "message": "Global Matrix Backtest Queued."}

@router.post("/{bot_id}/refresh_arena", response_model=schemas.BotOut)
def refresh_arena_metrics(
    bot_id: int, 
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Manually triggers a Robot Arena matrix recalculation for this bot."""
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
        
    # Queue the specific bot for refreshing
    from ..scheduler import run_daily_backtests
    background_tasks.add_task(run_daily_backtests)
    
    return bot

import subprocess
import os
import base64
import tempfile
import json
from .. import schemas

@router.post("/{bot_id}/compile/wasm", response_model=schemas.BotOut)
def compile_bot_to_wasm(
    bot_id: int, 
    payload: dict, # Accepts raw Dify JSON DAG
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Accepts a Dify Strategy JSON via the UI, transpiles the visual logic down to Rust, 
    compiles it into a Native WebAssembly Binary using a sandbox, and saves the blob to the DB.
    """
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
        
    try:
        # 1. Write the incoming Dify JSON to a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            json.dump(payload, f)
            temp_yaml_path = f.name
            
        # 2. Setup the compiler directory and target
        compiler_dir = "/app/wasm_test/compiler"
        target_rs_file = "/app/wasm_test/src/lib.rs"
        
        # 3. Step 1: Execute Python Transpiler (Reads YAML -> Writes Rust)
        transpile_cmd = ["python3", f"{compiler_dir}/transpile.py", temp_yaml_path, target_rs_file]
        subprocess.run(transpile_cmd, check=True, capture_output=True, text=True)
        
        # 4. Step 2: Fire off the Rust WASM Compiler Builder (Sandboxed)
        # We mount the compiler directory into a rust:latest container, build the target, and read the resulting .wasm data
        host_compiler_dir = "/home/paulo/Programs/apps/latinos/backend/wasm_test" # This must be the absolute path on the host
        
        # We need to run this command through the host's docker daemon. 
        # Since we are inside the latinos-backend container, we will assume the container has docker client installed
        # and /var/run/docker.sock mounted, OR we compile locally if rust is somehow present.
        # For this execution environment we will shell out to local rustc if available, or try docker.
        
        try:
             # Attempt to compile locally first
             compile_cmd = ["cargo", "build", "--target", "wasm32-unknown-unknown", "--release"]
             subprocess.run(compile_cmd, cwd=compiler_dir, check=True, capture_output=True, text=True)
        except Exception:
             # Fallback to Docker via sock (assuming it exists)
             docker_cmd = [
                 "docker", "run", "--rm", 
                 "-v", f"{host_compiler_dir}:/usr/src/app", 
                 "-w", "/usr/src/app", 
                 "rust:latest", 
                 "cargo", "build", "--target", "wasm32-unknown-unknown", "--release"
             ]
             subprocess.run(docker_cmd, check=True, capture_output=True, text=True)

        # 5. Read the compiled WASM binary
        wasm_file_path = f"{compiler_dir}/target/wasm32-unknown-unknown/release/strategy.wasm"
        if not os.path.exists(wasm_file_path):
             raise Exception(f"Compilation finished but no WASM found at {wasm_file_path}")
             
        with open(wasm_file_path, "rb") as bf:
             wasm_binary = bf.read()
             
        encoded_wasm = base64.b64encode(wasm_binary).decode('utf-8')
        
        # 6. Save to database
        bot.is_wasm = True
        bot.wasm_base64 = encoded_wasm
        bot.status = "standby" # Ready to trade
        
        db.commit()
        db.refresh(bot)
        
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Compilation Failed: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adapter Error: {str(e)}")
    finally:
        if os.path.exists(temp_yaml_path):
             os.remove(temp_yaml_path)
             
    return bot

@router.post("/{bot_id}/subscribe", response_model=schemas.BotOut)
def subscribe_to_bot(bot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Subscribes to an Admin Marketplace bot. Clones the bot and its formulas to the user's account.
    """
    # 1. Enforce bot creation limits
    if user.role != "admin":
        tier = (user.subscription_tier or "free").lower()
        limits = {"free": 1, "starter": 1, "pro": 5, "whale": 100}
        limit = limits.get(tier, 1)
        
        bot_count = db.query(models.Bot).filter(models.Bot.owner_id == user.id).count()
        if bot_count >= limit:
            raise HTTPException(status_code=403, detail=f"Plan limit reached. Your {tier.title()} plan allows {limit} bots.")
            
    # 2. Retrieve Master Bot
    master_bot = crud.get_bot(db, bot_id)
    if not master_bot:
        raise HTTPException(status_code=404, detail="Master bot not found.")
        
    if master_bot.owner_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot subscribe to your own bot.")
        
    # 3. Clone Bot Data
    cloned_bot = models.Bot(
        name=f"{master_bot.name} (Subscribed)",
        description=master_bot.description,
        script=master_bot.script,
        status="paused",  # Start paused so they can configure it
        owner_id=user.id,
        tags=master_bot.tags,
        signal_manifest=master_bot.signal_manifest,
        live_trading=False,
        live_trading_connection_id=None
    )
    db.add(cloned_bot)
    db.flush() # Flush to get the cloned_bot.id
    
    # 4. Clone associated Formulas
    master_formulas = crud.get_formulas(db, master_bot.id)
    for f in master_formulas:
        cloned_formula = models.FormulaVersion(
            bot_id=cloned_bot.id,
            version=f.version,
            payload=f.payload,
            created_by=user.id,
            published=f.published,
            assets=f.assets,
            notes=f.notes
        )
        db.add(cloned_formula)
        
    db.commit()
    db.refresh(cloned_bot)
    return cloned_bot

# Formulas

@router.post("/{bot_id}/formulas", response_model=schemas.FormulaOut, status_code=status.HTTP_201_CREATED)
def create_formula(
    bot_id: int,
    payload: schemas.FormulaCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    return crud.create_formula(db, payload, bot_id, user.id)

@router.get("/{bot_id}/formulas", response_model=List[schemas.FormulaOut])
def list_formulas_for_bot(
    bot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    return crud.get_formulas(db, bot_id)

@router.put("/formulas/{formula_id}", response_model=schemas.FormulaOut)
def update_formula(
    formula_id: int,
    payload: schemas.FormulaUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    formula = db.query(models.FormulaVersion).filter(models.FormulaVersion.id == formula_id).first()
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    bot = crud.get_bot(db, formula.bot_id)
    if bot and user.role != "admin" and bot.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if payload.payload is not None: formula.payload = payload.payload
    if payload.assets is not None: formula.assets = payload.assets
    if payload.notes is not None: formula.notes = payload.notes
    if payload.published is not None: formula.published = payload.published
    
    db.commit()
    db.refresh(formula)
    return formula

@router.post("/formulas/{formula_id}/publish", response_model=schemas.FormulaOut)
def publish_formula(
    formula_id: int,
    payload: schemas.FormulaPublishRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    formula = db.query(models.FormulaVersion).filter(models.FormulaVersion.id == formula_id).first()
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    bot = crud.get_bot(db, formula.bot_id)
    if bot and user.role != "admin" and bot.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    formula.published = payload.published
    db.commit()
    return formula

@router.get("/formulas/{formula_id}/history", response_model=schemas.FormulaHistoryResponse)
def formula_history(formula_id: int, db: Session = Depends(get_db)):
    formula = db.query(models.FormulaVersion).filter(models.FormulaVersion.id == formula_id).first()
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    history = db.query(models.FormulaVersion).filter(models.FormulaVersion.bot_id == formula.bot_id).order_by(models.FormulaVersion.version).all()
    return schemas.FormulaHistoryResponse(history=history)

# Backtests

@router.post("/backtests", response_model=schemas.BacktestOut, status_code=status.HTTP_201_CREATED)
def create_backtest(
    payload: schemas.BacktestCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, payload.bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    
    backtest = crud.create_backtest(db, payload, user.id)
    background_tasks.add_task(worker.run_backtest_task, backtest.id)
    return backtest

# Signals / Webhooks

from pydantic import BaseModel

class WebhookPayload(BaseModel):
    bot_id: int
    action: str # BUY, SELL
    symbol: str
    price: float
    confidence: float = 1.0
    webhook_secret: str

@router.post("/webhooks/signal", status_code=status.HTTP_201_CREATED)
def consume_webhook(
    payload: WebhookPayload,
    db: Session = Depends(get_db),
):
    """
    Secure Webhook receiver for n8n or TradingView. 
    Authenticates via the user's secure Webhook Secret stored in BrokerConnections.
    """
    # 1. Authenticate via Webhook Secret
    connection = db.query(models.BrokerConnection).filter(
        models.BrokerConnection.api_secret_encrypted == payload.webhook_secret,
        models.BrokerConnection.broker_name == "tradingview"
    ).first()
    
    if not connection:
        raise HTTPException(status_code=401, detail="Invalid Webhook Secret")
    
    user_id = connection.user_id
    
    # 2. Verify Bot ownership and Live status
    bot = crud.get_bot(db, payload.bot_id)
    if not bot or bot.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Bot not found or not owned by webhook user")
        
    if not bot.live_trading:
        return {"status": "ignored", "reason": "Bot is not armed for live trading."}
        
    # 3. Dispatch to Broker (Simulated for safety here, normally hits alpaca_broker)
    # This proves the n8n logic works.
    message = f"Dispatched {payload.action} for {payload.symbol} at ${payload.price} from n8n!"
    print(f"🚀 WEBHOOK EXECUTING: {message}")
    
    return {
        "status": "success",
        "action": payload.action,
        "symbol": payload.symbol,
        "bot": bot.name,
        "message": message
    }

# Simulation

@router.post("/simulate", response_model=schemas.BotSimulationResult)
def simulate_bots(
    request: schemas.BotSimulationRequest = schemas.BotSimulationRequest(),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluate all running bots' signal stacks against the latest historical candle.
    Returns BUY/SELL/HOLD recommendation per bot. Works outside market hours.
    """
    import pandas as pd
    from datetime import datetime
    from ..signals import SignalEvaluator
    from ..market_data_loader import sync_market_data
    from sqlalchemy import func as sqlfunc

    # Get all running bots for the user (admins see all)
    if user.role == "admin":
        bots = db.query(models.Bot).filter(models.Bot.status == "running").all()
    else:
        bots = db.query(models.Bot).filter(
            models.Bot.owner_id == user.id,
            models.Bot.status == "running"
        ).all()

    if not bots:
        return schemas.BotSimulationResult(
            bots=[],
            evaluated_at=datetime.utcnow().isoformat()
        )

    results = []
    for bot in bots:
        # Determine symbol — use request override or bot's first tag or default
        symbol = request.symbol or (bot.tags[0] if bot.tags else "AAPL")
        symbol = symbol.upper()

        # Get signal IDs from manifest
        manifest = bot.signal_manifest or []
        if not manifest:
            results.append(schemas.BotSimulationBotResult(
                bot_id=bot.id,
                bot_name=bot.name,
                symbol=symbol,
                recommendation="HOLD",
                confidence=0.0,
                signals_passed=0,
                signals_total=0,
                latest_close=0.0,
                timestamp=datetime.utcnow().isoformat(),
                details=[]
            ))
            continue

        # Parse manifest entries (support int IDs and dict configs with invert)
        signal_configs = []
        for entry in manifest:
            if isinstance(entry, dict):
                signal_configs.append({
                    "id": int(entry.get("id", 0)),
                    "invert": bool(entry.get("invert", False))
                })
            else:
                signal_configs.append({"id": int(entry), "invert": False})

        signal_ids = [c["id"] for c in signal_configs]

        # Load signal definitions from DB
        signals = db.query(models.Signal).filter(
            models.Signal.id.in_(signal_ids)
        ).all()

        if not signals:
            results.append(schemas.BotSimulationBotResult(
                bot_id=bot.id,
                bot_name=bot.name,
                symbol=symbol,
                recommendation="ERROR",
                confidence=0.0,
                signals_passed=0,
                signals_total=0,
                latest_close=0.0,
                timestamp=datetime.utcnow().isoformat(),
                details=[]
            ))
            continue

        # Ensure market data exists
        try:
            sync_market_data(db, symbol, "1d", range_="1y", use_synthetic=False)
        except Exception:
            try:
                sync_market_data(db, symbol, "1d", range_="30d", use_synthetic=True)
            except Exception:
                pass

        # Fetch recent market data
        subq = db.query(
            sqlfunc.max(models.MarketData.id).label("id")
        ).filter(
            models.MarketData.symbol == symbol,
            models.MarketData.interval == "1d"
        ).group_by(models.MarketData.timestamp).subquery()

        query = db.query(models.MarketData).join(
            subq, models.MarketData.id == subq.c.id
        ).order_by(models.MarketData.timestamp.desc()).limit(300)

        data = [
            {"open": d.open, "high": d.high, "low": d.low,
             "close": d.close, "volume": d.volume, "timestamp": d.timestamp}
            for d in query.all()
        ]

        if not data:
            results.append(schemas.BotSimulationBotResult(
                bot_id=bot.id,
                bot_name=bot.name,
                symbol=symbol,
                recommendation="ERROR",
                confidence=0.0,
                signals_passed=0,
                signals_total=0,
                latest_close=0.0,
                timestamp=datetime.utcnow().isoformat(),
                details=[]
            ))
            continue

        # Chronological order
        data = data[::-1]
        df = pd.DataFrame(data)
        last_idx = len(df) - 1
        latest_close = float(df.iloc[last_idx]["close"])
        latest_ts = str(df.iloc[last_idx]["timestamp"])

        # Evaluate each signal at the latest candle
        sig_map = {s.id: s for s in signals}
        config_map = {c["id"]: c for c in signal_configs}
        details = []
        passed = 0

        for sig_cfg in signal_configs:
            sig = sig_map.get(sig_cfg["id"])
            if not sig:
                details.append(schemas.BotSimulationSignalDetail(
                    signal_id=sig_cfg["id"],
                    name=f"Signal {sig_cfg['id']} (missing)",
                    result=None,
                    inverted=sig_cfg["invert"]
                ))
                continue

            evaluator = SignalEvaluator(sig, logs=[])
            try:
                result = evaluator.evaluate(df, last_idx, debug=False)
                # Apply invert if configured
                if sig_cfg["invert"] and result is not None:
                    result = not result
            except Exception:
                result = None

            sig_name = sig.payload.get("name", f"Signal {sig.id}") if isinstance(sig.payload, dict) else f"Signal {sig.id}"
            if sig_cfg["invert"]:
                sig_name = f"NOT {sig_name}"

            if result is True:
                passed += 1

            details.append(schemas.BotSimulationSignalDetail(
                signal_id=sig.id,
                name=sig_name,
                result=result,
                inverted=sig_cfg["invert"]
            ))

        total = len(details)
        confidence = (passed / total * 100) if total > 0 else 0.0

        # Recommendation logic: all signals must pass for BUY
        if total > 0 and passed == total:
            recommendation = "BUY"
        elif total > 0 and passed == 0:
            recommendation = "SELL"
        else:
            recommendation = "HOLD"

        results.append(schemas.BotSimulationBotResult(
            bot_id=bot.id,
            bot_name=bot.name,
            symbol=symbol,
            recommendation=recommendation,
            confidence=round(confidence, 1),
            signals_passed=passed,
            signals_total=total,
            latest_close=latest_close,
            timestamp=latest_ts,
            details=details
        ))

    return schemas.BotSimulationResult(
        bots=results,
        evaluated_at=datetime.utcnow().isoformat()
    )
