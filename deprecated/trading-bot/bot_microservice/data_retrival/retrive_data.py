from tvDatafeed import TvDatafeed
from .redis_connection import RedisConnection
import json
import pandas as pd


class DataCacheV2:
    def __init__(self, tv_data_feed: TvDatafeed, redis_client: RedisConnection):
        self.cache = {}
        self.useCache = False
        self.tv = tv_data_feed
        self.redis_client = redis_client

    # Better place the redis server check in this method
    def get_data(self, symbol, exchange, interval, n_bars):
        cache_key = f"micro_{symbol}_{exchange}_{interval}_{n_bars}"

        if self.useCache == False:

            data = self.tv.get_hist(
                symbol=symbol, exchange=exchange, interval=interval, n_bars=n_bars
            )
            return data

        try:
            result = self.redis_client.ping()
            print("conection to server is :", result)
        except Exception as e:
            print(f"Error checking connection to Redis server: {e}")
            self.useCache = False
            data = self.tv.get_hist(
                symbol=symbol, exchange=exchange, interval=interval, n_bars=n_bars
            )
            return data

        cached_data = self.redis_client.get(cache_key)
        if cached_data:
            data_json = json.loads(cached_data)
            df = pd.DataFrame(data_json)
            return df
            # Fetch data from API
        else:
            data = self.tv.get_hist(
                symbol=symbol, exchange=exchange, interval=interval, n_bars=n_bars
            )
            # Cache data in Redis with expiration time (e.g., 1 hour)
            data_json = data.to_json()
            self.redis_client.set(key=cache_key, expiration=45, value=data_json)
            return data
