---
description: How to deploy an agent team using the Agent Manager MCP for multi-agent parallel work
---

# Deploying an Agent Team

## Prerequisites

> [!CAUTION]
> **You MUST start `antigravity-claude-proxy` before launching any Claude team!**
> Without it, port 8080 has no listener and Claude CLI gets `ConnectionRefused`.

### 1. Start antigravity-claude-proxy

```bash
# Start the proxy (runs in foreground; use nohup for background)
antigravity-claude-proxy start

# Or start in background
nohup antigravity-claude-proxy start &>/tmp/antigravity-claude-proxy.log &

# Verify health
curl http://localhost:8080/health

# Check quota / rate limits
curl "http://localhost:8080/account-limits?format=table"

# List available models
curl http://localhost:8080/v1/models
```

**What it is:**

- npm package: `npm install -g antigravity-claude-proxy`
- Bridges Antigravity Cloud Code → Anthropic-compatible API on port 8080
- Uses OAuth tokens from your Google account (vilapaulo@gmail.com)
- `~/.claude/settings.json` sets `ANTHROPIC_BASE_URL=http://localhost:8080`
- `ANTHROPIC_API_KEY=test` (dummy key — proxy handles real auth via OAuth)

### 2. Other Services

- **Portal** must be running via PM2 (`portal-main` on port 3001)
- **Qdrant** must be running WITHOUT an API key (see Gotchas below)

---

## Model Naming — CRITICAL

> [!WARNING]
> **Proxy model IDs do NOT have the `google-antigravity/` prefix!**
>
> `~/.claude/settings.json` uses `google-antigravity/gemini-3-pro-high` — this is for the **Antigravity IDE only**.
> The proxy rejects this format with `400 invalid_request_error`.

**Available proxy models** (run `curl http://localhost:8080/v1/models`):

| Model ID                     | Type                        |
| ---------------------------- | --------------------------- |
| `gemini-3-pro-high`          | Best quality Gemini         |
| `gemini-3-flash`             | Fast Gemini                 |
| `gemini-3-pro-low`           | Lightweight Gemini          |
| `claude-sonnet-4-5`          | Claude Sonnet               |
| `claude-sonnet-4-5-thinking` | Claude Sonnet with thinking |
| `claude-opus-4-6-thinking`   | Claude Opus with thinking   |
| `gemini-2.5-pro`             | Gemini 2.5 Pro              |
| `gemini-2.5-flash`           | Gemini 2.5 Flash            |

**In every launch script, you MUST override ALL model env vars:**

```bash
# These override the prefixed names from ~/.claude/settings.json
export ANTHROPIC_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_OPUS_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_SONNET_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="gemini-3-flash"
export CLAUDE_CODE_SUBAGENT_MODEL="gemini-3-pro-high"
```

Without this, the **team lead** works (via `--model` flag) but **subagents fail** because they read `CLAUDE_CODE_SUBAGENT_MODEL` from settings.json which has the wrong prefix.

---

## Step-by-Step Deployment

### 1. Create a Launch Script

Create `launch_<team_name>_team.sh` in the **workspace root**:

```bash
#!/bin/bash
exec > /tmp/<team_name>_launch.log 2>&1
echo "🚀 Launching <Team Name>..."

# 1. Ensure proxy is running
if ! curl -s --max-time 3 http://localhost:8080/health > /dev/null 2>&1; then
    echo "⚠️  antigravity-claude-proxy not running, starting..."
    nohup antigravity-claude-proxy start &>/tmp/antigravity-claude-proxy.log &
    sleep 5
    if ! curl -s --max-time 3 http://localhost:8080/health > /dev/null 2>&1; then
        echo "❌ Failed to start proxy! Aborting."
        exit 1
    fi
fi
echo "✅ Proxy healthy on port 8080"

# 2. Override ALL model vars (NO google-antigravity/ prefix!)
export ANTHROPIC_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_OPUS_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_SONNET_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="gemini-3-flash"
export CLAUDE_CODE_SUBAGENT_MODEL="gemini-3-pro-high"

# 3. Launch team lead
claude -p '<DETAILED PROMPT>' \
  --model gemini-3-pro-high \
  --dangerously-skip-permissions
```

// turbo

### 2. Make the Script Executable

```bash
chmod +x /home/paulo/Programs/apps/imaginos/launch_<team_name>_team.sh
```

### 3. Launch via Agent Manager MCP

