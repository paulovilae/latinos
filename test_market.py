import urllib.request
import json
try:
    req = urllib.request.Request("http://127.0.0.1:8000/api/market/series/AAPL?range=1y&interval=1d")
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data["points"][0], indent=2))
except Exception as e:
    print(e)
