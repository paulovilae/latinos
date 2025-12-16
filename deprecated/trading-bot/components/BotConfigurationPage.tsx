import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import { BotConfiguration, BotStrategy } from '../types';
import { FiPlusCircle, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiAlertCircle, FiCheckCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import botService, { Formula, FormulaCreateParams, FormulaUpdateParams, SystemStatus } from '../services/botService';
import LoadingSpinner from './LoadingSpinner';

// Map Formula from API to BotConfiguration for UI
const mapFormulaToConfig = (formula: Formula): BotConfiguration => {
  return {
    id: formula.id,
    name: formula.name,
    marketPair: `${formula.symbol}/${formula.exchange || 'USD'}`,
    strategy: formula.parameters.strategy || BotStrategy.MOVING_AVERAGE_CROSSOVER,
    investmentAmount: formula.parameters.investmentAmount || 1000,
    riskLevel: formula.parameters.riskLevel || 'medium',
    isActive: formula.is_active
  };
};

// Map BotConfiguration back to Formula update params for API
const mapConfigToFormulaUpdate = (config: BotConfiguration): FormulaUpdateParams => {
  const [symbol, exchange] = config.marketPair.split('/');
  return {
    name: config.name,
    symbol: symbol,
    exchange: exchange,
    parameters: {
      strategy: config.strategy,
      investmentAmount: config.investmentAmount,
      riskLevel: config.riskLevel
    },
    is_active: config.isActive
  };
};

const BotConfigCard: React.FC<{ bot: BotConfiguration; onToggleActive: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;}> = ({ bot, onToggleActive, onEdit, onDelete }) => {
  const { t } = useLanguage();
  return (
    <Card className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-lg font-semibold text-light-accent dark:text-dark-accent">{bot.name}</h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {bot.marketPair} - {t(`dashboard.botStrategy.${bot.strategy.replace(/\s+/g, '')}` as any, { defaultValue: bot.strategy })}
          </p>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            {t('dashboard.configure.investment')}: ${bot.investmentAmount.toLocaleString()}
          </p>
           <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
             {t('dashboard.configure.risk')}: {t(`dashboard.botRisk.${bot.riskLevel}` as any, { defaultValue: bot.riskLevel })}
           </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
           <button 
            onClick={() => onToggleActive(bot.id)}
            className={`p-2 rounded-md transition-colors ${bot.isActive ? 'text-light-positive dark:text-dark-positive hover:bg-light-positive/10 dark:hover:bg-dark-positive/10' : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-negative/10 dark:hover:bg-dark-negative/10'}`}
            aria-label={bot.isActive ? t('dashboard.configure.deactivateBot') : t('dashboard.configure.activateBot')}
            title={bot.isActive ? t('dashboard.configure.deactivateBot') : t('dashboard.configure.activateBot')}
            >
            {bot.isActive ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
          </button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(bot.id)} aria-label={t('dashboard.configure.editBot')}>
            <FiEdit size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(bot.id)} className="text-light-negative dark:text-dark-negative hover:bg-light-negative/10 dark:hover:bg-dark-negative/10" aria-label={t('dashboard.configure.deleteBot')}>
            <FiTrash2 size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const SystemStatusCard: React.FC<{ status: SystemStatus | null; onStartSystem: () => void; onStopSystem: () => void; isLoading: boolean }> = ({
  status, onStartSystem, onStopSystem, isLoading
}) => {
  const { t } = useLanguage();
  
  if (!status) {
    return (
      <Card className="mb-6 bg-light-card dark:bg-dark-card">
        <div className="flex items-center justify-center p-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-light-text-secondary dark:text-dark-text-secondary">
            {t('dashboard.configure.loadingStatus')}
          </span>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6 bg-light-card dark:bg-dark-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2">
        <div>
          <div className="flex items-center">
            {status.status === 'running' ? (
              <FiCheckCircle className="text-light-positive dark:text-dark-positive mr-2" size={20} />
            ) : status.status === 'error' ? (
              <FiAlertCircle className="text-light-negative dark:text-dark-negative mr-2" size={20} />
            ) : (
              <FiAlertCircle className="text-light-text-secondary dark:text-dark-text-secondary mr-2" size={20} />
            )}
            <h3 className="text-lg font-medium">
              {t(`dashboard.configure.systemStatus.${status.status}`, {defaultValue: status.status})}
            </h3>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            {t('dashboard.configure.activeFormulas')}: {status.active_formulas}
          </p>
          {status.last_execution && (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {t('dashboard.configure.lastExecution')}: {new Date(status.last_execution).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex mt-4 sm:mt-0">
          {status.status === 'running' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={onStopSystem}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : t('dashboard.configure.stopSystem')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onStartSystem}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : t('dashboard.configure.startSystem')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const BotConfigurationPage: React.FC = () => {
  const { t } = useLanguage();
  const [bots, setBots] = useState<BotConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isSystemActionLoading, setIsSystemActionLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  // Check backend connectivity first
  useEffect(() => {
    const checkConnectivity = async () => {
      setIsCheckingConnection(true);
      const connected = await botService.checkBackendConnectivity();
      setIsConnected(connected);
      setIsCheckingConnection(false);
      
      // If connected, proceed with data fetching
      if (connected) {
        fetchData();
      } else {
        setIsLoading(false);
        setError(t('dashboard.configure.connectionError'));
      }
    };
    
    checkConnectivity();
  }, [t]);

  // Fetch formulas and system status
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch formulas
      const formulas = await botService.getFormulas();
      setBots(formulas.map(mapFormulaToConfig));
      
      // Fetch system status
      const status = await botService.getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('dashboard.configure.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Set up status refresh interval when connected
  useEffect(() => {
    if (!isConnected) return;
    
    // Refresh status every 30 seconds
    const intervalId = setInterval(() => {
      botService.getSystemStatus()
        .then(status => setSystemStatus(status))
        .catch(err => console.error('Error fetching system status:', err));
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [isConnected]);

  const handleRetryConnection = async () => {
    setIsCheckingConnection(true);
    const connected = await botService.checkBackendConnectivity();
    setIsConnected(connected);
    setIsCheckingConnection(false);
    
    if (connected) {
      fetchData();
    }
  };

  const handleAddBot = async () => {
    // This could be replaced with a modal form for creating new bots
    try {
      const newFormula: FormulaCreateParams = {
        name: "New Trading Bot",
        symbol: "BTC",
        exchange: "USD",
        interval: "1h",
        parameters: {
          strategy: BotStrategy.MOVING_AVERAGE_CROSSOVER,
          investmentAmount: 1000,
          riskLevel: "medium"
        },
        is_active: false
      };
      
      const created = await botService.createFormula(newFormula);
      setBots(prev => [...prev, mapFormulaToConfig(created)]);
    } catch (err) {
      console.error('Error creating formula:', err);
      alert(t('dashboard.configure.createError'));
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const bot = bots.find(b => b.id === id);
      if (!bot) return;
      
      const updated = await botService.updateFormula(id, {
        is_active: !bot.isActive
      });
      
      setBots(prevBots => prevBots.map(b =>
        b.id === id ? mapFormulaToConfig(updated) : b
      ));
    } catch (err) {
      console.error('Error updating formula:', err);
      alert(t('dashboard.configure.updateError'));
    }
  };
  
  const handleEditBot = async (id: string) => {
    // This could be replaced with a modal form for editing bots
    try {
      const bot = bots.find(b => b.id === id);
      if (!bot) return;
      
      // For now, just toggle the active status as an example
      const updated = await botService.updateFormula(id, {
        is_active: !bot.isActive
      });
      
      setBots(prevBots => prevBots.map(b =>
        b.id === id ? mapFormulaToConfig(updated) : b
      ));
    } catch (err) {
      console.error('Error updating formula:', err);
      alert(t('dashboard.configure.updateError'));
    }
  };

  const handleDeleteBot = async (id: string) => {
    const bot = bots.find(b => b.id === id);
    if (!bot) return;
    
    if(window.confirm(t('dashboard.configure.confirmDeleteBot', { botName: bot.name || 'this bot' }))) {
      try {
        await botService.deleteFormula(id);
        setBots(prevBots => prevBots.filter(b => b.id !== id));
      } catch (err) {
        console.error('Error deleting formula:', err);
        alert(t('dashboard.configure.deleteError'));
      }
    }
  };
  
  const handleStartSystem = async () => {
    try {
      setIsSystemActionLoading(true);
      const result = await botService.startSystem();
      if (result.success) {
        setSystemStatus(result.data);
      }
    } catch (err) {
      console.error('Error starting system:', err);
      alert(t('dashboard.configure.startSystemError'));
    } finally {
      setIsSystemActionLoading(false);
    }
  };
  
  const handleStopSystem = async () => {
    try {
      setIsSystemActionLoading(true);
      const result = await botService.stopSystem();
      if (result.success) {
        setSystemStatus(result.data);
      }
    } catch (err) {
      console.error('Error stopping system:', err);
      alert(t('dashboard.configure.stopSystemError'));
    } finally {
      setIsSystemActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">
                {t('dashboard.configure.title')}
            </h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {t('dashboard.configure.description')}
            </p>
        </div>
        <Button
          onClick={handleAddBot}
          variant="primary"
          className="mt-4 sm:mt-0"
          disabled={isLoading || !isConnected}
        >
          <FiPlusCircle className="mr-2" />
          {t('dashboard.configure.addBot')}
        </Button>
      </div>
      
      {/* Connection Status Alert */}
      {!isConnected && (
        <Card className="mb-6 bg-light-negative/10 dark:bg-dark-negative/10 border border-light-negative dark:border-dark-negative">
          <div className="flex items-center p-4">
            <FiWifiOff className="text-light-negative dark:text-dark-negative mr-3" size={24} />
            <div className="flex-1">
              <h3 className="font-medium text-light-text dark:text-dark-text">
                {t('dashboard.configure.connectionError')}
              </h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {t('dashboard.configure.connectionErrorDescription')}
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={handleRetryConnection}
              disabled={isCheckingConnection}
              className="ml-4"
            >
              {isCheckingConnection ? <LoadingSpinner size="sm" /> : t('common.retry')}
            </Button>
          </div>
        </Card>
      )}
      
      {/* System Status Card - only show when connected */}
      {isConnected && (
        <SystemStatusCard
          status={systemStatus}
          onStartSystem={handleStartSystem}
          onStopSystem={handleStopSystem}
          isLoading={isSystemActionLoading}
        />
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error && isConnected ? (
        <Card className="bg-light-card dark:bg-dark-card">
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto h-12 w-12 text-light-negative dark:text-dark-negative mb-4" />
            <p className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
              {error}
            </p>
            <Button onClick={fetchData} variant="secondary">
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      ) : isConnected && bots.length > 0 ? (
        <div className="space-y-4">
          {bots.map(bot => (
            <BotConfigCard 
              key={bot.id} 
              bot={bot} 
              onToggleActive={handleToggleActive}
              onEdit={handleEditBot}
              onDelete={handleDeleteBot}
            />
          ))}
        </div>
      ) : isConnected ? (
        <Card className="bg-light-card dark:bg-dark-card">
          <div className="text-center py-12">
            <FiPlusCircle className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary mb-4" />
            <p className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
              {t('dashboard.configure.noBotsYet')}
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
                {t('dashboard.configure.noBotsYetSubtitle')}
            </p>
            <Button onClick={handleAddBot} variant="secondary">
              {t('dashboard.configure.addFirstBot')}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default BotConfigurationPage;