import os
import sys
from dotenv import load_dotenv

# Añadir el directorio base al path para poder importar el broker
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.brokers.alpaca_broker import AlpacaBroker

def test_connection():
    load_dotenv()
    
    print("--- Probando Conexión con Alpaca ---")
    broker = AlpacaBroker()
    
    if broker.api:
        try:
            account = broker.api.get_account()
            print(f"Éxito: Conectado a la cuenta {account.id}")
            print(f"Estatus: {account.status}")
            print(f"Cash disponible: ${account.cash}")
            print(f"Buying Power: ${account.buying_power}")
            
            # Intentar obtener el precio de una acción (AAPL)
            # Nota: Necesita market data configurado
            try:
                asset = broker.api.get_asset("AAPL")
                print(f"Activo AAPL encontrado: {asset.name} (Tradable: {asset.tradable})")
            except:
                print("No se pudo obtener información del activo AAPL")
                
        except Exception as e:
            print(f"Error al obtener información de la cuenta: {e}")
    else:
        print("Error: El cliente API no pudo ser inicializado. Verifica tus API Keys en .env")

if __name__ == "__main__":
    test_connection()
