# Bot Microservice Integration Guide

This guide provides comprehensive instructions for frontend developers to integrate with the AI Trading Bot Platform's backend services. It covers the process of using the bot services from React components, along with best practices, code examples, and troubleshooting tips.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setting Up the Integration](#setting-up-the-integration)
3. [Common Operations](#common-operations)
   - [Managing Trading Formulas](#managing-trading-formulas)
   - [Monitoring Trades](#monitoring-trades)
   - [Controlling the Bot System](#controlling-the-bot-system)
4. [Implementing UI Components](#implementing-ui-components)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

The AI Trading Bot Platform follows a three-tier architecture:

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│    Frontend     │────►│ Backend (Node.js)│────►│  Bot Microservice │
│  (React + TS)   │◄────│    Bot Module    │◄────│    (Python)       │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

- **Frontend**: React application with TypeScript
- **Backend**: Node.js/Express.js REST API
- **Bot Microservice**: Python-based trading algorithm engine

The frontend communicates with the backend through the `botService.ts` service, which handles authentication, API calls, and response processing.

## Setting Up the Integration

### 1. Import the botService

```typescript
import botService from '../services/botService';
```

### 2. Use React hooks for state management

```typescript
import React, { useState, useEffect } from 'react';
import { Formula } from '../services/botService';

function BotConfigComponent() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormulas = async () => {
      try {
        setLoading(true);
        const data = await botService.getFormulas();
        setFormulas(data);
        setError(null);
      } catch (err) {
        setError('Failed to load trading formulas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormulas();
  }, []);

  // Component rendering...
}
```

### 3. Ensure authentication is properly set up

The bot service requires authentication. Make sure the user is logged in before making API calls.

```typescript
import { useAuth } from '../hooks/useAuth';

function BotComponent() {
  const { isAuthenticated, login } = useAuth();

  // Only proceed with API calls if authenticated
  if (!isAuthenticated) {
    return <div>Please log in to access bot configuration</div>;
  }

  // Component logic...
}
```

## Common Operations

### Managing Trading Formulas

#### Fetching All Formulas

```typescript
const fetchFormulas = async () => {
  try {
    setLoading(true);
    const formulas = await botService.getFormulas();
    setFormulas(formulas);
  } catch (error) {
    setError('Failed to fetch formulas');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

#### Creating a New Formula

```typescript
const createNewFormula = async (formulaData: FormulaCreateParams) => {
  try {
    setSubmitting(true);
    const newFormula = await botService.createFormula(formulaData);
    setFormulas(prevFormulas => [...prevFormulas, newFormula]);
    setSuccess('Formula created successfully');
  } catch (error) {
    setError('Failed to create formula');
    console.error(error);
  } finally {
    setSubmitting(false);
  }
};
```

#### Updating a Formula

```typescript
const updateFormula = async (id: string, formulaData: FormulaUpdateParams) => {
  try {
    setSubmitting(true);
    const updatedFormula = await botService.updateFormula(id, formulaData);
    
    // Update the formula in the state
    setFormulas(prevFormulas => 
      prevFormulas.map(formula => 
        formula.id === id ? updatedFormula : formula
      )
    );
    
    setSuccess('Formula updated successfully');
  } catch (error) {
    setError('Failed to update formula');
    console.error(error);
  } finally {
    setSubmitting(false);
  }
};
```

#### Deleting a Formula

```typescript
const deleteFormula = async (id: string) => {
  try {
    setDeleting(true);
    await botService.deleteFormula(id);
    
    // Remove the formula from the state
    setFormulas(prevFormulas => 
      prevFormulas.filter(formula => formula.id !== id)
    );
    
    setSuccess('Formula deleted successfully');
  } catch (error) {
    setError('Failed to delete formula');
    console.error(error);
  } finally {
    setDeleting(false);
  }
};
```

### Monitoring Trades

#### Fetching Trade History

```typescript
const fetchTrades = async (filters = {}) => {
  try {
    setLoading(true);
    const tradeData = await botService.getTrades(filters);
    setTrades(tradeData.data);
    setPagination(tradeData.pagination);
  } catch (error) {
    setError('Failed to fetch trade history');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

#### Getting Current Trades

```typescript
const fetchCurrentTrades = async () => {
  try {
    setLoading(true);
    const activeTrades = await botService.getCurrentTrades();
    setCurrentTrades(activeTrades);
  } catch (error) {
    setError('Failed to fetch current trades');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

#### Fetching Performance Metrics

```typescript
const fetchPerformanceMetrics = async () => {
  try {
    setLoading(true);
    const metrics = await botService.getPerformanceMetrics();
    setPerformance(metrics);
  } catch (error) {
    setError('Failed to fetch performance metrics');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### Controlling the Bot System

#### Starting the Bot System

```typescript
const startBotSystem = async () => {
  try {
    setSubmitting(true);
    const result = await botService.startSystem();
    setSystemStatus(result.data);
    setSuccess('Trading system started successfully');
  } catch (error) {
    setError('Failed to start trading system');
    console.error(error);
  } finally {
    setSubmitting(false);
  }
};
```

#### Stopping the Bot System

```typescript
const stopBotSystem = async () => {
  try {
    setSubmitting(true);
    const result = await botService.stopSystem();
    setSystemStatus(result.data);
    setSuccess('Trading system stopped successfully');
  } catch (error) {
    setError('Failed to stop trading system');
    console.error(error);
  } finally {
    setSubmitting(false);
  }
};
```

#### Checking System Status

```typescript
const checkSystemStatus = async () => {
  try {
    const status = await botService.getSystemStatus();
    setSystemStatus(status);
  } catch (error) {
    setError('Failed to fetch system status');
    console.error(error);
  }
};
```

## Implementing UI Components

### Formula Configuration Form

```tsx
import React, { useState } from 'react';
import { FormulaCreateParams } from '../services/botService';
import botService from '../services/botService';

const FormulaForm: React.FC = () => {
  const [formula, setFormula] = useState<FormulaCreateParams>({
    name: '',
    symbol: '',
    interval: '1h',
    parameters: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormula(prev => ({ ...prev, [name]: value }));
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setFormula(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramName]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await botService.createFormula(formula);
      setSuccess('Formula created successfully');
      // Reset form or redirect
    } catch (err) {
      setError('Failed to create formula');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Formula Name</label>
        <input
          id="name"
          name="name"
          value={formula.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="symbol">Symbol</label>
        <input
          id="symbol"
          name="symbol"
          value={formula.symbol}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="interval">Interval</label>
        <select
          id="interval"
          name="interval"
          value={formula.interval}
          onChange={handleChange}
          required
        >
          <option value="1m">1 Minute</option>
          <option value="5m">5 Minutes</option>
          <option value="15m">15 Minutes</option>
          <option value="1h">1 Hour</option>
          <option value="1d">1 Day</option>
        </select>
      </div>
      
      {/* Dynamic parameters based on formula type */}
      <div className="form-group">
        <label htmlFor="rsi_period">RSI Period</label>
        <input
          id="rsi_period"
          type="number"
          value={formula.parameters.rsi_period || 14}
          onChange={(e) => handleParameterChange('rsi_period', parseInt(e.target.value))}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Formula'}
      </button>
    </form>
  );
};

export default FormulaForm;
```

### Performance Dashboard

```tsx
import React, { useEffect, useState } from 'react';
import { PerformanceMetrics } from '../services/botService';
import botService from '../services/botService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await botService.getPerformanceMetrics();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load performance metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Set up polling for regular updates
    const intervalId = setInterval(fetchMetrics, 60000); // Update every minute
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  if (loading) return <div>Loading performance metrics...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!metrics) return <div>No performance data available</div>;

  return (
    <div className="performance-dashboard">
      <h2>Trading Performance</h2>
      
      <div className="metrics-summary">
        <div className="metric-card">
          <h3>Total Trades</h3>
          <p>{metrics.total_trades}</p>
        </div>
        
        <div className="metric-card">
          <h3>Success Rate</h3>
          <p>{metrics.success_rate}%</p>
        </div>
        
        <div className="metric-card">
          <h3>Total Profit</h3>
          <p>${metrics.total_profit.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="profit-chart">
        <h3>Profit History</h3>
        <LineChart width={600} height={300} data={metrics.profit_history}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="profit" stroke="#8884d8" />
        </LineChart>
      </div>
      
      <div className="symbols-performance">
        <h3>Performance by Symbol</h3>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Trades</th>
              <th>Success Rate</th>
              <th>Total Profit</th>
            </tr>
          </thead>
          <tbody>
            {metrics.symbols_performance.map(symbol => (
              <tr key={symbol.symbol}>
                <td>{symbol.symbol}</td>
                <td>{symbol.trades_count}</td>
                <td>{symbol.success_rate}%</td>
                <td>${symbol.total_profit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
```

### System Control Panel

```tsx
import React, { useEffect, useState } from 'react';
import { SystemStatus } from '../services/botService';
import botService from '../services/botService';

const SystemControlPanel: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await botService.getSystemStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Regular polling for status updates
    const intervalId = setInterval(fetchStatus, 10000); // Every 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const handleStartSystem = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await botService.startSystem();
      setStatus(result.data);
      setSuccess('Trading system started successfully');
    } catch (err) {
      setError('Failed to start the trading system');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopSystem = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await botService.stopSystem();
      setStatus(result.data);
      setSuccess('Trading system stopped successfully');
    } catch (err) {
      setError('Failed to stop the trading system');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading system status...</div>;

  return (
    <div className="system-control-panel">
      <h2>System Control Panel</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {status && (
        <div className="status-display">
          <div className={`status-indicator ${status.status}`}>
            System Status: {status.status.toUpperCase()}
          </div>
          
          <div className="status-details">
            <p>Active Formulas: {status.active_formulas}</p>
            {status.start_time && (
              <p>Running since: {new Date(status.start_time).toLocaleString()}</p>
            )}
            {status.last_execution && (
              <p>Last execution: {new Date(status.last_execution).toLocaleString()}</p>
            )}
            {status.next_execution && (
              <p>Next execution: {new Date(status.next_execution).toLocaleString()}</p>
            )}
            {status.error_message && (
              <p className="error-message">Error: {status.error_message}</p>
            )}
          </div>
        </div>
      )}
      
      <div className="control-buttons">
        <button 
          onClick={handleStartSystem} 
          disabled={actionLoading || (status && status.status === 'running')}
          className="start-button"
        >
          {actionLoading ? 'Processing...' : 'Start System'}
        </button>
        
        <button 
          onClick={handleStopSystem} 
          disabled={actionLoading || (status && status.status !== 'running')}
          className="stop-button"
        >
          {actionLoading ? 'Processing...' : 'Stop System'}
        </button>
      </div>
    </div>
  );
};

export default SystemControlPanel;
```

## Error Handling

### Common Error Patterns

Implement consistent error handling across components:

```typescript
try {
  // API operation
} catch (error) {
  // 1. Log the error for debugging
  console.error('Detailed error information:', error);
  
  // 2. Set user-friendly error message based on error type
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      
      if (status === 401) {
        setError('Your session has expired. Please log in again.');
        // Potentially trigger auth logout/redirect
      } else if (status === 403) {
        setError('You do not have permission to perform this action.');
      } else if (status === 404) {
        setError('The requested resource could not be found.');
      } else if (status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        // Use error message from API if available
        const message = error.response.data?.error || 'An unexpected error occurred';
        setError(message);
      }
    } else if (error.request) {
      // Request made but no response received
      setError('Unable to connect to the server. Please check your internet connection.');
    } else {
      // Error setting up the request
      setError('An error occurred while setting up the request.');
    }
  } else {
    // Non-Axios error
    setError('An unexpected error occurred.');
  }
}
```

### Error Boundary Component

Implement an error boundary to catch rendering errors:

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    // You could also log to an error reporting service here
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>Please try refreshing the page or contact support if the problem persists.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Usage:

```tsx
<ErrorBoundary>
  <PerformanceDashboard />
</ErrorBoundary>
```

## Performance Optimization

### Implementing Data Polling with React Hooks

Create a custom hook for polling data:

```typescript
import { useState, useEffect, useRef } from 'react';

interface PollingOptions {
  interval: number;  // milliseconds
  immediate?: boolean;
  enabled?: boolean;
}

export function usePolling<T>(
  fetchFunction: () => Promise<T>,
  options: PollingOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { interval, immediate = true, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await fetchFunction();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    
    if (immediate) {
      fetchData();
    }
    
    const poll = () => {
      timeoutRef.current = setTimeout(async () => {
        await fetchData();
        poll();
      }, interval);
    };
    
    poll();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchFunction, interval, immediate, enabled]);
  
  return { data, loading, error, refetch: fetchData };
}
```

Usage:

```typescript
function SystemStatusComponent() {
  const { 
    data: status, 
    loading, 
    error,
    refetch 
  } = usePolling(
    () => botService.getSystemStatus(),
    { interval: 10000, immediate: true } // 10 seconds
  );
  
  // Component rendering...
}
```

### Memoization for Complex Calculations

Use React's memoization to optimize rendering performance:

```typescript
import React, { useMemo } from 'react';

function PerformanceAnalysis({ trades }) {
  // Memoize expensive calculations
  const statistics = useMemo(() => {
    if (!trades || trades.length === 0) return null;
    
    // Perform expensive calculations here
    return {
      winRate: calculateWinRate(trades),
      profitFactor: calculateProfitFactor(trades),
      sharpeRatio: calculateSharpeRatio(trades)
    };
  }, [trades]); // Only recalculate when trades change
  
  if (!statistics) return <div>No data available</div>;
  
  return (
    <div className="performance-stats">
      <div>Win Rate: {statistics.winRate.toFixed(2)}%</div>
      <div>Profit Factor: {statistics.profitFactor.toFixed(2)}</div>
      <div>Sharpe Ratio: {statistics.sharpeRatio.toFixed(2)}</div>
    </div>
  );
}
```

### Lazy Loading Components

Implement lazy loading for heavy components:

```typescript
import React, { Suspense, lazy } from 'react';

// Lazy load the performance dashboard
const PerformanceDashboard = lazy(() => import('./PerformanceDashboard'));

function BotConfigPage() {
  return (
    <div className="bot-config-page">
      <h1>Bot Configuration</h1>
      
      {/* Other lightweight components */}
      <SystemControlPanel />
      
      {/* Lazy-loaded heavy component */}
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <PerformanceDashboard />
      </Suspense>
    </div>
  );
}
```

## Troubleshooting

### Common Issues and Solutions

#### Authentication Issues

**Problem**: API calls return 401 Unauthorized errors.

**Solution**: 
1. Check if the authentication token is present and valid
2. Ensure the token is properly included in API requests
3. Verify token expiration and implement automatic refresh

```typescript
// Check token expiration before making API calls
const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    // Parse the JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    
    return Date.now() >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Refresh token if needed before API call
const executeWithValidToken = async (apiCall) => {
  if (isTokenExpired()) {
    await refreshToken();
  }
  return apiCall();
};
```

#### Network Connectivity Issues

**Problem**: API calls fail with network errors.

**Solution**:
1. Implement retry logic for transient network issues
2. Add offline detection and recovery
3. Provide clear feedback to users

```typescript
import { useState, useEffect } from 'react';

// Hook to detect online/offline status
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

// Usage in component
function BotComponent() {
  const isOnline = useOnlineStatus();
  
  if (!isOnline) {
    return (
      <div className="offline-warning">
        You're currently offline. Please check your internet connection to continue.
      </div>
    );
  }
  
  // Regular component rendering...
}
```

#### Data Format Errors

**Problem**: UI components fail to render due to unexpected data formats.

**Solution**:
1. Implement data validation before using API responses
2. Provide fallbacks for missing or invalid data
3. Use TypeScript interfaces to catch issues at compile time

```typescript
// Validate performance metrics data
const validatePerformanceMetrics = (data: any): PerformanceMetrics => {
  return {
    total_trades: Number(data.total_trades) || 0,
    successful_trades: Number(data.successful_trades) || 0,
    failed_trades: Number(data.failed_trades) || 0,
    success_rate: Number(data.success_rate) || 0,
    total_profit: Number(data.total_profit) || 0,
    average_profit_per_trade: Number(data.average_profit_per_trade) || 0,
    largest_profit: Number(data.largest_profit) || 0,
    largest_loss: Number(data.largest_loss) || 0,
    profit_history: Array.isArray(data.profit_history) 
      ? data.profit_history.map(item => ({
          date: String(item.date) || '',
          profit: Number(item.profit) || 0
        }))
      : [],
    symbols_performance: Array.isArray(data.symbols_performance)
      ? data.symbols_performance.map(item => ({
          symbol: String(item.symbol) || '',
          trades_count: Number(item.trades_count) || 0,
          success_rate: Number(item.success_rate) || 0,
          total_profit: Number(item.total_profit) || 0
        }))
      : []
  };
};
```

#### Performance Issues

**Problem**: UI becomes slow or unresponsive when displaying large datasets.

**Solution**:
1. Implement pagination for large data sets
2. Use virtualized lists for efficient rendering
3. Optimize data fetching with filtering parameters

```typescript
import { FixedSizeList } from 'react-window';

// Virtualized list for efficient rendering of large trade lists
function TradeHistoryList({ trades }) {
  const Row = ({ index, style }) => {
    const trade = trades[index];
    return (
      <div style={style} className="trade-row">
        <div>{trade.symbol}</div>
        <div>{trade.side}</div>
        <div>${trade.price.toFixed(2)}</div>
        <div>{new Date(trade.created_at).toLocaleString()}</div>
        <div className={`status ${trade.status}`}>{trade.status}</div>
      </div>
    );
  };

  return (
    <FixedSizeList
      height={400}
      width="100%"
      itemCount={trades.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Debugging Tips

1. **Enable detailed logging**:
   ```typescript
   // Configure in development environment
   const DEBUG_MODE = process.env.NODE_ENV === 'development';
   
   const debugLog = (...args) => {
     if (DEBUG_MODE) {
       console.log('[Bot Service Debug]', ...args);
     }
   };
   
   // Usage in service calls
   async function fetchData() {
     debugLog('Fetching data with params:', params);
     const result = await apiCall();
     debugLog('API response:', result);
     return result;
   }
   ```

2. **Use React DevTools** for component inspection and debugging
   
3. **Implement service interceptors** for monitoring API calls:
   ```typescript
   // In a setup file
   import axios from 'axios';

   axios.interceptors.request.use(
     config => {
       console.log(`Request: ${config.method.toUpperCase()} ${config.url}`, config);
       return config;
     },
     error => {
       console.error('Request error:', error);
       return Promise.reject(error);
     }
   );

   axios.interceptors.response.use(
     response => {
       console.log(`Response: ${response.status} ${response.config.url}`, response);
       return response;
     },
     error => {
       console.error('Response error:', error);
       return Promise.reject(error);
     }
   );
   ```

4. **Add a debug mode toggle** in development:
   ```tsx
   function DebugPanel({ data }) {
     const [showDebug, setShowDebug] = useState(false);
     
     if (process.env.NODE_ENV !== 'development') return null;
     
     return (
       <div className="debug-panel">
         <button onClick={() => setShowDebug(!showDebug)}>
           {showDebug ? 'Hide' : 'Show'} Debug Info
         </button>
         
         {showDebug && (
           <pre>{JSON.stringify(data, null, 2)}</pre>
         )}
       </div>
     );
   }