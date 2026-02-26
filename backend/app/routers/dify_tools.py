import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import pandas as pd
from app.signals import TechnicalAnalysis

# We will create 4 distinct routers to force Dify to categorize the tools cleanly
router = APIRouter(prefix="/api/dify/tools", responses={404: {"description": "Not found"}})

# ---------------------------------------------------------
# Shared Schemas
# ---------------------------------------------------------
class IndicatorInput(BaseModel):
    close_prices: List[float] = Field(..., description="Array of historical close prices. Usually passed from a 'Market Data' node.")
    period: int = Field(14, description="Calculation period (e.g. 14)")

class IndicatorOutput(BaseModel):
    latest_value: float = Field(..., description="The most recent calculated value")
    history: List[float] = Field(..., description="The full array of calculated values")

class OHLCVInput(BaseModel):
    high_prices: List[float] = Field(..., description="Array of historical high prices.")
    low_prices: List[float] = Field(..., description="Array of historical low prices.")
    close_prices: List[float] = Field(..., description="Array of historical close prices.")
    period: int = Field(14, description="Calculation period")

# ---------------------------------------------------------
# Category 1: Trend Indicators
# ---------------------------------------------------------

class MAInput(BaseModel):
    close_prices: List[float] = Field(..., description="Array of historical close prices")
    period: int = Field(14, description="Calculation period (e.g. 14)")
    type: str = Field("sma", description="Moving Average Type ('sma' or 'ema')")

