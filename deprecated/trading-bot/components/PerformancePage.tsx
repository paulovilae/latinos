import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import botService, { PerformanceMetrics, Trade, PaginatedResponse } from '../services/botService';
import { FiAlertCircle, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Simple chart representation component (placeholder for a real chart library)
const PerformanceChart: React.FC<{ data: PerformanceMetrics | null; isLoading: boolean }> = ({
  data, isLoading
}) => {
  const { t } = useLanguage();
  
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }
  
  if (!data || !data.profit_history || data.profit_history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
        <p>{t('dashboard.performance.noDataAvailable')}</p>
      </div>
    );
  }
  
  // Calculate chart dimensions
  const chartHeight = 200;
  const chartWidth = '100%';
  const maxProfit = Math.max(...data.profit_history.map(p => p.profit));
  const minProfit = Math.min(0, ...data.profit_history.map(p => p.profit));
  const range = maxProfit - minProfit;
  
  // This is a placeholder for an actual chart component
  return (
    <div className="h-64 relative">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
          {t('dashboard.performance.profitOverTime')}
        </h3>
        <div className="text-right">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {t('dashboard.performance.totalProfit')}:
          </p>
          <p className={`text-xl font-bold ${data.total_profit >= 0 ? 'text-light-positive dark:text-dark-positive' : 'text-light-negative dark:text-dark-negative'}`}>
            ${data.total_profit.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Placeholder for the actual chart */}
      <div className="h-40 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border flex items-center justify-center">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          {t('dashboard.performance.chartVisualization')}
        </p>
      </div>
    </div>
  );
};

