import json
import uuid
from dify_mcp import dify_list_workspaces, dify_list_apps, dify_upload_workflow_dsl

workspace_id = "ec3500af-4645-442c-b8d6-0405859fe0c1"
dummy_graph = {
    "nodes": [
        {
            "id": "start-node",
            "type": "custom",
            "data": {
                "title": "Start",
                "type": "start",
                "desc": "",
                "variables": [],
                "selected": False
            },
            "position": {"x": 50, "y": 50},
            "positionAbsolute": {"x": 50, "y": 50},
            "selected": False,
            "sourcePosition": "right",
            "targetPosition": "left",
            "width": 242,
            "height": 52
        },
        {
            "id": "end-node",
            "type": "custom",
            "data": {
                "title": "End",
                "type": "end",
                "desc": "",
                "outputs": [],
                "selected": False
            },
            "position": {"x": 400, "y": 50},
            "positionAbsolute": {"x": 400, "y": 50},
            "selected": False,
            "sourcePosition": "right",
            "targetPosition": "left",
            "width": 242,
            "height": 52
        }
    ],
    "edges": [
        {
            "id": "edge-start-end",
            "type": "custom",
            "source": "start-node",
            "target": "end-node",
            "sourceHandle": "source",
            "targetHandle": "target",
            "data": {
                "isInIteration": False,
                "sourceType": "start",
                "targetType": "end"
            },
            "zIndex": 0
        }
    ],
    "viewport": {"x": 0, "y": 0, "zoom": 1}
}

print("Injecting Schema-Compliant Dummy App...")
result = dify_upload_workflow_dsl("MCP Schema Test", workspace_id, json.dumps(dummy_graph))
print(result)

print("\n--- Current Apps ---")
print(dify_list_apps())
