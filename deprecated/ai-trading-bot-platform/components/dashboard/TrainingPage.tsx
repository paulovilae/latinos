import React from 'react';
import { MOCK_TRAINING_MODULES } from '../../constants';
import Card from '../Card';
import Button from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiChevronRight } from 'react-icons/fi';

const TrainingPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-6 text-light-text dark:text-dark-text">
        {t('dashboard.trainingPage.title')}
      </h1>
      <p className="mb-8 text-light-text-secondary dark:text-dark-text-secondary">
        {t('dashboard.trainingPage.description')}
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_TRAINING_MODULES.map(module => (
          <Card key={module.id} className="flex flex-col h-full bg-light-card dark:bg-dark-card">
            <div className="p-6 flex-grow">
              {module.icon && <module.icon className="h-10 w-10 text-light-accent dark:text-dark-accent mb-4" />}
              <h3 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
                {t(module.titleKey)}
              </h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                {t(module.descriptionKey)}
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {t('dashboard.trainingPage.estimatedTimeLabel') || 'Est. Time'}: {module.estimatedTime}
              </p>
            </div>
            <div className="p-4 mt-auto border-t border-light-border dark:border-dark-border">
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => alert(t('dashboard.trainingPage.comingSoon'))} // Placeholder action
                className="flex items-center justify-center"
              >
                {t('dashboard.trainingPage.startTraining')}
                <FiChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrainingPage;
