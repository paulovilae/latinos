import os
import psycopg2
import subprocess
import json

DB_URL = os.environ.get("DIFY_DATABASE_URL", "postgresql://postgres:difyai123456@127.0.0.1:5433/dify")

def get_db_connection():
    return psycopg2.connect(DB_URL)

workspace_id = "ec3500af-4645-442c-b8d6-0405859fe0c1"
name = "Dummy Financial Indicator"

schema = {
  "openapi": "3.1.0",
  "info": {
    "title": "Dummy Financial",
    "description": "Just a test",
    "version": "v1.0.0"
  },
  "servers": [
    {
      "url": "https://apilatinos.paulovila.org"
    }
  ],
  "paths": {
    "/api/dify/tools/dummy": {
      "post": {
        "description": "Dummy tool",
        "operationId": "DummyTool",
        "parameters": [],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "input": {"type": "string"}
                },
                "required": ["input"]
              }
            }
          }
        }
      }
    }
  }
}

openapi_schema_json=json.dumps(schema)

with get_db_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM accounts LIMIT 1;")
        account_row = cur.fetchone()
        account_id = account_row[0]

injection_script = f'''
import sys
import json
from app import create_app
from core.tools.entities.tool_entities import ApiProviderSchemaType
from services.tools.api_tools_manage_service import ApiToolManageService

user_id = "{account_id}"
tenant_id = "{workspace_id}"
provider_name = """{name}"""
schema_str = """{openapi_schema_json.replace('"', '\\"')}"""

try:
    app = create_app()
    with app.app_context():
        # Dify will automatically parse the schema and build the React Flow tools_str JSON
        ApiToolManageService.create_api_tool_provider(
            user_id=user_id,
            tenant_id=tenant_id,
            provider_name=provider_name,
            icon={{"content": "🛠️", "background": "#252525"}},
            credentials={{"auth_type": "none"}},
            schema_type=ApiProviderSchemaType.OPENAPI,
            schema=schema_str,
            privacy_policy="",
            custom_disclaimer="",
            labels=[]
        )
    print("SUCCESS")
except ValueError as e:
    if "already exists" in str(e):
        print("SUCCESS_EXISTS")
    else:
        print(f"ERROR: {{e}}")
except Exception as e:
    print(f"ERROR: {{e}}")
'''

result = subprocess.run(
    ["docker", "exec", "-i", "docker-api-1", "python3", "-c", injection_script],
    capture_output=True,
    text=True
)

output = result.stdout.strip()

if "SUCCESS_EXISTS" in output:
    print(f"Tool Provider '{name}' already exists in workspace {workspace_id}.")
elif "SUCCESS" in output:
    print(f"Success! Tool Provider '{name}' was natively parsed and injected into Dify.")
else:
    print(f"Injection Error inside Dify API Container: {output} | STDERR: {result.stderr}")
