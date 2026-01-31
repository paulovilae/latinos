import requests
import json
import random

BASE_URL = "http://localhost:8000/api"
EMAIL = "demo@latinos.trade"
PASSWORD = "demo123"

def debug_flow():
    session = requests.Session()
    
    # 1. Login
    print("Step 1: Logging in...")
    try:
        res = session.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if res.status_code != 200:
            print(f"❌ Login failed: {res.text}")
            return
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful")
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    # 2. List Signals or Create One
    print("\nStep 2: Getting Signals...")
    res = session.get(f"{BASE_URL}/signals", headers=headers)
    signals = res.json()
    if not signals:
        print("   No signals found. Creating one...")
        sig_payload = {
            "type": "buy",
            "payload": {"name": f"Debug Signal {random.randint(1,999)}", "code": "close > open"},
            "bot_id": None
        }
        res = session.post(f"{BASE_URL}/webhooks/signal", json=sig_payload, headers=headers)
        signal_id = res.json()["id"]
        print(f"✅ Created signal ID: {signal_id}")
    else:
        signal_id = signals[0]["id"]
        print(f"✅ Using existing signal ID: {signal_id}")

    # 3. Create Bot with Signal
    print("\nStep 3: Creating Bot with Signal Manifest...")
    bot_payload = {
        "name": f"Debug Bot {random.randint(1000,9999)}",
        "description": "Debugging manifest",
        "signal_ids": [signal_id] 
    }
    
    res = session.post(f"{BASE_URL}/bots/", json=bot_payload, headers=headers)
    if res.status_code not in [200, 201]:
        print(f"❌ Create Bot failed: {res.text}")
        return
    
    bot_data = res.json()
    new_bot_id = bot_data["id"]
    print(f"✅ Bot created! ID: {new_bot_id}")
    print(f"   Response Manifest: {bot_data.get('signal_manifest')}")
    print(f"   Response Signals: {len(bot_data.get('signals') or [])}")

    # 4. Fetch Bot List (What the frontend does)
    print("\nStep 4: Fetching Bot List (Frontend Simulation)...")
    res = session.get(f"{BASE_URL}/bots/", headers=headers)
    bots = res.json()
    
    my_bot = next((b for b in bots if b["id"] == new_bot_id), None)
    
    if my_bot:
        print(f"✅ Found Bot {my_bot['id']}")
        print(f"   Name: {my_bot['name']}")
        print(f"   Manifest (Raw): {my_bot.get('signal_manifest')}")
        print(f"   Manifest (Type): {type(my_bot.get('signal_manifest'))}")
        
        # Validation
        manifest = my_bot.get('signal_manifest')
        if isinstance(manifest, str):
            print("⚠️ WARNING: Manifest is a STRING. Frontend needs JSON.parse!")
            try:
                 parsed = json.loads(manifest)
                 print(f"   Parsed: {parsed}")
                 if signal_id in parsed:
                     print("✅ ID found in parsed manifest.")
                 else:
                     print("❌ ID NOT FOUND in parsed manifest.")
            except:
                print("❌ FAILED TO PARSE JSON STRING")
        elif isinstance(manifest, list):
            print("✅ Manifest is a LIST. Frontend should just work.")
            if signal_id in manifest:
                 print("✅ ID found in manifest.")
            else:
                 print("❌ ID NOT FOUND in manifest.")
        else:
            print("❌ Manifest is NONE or INVALID")
            
    else:
        print("❌ Bot not found in list")

if __name__ == "__main__":
    debug_flow()