@router.post("/ma", tags=["📈 Trend Indicators"], name="Moving Average (SMA/EMA)", response_model=IndicatorOutput)
def calculate_ma(inputs: MAInput):
    """Calculates Simple (SMA) or Exponential (EMA) Moving Average."""
    try:
        closes = pd.Series(inputs.close_prices)
        if inputs.type.lower() == "ema":
            ma_series = TechnicalAnalysis.ema(closes, period=inputs.period)
        else:
            ma_series = TechnicalAnalysis.sma(closes, period=inputs.period)
            
        ma_series = ma_series.fillna(0.0)
        latest = float(ma_series.iloc[-1]) if not ma_series.empty else 0.0
        return IndicatorOutput(latest_value=latest, history=ma_series.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MACDInput(BaseModel):
    close_prices: List[float] = Field(..., description="Array of historical close prices")
    fast_period: int = Field(12, description="Fast EMA period")
    slow_period: int = Field(26, description="Slow EMA period")
    signal_period: int = Field(9, description="Signal line EMA period")

class MACDOutput(BaseModel):
    latest_macd: float
    latest_signal: float
    latest_hist: float
    macd_history: List[float]
    signal_history: List[float]
    hist_history: List[float]

@router.post("/macd", tags=["📈 Trend Indicators"], name="Moving Average Convergence Divergence (MACD)", response_model=MACDOutput)
def calculate_macd(inputs: MACDInput):
    """Calculates the MACD line, Signal line, and Histogram."""
    try:
        closes = pd.Series(inputs.close_prices)
        result = TechnicalAnalysis.macd(closes, fast=inputs.fast_period, slow=inputs.slow_period, signal=inputs.signal_period)
        macd = result["macd"].fillna(0.0)
        signal = result["signal"].fillna(0.0)
        hist = result["hist"].fillna(0.0)
        return MACDOutput(
            latest_macd=float(macd.iloc[-1]) if not macd.empty else 0.0,
            latest_signal=float(signal.iloc[-1]) if not signal.empty else 0.0,
            latest_hist=float(hist.iloc[-1]) if not hist.empty else 0.0,
            macd_history=macd.tolist(), signal_history=signal.tolist(), hist_history=hist.tolist()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SupertrendInput(BaseModel):
    high_prices: List[float] = Field(..., description="Array of high prices.")
    low_prices: List[float] = Field(..., description="Array of low prices.")
    close_prices: List[float] = Field(..., description="Array of close prices.")
    length: int = Field(7, description="ATR Length")
    multiplier: float = Field(3.0, description="ATR Multiplier")

class SupertrendOutput(BaseModel):
    latest_supertrend: float
    latest_direction: int
    supertrend_history: List[float]
    direction_history: List[int]

@router.post("/supertrend", tags=["📈 Trend Indicators"], name="Supertrend", response_model=SupertrendOutput)
def calculate_supertrend(inputs: SupertrendInput):
    """Calculates the ATR-based Supertrend."""
    try:
        h, l, c = pd.Series(inputs.high_prices), pd.Series(inputs.low_prices), pd.Series(inputs.close_prices)
        result = TechnicalAnalysis.supertrend(h, l, c, length=inputs.length, multiplier=inputs.multiplier)
        st = result["supertrend"].fillna(0.0)
        td = result["direction"].fillna(1)
        return SupertrendOutput(
            latest_supertrend=float(st.iloc[-1]) if not st.empty else 0.0,
            latest_direction=int(td.iloc[-1]) if not td.empty else 1,
            supertrend_history=st.tolist(),
            direction_history=td.astype(int).tolist()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class IchimokuInput(BaseModel):
    high_prices: List[float]
    low_prices: List[float]
    close_prices: List[float]

class IchimokuOutput(BaseModel):
    latest_tenkan_sen: float
    latest_kijun_sen: float
    latest_span_a: float
    latest_span_b: float

@router.post("/ichimoku", tags=["📈 Trend Indicators"], name="Ichimoku Cloud", response_model=IchimokuOutput)
def calculate_ichimoku(inputs: IchimokuInput):
    """Calculates the Ichimoku Cloud baseline indicators."""
    try:
        h, l, c = pd.Series(inputs.high_prices), pd.Series(inputs.low_prices), pd.Series(inputs.close_prices)
        res = TechnicalAnalysis.ichimoku(h, l, c)
        return IchimokuOutput(
            latest_tenkan_sen=float(res["tenkan_sen"].fillna(0.0).iloc[-1]),
            latest_kijun_sen=float(res["kijun_sen"].fillna(0.0).iloc[-1]),
            latest_span_a=float(res["spanA"].fillna(0.0).iloc[-1]),
            latest_span_b=float(res["spanB"].fillna(0.0).iloc[-1])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adx", tags=["📈 Trend Indicators"], name="Average Directional Index (ADX)", response_model=IndicatorOutput)
def calculate_adx(inputs: OHLCVInput):
    """Calculates trend strength via ADX."""
    try:
        h, l, c = pd.Series(inputs.high_prices), pd.Series(inputs.low_prices), pd.Series(inputs.close_prices)
        adx_series = TechnicalAnalysis.adx(h, l, c, length=inputs.period).fillna(0.0)
        return IndicatorOutput(latest_value=float(adx_series.iloc[-1]), history=adx_series.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# Category 2: Momentum Oscillators
# ---------------------------------------------------------

@router.post("/rsi", tags=["🌊 Momentum Oscillators"], name="Relative Strength Index (RSI)", response_model=IndicatorOutput)
def calculate_rsi(inputs: IndicatorInput):
    """Calculates the Relative Strength Index (RSI)."""
    try:
        closes = pd.Series(inputs.close_prices)
        rsi_series = TechnicalAnalysis.rsi(closes, period=inputs.period).fillna(0.0)
        return IndicatorOutput(latest_value=float(rsi_series.iloc[-1]), history=rsi_series.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class StochInput(BaseModel):
    high_prices: List[float]
    low_prices: List[float]
    close_prices: List[float]
    period: int = 14
    k_window: int = 3
    d_window: int = 3

class StochOutput(BaseModel):
    latest_k: float
    latest_d: float
    k_history: List[float]
    d_history: List[float]

@router.post("/stochastic", tags=["🌊 Momentum Oscillators"], name="Stochastic Oscillator", response_model=StochOutput)
def calculate_stochastic(inputs: StochInput):
    """Calculates the Stochastic Oscillator (K and D bounds)."""
    try:
        h, l, c = pd.Series(inputs.high_prices), pd.Series(inputs.low_prices), pd.Series(inputs.close_prices)
        res = TechnicalAnalysis.stoch(h, l, c, period=inputs.period, k_window=inputs.k_window, d_window=inputs.d_window)
        k, d = res["k"].fillna(0.0), res["d"].fillna(0.0)
        return StochOutput(
            latest_k=float(k.iloc[-1]), latest_d=float(d.iloc[-1]),
            k_history=k.tolist(), d_history=d.tolist()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/williams_r", tags=["🌊 Momentum Oscillators"], name="Williams %R", response_model=IndicatorOutput)
def calculate_willr(inputs: OHLCVInput):
    """Calculates Williams %R overbought/oversold levels."""
    try:
        h, l, c = pd.Series(inputs.high_prices), pd.Series(inputs.low_prices), pd.Series(inputs.close_prices)
        r_series = TechnicalAnalysis.willr(h, l, c, length=inputs.period).fillna(0.0)
        return IndicatorOutput(latest_value=float(r_series.iloc[-1]), history=r_series.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# Category 3: Volatility
# ---------------------------------------------------------

class BBandsInput(BaseModel):
    close_prices: List[float] = Field(..., description="Array of historical close prices")
    period: int = Field(20, description="SMA period")
    std_dev: int = Field(2, description="Standard Deviation multiplier")

class BBandsOutput(BaseModel):
    latest_upper: float
    latest_middle: float
    latest_lower: float

@router.post("/bbands", tags=["🌪️ Volatility"], name="Bollinger Bands", response_model=BBandsOutput)
def calculate_bbands(inputs: BBandsInput):
    """Calculates Standard Deviation Bollinger Bands."""
    try:
        closes = pd.Series(inputs.close_prices)
        res = TechnicalAnalysis.bbands(closes, period=inputs.period, std_dev=inputs.std_dev)
        return BBandsOutput(
            latest_upper=float(res["upper"].fillna(0.0).iloc[-1]),
            latest_middle=float(res["middle"].fillna(0.0).iloc[-1]),
            latest_lower=float(res["lower"].fillna(0.0).iloc[-1])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/atr", tags=["🌪️ Volatility"], name="Average True Range (ATR)", response_model=IndicatorOutput)
def calculate_atr(inputs: OHLCVInput):
    """Calculates Average True Range for strict Stop Loss determination."""
    try:
        h, l, c = pd.Series(inputs.high_prices), pd.Series(inputs.low_prices), pd.Series(inputs.close_prices)
        atr_series = TechnicalAnalysis.atr(h, l, c, length=inputs.period).fillna(0.0)
        return IndicatorOutput(latest_value=float(atr_series.iloc[-1]), history=atr_series.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# Category 4: Volume
# ---------------------------------------------------------

class VWAPInput(BaseModel):
    high_prices: List[float]
    low_prices: List[float]
    close_prices: List[float]
    volume: List[float]

@router.post("/vwap", tags=["📊 Volume"], name="Volume Weighted Average Price (VWAP)", response_model=IndicatorOutput)
def calculate_vwap(inputs: VWAPInput):
    """Calculates VWAP utilizing historical volume pressure."""
    try:
        h, l, c, v = pd.Series(inputs.high_prices), pd.Series(inputs.low_prices), pd.Series(inputs.close_prices), pd.Series(inputs.volume)
        vwap_series = TechnicalAnalysis.vwap(h, l, c, v).fillna(0.0)
        return IndicatorOutput(latest_value=float(vwap_series.iloc[-1]), history=vwap_series.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

