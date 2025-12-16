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

export interface DashboardSummary {
  metrics: Metrics;
  bots: Bot[];
  formulas: Formula[];
  signals: Signal[];
  backtests: Backtest[];
  plans: Plan[];
  market_universe: MarketUniverseItem[];
}
