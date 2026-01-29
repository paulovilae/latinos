from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

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
    db_bot = models.Bot(**bot.dict(), owner_id=owner_id, status="draft")
    db.add(db_bot)
    db.commit()
    db.refresh(db_bot)
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
    db_bt = models.Backtest(**backtest.dict(), status="pending", submitted_at=None)
    import datetime
    db_bt.submitted_at = datetime.datetime.utcnow()
    db.add(db_bt)
    db.commit()
    db.refresh(db_bt)
    db.refresh(db_bt)
    return db_bt

def get_backtest(db: Session, backtest_id: int):
    return db.query(models.Backtest).filter(models.Backtest.id == backtest_id).first()

def create_signal(db: Session, signal: schemas.SignalCreate):
    db_sig = models.Signal(**signal.dict(), emitted_at=None, delivery_status="pending")
    import datetime
    db_sig.emitted_at = datetime.datetime.utcnow()
    db.add(db_sig)
    db.commit()
    db.refresh(db_sig)
    return db_sig
