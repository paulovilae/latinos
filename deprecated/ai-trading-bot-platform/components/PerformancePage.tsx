import React from 'react';
import Card from './Card';
import { useLanguage } from '../contexts/LanguageContext';

const PerformancePage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-6 text-light-text dark:text-dark-text">
        {t('dashboard.sidebar.performance')}
      </h1>
      <Card titleKey="dashboard.performance.summaryTitle" className="bg-light-card dark:bg-dark-card">
        <div className="h-64 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
          <p>{t('dashboard.performance.summaryPlaceholder')}</p>
        </div>
      </Card>
      {/* TODO: Add more content specific to performance, e.g., list of bot performances, charts */}
      <Card className="mt-6 bg-light-card dark:bg-dark-card">
         <p className="text-center p-4 text-light-text-secondary dark:text-dark-text-secondary">
            {t('dashboard.performance.detailedReportPlaceholder', {defaultValue: "Detailed performance reports and breakdown per bot will be shown here."})}
         </p>
      </Card>
    </div>
  );
};

export default PerformancePage;