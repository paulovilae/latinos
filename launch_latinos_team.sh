#!/bin/bash
echo "🚀 Launching Latinos Feature Implementation Team..."

# 1. Ensure proxy is running
if ! curl -s --max-time 3 http://localhost:8080/health > /dev/null 2>&1; then
    echo "⚠️  antigravity-claude-proxy not running, starting..."
    nohup antigravity-claude-proxy start &>/tmp/antigravity-claude-proxy.log &
    sleep 5
fi

# 2. Override ALL model vars (NO google-antigravity/ prefix!)
export ANTHROPIC_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_OPUS_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_SONNET_MODEL="gemini-3-pro-high"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="gemini-3-flash"
export CLAUDE_CODE_SUBAGENT_MODEL="gemini-3-pro-high"

# 3. Launch team lead INTERACTIVELY
claude "You are the Lead Quant Developer for the Latinos trading platform. Your singular goal is to invent the 'Golden Goose', a highly profitable algorithmic trading strategy.
Read /home/paulo/.gemini/antigravity/brain/7c40be10-b8e5-443f-9f9b-045c0cab1cca/task.md and PROGRESS_GOLDEN_GOOSE.md to understand the scope.

YOUR SCOPE FOR THIS SESSION:
1. Access the Backtesting engine via the Fastapi backend endpoints (\`POST /api/signals/backtest\`) or bypass the API and write a Python script that injects variations directly into \`app/signals.py\` BacktestEngine.
2. Formulate, combine, and test mathematical pattern variations for trading signals using historical OHLCV data. 
3. Run large-scale backtests iterating over variations of SMA, RSI, ATR, and other technical or statistical signals defined in our system.
4. Keep testing formulas until you produce a combination that yields:
   - Sharpe Ratio > 1.8
   - Max Drawdown < 15%
5. Once this constraint is fulfilled, publish the winning bot into the PostgreSQL database using the FastAPI endpoints so it is available in the User Dashboard as the flagship 'Golden Goose' offering.

CONSTRAINTS:
- Write your progress, current best metrics, and strategy configurations to PROGRESS_GOLDEN_GOOSE.md in the workspace root.
- You have permission to write Python test scripts to rapid-fire the backtester instead of using the API if it is faster.
- Do NOT stop until the Sharpe Ratio and Drawdown constraints are met.
- Once completed, ensure the bot is saved in the database with status='running'.
" --model gemini-3-pro-high --dangerously-skip-permissions
