import React from 'react';
import Card from './Card';
import Button from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import { INITIAL_BOT_CONFIGURATIONS } from '../constants';
import { BotConfiguration } from '../types';
import { FiPlusCircle, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

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

const BotConfigurationPage: React.FC = () => {
  const { t } = useLanguage();
  const [bots, setBots] = React.useState<BotConfiguration[]>(INITIAL_BOT_CONFIGURATIONS);

  const handleAddBot = () => {
    alert(t('dashboard.configure.addBotActionPlaceholder'));
  };

  const handleToggleActive = (id: string) => {
    setBots(prevBots => prevBots.map(b => b.id === id ? {...b, isActive: !b.isActive} : b));
  };
  
  const handleEditBot = (id: string) => {
    alert(t('dashboard.configure.editBotActionPlaceholder', {botId: id}));
  };

  const handleDeleteBot = (id: string) => {
    if(window.confirm(t('dashboard.configure.confirmDeleteBot', { botName: bots.find(b=>b.id===id)?.name || 'this bot' }))) {
        setBots(prevBots => prevBots.filter(b => b.id !== id));
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
        <Button onClick={handleAddBot} variant="primary" className="mt-4 sm:mt-0">
          <FiPlusCircle className="mr-2" />
          {t('dashboard.configure.addBot')}
        </Button>
      </div>
      
      {bots.length > 0 ? (
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
      ) : (
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
      )}
    </div>
  );
};

export default BotConfigurationPage;