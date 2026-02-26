"""
Sovereign Dify MCP Server
==========================
A universal workflow builder for the ImagineOS ecosystem.
Creates, lists, and manages Dify visual workflows via direct PostgreSQL
injection. Project-agnostic — works for Latinos, Vetra, Imaginos, or
any future app that needs visual AI/automation workflows.

=== VERIFIED DIFY REACT FLOW SCHEMA RULES ===
(Reverse-engineered from working Dify apps. Violating ANY of these
rules will cause the Dify UI to crash or silently drop edges.)

  NODES:
  - All logic nodes use outer type: "custom"
  - Inner data.type = start | code | llm | if-else | end
  - Notes use outer type: "custom-note"
  - Every node MUST have: position, positionAbsolute (identical values),
    width, height, sourcePosition="right", targetPosition="left"

  EDGES:
  - Edge ID format: "{source_id}-{handle}-{target_id}-target"
  - Every edge MUST have: zIndex=0, data.isInIteration=false
  - sourceHandle and targetHandle are ALWAYS strings, never booleans

  IF/ELSE (CRITICAL — most common source of bugs):
  - case_id MUST be a STRING "true", NOT boolean True
  - sourceHandle for IF branch  = "true"  (string)
  - sourceHandle for ELSE branch = "false" (string)
  - case_id and sourceHandle MUST be the same type (both strings)
    A type mismatch (bool vs string) silently drops the edge!
  - Comparison operators use symbols: <, >, is, not is
    NOT shortcodes like lt, gt
"""
import os
import uuid
import json
import time
import psycopg2
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Server & Config
# ---------------------------------------------------------------------------
mcp = FastMCP("dify-mcp")

DB_URL = os.environ.get(
    "DIFY_DATABASE_URL",
    "postgresql://postgres:difyai123456@127.0.0.1:5433/dify",
)


def get_db_connection():
    """Returns a fresh psycopg2 connection to the Dify database."""
    return psycopg2.connect(DB_URL)


# ---------------------------------------------------------------------------
# Verified React Flow Schema Builders
# ---------------------------------------------------------------------------
def _build_node(node_id, x, y, data, width=242, height=94, node_type="custom"):
    """Build a Dify React Flow node matching the verified schema."""
    return {
        "id": node_id,
        "type": node_type,
        "data": data,
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "width": width,
        "height": height,
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
    }


def _build_edge(source_id, target_id, source_type, target_type,
                source_handle="source"):
    """
    Build a Dify React Flow edge matching the verified schema.

    CRITICAL: sourceHandle MUST always be a string.
    For IF/ELSE nodes, use "true" or "false" (strings),
    NEVER boolean True/False. A type mismatch between case_id
    and sourceHandle will silently drop the edge.
    """
    # DEFENSIVE: Auto-coerce booleans to strings to prevent
    # the silent edge-drop bug we discovered.
    if isinstance(source_handle, bool):
        source_handle = str(source_handle).lower()  # True -> "true"

    return {
        "id": f"{source_id}-{source_handle}-{target_id}-target",
        "source": source_id,
        "target": target_id,
        "sourceHandle": source_handle,
        "targetHandle": "target",
        "type": "custom",
        "zIndex": 0,
        "data": {
            "sourceType": source_type,
            "targetType": target_type,
            "isInIteration": False,
        },
    }


def _build_ifelse_cases(variable_selector, comparison_operator, value):
    """
    Build IF/ELSE cases with the verified schema.

    CRITICAL: case_id MUST be the string "true", NOT boolean True.
    The sourceHandle on the corresponding edge must also be "true".
    A type mismatch between case_id and sourceHandle silently drops
    the edge connection in the Dify UI.
    """
    return [{
        "case_id": "true",  # MUST be string, never boolean
        "logical_operator": "and",
        "conditions": [{
            "comparison_operator": comparison_operator,
            "logical_operator": "and",
            "value": str(value),
            "variable_selector": variable_selector,
        }],
    }]


