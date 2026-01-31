import requests
import json

BASE_URL = "http://localhost:8000/api"
EMAIL = "demo@latinos.trade"
PASSWORD = "demo123"

def test_api():
    session = requests.Session()
    try:
        # Login
        auth_res = session.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if auth_res.status_code != 200:
            print("Login failed")
            return
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get Bots
        res = session.get(f"{BASE_URL}/bots", headers=headers)
        print(f"Status: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            prueba_bot = next((b for b in data if b["name"] == "prueba"), None)
            
            if prueba_bot:
                print(f"Bot: {prueba_bot['name']}")
                print(f"  ID: {prueba_bot['id']}")
                print(f"  Manifest: {prueba_bot.get('signal_manifest')}")
                print(f"  Type: {type(prueba_bot.get('signal_manifest'))}")
            else:
                print("Bot 'prueba' not found in API response")
        else:
            print(res.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
