import sqlite3
import json

def smart_dedup():
    print("🧹 Starting Smart Signal Deduplication...")
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Fetch all signals
    print("   Fetching signals...")
    cursor.execute("SELECT id, type, payload FROM signals")
    all_signals = cursor.fetchall()
    
    # 2. Group by signature (type + name)
    groups = {}
    for sig in all_signals:
        try:
            payload = json.loads(sig['payload']) if isinstance(sig['payload'], str) else sig['payload']
            name = payload.get('name', 'Unknown')
            # Signature: type + name
            sig_key = f"{sig['type']}:{name}"
            
            if sig_key not in groups:
                groups[sig_key] = []
            groups[sig_key].append(sig['id'])
        except Exception as e:
            print(f"   ⚠️ Skipping invalid signal {sig['id']}: {e}")

    # 3. Process Groups
    remap_map = {} # old_id -> new_id
    ids_to_delete = []
    
    for key, ids in groups.items():
        if len(ids) > 1:
            ids.sort()
            keep_id = ids[-1] # Keep the latest one
            remove_ids = ids[:-1]
            
            print(f"   Found duplicate group '{key}': Keeping {keep_id}, removing {remove_ids}")
            
            for rm_id in remove_ids:
                remap_map[rm_id] = keep_id
                ids_to_delete.append(rm_id)
    
    if not ids_to_delete:
        print("✅ No duplicates found.")
        conn.close()
        return

    # 4. Update Bots
    print("   Updating Bots...")
    cursor.execute("SELECT id, signal_manifest FROM bots")
    bots = cursor.fetchall()
    
    for bot in bots:
        try:
            if not bot['signal_manifest']: continue
            
            manifest_raw = bot['signal_manifest']
            manifest = json.loads(manifest_raw) if isinstance(manifest_raw, str) else manifest_raw
            
            if not isinstance(manifest, list): continue
            
            changed = False
            new_manifest = []
            for sig_id in manifest:
                # If this signal is being deleted, map it to the keeper
                if sig_id in remap_map:
                    new_manifest.append(remap_map[sig_id])
                    changed = True
                else:
                    new_manifest.append(sig_id)
            
            # Remove duplicates inside the manifest itself (if any)
            new_manifest = list(set(new_manifest))
            
            if changed:
                print(f"   🔄 Updating Bot {bot['id']}: {manifest} -> {new_manifest}")
                cursor.execute(
                    "UPDATE bots SET signal_manifest = ? WHERE id = ?", 
                    (json.dumps(new_manifest), bot['id'])
                )
        except Exception as e:
            print(f"   ⚠️ Error processing bot {bot['id']}: {e}")

    # 5. Delete Signals
    print(f"   Deleting {len(ids_to_delete)} duplicate signals...")
    csv_ids = ",".join(map(str, ids_to_delete))
    cursor.execute(f"DELETE FROM signals WHERE id IN ({csv_ids})")
    
    conn.commit()
    print("✅ Cleanup Complete!")
    conn.close()

if __name__ == "__main__":
    smart_dedup()