def _build_note(node_id, x, y, text, theme="blue", width=380, height=90):
    """Build a Dify documentation note node (Lexical editor format)."""
    lexical = json.dumps({
        "root": {
            "children": [{
                "children": [{
                    "detail": 0, "format": 0, "mode": "normal",
                    "style": "", "text": text, "type": "text", "version": 1,
                }],
                "direction": "ltr", "format": "", "indent": 0,
                "type": "paragraph", "version": 1, "textFormat": 0,
            }],
            "direction": "ltr", "format": "", "indent": 0,
            "type": "root", "version": 1,
        }
    })
    return {
        "id": node_id,
        "type": "custom-note",
        "data": {
            "author": "ImagineOS", "desc": "", "height": height,
            "selected": False, "showAuthor": True, "text": lexical,
            "theme": theme, "title": "", "type": "", "width": width,
        },
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "width": width,
        "height": height,
        "sourcePosition": "right",
        "targetPosition": "left",
    }


# ---------------------------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------------------------
def _inject_workflow(name, workspace_id, graph_json):
    """Core DB injection for creating an App + Workflow atomically."""
    app_id = str(uuid.uuid4())
    workflow_id = str(uuid.uuid4())
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM accounts LIMIT 1;")
            account_row = cur.fetchone()
            if not account_row:
                raise RuntimeError("No Admin Accounts found in Dify.")
            account_id = account_row[0]

            cur.execute(
                """INSERT INTO apps
                   (id, tenant_id, name, mode, status, enable_site,
                    enable_api, api_rpm, api_rph, is_demo, is_public,
                    is_universal, description, icon, icon_background,
                    icon_type, created_by, updated_by,
                    use_icon_as_answer_icon)
                   VALUES (%s,%s,%s,'workflow','normal',true,true,0,0,
                           false,false,false,'',%s,'#FFEAD5','emoji',
                           %s,%s,false)""",
                (app_id, workspace_id, name, '🤖', account_id, account_id),
            )
            cur.execute(
                """INSERT INTO workflows
                   (id, tenant_id, app_id, type, version, graph, features,
                    created_by, updated_by, environment_variables,
                    conversation_variables, rag_pipeline_variables,
                    marked_name, marked_comment, created_at, updated_at)
                   VALUES (%s,%s,%s,'workflow','draft',%s,'{}',
                           %s,%s,'[]','[]','[]','','',NOW(),NOW())""",
                (workflow_id, workspace_id, app_id, graph_json,
                 account_id, account_id),
            )
            conn.commit()
    return app_id, workflow_id


# ---------------------------------------------------------------------------
# MCP Tools — Universal CRUD
# ---------------------------------------------------------------------------
@mcp.tool()
def dify_list_workspaces() -> str:
    """Lists all active Dify workspaces (Tenants). Use this to find the target Workspace ID before creating an app."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name FROM tenants;")
                rows = cur.fetchall()
                if not rows:
                    return "No workspaces found."
                return "\n".join(
                    [f"Workspace ID: {row[0]} | Name: {row[1]}" for row in rows]
                )
    except Exception as e:
        return f"Database Error: {str(e)}"


@mcp.tool()
def dify_list_apps() -> str:
    """Lists recent Applications inside Dify to find their App IDs."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, name, tenant_id FROM apps "
                    "ORDER BY created_at DESC LIMIT 10;"
                )
                rows = cur.fetchall()
                if not rows:
                    return "No apps found."
                return "\n".join(
                    [f"App ID: {row[0]} | Name: {row[1]} | Workspace: {row[2]}"
                     for row in rows]
                )
    except Exception as e:
        return f"Database Error: {str(e)}"


