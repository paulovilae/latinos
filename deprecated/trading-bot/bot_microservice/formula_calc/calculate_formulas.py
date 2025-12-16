from datetime import datetime
import re
import time
from typing import List
import pandas as pd
from data_retrival.retrive_data import DataCacheV2
from tvDatafeed import TvDatafeed, Interval
import os
from environment_config import EnvironmentConfig
from data_retrival.redis_connection import RedisConnection
import traceback
from order_manager.orders import (
    buy_stock,
    getMoneyInPortfolio,
    check_portfolio_value_vs_equity_threshold,
    check_orders_trailing_stop,
)
from .complex_func import (
    check_MA_condition,
    calculate_rsi,
    calculate_historic_volatility,
    calculate_atr,
)
import pandas as pd

# from db.queries.formula_queries import FormulaQueries


def write_to_csv(data, stock_symbol, current_price, exchange, historic_volatility):
    df = pd.DataFrame(data)
    df["stock_symbol"] = stock_symbol
    df["current_price"] = current_price
    df["exchange"] = exchange
    df["historic_volatility"] = historic_volatility

    file_exists = os.path.isfile("output.csv")

    if file_exists:
        df.to_csv("output.csv", mode="a", header=False, index=False)
    else:
        df.to_csv("output.csv", mode="w", header=True, index=False)

    return True


def get_interval_enum(interval_str):
    interval_map = {
        "1m": Interval.in_1_minute,
        "5m": Interval.in_5_minute,
        "15m": Interval.in_15_minute,
        "30m": Interval.in_30_minute,
        "1h": Interval.in_1_hour,
        "2h": Interval.in_2_hour,
        "4h": Interval.in_4_hour,
        "1d": Interval.in_daily,
        "1W": Interval.in_weekly,
        "1M": Interval.in_monthly,
    }

    return interval_map[interval_str]


""" 
PAULO: este es el metodo que contiene toda la logica para determinar si se ejecuta la compra de orden para la accion
se carga primero las variables de entorno para acceder al api de trading view I se pide las ultimas 200 barras de la accion
Luego se calculan los indicadores y determinar si se compra o vende la accion
"""


def determine_formula_output():
    stock = os.environ.get("STOCK")
    stock_list = [stock]
    redis_conn = RedisConnection()
    redis_conn.connect()

    tv_username = os.environ.get("TRADING_VIEW_USER")
    tv_pass = os.environ.get("TRADING_VIEW_PASSWORD")
    print("Running for :", stock)
    exchange = "AMEX"
    intervals = Interval.in_5_minute
    histo_intervals = Interval.in_daily
    n_bars = 200

    for stocks in stock_list:
        print("Running for :", stocks)

        try:
            data_cache = DataCacheV2(
                tv_data_feed=TvDatafeed(username=tv_username, password=tv_pass),
                redis_client=redis_conn,
            )

            stock_df = data_cache.get_data(
                symbol=stocks, exchange=exchange, interval=intervals, n_bars=n_bars
            )

            historic_volatility_df = data_cache.get_data(
                symbol=stocks,
                exchange=exchange,
                interval=histo_intervals,
                n_bars=n_bars,
            )

            print(stock_df)

            if stock_df is None or stock_df.empty:
                print(f"No data retrieved for {stocks}. Skipping to next stock.")
                continue

            """ 
            PAULO: Aqui se calcula la condicion del promedio movil 
            """

            criteria_1, selling_price, stop_loss_price, ma_data = check_MA_condition(
                stock_df
            )
            """ 
            PAULO: Aqui se calcula la condicion del rsi
            """
            criteria_2, rsi_data = calculate_rsi(stock_df)

            current_price = stock_df["close"].iloc[-1]

            merged_dict = ma_data | rsi_data
            """ 
            PAULO: Aqui determinamos los valores de la volatiliad historica el take profit y el stop loss
            """
            historic_volatility, take_profit_price, stop_loss_price_difference = (
                calculate_historic_volatility(df=historic_volatility_df)
            )
            print("condition 1: ", criteria_1, "condition 2: ", criteria_2)
            print("Sell amount :", selling_price)

            env_config = EnvironmentConfig()
            alpaca_key = env_config.alpaca_key
            alpaca_secret = env_config.alpaca_secret

            trade_value_percent = float(env_config.trade_value_percent)
            trade_value_cap = float(env_config.trade_value_cap) / 100
            """ 
            PAULO: Aqui se revisa el dinero en el portafolio
            """
            cash_available = getMoneyInPortfolio(
                value_percent=trade_value_percent,
                Api_key=alpaca_key,
                Api_secret=alpaca_secret,
            )
            """ 
            PAULO: Se revisa si ya existe una orden, si no hay ordenes coloca una si existe entonces no
            """
            check_order_criteria = check_orders_trailing_stop(
                Api_key=alpaca_key, Api_secret=alpaca_secret, symbol=stocks
            )
            check_order_criteria_portoflio = check_portfolio_value_vs_equity_threshold(
                Api_key=alpaca_key,
                Api_secret=alpaca_secret,
                threshold_percentage=trade_value_cap,
            )
            print("condition any open orders fo the stock: ", check_order_criteria)
            print("Condition check for liquidity: ", check_order_criteria_portoflio)
            number_of_shares = int(cash_available // current_price)
            percent_current_price = current_price * 0.001
            stop_loss_price_difference = current_price - stop_loss_price_difference
            print("sell trailing price", stop_loss_price_difference)
            check_percent_condition = False
            if stop_loss_price_difference >= percent_current_price:
                check_percent_condition = True
            print("check percent trail price condition:", check_percent_condition)
            if (
                criteria_1 == True
                and criteria_2 == True
                and check_order_criteria == True
                and check_order_criteria_portoflio == True
                and check_percent_condition
            ):
                """
                PAULO: Si todas las condiciones se cumplen entonces se ejeucta el trade y se transcribe la informacion a output.csv
                """
                final_data = {
                    "check_order_criteria": [check_order_criteria],
                    "check_portfolio_liquidity": [check_order_criteria_portoflio],
                    "execute_trade": [True],
                }

                new_dict = merged_dict | final_data
                write_to_csv(
                    new_dict, stocks, current_price, exchange, historic_volatility
                )
                print(" FINAL RESULT : Executed Trade")
                symbol = stocks
                qty = number_of_shares
                buy_stock(
                    symbol=symbol,
                    qty=qty,
                    stop_price_value=stop_loss_price_difference,
                    sell_price=take_profit_price,
                    Api_key=alpaca_key,
                    Api_secret=alpaca_secret,
                )

                time.sleep(10)

            else:
                print(" FINAL RESULT : Trade not executed")
                final_data = {
                    "check_order_criteria": [check_order_criteria],
                    "check_portfolio_liquidity": [check_order_criteria_portoflio],
                    "execute_trade": [False],
                }
                new_dict = merged_dict | final_data
                write_to_csv(
                    new_dict, stocks, current_price, exchange, historic_volatility
                )

        except Exception as e:
            print(e)
            traceback.print_exc()

            continue  # Move to the next stock in the list
    return True


def run_strategies(strategy_list: List):
    for strategy in strategy_list:
        strategy()
    return True
