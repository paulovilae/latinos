-- AI Trading Platform Database Initialization
-- This script sets up the shared PostgreSQL database with tenant isolation

-- Create schemas for different parts of the application
CREATE SCHEMA IF NOT EXISTS shared;      -- Shared entities (users, tenants)
CREATE SCHEMA IF NOT EXISTS marketing;   -- Marketing Payload data
CREATE SCHEMA IF NOT EXISTS trading;     -- Trading Payload data
CREATE SCHEMA IF NOT EXISTS analytics;   -- Analytics and time series data

-- Set search path to include all schemas
ALTER DATABASE trading_platform SET search_path TO shared, marketing, trading, analytics, public;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SHARED SCHEMA: Core entities used by both Marketing and Trading platforms
-- ============================================================================

-- Tenants table for multi-tenancy
CREATE TABLE shared.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    branding JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (shared between marketing and trading)
CREATE TABLE shared.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'expert', 'admin', 'super_admin')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified BOOLEAN DEFAULT FALSE,
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for authentication
CREATE TABLE shared.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MARKETING SCHEMA: Marketing platform specific tables
-- ============================================================================

-- Marketing pages
CREATE TABLE marketing.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content JSONB,
    seo JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- Blog posts for content marketing
CREATE TABLE marketing.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    author_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content JSONB,
    featured_image VARCHAR(500),
    tags TEXT[],
    seo JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- Subscriptions and billing
CREATE TABLE marketing.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    billing_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRADING SCHEMA: Trading platform specific tables
-- ============================================================================

-- Trading bots
CREATE TABLE trading.trading_bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bot_type VARCHAR(50) NOT NULL CHECK (bot_type IN ('ai', 'strategy', 'copy')),
    status VARCHAR(50) DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'stopped', 'error')),
    config JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    risk_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading strategies
CREATE TABLE trading.trading_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    code TEXT,
    parameters JSONB DEFAULT '{}',
    backtest_results JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading positions
CREATE TABLE trading.positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    bot_id UUID REFERENCES trading.trading_bots(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20,8) NOT NULL,
    entry_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    pnl DECIMAL(20,8) DEFAULT 0.00,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade history
CREATE TABLE trading.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    bot_id UUID REFERENCES trading.trading_bots(id) ON DELETE CASCADE,
    position_id UUID REFERENCES trading.positions(id) ON DELETE SET NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0.00,
    trade_type VARCHAR(50) DEFAULT 'market' CHECK (trade_type IN ('market', 'limit', 'stop', 'stop_limit')),
    external_id VARCHAR(255),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio snapshots
CREATE TABLE trading.portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    total_value DECIMAL(20,8) NOT NULL,
    cash_balance DECIMAL(20,8) NOT NULL,
    positions_value DECIMAL(20,8) NOT NULL,
    daily_pnl DECIMAL(20,8) DEFAULT 0.00,
    total_pnl DECIMAL(20,8) DEFAULT 0.00,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id, snapshot_date)
);

-- ============================================================================
-- ANALYTICS SCHEMA: Analytics and performance data
-- ============================================================================

-- Market data cache
CREATE TABLE analytics.market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open_price DECIMAL(20,8) NOT NULL,
    high_price DECIMAL(20,8) NOT NULL,
    low_price DECIMAL(20,8) NOT NULL,
    close_price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, timeframe, timestamp)
);

-- AI analysis results
CREATE TABLE analytics.ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    input_data JSONB,
    results JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Shared schema indexes
CREATE INDEX idx_tenants_subdomain ON shared.tenants(subdomain);
CREATE INDEX idx_users_tenant_id ON shared.users(tenant_id);
CREATE INDEX idx_users_email ON shared.users(email);
CREATE INDEX idx_user_sessions_user_id ON shared.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON shared.user_sessions(expires_at);

-- Marketing schema indexes
CREATE INDEX idx_pages_tenant_slug ON marketing.pages(tenant_id, slug);
CREATE INDEX idx_blog_posts_tenant_slug ON marketing.blog_posts(tenant_id, slug);
CREATE INDEX idx_blog_posts_status_published ON marketing.blog_posts(status, published_at);
CREATE INDEX idx_subscriptions_tenant_user ON marketing.subscriptions(tenant_id, user_id);

-- Trading schema indexes
CREATE INDEX idx_trading_bots_owner ON trading.trading_bots(owner_id);
CREATE INDEX idx_trading_bots_tenant ON trading.trading_bots(tenant_id);
CREATE INDEX idx_trading_strategies_creator ON trading.trading_strategies(creator_id);
CREATE INDEX idx_trading_strategies_public ON trading.trading_strategies(is_public);
CREATE INDEX idx_positions_bot_id ON trading.positions(bot_id);
CREATE INDEX idx_positions_status ON trading.positions(status);
CREATE INDEX idx_trades_bot_id ON trading.trades(bot_id);
CREATE INDEX idx_trades_symbol_executed ON trading.trades(symbol, executed_at);
CREATE INDEX idx_portfolio_snapshots_user_date ON trading.portfolio_snapshots(user_id, snapshot_date);

-- Analytics schema indexes
CREATE INDEX idx_market_data_symbol_timeframe ON analytics.market_data(symbol, timeframe, timestamp);
CREATE INDEX idx_ai_analysis_tenant_symbol ON analytics.ai_analysis(tenant_id, symbol);
CREATE INDEX idx_ai_analysis_created_at ON analytics.ai_analysis(created_at);

-- ============================================================================
-- TRIGGERS for Updated At
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON shared.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON shared.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON marketing.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON marketing.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON marketing.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_bots_updated_at BEFORE UPDATE ON trading.trading_bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_strategies_updated_at BEFORE UPDATE ON trading.trading_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON trading.positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) for Tenant Isolation
-- ============================================================================

-- Enable RLS on all tenant-specific tables
ALTER TABLE shared.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.ai_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
-- Note: These policies will be refined based on application-level tenant context

-- ============================================================================
-- SEED DATA for Development
-- ============================================================================

-- Insert default tenant
INSERT INTO shared.tenants (id, name, subdomain, plan, status) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Trading Platform',
    'demo',
    'professional',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Insert admin user
INSERT INTO shared.users (id, tenant_id, email, password_hash, role, email_verified, profile) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', -- password: admin123
    'admin',
    true,
    '{"firstName": "Admin", "lastName": "User", "tradingExperience": "advanced"}'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample trading bot
INSERT INTO trading.trading_bots (id, tenant_id, owner_id, name, description, bot_type, status, config, performance) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Demo AI Trading Bot',
    'AI-powered trading bot for demonstration purposes',
    'ai',
    'paused',
    '{"riskLevel": "medium", "maxPositionSize": 10, "stopLoss": 5, "takeProfit": 15, "assetClasses": ["stocks", "crypto"]}',
    '{"totalReturn": 24.5, "winRate": 68.2, "sharpeRatio": 1.45, "maxDrawdown": -8.3, "totalTrades": 156}'
) ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA shared TO PUBLIC;
GRANT USAGE ON SCHEMA marketing TO PUBLIC;
GRANT USAGE ON SCHEMA trading TO PUBLIC;
GRANT USAGE ON SCHEMA analytics TO PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shared TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA marketing TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA trading TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO PUBLIC;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shared TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA marketing TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA trading TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics TO PUBLIC;

-- Database initialization complete
SELECT 'AI Trading Platform database initialized successfully!' as status;