@mcp.tool()
def dify_list_workflows(app_id: str) -> str:
    """Lists all workflows associated with a specific Dify App ID."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, version, updated_at FROM workflows "
                    "WHERE app_id = %s ORDER BY updated_at DESC LIMIT 5;",
                    (app_id,),
                )
                rows = cur.fetchall()
                if not rows:
                    return f"No workflows found for app {app_id}."
                return "\n".join(
                    [f"Workflow ID: {row[0]} | Version: {row[1]} "
                     f"| Updated: {row[2]}"
                     for row in rows]
                )
    except Exception as e:
        return f"Database Error: {str(e)}"


@mcp.tool()
def dify_upload_workflow_dsl(name: str, workspace_id: str,
                             graph_json: str) -> str:
    """
    Creates a new Dify Application and injects a visual workflow Graph
    natively via PostgreSQL.
    Args:
        name: Name of the App (e.g. "RSI Strategy").
        workspace_id: The Dify Workspace (Tenant) ID to put this app in.
        graph_json: The literal JSON string representing the React Flow
                    node DAG.
    """
    try:
        app_id, workflow_id = _inject_workflow(name, workspace_id, graph_json)
        return (
            f"Success! Workflow App '{name}' has been instantly injected "
            f"into Dify. App ID: {app_id} | Workflow ID: {workflow_id}"
        )
    except Exception as e:
        return f"Database Injection Error: {str(e)}"


@mcp.tool()
def dify_delete_app(app_id: str) -> str:
    """
    Deletes a Dify Application and all its associated workflows directly
    from the database.
    Args:
        app_id: The UUID of the Dify App to delete.
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM workflows WHERE app_id = %s;", (app_id,))
                cur.execute(
                    "DELETE FROM apps WHERE id = %s;", (app_id,))
                conn.commit()
        return (
            f"Successfully deleted App ID: {app_id} "
            f"and its associated workflows."
        )
    except Exception as e:
        return f"Database Deletion Error: {str(e)}"


# ---------------------------------------------------------------------------
# MCP Tool — Universal Workflow Creator
# ---------------------------------------------------------------------------
# Map of comparison shortcodes to Dify-native operators
COMPARISON_MAP = {
    "lt": "<", "gt": ">", "lte": "<=", "gte": ">=",
    "is": "is", "not_is": "not is",
    "contains": "contains", "not_contains": "not contains",
    "<": "<", ">": ">", "<=": "<=", ">=": ">=",
}


