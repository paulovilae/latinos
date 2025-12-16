import redis
import ssl

class RedisConnection:
    def __init__(self, password="AC75K67q6jP|+U;", host='18.188.166.164', port=6379, db=0):
        self.host = host
        self.port = port
        self.db = db
        self.redis_client = None
        self.password = password

    def connect(self):
        """Establish a connection to the Redis server."""
        try:
            self.redis_client = redis.Redis(host=self.host, port=self.port, db=self.db,ssl=True,ssl_cert_reqs=ssl.CERT_NONE)
            print("Successfully connected to Redis server")
            return True  # Connection successful
        except ConnectionError as e:
            print(f"Error connecting to Redis server: {e}")
            return False  # Connection failed

    def set(self, key, value, expiration=None):
        """Set a key-value pair in Redis."""
        if expiration is None:
            self.redis_client.set(key, value)
        else:
            self.redis_client.setex(key, expiration, value)

    def get(self, key):
        """Retrieve the value associated with a key from Redis."""
        return self.redis_client.get(key)

    def delete(self, key):
        """Delete a key-value pair from Redis."""
        self.redis_client.delete(key)

    def disconnect(self):
        """Disconnect from the Redis server."""
        self.redis_client.close()

    def ping(self):
            return self.redis_client.ping()