import pandas as pd
import numpy as np
from datetime import datetime

"""
PAULO: aqui se calcula la condicion del promedio movil. se determina si el precio esta
por debajo a 2 desviaciones estandar del promedio movil se activa un señal de compra si no no se activa.
"""


def check_MA_condition(df, window=100):
    # Calculate the 100-period moving average of the 'close' prices

    df["MA_100"] = df["close"].astype(float).rolling(window=window).mean()

    # Calculate the standard deviation of the 100-period moving average
    ma_100_stdev = df["close"].tail(100)
    ma_100_stdev = ma_100_stdev.std()
    # Calculate the expression: ma(close,100) - 2 * (stdev(ma(close,100)))
    expression_result = df["MA_100"] - 2 * ma_100_stdev
    selling_price = df["MA_100"] + 3 * ma_100_stdev
    stop_loss_price = df["MA_100"] - 3 * ma_100_stdev
    prev_close = df["close"].iloc[-2]

    # Compare if ma(close,100) is lower than -2 * (stdev(ma(close,100)))
    print("close: ", df["close"].iloc[-1])
    print("Standard_dev", round(ma_100_stdev, 3))
    print("lower band:", round(expression_result.iloc[-1], 3))
    condition_met = round(df["close"].iloc[-1]) < round(expression_result.iloc[-1], 3)
    second_condition_met = round(prev_close) < round(expression_result.iloc[-1], 3)
    print("First condition met? : ", condition_met)
    print("Second condition met? : ", second_condition_met)
    if condition_met or second_condition_met:
        final_condtion = True
    else:
        final_condtion = False
    print("final condition met? : ", final_condtion)

    data = {
        "time": [datetime.now()],
        "close": [df["close"].iloc[-1]],
        "standard_dev": [round(ma_100_stdev, 3)],
        "lower_band": [round(expression_result.iloc[-1], 3)],
        "close < lowerband": [condition_met],
        "prev_close < lowerband": [second_condition_met],
        "first condition met?": [final_condtion],
    }

    return (
        condition_met,
        round(selling_price.iloc[-1], 3),
        round(stop_loss_price.iloc[-1], 3),
        data,
    )


"""
PAULO: aqui se calcula la condicion del rsi, si el rsi esta un periodo anterior por debajo de 30 y el siguiente sube
entonces se cumple una condicion para colocar la orden de compra.
"""


def calculate_rsi(close_prices, period=14):
    # Calculate price changes
    delta = close_prices["close"].diff()

    # Calculate upward and downward changes
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)

    # Calculate the average gains and losses using Wilder's smoothing method
    def rma(values, n):
        # rma is a recursive moving average
        alpha = 1 / n
        rma_values = np.zeros_like(values)
        rma_values[n - 1] = np.mean(values[:n])
        for i in range(n, len(values)):
            rma_values[i] = alpha * values[i] + (1 - alpha) * rma_values[i - 1]
        return rma_values

    avg_gain = rma(gain, period)
    avg_loss = rma(loss, period)

    # Calculate relative strength (RS)
    rs = avg_gain / avg_loss

    # Calculate RSI
    rsi = 100 - (100 / (1 + rs))

    # Initial RSI values will be NaN until enough data points are available
    rsi[:period] = np.nan

    print("rsi :", round(rsi[-1], 3))
    print("rsi previous :", round(rsi[-2], 3))
    if round(rsi[-1], 3) >= 30 and round(rsi[-2], 3) < 30:
        data = {
            "rsi": round(rsi[-1], 3),
            "rsi prev": round(rsi[-2], 3),
            "rsi_condition_met?": True,
        }
        return True, data
    else:
        data = {
            "rsi": round(rsi[-1], 3),
            "rsi prev": round(rsi[-2], 3),
            "rsi_condition_met?": False,
        }
        return False, data


"""
PAULO: aqui se calcula todos los datos para colocar la orden de compra y los valores de stop loss y take profit
utilizando la volatilidad historica.
"""


def calculate_historic_volatility(df, window=30):
    closing_prices = df["close"]
    if len(closing_prices) < window:
        raise ValueError(
            "Not enough data to calculate the specified period's volatility."
        )

    # Calculate daily log returns
    log_returns = np.log(closing_prices / closing_prices.shift(1)).dropna()

    # Calculate the logarithmic returns of the 'close' prices
    df["log_returns"] = np.log(
        df["close"].astype(float) / df["close"].shift(1).astype(float)
    )

    # Calculate the rolling standard deviation of the logarithmic returns
    df["volatility"] = df["log_returns"].rolling(window=window).std()

    recent_volatility = df["volatility"].iloc[-1]

    current_close_price = df["close"].iloc[-1]
    stop_loss_num_stdev = 1.2
    sell_num_stdev = 3

    take_profit_price = current_close_price * (1 + (sell_num_stdev * recent_volatility))
    stop_loss_price_difference = current_close_price * (
        stop_loss_num_stdev * recent_volatility
    )
    print("number of stdev", stop_loss_num_stdev)
    percent_value = 1 - (stop_loss_num_stdev * recent_volatility)
    print("percent value", percent_value)
    print("Recent historic volatility:", recent_volatility)
    print("Stop loss trailing : ", stop_loss_price_difference)
    print("Take profit", take_profit_price)
    return recent_volatility, take_profit_price, stop_loss_price_difference


def calculate_atr(df, window=14):

    # Calculate True Range (TR)
    df["prev_close"] = df["close"].shift(1)
    df["tr1"] = df["high"] - df["low"]
    df["tr2"] = (df["high"] - df["prev_close"]).abs()
    df["tr3"] = (df["low"] - df["prev_close"]).abs()
    df["true_range"] = df[["tr1", "tr2", "tr3"]].max(axis=1)

    # Calculate Average True Range (ATR)
    # Calculate the ATR using EMA
    alpha = 2 / (window + 1)
    df["atr"] = df["true_range"].ewm(span=window, adjust=False).mean()

    # Drop helper columns
    df = df.drop(columns=["prev_close", "tr1", "tr2", "tr3"])

    return df["atr"].iloc[-1]