@mcp.tool()
def dify_create_financial_bot(
    name: str,
    indicator: str,
    threshold: str,
    comparison: str = "lt",
    note: str = "",
) -> str:
    """
    High-level tool: Creates a complete Dify financial strategy bot.
    Automatically generates the correct React Flow visual graph using the
    verified Dify schema. No manual JSON construction needed!

    Args:
        name: Name of the bot (e.g. "Golden Goose RSI Sniper").
        indicator: Short key for the indicator. One of:
            ma, rsi, macd, bbands, stochastic, vwap, ichimoku,
            williams_r, atr, supertrend, adx
        threshold: The numeric threshold for the IF/ELSE decision
            (e.g. "30" for RSI < 30).
        comparison: Comparison operator. One of: lt, gt, is, not_is,
            contains, not_contains. Default: "lt".
        note: Optional documentation note text to display on the canvas.
    """
    # Resolve workspace
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM tenants LIMIT 1;")
                ws_row = cur.fetchone()
                if not ws_row:
                    return "Error: No Dify workspace found."
                workspace_id = ws_row[0]
    except Exception as e:
        return f"Database Error: {str(e)}"

    comp_op = COMPARISON_MAP.get(comparison, comparison)
    base = int(time.time() * 1000)
    ids = {k: str(base + i)
           for i, k in enumerate(["start", "code", "ifelse", "set_buy",
                                   "set_hold", "end_buy", "end_hold",
                                   "note"])}

    nodes = [
        _build_node(ids["start"], 80, 282, {
            "desc": "", "selected": False, "title": "Start", "type": "start",
            "variables": [
                {"label": "close", "max_length": 256, "options": [],
                 "required": True, "type": "number", "variable": "close"},
                {"label": indicator, "max_length": 256, "options": [],
                 "required": True, "type": "number", "variable": indicator},
            ],
        }, height=140),
        _build_node(ids["code"], 384, 282, {
            "code": "def main(arg1: float) -> dict:\n"
                    "    return {\"result\": arg1}",
            "code_language": "python3",
            "desc": f"Calculate {indicator}",
            "outputs": {"result": {"children": None, "type": "number"}},
            "selected": False,
            "title": f"Calculate {indicator.upper()}",
            "type": "code",
            "variables": [{"value_selector": [ids["start"], "close"],
                           "variable": "arg1"}],
        }, height=80),
        _build_node(ids["ifelse"], 684, 282, {
            "desc": "", "selected": False,
            "title": f"IF {indicator} {comp_op} {threshold}",
            "type": "if-else",
            "cases": _build_ifelse_cases(
                [ids["start"], indicator], comp_op, threshold
            ),
        }, height=124),
        # Action code nodes — produce output for the trade engine
        _build_node(ids["set_buy"], 984, 202, {
            "code": "def main() -> dict:\n"
                    "    return {\"action\": \"BUY\", \"signal\": 1}",
            "code_language": "python3",
            "desc": f"{indicator} oversold — emit BUY signal",
            "outputs": {
                "action": {"children": None, "type": "string"},
                "signal": {"children": None, "type": "number"},
            },
            "selected": False, "title": "Set BUY", "type": "code",
            "variables": [],
        }, height=80),
        _build_node(ids["set_hold"], 984, 382, {
            "code": "def main() -> dict:\n"
                    "    return {\"action\": \"HOLD\", \"signal\": 0}",
            "code_language": "python3",
            "desc": f"{indicator} not triggered — emit HOLD signal",
            "outputs": {
                "action": {"children": None, "type": "string"},
                "signal": {"children": None, "type": "number"},
            },
            "selected": False, "title": "Set HOLD", "type": "code",
            "variables": [],
        }, height=80),
        # End nodes — reference action code outputs for the trade engine
        _build_node(ids["end_buy"], 1284, 202, {
            "desc": "", "selected": False, "title": "BUY Signal",
            "type": "end",
            "outputs": [
                {"value_selector": [ids["set_buy"], "action"],
                 "variable": "action"},
                {"value_selector": [ids["set_buy"], "signal"],
                 "variable": "signal"},
            ],
        }, height=90),
        _build_node(ids["end_hold"], 1284, 382, {
            "desc": "", "selected": False, "title": "HOLD Signal",
            "type": "end",
            "outputs": [
                {"value_selector": [ids["set_hold"], "action"],
                 "variable": "action"},
                {"value_selector": [ids["set_hold"], "signal"],
                 "variable": "signal"},
            ],
        }, height=90),
    ]

    note_text = note or f"{name} — auto-generated by ImagineOS."
    nodes.append(_build_note(ids["note"], 80, 120, note_text))

    edges = [
        _build_edge(ids["start"], ids["code"], "start", "code"),
        _build_edge(ids["code"], ids["ifelse"], "code", "if-else"),
        _build_edge(ids["ifelse"], ids["set_buy"], "if-else", "code", "true"),
        _build_edge(ids["ifelse"], ids["set_hold"], "if-else", "code",
                    "false"),
        _build_edge(ids["set_buy"], ids["end_buy"], "code", "end"),
        _build_edge(ids["set_hold"], ids["end_hold"], "code", "end"),
    ]

    graph_json = json.dumps({
        "nodes": nodes, "edges": edges,
        "viewport": {"x": 100, "y": -100, "zoom": 1.0},
    })

    try:
        app_id, workflow_id = _inject_workflow(name, workspace_id, graph_json)
        return (
            f"Success! '{name}' deployed to Dify!\n"
            f"  Indicator: {indicator}\n"
            f"  Condition: value {comp_op} {threshold}\n"
            f"  App ID: {app_id}\n"
            f"  Workflow ID: {workflow_id}\n"
            f"  View: https://dify.imaginos.ai/app/{app_id}/workflow"
        )
    except Exception as e:
        return f"Bot Creation Error: {str(e)}"


