export const metrics = {
  users: 1240,
  bots: 58,
  formulas: 132,
  backtests: 784,
  signals: 12943,
};

export const bots = [
  { id: 1, name: "Momentum Alpha", status: "running", tags: ["momentum", "equities"], owner: "Alice" },
  { id: 2, name: "Mean Reverter", status: "paused", tags: ["fx", "mean-reversion"], owner: "Bob" },
  { id: 3, name: "Breakout Hunter", status: "draft", tags: ["crypto", "intraday"], owner: "Team" },
];

export const formulas = [
  { id: 11, bot: "Momentum Alpha", version: 3, published: true, created: "2024-06-01" },
  { id: 12, bot: "Mean Reverter", version: 1, published: false, created: "2024-05-12" },
];

export const signals = [
  { id: 201, bot: "Momentum Alpha", type: "buy", payload: "price > sma50", mode: "paper", emitted: "12:01" },
  { id: 202, bot: "Mean Reverter", type: "sell", payload: "spread zscore > 2", mode: "live", emitted: "12:04" },
];

export const backtests = [
  { id: 501, bot: "Momentum Alpha", status: "completed", range: "2020-2024", pnl: 142, hitRate: 0.67 },
  { id: 502, bot: "Mean Reverter", status: "running", range: "2023", pnl: 12, hitRate: 0.53 },
];

export const plans = [
  { name: "Free", limits: "1 bot, 1 backtest/day", price: "$0", features: ["Signal log", "Draft formulas"] },
  { name: "Pro", limits: "10 bots, 50 backtests/mo", price: "$49", features: ["Live trading", "Webhooks", "MFA required"] },
  { name: "Enterprise", limits: "Custom", price: "Contact us", features: ["SAML", "Priority compute", "SLAs"] },
];
