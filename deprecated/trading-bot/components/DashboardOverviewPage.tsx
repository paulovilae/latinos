import React from 'react';
import Card from './Card';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import UserProgressCard from './dashboard/UserProgressCard'; // New import
import { FiTrendingUp, FiCheckCircle, FiAlertCircle, FiSettings } from 'react-icons/fi';


const StatCard: React.FC<{ titleKey: string; value: string; icon: React.ElementType, iconColorClass?: string }> = ({ titleKey, value, icon: Icon, iconColorClass = "text-light-accent dark:text-dark-accent" }) => {
  const { t } = useLanguage();
  return (
    <Card className="bg-light-card dark:bg-dark-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 ${iconColorClass} mr-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t(titleKey)}</p>
          <p className="text-2xl font-semibold text-light-text dark:text-dark-text">{value}</p>
        </div>
      </div>
    </Card>
  );
};


const DashboardOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Mock data for overview stats
  const mockStats = {
    activeBots: 2,
    totalProfit: 1250.75,
    overallWinRate: 68.5,
    recentAlerts: 1,
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">
          {t('dashboard.overviewPage.welcome', { name: user?.name || user?.email || 'Trader' })}
        </h1>
        {user?.role === 'admin' && (
          <p className="mt-1 text-sm text-light-accent dark:text-dark-accent">{t('dashboard.overviewPage.adminMessage')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard titleKey="dashboard.overview.activeBots" value={String(mockStats.activeBots)} icon={FiSettings} />
        <StatCard titleKey="dashboard.overview.totalProfit" value={`$${mockStats.totalProfit.toLocaleString()}`} icon={FiTrendingUp} iconColorClass="text-light-positive dark:text-dark-positive" />
        <StatCard titleKey="dashboard.overview.winRate" value={`${mockStats.overallWinRate}%`} icon={FiCheckCircle} iconColorClass="text-light-positive dark:text-dark-positive" />
        <StatCard titleKey="dashboard.overview.recentAlerts" value={String(mockStats.recentAlerts)} icon={FiAlertCircle} iconColorClass="text-light-negative dark:text-dark-negative" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
           {user?.progress && <UserProgressCard userProgress={user.progress} />}
        </div>
        <Card titleKey="dashboard.overview.recentActivity" className="lg:col-span-2 bg-light-card dark:bg-dark-card">
          {/* Placeholder for recent activity feed */}
          <ul className="space-y-3">
            {[1,2,3,4].map(i => (
                 <li key={i} className="text-sm text-light-text-secondary dark:text-dark-text-secondary p-3 bg-light-bg dark:bg-dark-bg rounded-md border border-light-border dark:border-dark-border">
                    {t('dashboard.overview.mockActivity', {item: i})}
                 </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Placeholder for a main chart or key performance indicator */}
      <Card titleKey="dashboard.overview.performanceChart" className="bg-light-card dark:bg-dark-card">
        <div className="h-64 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
          <p>{t('dashboard.overview.chartComingSoon')}</p>
        </div>
      </Card>
    </div>
  );
};

export default DashboardOverviewPage;
