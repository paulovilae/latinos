import alpaca_trade_api as tradeapi
import os
import logging
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alpaca_broker")

load_dotenv()

class AlpacaBroker:
    def __init__(self):
        self.api_key = os.getenv("ALPACA_API_KEY")
        self.secret_key = os.getenv("ALPACA_SECRET_KEY")
        self.paper = os.getenv("ALPACA_PAPER", "true").lower() == "true"
        self.base_url = "https://paper-api.alpaca.markets" if self.paper else "https://api.alpaca.markets"
        
        if not self.api_key or not self.secret_key:
            logger.warning("Alpaca API keys not found in environment variables.")
            self.api = None
        else:
            try:
                self.api = tradeapi.REST(self.api_key, self.secret_key, self.base_url, api_version='v2')
                # No verificar cuenta aquí para evitar bloqueos en el arranque
                logger.info(f"Cliente de Alpaca inicializado ({'Paper' if self.paper else 'Live'})")
            except Exception as e:
                logger.error(f"Error al inicializar cliente de Alpaca: {e}")
                self.api = None

    def buy_market(self, symbol: str, qty: int):
        """
        Compra stocks a precio de mercado.
        """
        if not self.api:
            logger.error("No se puede ejecutar la orden: API no inicializada.")
            return None
        
        try:
            order = self.api.submit_order(
                symbol=symbol,
                qty=qty,
                side='buy',
                type='market',
                time_in_force='gtc'
            )
            logger.info(f"Orden de COMPRA enviada: {symbol} x{qty}")
            return order
        except Exception as e:
            logger.error(f"Error al enviar orden de COMPRA: {e}")
            return None

    def sell_market(self, symbol: str, qty: int):
        """
        Vende stocks a precio de mercado.
        """
        if not self.api:
            logger.error("No se puede ejecutar la orden: API no inicializada.")
            return None
        
        try:
            order = self.api.submit_order(
                symbol=symbol,
                qty=qty,
                side='sell',
                type='market',
                time_in_force='gtc'
            )
            logger.info(f"Orden de VENTA enviada: {symbol} x{qty}")
            return order
        except Exception as e:
            logger.error(f"Error al enviar orden de VENTA: {e}")
            return None

    def get_orders(self, status='all', limit=50):
        """
        Obtiene la lista de órdenes de Alpaca.
        """
        if not self.api:
            return []
        try:
            return self.api.list_orders(status=status, limit=limit)
        except Exception as e:
            logger.error(f"Error al obtener órdenes de Alpaca: {e}")
            return []

    def get_positions(self):
        """
        Obtiene las posiciones abiertas en Alpaca.
        """
        if not self.api:
            return []
        try:
            return self.api.list_positions()
        except Exception as e:
            logger.error(f"Error al obtener posiciones de Alpaca: {e}")
            return []

    def get_account_summary(self):
        """
        Obtiene un resumen de la cuenta de Alpaca.
        """
        if not self.api:
            return None
        try:
            return self.api.get_account()
        except Exception as e:
            logger.error(f"Error al obtener resumen de cuenta de Alpaca: {e}")
            return None

# Singleton instance
alpaca_client = AlpacaBroker()
