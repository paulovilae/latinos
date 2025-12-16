import os
import logging
from pathlib import Path
from dotenv import load_dotenv


class EnvironmentConfig:
    """
    Environment configuration for the bot microservice
    Handles loading and validating environment variables with proper defaults
    """
    def __init__(self):
        # Load environment variables from the root-level .env file first
        root_env_path = Path(__file__).resolve().parent.parent / '.env'
        if root_env_path.exists():
            load_dotenv(dotenv_path=root_env_path)
        
        # Then load any bot-specific .env file (for override)
        bot_env_path = Path(__file__).resolve().parent / '.env'
        if bot_env_path.exists():
            load_dotenv(dotenv_path=bot_env_path)

        # Path configurations
        self.base_dir = Path(__file__).resolve().parent

        # Database configurations
        self.host = self._get_env("DB_HOST")
        self.data_table = self._get_env("DATA_NAME", "data_table")
        self.passphrase = self._get_env("DB_PASSPHRASE", "Passphrase")
        self.port = self._get_env("DB_PORT")
        self.user = self._get_env("DB_USER")

        # Debugging and performance configurations
        self.debug = self._get_env_int("DEBUG", 1)
        
        # Set up log file path
        log_filename = self._get_env("DB_LOG_NAME", "../databases/db_operations.log")
        self.database_log_filename = os.path.join(self.base_dir, log_filename)
        
        # Ensure log directory exists
        log_dir = os.path.dirname(self.database_log_filename)
        os.makedirs(log_dir, exist_ok=True)
        
        # Log level
        self.database_log_level_name = self._get_env("DB_LOG_LEVEL", "INFO").upper()
        self.database_log_level = self._get_log_level(self.database_log_level_name)

        # API credentials
        self.alpaca_secret = self._get_env("ALPACA_SECRET")
        self.alpaca_key = self._get_env("ALPACA_KEY")

        # Trading configurations
        self.trade_value_percent = self._get_env_float("TRADE_VALUE_PERCENT", 0.1)
        self.trade_value_cap = self._get_env_float("TRADE_VALUE_CAP", 1000.0)

        # Connection configurations
        self.use_secure_connection = self._get_env_bool("USE_SECURE_CONNECTION", False)
        
        # API settings
        # First try to get from environment variable
        port_from_env = self._get_env_int("BOT_PORT", None)
        
        # If not in environment, try to read from selected-port.txt
        if port_from_env is None:
            try:
                port_file_path = os.path.join(self.base_dir, "selected-port.txt")
                if os.path.exists(port_file_path):
                    with open(port_file_path, 'r') as port_file:
                        port_from_file = port_file.read().strip()
                        port_from_env = int(port_from_file)
                        print(f"Found port {port_from_env} in selected-port.txt")
            except Exception as e:
                print(f"Error reading port from file: {e}")
        
        # Default to 5555 if not found anywhere
        self.api_port = port_from_env if port_from_env is not None else 5555
        print(f"Using API port: {self.api_port}")
        
        # Validate required settings
        self._validate_required_settings()
    
    def _get_env(self, name, default=None):
        """Get environment variable with optional default"""
        return os.environ.get(name, default)
    
    def _get_env_int(self, name, default=0):
        """Get environment variable as integer with default"""
        value = os.environ.get(name)
        if value is None:
            return default
        try:
            return int(value)
        except ValueError:
            logging.warning(f"Invalid integer value for {name}: {value}. Using default: {default}")
            return default
    
    def _get_env_float(self, name, default=0.0):
        """Get environment variable as float with default"""
        value = os.environ.get(name)
        if value is None:
            return default
        try:
            return float(value)
        except ValueError:
            logging.warning(f"Invalid float value for {name}: {value}. Using default: {default}")
            return default
    
    def _get_env_bool(self, name, default=False):
        """Get environment variable as boolean with default"""
        value = os.environ.get(name)
        if value is None:
            return default
        
        if value.lower() in ('1', 'true', 'yes', 'y', 'on'):
            return True
        if value.lower() in ('0', 'false', 'no', 'n', 'off'):
            return False
            
        logging.warning(f"Invalid boolean value for {name}: {value}. Using default: {default}")
        return default
    
    def _get_log_level(self, level_name):
        """Convert string log level to logging constant"""
        levels = {
            'DEBUG': logging.DEBUG,
            'INFO': logging.INFO,
            'WARNING': logging.WARNING,
            'ERROR': logging.ERROR,
            'CRITICAL': logging.CRITICAL
        }
        return levels.get(level_name, logging.INFO)
    
    def _validate_required_settings(self):
        """Validate that required settings are present"""
        warnings = []
        
        # Check critical API credentials
        if not self.alpaca_key:
            warnings.append("ALPACA_KEY is not set")
        if not self.alpaca_secret:
            warnings.append("ALPACA_SECRET is not set")
            
        # Log warnings for missing settings
        if warnings:
            logging.warning("Missing required environment variables:")
            for warning in warnings:
                logging.warning(f" - {warning}")
