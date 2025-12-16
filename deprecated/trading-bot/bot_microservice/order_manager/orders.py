import alpaca_trade_api as tradeapi
from datetime import datetime, timedelta

BASE_URL = "https://paper-api.alpaca.markets"

""" 
PAULO: Esta clase se encarga de ejecutar todas las peticiones al API de alpaca para ejectuar los trades
esta funcion se utiliza para colocar la orden de compra junto con un precio de take profit y de stop loss
"""


def buy_stock(symbol, qty, sell_price, stop_price_value, Api_key, Api_secret):
    api = tradeapi.REST(Api_key, Api_secret, BASE_URL, api_version="v2")
    sell_price = round(sell_price, 2)
    stop_price_value = round(stop_price_value, 2)
    try:
        order = api.submit_order(
            symbol=symbol,
            qty=qty,
            side="buy",
            type="market",
            time_in_force="gtc",  # Good till canceled
            order_class="bracket",
            take_profit=dict(limit_price=sell_price),
            stop_loss=dict(stop_price=stop_price_value),
        )
        print(f"Buy order for {qty} shares of {symbol} placed successfully.")
        return order
    except Exception as e:
        print(f"An error occurred while placing a buy order: {e}")


""" 
PAULO: Aqui revisamos si no hay mas ordenes abirtas para un accion en especifico
"""


def check_orders_trailing_stop(Api_key="", Api_secret="", symbol=""):
    print("checking orders ")
    api = tradeapi.REST(Api_key, Api_secret, BASE_URL, api_version="v2")
    open_orders = api.list_orders(status="open")
    bracket_orders = [
        order
        for order in open_orders
        if order.order_type == "trailing_stop" and order.symbol == symbol
    ]

    if bracket_orders:
        print("trailing_stop orders still exist will not be placing a new order")
        return False
    else:
        print("trailing_stop order does not exist")
    return True


""" 
PAULO: Aqui detemrinaoms si tenemos mas del 60% invertido en acciones, si lo tenemos no podemos colocar mas ordenes,
si no, se pueden colocar mas ordenes. 
"""


def check_portfolio_value_vs_equity_threshold(
    Api_key="", Api_secret="", threshold_percentage=0.6
):
    # Get account information
    print("checking orders ")
    api = tradeapi.REST(Api_key, Api_secret, BASE_URL, api_version="v2")
    account = api.get_account()
    equity = float(account.equity)

    # Get all open positions
    positions = api.list_positions()

    # Calculate the total purchase value of all positions

    total_purchase_value = sum(
        float(position.avg_entry_price) * float(position.qty) for position in positions
    )

    # Calculate the threshold value
    print("Equity :", equity)
    print("Threshold percent:", threshold_percentage)
    threshold_value = threshold_percentage * equity
    print("Value of all open positions :", total_purchase_value)
    print("Threshold value : ", threshold_value)
    # Compare total purchase value with 60% of the portfolio equity
    if total_purchase_value < threshold_value:
        print("Value of all open positions is below 60 percent, can place order ")
        return True
    else:
        print("Value of all open positions is above 60 percent, cannot place order ")
        return False


def getMoneyInPortfolio(value_percent: float, Api_key="", Api_secret=""):

    api = tradeapi.REST(Api_key, Api_secret, BASE_URL, api_version="v2")

    account = api.get_account()

    cash_available = float(account.equity)

    trade_value = cash_available * value_percent / 100
    print("Trade value:", trade_value)
    return trade_value
