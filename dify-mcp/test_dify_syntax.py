import sys
import os
import json

# This mimics the exact graphical payload the React UI outputs
valid_dify_payload = {
    "nodes": [
        {
            "id": "start_1",
            "type": "start",
            "data": {
                "title": "Start",
                "variables": [
                    {"variable": "close", "type": "number"},
                    {"variable": "rsi", "type": "number"}
                ]
            },
            "position": {"x": 50, "y": 200},
            "width": 240,
            "height": 100
        },
        {
            "id": "indicator_rsi_1",
            "type": "custom_tool",
            "data": {
                "title": "Relative Strength Index (RSI)",
                "tool_name": "Relative_Strength_Index__RSI__api_dify_tools_rsi_post",
                "parameters": {"period": 14}
            },
            "position": {"x": 350, "y": 200},
            "width": 240,
            "height": 150
        }
    ],
    "edges": [
        {
            "id": "start_1-indicator_rsi_1",
            "source": "start_1",
            "target": "indicator_rsi_1",
            "sourceHandle": "source",
            "targetHandle": "target"
        }
    ],
    "viewport": {
        "x": 0,
        "y": 0,
        "zoom": 1
    }
}

graph_json_str = json.dumps(valid_dify_payload)
sys.path.append("/home/paulo/Programs/apps/latinos/dify-mcp")
from dify_mcp import dify_upload_workflow_dsl

workspace_id = "ec3500af-4645-442c-b8d6-0405859fe0c1"
print(dify_upload_workflow_dsl("Golden Goose Alpha V1", workspace_id, graph_json_str))
