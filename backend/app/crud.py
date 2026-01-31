import datetime
from sqlalchemy.orm import Session
from passlib.hash import argon2
from . import models, schemas

def get_password_hash(password):
    # Use argon2 instead of bcrypt to avoid 72-byte limitation
    return argon2.hash(password)

def verify_password(plain_password, hashed_password):
    return argon2.verify(plain_password, hashed_password)

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreateRequest):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        name=user.name, 
        password_hash=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_subscription(db: Session, user_id: int, tier: str, status: str, stripe_id: str, period_end=None):
    user = get_user(db, user_id)
    if user:
        user.subscription_tier = tier
        user.subscription_status = status
        user.stripe_customer_id = stripe_id
        if period_end:
            user.current_period_end = period_end
        db.commit()
        db.refresh(user)
    return user

def create_bot(db: Session, bot: schemas.BotCreate, owner_id: int):
    # Determine the manifest (signal IDs)
    signal_manifest = bot.signal_ids if bot.signal_ids else []
    
    # Create bot with the manifest
    bot_data = bot.model_dump(exclude={"signal_ids"})
    db_bot = models.Bot(**bot_data, owner_id=owner_id, status="draft", signal_manifest=signal_manifest)
    
    db.add(db_bot)
    db.commit()
    db.refresh(db_bot)
    
    # WE DO NOT CHANGE Signal.bot_id anymore! 
    # Signals are now shared definitions referenced by ID in signal_manifest.
    
    return db_bot

def get_bots(db: Session, owner_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Bot)
    if owner_id:
        query = query.filter(models.Bot.owner_id == owner_id)
    return query.offset(skip).limit(limit).all()

def get_bot(db: Session, bot_id: int):
    return db.query(models.Bot).filter(models.Bot.id == bot_id).first()

def create_formula(db: Session, formula: schemas.FormulaCreate, bot_id: int, user_id: int):
    # Calculate version
    count = db.query(models.FormulaVersion).filter(models.FormulaVersion.bot_id == bot_id).count()
    version = count + 1
    
    db_formula = models.FormulaVersion(
        **formula.dict(),
        bot_id=bot_id,
        created_by=user_id,
        version=version
    )
    db.add(db_formula)
    db.commit()
    db.refresh(db_formula)
    return db_formula

def get_formulas(db: Session, bot_id: int):
    return db.query(models.FormulaVersion)\
             .filter(models.FormulaVersion.bot_id == bot_id)\
             .order_by(models.FormulaVersion.version.desc())\
             .all()

def create_backtest(db: Session, backtest: schemas.BacktestCreate, user_id: int):
    db_bt = models.Backtest(**backtest.dict(), status="pending", submitted_at=datetime.datetime.utcnow())
    db.add(db_bt)
    db.commit()
    db.refresh(db_bt)
    return db_bt

def get_backtest(db: Session, backtest_id: int):
    return db.query(models.Backtest).filter(models.Backtest.id == backtest_id).first()

def create_signal(db: Session, signal: schemas.SignalCreate):
    db_sig = models.Signal(**signal.dict(), emitted_at=datetime.datetime.utcnow(), delivery_status="pending")
    db.add(db_sig)
    db.commit()
    db.refresh(db_sig)
    return db_sig

def update_signal(db: Session, signal_id: int, signal: schemas.SignalCreate):
    db_sig = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if db_sig:
        # Update fields
        data = signal.dict(exclude_unset=True)
        for key, value in data.items():
            setattr(db_sig, key, value)
        db.commit()
        db.refresh(db_sig)
    return db_sig

def delete_bot(db: Session, bot_id: int):
    db_bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
    if db_bot:
        db.delete(db_bot)
        db.commit()
        return True
    return False

def create_trade(db: Session, trade: schemas.TradeCreate, user_id: int):
    db_trade = models.Trade(**trade.model_dump(), user_id=user_id)
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade
