export interface Metrics {
  users: number;
  bots: number;
  formulas: number;
  backtests: number;
  signals: number;
}

export interface Bot {
  id: number;
  name: string;
  description: string;
  status: string;
  owner_id: number;
  tags: string[];
  script?: string;
  live_trading?: boolean;
  live_trading_connection_id?: number | null;
  live_metrics?: Record<string, any>;
  // Bean (WASM) integration
  wasm_base64?: string;
  wasm_size_bytes?: number;
  wasm_hash?: string;
  dify_app_id?: string;
  python_validated?: boolean;
  indicator?: string;
  condition?: string;
}

export interface Formula {
  id: number;
  bot_id: number;
  version: number;
  payload: Record<string, unknown>;
  created_by: number;
  created_at: string;
  published: boolean;
  assets: string[];
  notes?: string | null;
}

export interface Signal {
  id: number;
  bot_id: number;
  type: string;
  payload: Record<string, unknown>;
  emitted_at: string;
  mode: string;
  delivery_status: string;
}

export interface Backtest {
  id: number;
  bot_id: number;
  formula_version_id: number;
  range: string;
  market: string;
  status: string;
  results: Record<string, unknown> | null;
  submitted_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  mfa_enabled: boolean;
}

export interface Plan {
  name: string;
  description: string;
  limits: string;
  price_monthly: string;
  price_yearly: string;
  features: string[];
}

export interface MarketUniverseItem {
  symbol: string;
  name: string;
  sector: string;
}

export interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: string;
  filled_qty: string;
  type: string;
  side: string;
  status: string;
  filled_avg_price: string | null;
  created_at: string;
}

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  unrealized_pl: string;
  current_price: string;
}

export interface AlpacaAccount {
  cash: string;
  portfolio_value: string;
  equity: string;
  buying_power: string;
}

export interface DashboardSummary {
  metrics: Metrics;
  bots: Bot[];
  formulas: Formula[];
  signals: Signal[];
  backtests: Backtest[];
  plans: Plan[];
  market_universe: MarketUniverseItem[];
  subscription_tier: string;
  alpaca_account?: AlpacaAccount | null;
  alpaca_orders: AlpacaOrder[];
  alpaca_positions: AlpacaPosition[];
}
