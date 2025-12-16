import React, { useState, useEffect } from 'react';
import Card from './Card';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import botService, { Formula } from '../services/botService';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

// Type for market data
interface MarketData {
  symbol: string;
  exchange: string;
  currentPrice: number;
  priceHistory: { time: string; price: number }[];
  indicators: {
    rsi: number;
    ma20: number;
    ma50: number;
    volatility: number;
  };
}

// In a real app, we would install and use a chart library like Recharts or Chart.js
// This is a placeholder component for demonstration
const MarketChart: React.FC<{ data: MarketData | null; isLoading: boolean }> = ({ data, isLoading }) => {
  const { t } = useLanguage();
  
  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="h-96 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
        <p>{t('dashboard.analysis.noDataAvailable')}</p>
      </div>
    );
  }
  
  // This is a placeholder for an actual chart component
  return (
    <div className="h-96">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold text-light-text dark:text-dark-text">
            {data.symbol}/{data.exchange}
          </h3>
          <p className="text-2xl font-bold text-light-accent dark:text-dark-accent">
            ${data.currentPrice.toFixed(2)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">RSI:</span>
            <span className={`ml-2 font-medium ${data.indicators.rsi > 70 ? 'text-light-negative dark:text-dark-negative' :
              data.indicators.rsi < 30 ? 'text-light-positive dark:text-dark-positive' :
              'text-light-text dark:text-dark-text'}`}>
              {data.indicators.rsi.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">MA20:</span>
            <span className="ml-2 font-medium text-light-text dark:text-dark-text">
              ${data.indicators.ma20.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">MA50:</span>
            <span className="ml-2 font-medium text-light-text dark:text-dark-text">
              ${data.indicators.ma50.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Volatility:</span>
            <span className="ml-2 font-medium text-light-text dark:text-dark-text">
              {(data.indicators.volatility * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Placeholder for the actual chart */}
      <div className="h-64 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border flex items-center justify-center">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          {t('dashboard.analysis.chartVisualization')}
        </p>
      </div>
    </div>
  );
};

const IndicatorCard: React.FC<{ title: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }> = ({
  title, value, trend = 'neutral'
}) => {
  return (
    <div className="p-4 bg-light-card dark:bg-dark-card rounded-lg border border-light-border dark:border-dark-border">
      <h3 className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">{title}</h3>
      <p className={`text-xl font-semibold ${
        trend === 'up' ? 'text-light-positive dark:text-dark-positive' :
        trend === 'down' ? 'text-light-negative dark:text-dark-negative' :
        'text-light-text dark:text-dark-text'
      }`}>
        {value}
      </p>
    </div>
  );
};

const TechnicalAnalysisPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  
  // Fetch available formulas to show their symbols
  useEffect(() => {
    const fetchFormulas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const formulaData = await botService.getFormulas();
        setFormulas(formulaData);
        
        // Select the first formula's symbol by default
        if (formulaData.length > 0 && !selectedSymbol) {
          setSelectedSymbol(formulaData[0].symbol);
        }
      } catch (err) {
        console.error('Error fetching formulas:', err);
        setError(t('dashboard.analysis.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFormulas();
  }, [t]);
  
  // Fetch market data for the selected symbol
  useEffect(() => {
    if (!selectedSymbol) return;
    
    const fetchMarketData = async () => {
      try {
        setIsRefreshing(true);
        
        // In a real implementation, we would have an API endpoint for this
        // For now, we'll simulate market data based on the formula
        const formula = formulas.find(f => f.symbol === selectedSymbol);
        
        if (formula) {
          // Simulate market data for demonstration
          const mockPriceHistory = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (30 - i));
            
            // Generate a somewhat realistic price series
            const basePrice = 100 + (Math.sin(i / 3) * 20) + (i / 2);
            const noise = Math.random() * 5 - 2.5;
            
            return {
              time: date.toISOString(),
              price: basePrice + noise
            };
          });
          
          const lastPrice = mockPriceHistory[mockPriceHistory.length - 1].price;
          
          // Simulate indicator values
          const simulatedData: MarketData = {
            symbol: formula.symbol,
            exchange: formula.exchange || 'USD',
            currentPrice: lastPrice,
            priceHistory: mockPriceHistory,
            indicators: {
              rsi: 35 + Math.random() * 30, // Between 35-65
              ma20: lastPrice * (0.95 + Math.random() * 0.1), // Slightly below current price
              ma50: lastPrice * (0.9 + Math.random() * 0.15), // Further below current price
              volatility: 0.02 + Math.random() * 0.05 // 2-7% volatility
            }
          };
          
          setMarketData(simulatedData);
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        // Don't set error here, just log it to avoid disrupting the UI
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchMarketData();
    
    // Set up auto-refresh every 60 seconds
    const intervalId = setInterval(fetchMarketData, 60000);
    
    return () => clearInterval(intervalId);
  }, [selectedSymbol, formulas]);
  
  const handleRefresh = () => {
    // Trigger a manual refresh of the market data
    if (!isRefreshing && selectedSymbol) {
      // This would typically call the API again
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000); // Simulate network delay
    }
  };
  
  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">
          {t('dashboard.sidebar.analysis')}
        </h1>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select
            className="bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-md p-2"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            disabled={isLoading || formulas.length === 0}
            aria-label={t('dashboard.analysis.selectSymbol')}
          >
            {formulas.length === 0 ? (
              <option value="">{t('dashboard.analysis.noSymbolsAvailable')}</option>
            ) : (
              formulas.map(formula => (
                <option key={formula.id} value={formula.symbol}>
                  {formula.symbol}/{formula.exchange || 'USD'}
                </option>
              ))
            )}
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !selectedSymbol}
            className={`p-2 rounded-md transition-colors ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-light-bg dark:hover:bg-dark-bg'
            } text-light-text dark:text-dark-text`}
            aria-label={t('dashboard.analysis.refreshData')}
            title={t('dashboard.analysis.refreshData')}
          >
            <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {error ? (
        <Card className="bg-light-card dark:bg-dark-card mb-6">
          <div className="text-center py-8">
            <FiAlertCircle className="mx-auto h-12 w-12 text-light-negative dark:text-dark-negative mb-4" />
            <p className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              {t('common.retry')}
            </button>
          </div>
        </Card>
      ) : (
        <>
          <Card titleKey="dashboard.analysis.mainChartTitle" className="bg-light-card dark:bg-dark-card mb-6">
            <MarketChart data={marketData} isLoading={isLoading || isRefreshing} />
          </Card>
          
          {marketData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <IndicatorCard
                title={t('dashboard.analysis.rsi')}
                value={marketData.indicators.rsi.toFixed(2)}
                trend={marketData.indicators.rsi > 70 ? 'down' : marketData.indicators.rsi < 30 ? 'up' : 'neutral'}
              />
              <IndicatorCard
                title={t('dashboard.analysis.movingAverage20')}
                value={`$${marketData.indicators.ma20.toFixed(2)}`}
                trend={marketData.currentPrice > marketData.indicators.ma20 ? 'up' : 'down'}
              />
              <IndicatorCard
                title={t('dashboard.analysis.movingAverage50')}
                value={`$${marketData.indicators.ma50.toFixed(2)}`}
                trend={marketData.currentPrice > marketData.indicators.ma50 ? 'up' : 'down'}
              />
              <IndicatorCard
                title={t('dashboard.analysis.volatility')}
                value={`${(marketData.indicators.volatility * 100).toFixed(2)}%`}
                trend={marketData.indicators.volatility > 0.05 ? 'down' : 'neutral'}
              />
            </div>
          )}
          
          <Card className="bg-light-card dark:bg-dark-card">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">
                {t('dashboard.analysis.technicalInsights')}
              </h2>
              
              {isLoading || !marketData ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="text-light-text dark:text-dark-text">
                  <p className="mb-3">
                    {marketData.indicators.rsi > 70 ?
                      t('dashboard.analysis.insights.overBought') :
                      marketData.indicators.rsi < 30 ?
                        t('dashboard.analysis.insights.overSold') :
                        t('dashboard.analysis.insights.neutral')}
                  </p>
                  
                  <p className="mb-3">
                    {marketData.currentPrice > marketData.indicators.ma20 && marketData.currentPrice > marketData.indicators.ma50 ?
                      t('dashboard.analysis.insights.bullishTrend') :
                      marketData.currentPrice < marketData.indicators.ma20 && marketData.currentPrice < marketData.indicators.ma50 ?
                        t('dashboard.analysis.insights.bearishTrend') :
                        t('dashboard.analysis.insights.mixedSignals')}
                  </p>
                  
                  <p>
                    {marketData.indicators.volatility > 0.05 ?
                      t('dashboard.analysis.insights.highVolatility') :
                      marketData.indicators.volatility < 0.02 ?
                        t('dashboard.analysis.insights.lowVolatility') :
                        t('dashboard.analysis.insights.moderateVolatility')}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default TechnicalAnalysisPage;