// Trade history table component
const TradeHistoryTable: React.FC<{
  trades: Trade[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({
  trades, isLoading, page, totalPages, onPageChange
}) => {
  const { t } = useLanguage();
  
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }
  
  if (!trades || trades.length === 0) {
    return (
      <div className="py-12 text-center text-light-text-secondary dark:text-dark-text-secondary">
        <p>{t('dashboard.performance.noTradesFound')}</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                {t('dashboard.performance.symbol')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                {t('dashboard.performance.side')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                {t('dashboard.performance.quantity')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                {t('dashboard.performance.price')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                {t('dashboard.performance.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                {t('dashboard.performance.date')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {trades.map(trade => (
              <tr key={trade.id} className="hover:bg-light-bg dark:hover:bg-dark-bg">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-light-text dark:text-dark-text">
                  {trade.symbol}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                  trade.side === 'buy' ? 'text-light-positive dark:text-dark-positive' : 'text-light-negative dark:text-dark-negative'
                }`}>
                  {trade.side.toUpperCase()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-light-text dark:text-dark-text">
                  {trade.quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-light-text dark:text-dark-text">
                  ${trade.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trade.status === 'filled' ? 'bg-light-positive/10 dark:bg-dark-positive/10 text-light-positive dark:text-dark-positive' :
                    trade.status === 'open' ? 'bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent' :
                    'bg-light-negative/10 dark:bg-dark-negative/10 text-light-negative dark:text-dark-negative'
                  }`}>
                    {trade.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {new Date(trade.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-4">
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {t('dashboard.performance.page')} {page} {t('dashboard.performance.of')} {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className={`p-2 rounded-md ${
                page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-light-bg dark:hover:bg-dark-bg'
              } text-light-text dark:text-dark-text`}
              aria-label={t('dashboard.performance.previousPage')}
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className={`p-2 rounded-md ${
                page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-light-bg dark:hover:bg-dark-bg'
              } text-light-text dark:text-dark-text`}
              aria-label={t('dashboard.performance.nextPage')}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Filter controls component
const TradeFilters: React.FC<{
  symbol: string;
  setSymbol: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  onApplyFilters: () => void;
  symbols: string[];
}> = ({
  symbol, setSymbol,
  status, setStatus,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  onApplyFilters,
  symbols
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div>
        <label htmlFor="symbol-filter" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          {t('dashboard.performance.symbol')}
        </label>
        <select
          id="symbol-filter"
          className="w-full bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-md p-2"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          <option value="">{t('dashboard.performance.allSymbols')}</option>
          {symbols.map((s, index) => (
            <option key={index} value={s}>{s}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          {t('dashboard.performance.status')}
        </label>
        <select
          id="status-filter"
          className="w-full bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-md p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{t('dashboard.performance.allStatuses')}</option>
          <option value="open">{t('dashboard.performance.statusOpen')}</option>
          <option value="filled">{t('dashboard.performance.statusFilled')}</option>
          <option value="cancelled">{t('dashboard.performance.statusCancelled')}</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="date-from" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          {t('dashboard.performance.fromDate')}
        </label>
        <input
          id="date-from"
          type="date"
          className="w-full bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-md p-2"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="date-to" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          {t('dashboard.performance.toDate')}
        </label>
        <input
          id="date-to"
          type="date"
          className="w-full bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-md p-2"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>
      
      <div className="lg:col-span-4 flex justify-end">
        <Button
          onClick={onApplyFilters}
          variant="secondary"
          size="sm"
        >
          <FiFilter className="mr-2" />
          {t('dashboard.performance.applyFilters')}
        </Button>
      </div>
    </div>
  );
};

// Performance metrics card component
const MetricsCard: React.FC<{
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  isPercentage?: boolean;
}> = ({
  title, value, trend = 'neutral', isPercentage = false
}) => {
  return (
    <div className="p-4 bg-light-card dark:bg-dark-card rounded-lg border border-light-border dark:border-dark-border">
      <h3 className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">{title}</h3>
      <p className={`text-xl font-semibold ${
        trend === 'up' ? 'text-light-positive dark:text-dark-positive' :
        trend === 'down' ? 'text-light-negative dark:text-dark-negative' :
        'text-light-text dark:text-dark-text'
      }`}>
        {isPercentage ? `${value}%` : (typeof value === 'number' ? `$${value.toFixed(2)}` : value)}
      </p>
    </div>
  );
};

// Symbol performance table component
const SymbolPerformanceTable: React.FC<{ data: PerformanceMetrics | null }> = ({ data }) => {
  const { t } = useLanguage();
  
  if (!data || !data.symbols_performance || data.symbols_performance.length === 0) {
    return null;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
              {t('dashboard.performance.symbol')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
              {t('dashboard.performance.tradesCount')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
              {t('dashboard.performance.successRate')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
              {t('dashboard.performance.totalProfit')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-light-border dark:divide-dark-border">
          {data.symbols_performance.map((item, index) => (
            <tr key={index} className="hover:bg-light-bg dark:hover:bg-dark-bg">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-light-text dark:text-dark-text">
                {item.symbol}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-light-text dark:text-dark-text">
                {item.trades_count}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span className={`${
                  item.success_rate >= 60 ? 'text-light-positive dark:text-dark-positive' :
                  item.success_rate < 40 ? 'text-light-negative dark:text-dark-negative' :
                  'text-light-text dark:text-dark-text'
                }`}>
                  {item.success_rate.toFixed(1)}%
                </span>
              </td>
              <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                item.total_profit >= 0 ? 'text-light-positive dark:text-dark-positive' : 'text-light-negative dark:text-dark-negative'
              }`}>
                ${item.total_profit.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PerformancePage: React.FC = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTradesLoading, setIsTradesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [symbols, setSymbols] = useState<string[]>([]);
  
  // Filter state
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  
  // Fetch performance metrics
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await botService.getPerformanceMetrics();
        setPerformanceData(data);
        
        // Extract unique symbols from performance data
        if (data.symbols_performance) {
          const uniqueSymbols = [...new Set(data.symbols_performance.map(item => item.symbol))];
          setSymbols(uniqueSymbols);
        }
      } catch (err) {
        console.error('Error fetching performance metrics:', err);
        setError(t('dashboard.performance.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [t]);
  
  // Fetch trade history with filters
  const fetchTrades = async () => {
    try {
      setIsTradesLoading(true);
      
      // Prepare filter params
      const params: {
        page?: number;
        limit?: number;
        symbol?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
      } = {
        page: currentPage,
        limit: 10 // Fixed page size
      };
      
      if (filterSymbol) params.symbol = filterSymbol;
      if (filterStatus) params.status = filterStatus;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;
      
      const response = await botService.getTrades(params);
      setTrades(response.data);
      setTotalPages(response.pagination.pages);
    } catch (err) {
      console.error('Error fetching trade history:', err);
      // Don't set error state here to avoid disrupting the entire page
    } finally {
      setIsTradesLoading(false);
    }
  };
  
  // Fetch trades when page or filters change
  useEffect(() => {
    fetchTrades();
  }, [currentPage]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle filter application
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page
    fetchTrades();
  };
  
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-6 text-light-text dark:text-dark-text">
        {t('dashboard.sidebar.performance')}
      </h1>
      
      {error ? (
        <Card className="bg-light-card dark:bg-dark-card mb-6">
          <div className="text-center py-8">
            <FiAlertCircle className="mx-auto h-12 w-12 text-light-negative dark:text-dark-negative mb-4" />
            <p className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
              {error}
            </p>
            <Button onClick={() => window.location.reload()} variant="secondary">
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Performance summary cards */}
          {performanceData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricsCard
                title={t('dashboard.performance.totalTrades')}
                value={performanceData.total_trades}
                trend="neutral"
                isPercentage={false}
              />
              <MetricsCard
                title={t('dashboard.performance.successRate')}
                value={performanceData.success_rate.toFixed(1)}
                trend={performanceData.success_rate >= 50 ? 'up' : 'down'}
                isPercentage={true}
              />
              <MetricsCard
                title={t('dashboard.performance.totalProfit')}
                value={performanceData.total_profit}
                trend={performanceData.total_profit >= 0 ? 'up' : 'down'}
                isPercentage={false}
              />
              <MetricsCard
                title={t('dashboard.performance.avgProfitPerTrade')}
                value={performanceData.average_profit_per_trade}
                trend={performanceData.average_profit_per_trade >= 0 ? 'up' : 'down'}
                isPercentage={false}
              />
            </div>
          )}
          
          {/* Performance chart */}
          <Card titleKey="dashboard.performance.summaryTitle" className="bg-light-card dark:bg-dark-card mb-6">
            <PerformanceChart data={performanceData} isLoading={isLoading} />
          </Card>
          
          {/* Symbol performance breakdown */}
          {performanceData && performanceData.symbols_performance && performanceData.symbols_performance.length > 0 && (
            <Card className="bg-light-card dark:bg-dark-card mb-6">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4 text-light-text dark:text-dark-text">
                  {t('dashboard.performance.symbolBreakdown')}
                </h2>
                <SymbolPerformanceTable data={performanceData} />
              </div>
            </Card>
          )}
          
          {/* Trade history */}
          <Card className="bg-light-card dark:bg-dark-card mb-6">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
                  {t('dashboard.performance.tradeHistory')}
                </h2>
                <Button
                  onClick={() => fetchTrades()}
                  variant="ghost"
                  size="sm"
                  className="text-light-text dark:text-dark-text"
                  disabled={isTradesLoading}
                >
                  <FiRefreshCw className={isTradesLoading ? 'animate-spin mr-2' : 'mr-2'} />
                  {t('dashboard.performance.refresh')}
                </Button>
              </div>
              
              {/* Filter controls */}
              <TradeFilters
                symbol={filterSymbol}
                setSymbol={setFilterSymbol}
                status={filterStatus}
                setStatus={setFilterStatus}
                dateFrom={filterDateFrom}
                setDateFrom={setFilterDateFrom}
                dateTo={filterDateTo}
                setDateTo={setFilterDateTo}
                onApplyFilters={handleApplyFilters}
                symbols={symbols}
              />
              
              {/* Trade table */}
              <TradeHistoryTable
                trades={trades}
                isLoading={isTradesLoading}
                page={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default PerformancePage;