```
mcp_agent-manager_start_team(
  workspace_path="/home/paulo/Programs/apps/imaginos",
  session_name="<team-name>-team",
  launch_script="launch_<team_name>_team.sh"
)
```

### 4. Verify Team is Running (MANDATORY)

**Do NOT report success without these checks:**

```bash
# 1. Check session exists
tmux has-session -t <team-name>-team

# 2. Check launch log for errors
cat /tmp/<team_name>_launch.log

# 3. Check proxy log for 400 errors (model name issues)
grep -E 'ERROR|400|invalid' /tmp/antigravity-claude-proxy.log | tail -10

# 4. Check pane has activity
tmux capture-pane -t <team-name>-team:0 -p -S -20
```

### 5. Monitor Progress

```
mcp_agent-manager_get_team_status(session_name="<team-name>-team")
tmux attach -t <team-name>-team   # Watch live
```

### 6. Stop Team

```
mcp_agent-manager_stop_team(session_name="<team-name>-team")
```

---

## Agent Team Design Best Practices

### Team Composition (Recommended)

- **Team Lead** (1): Coordinates, delegates, reviews
- **Backend Agent** (subagent): API routes, DB schema, server logic
- **Frontend Agent** (subagent): UI components, pages, styling
- **Testing Agent** (subagent): Validates builds, runs tests, verifies UI

### How Subagents Work

The Team Lead spawns subagents using Claude's built-in `--teammate-mode tmux` capabilities. Each subagent runs in the same tmux session as a new window.

### Prompt Engineering for Team Leads

The prompt must include:

1. **Clear goal** and scope
2. **File locations** (schema, components, API routes)
3. **Port constraints** (3001 dev, 3005 test, NEVER 3000)
4. **Progress tracking** (write to `PROGRESS.md` in workspace root)
5. **Task breakdown** (numbered steps with clear ownership per subagent)
6. **Exit condition** (when to stop)

---

## ⚠️ Critical Gotchas

### Qdrant API Key

**NEVER set `QDRANT__SERVICE__API_KEY`** on the Qdrant container. The SmartOS MCP and portal access Qdrant without authentication. If it gets set somehow:

```bash
docker stop imagineos-remember && docker rm imagineos-remember
cd /home/paulo/Programs/apps/imaginos/srv/containers && docker compose up -d remember
```

Verify: `curl http://localhost:6333/collections`

### Port Discipline

| Port | Service                  | Rule                     |
| ---- | ------------------------ | ------------------------ |
| 3000 | Caddy/Sentinel Router    | ❌ NEVER KILL            |
| 3001 | Portal (dev/prod)        | ✅ Use for testing       |
| 3005 | Portal (test)            | ✅ Alternative           |
| 6333 | Qdrant REST              | ✅ No auth needed        |
| 8080 | antigravity-claude-proxy | ✅ Must be started first |

### PM2 Mandate

- All app processes managed by PM2
- NEVER run `npm run dev` alongside PM2
- Restart after changes: `pm2 restart portal-main`

### Workspace & Schema

- Workspace root: `/home/paulo/Programs/apps/imaginos`
- DB schema: `opt/portal/src/lib/db/schema.ts` (Drizzle ORM + SQLite)
- Agent configs: `dump/agents/*.json` (OpenClaw agents)
- Agent Manager MCP: `agent-manager-mcp/index.js`
- SmartOS MCP: `smartos-mcp/index.js`

### Qdrant Collections

| Collection        | Purpose                          |
| ----------------- | -------------------------------- |
| `agents`          | Agent state, activity, knowledge |
| `service_history` | Service interaction logs         |
| `mijourney`       | Image generation metadata        |
| `projects`        | Project-level knowledge          |

---

## Troubleshooting

| Symptom                                    | Cause                                        | Fix                                                         |
| ------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------- |
| `ConnectionRefused` on Claude CLI          | `antigravity-claude-proxy` not running       | `antigravity-claude-proxy start`                            |
| `400 invalid_request_error: Invalid model` | Model name has `google-antigravity/` prefix  | Override ALL model env vars (see above)                     |
| Subagents fail but lead works              | `CLAUDE_CODE_SUBAGENT_MODEL` not overridden  | Add `export CLAUDE_CODE_SUBAGENT_MODEL="gemini-3-pro-high"` |
| tmux session exits immediately             | Check `/tmp/<name>_launch.log` for errors    | Usually proxy or model issue                                |
| Qdrant returns "Must provide API key"      | Container has `QDRANT__SERVICE__API_KEY` env | Recreate container from docker-compose                      |