# ---------------------------------------------------------------------------
# MCP Tool — WASM Compilation (Upgrade-Safe: zero Dify modifications)
# ---------------------------------------------------------------------------
# Path to the Latinos WASM transpiler and compiler workspace.
# Configurable via env var for portability.
WASM_COMPILER_DIR = os.environ.get(
    "WASM_COMPILER_DIR",
    "/home/paulo/Programs/apps/latinos/backend/wasm_test",
)
TRANSPILER_PATH = os.path.join(WASM_COMPILER_DIR, "compiler", "transpile.py")


def _read_workflow_graph(app_id):
    """Read the React Flow graph JSON from Dify's database for a given app."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT graph FROM workflows WHERE app_id = %s "
                "ORDER BY updated_at DESC LIMIT 1;",
                (app_id,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"No workflow found for app {app_id}")
            graph = row[0]
            if isinstance(graph, str):
                return json.loads(graph)
            return graph


@mcp.tool()
def dify_compile_wasm(app_id: str) -> str:
    """
    Compiles a Dify workflow into a WebAssembly (WASM) binary.

    Pipeline: Dify Graph → Extract Variables & Conditions → Generate Rust
    → Compile with cargo → Return .wasm binary path.

    This is upgrade-safe: zero Dify source modifications needed.
    All compilation logic lives in the Latinos backend transpiler.

    Args:
        app_id: The UUID of the Dify App whose workflow should be compiled.
    """
    import subprocess
    import tempfile

    try:
        # 1. Read the workflow graph from Dify's database
        graph = _read_workflow_graph(app_id)
        nodes = graph.get("nodes", [])
        if not nodes:
            return f"Error: Workflow for app {app_id} has no nodes."

        # 2. Dynamically import the transpiler
        import importlib.util
        spec = importlib.util.spec_from_file_location("transpile", TRANSPILER_PATH)
        transpiler = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(transpiler)

        # 3. Extract variables and conditions from the graph
        variables = transpiler.extract_variables(nodes)
        conditions = transpiler.extract_conditions(nodes)

        if not variables:
            return (
                "Error: No input variables found in the Start node. "
                "The workflow needs a Start node with variables."
            )

        # 4. Generate Rust code
        rust_code = transpiler.generate_rust_code(variables, conditions)

        # 5. Write Rust code to the compiler workspace
        lib_rs_path = os.path.join(WASM_COMPILER_DIR, "src", "lib.rs")
        with open(lib_rs_path, "w") as f:
            f.write(rust_code)

        # 6. Compile to WASM
        wasm_target = "wasm32-unknown-unknown"
        try:
            result = subprocess.run(
                ["cargo", "build", "--target", wasm_target, "--release"],
                cwd=WASM_COMPILER_DIR,
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode != 0:
                return (
                    f"Rust compilation failed:\n"
                    f"STDERR: {result.stderr[:500]}\n"
                    f"STDOUT: {result.stdout[:500]}"
                )
        except FileNotFoundError:
            return (
                "Error: 'cargo' not found. Install Rust toolchain with: "
                "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh && "
                "rustup target add wasm32-unknown-unknown"
            )
        except subprocess.TimeoutExpired:
            return "Error: WASM compilation timed out (120s limit)."

        # 7. Read the compiled WASM binary
        wasm_path = os.path.join(
            WASM_COMPILER_DIR,
            "target", wasm_target, "release", "strategy.wasm",
        )
        if not os.path.exists(wasm_path):
            return f"Error: Compilation succeeded but no .wasm found at {wasm_path}"

        wasm_size = os.path.getsize(wasm_path)

        # 8. Report results
        return (
            f"WASM compilation successful!\n"
            f"  App ID: {app_id}\n"
            f"  Variables: {variables}\n"
            f"  Conditions: {[c['variable'] + ' ' + c['operator'] + ' ' + c['value'] for c in conditions]}\n"
            f"  Rust source: {lib_rs_path}\n"
            f"  WASM binary: {wasm_path}\n"
            f"  Binary size: {wasm_size:,} bytes\n"
            f"\n  Generated Rust:\n{rust_code}"
        )

    except ValueError as ve:
        return f"Workflow Error: {str(ve)}"
    except Exception as e:
        return f"Compilation Pipeline Error: {str(e)}"


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    mcp.run()

