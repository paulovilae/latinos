import sys
import os
import json

# 1. Provide the exact Graph structure Dify Visual Editor uses
# (And our backend transpile.py Rust engine parses to build the WASM binary)
dify_graph_payload = {
    "workflow": {
        "graph": {
            "nodes": [
                {
                    "data": {
                        "type": "start",
                        "variables": [
                            {"variable": "close"},
                            {"variable": "rsi"}
                        ]
                    }
                },
                {
                    "data": {
                        "type": "custom_tool",
                        "tool_name": "Relative_Strength_Index__RSI__api_dify_tools_rsi_post",
                        "parameters": {"period": 14}
                    }
                },
                {
                    "data": {
                        "type": "if-else",
                        "cases": [
                            {
                                "conditions": [
                                    {
                                        "variable_selector": ["start", "rsi"],
                                        "comparison_operator": "<",
                                        "value": "30.0"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    }
}

graph_json_str = json.dumps(dify_graph_payload["workflow"]["graph"])

# 2. Inject this workflow natively into the PostgreSQL Dify Database via our MCP logic
sys.path.append("/home/paulo/Programs/apps/latinos/dify-mcp")
from dify_mcp import dify_upload_workflow_dsl

workspace_id = "ec3500af-4645-442c-b8d6-0405859fe0c1"
print("Injecting RSI Breakout Workflow into Dify Workspace...")
result = dify_upload_workflow_dsl("Real RSI Breakout", workspace_id, graph_json_str)
print(result)
