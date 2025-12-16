import React from 'react';
import { UserProgress, Achievement } from '../../types';
import Card from '../Card';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiAward, FiStar, FiTrendingUp } from 'react-icons/fi'; // Example icons

interface UserProgressCardProps {
  userProgress: UserProgress;
}

const AchievementItem: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const { t } = useLanguage();
  return (
    <li className={`flex items-center p-3 rounded-md transition-opacity ${achievement.achieved ? 'opacity-100 bg-light-accent/10 dark:bg-dark-accent/10' : 'opacity-60 bg-light-border/50 dark:bg-dark-border/50'}`}>
      {achievement.iconUrl ? 
        <img src={achievement.iconUrl} alt={t(achievement.nameKey)} className="h-8 w-8 mr-3"/>
        : <FiAward className={`h-8 w-8 mr-3 ${achievement.achieved ? 'text-light-accent dark:text-dark-accent' : 'text-light-text-secondary dark:text-dark-text-secondary' }`} />
      }
      <div>
        <p className={`font-semibold text-sm ${achievement.achieved ? 'text-light-accent dark:text-dark-accent' : 'text-light-text dark:text-dark-text'}`}>{t(achievement.nameKey)}</p>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{t(achievement.descriptionKey)}</p>
      </div>
    </li>
  );
};

const UserProgressCard: React.FC<UserProgressCardProps> = ({ userProgress }) => {
  const { t } = useLanguage();

  return (
    <Card titleKey="dashboard.userProgress.title" className="bg-light-card dark:bg-dark-card h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-md border border-light-border dark:border-dark-border">
          <div className="flex items-center">
            <FiStar className="h-6 w-6 text-yellow-500 dark:text-yellow-400 mr-2" />
            <span className="text-sm font-medium text-light-text dark:text-dark-text">
              {t('dashboard.userProgress.points', { points: userProgress.points.toLocaleString() })}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-md border border-light-border dark:border-dark-border">
          <div className="flex items-center">
            <FiTrendingUp className="h-6 w-6 text-green-500 dark:text-green-400 mr-2" />
             <span className="text-sm font-medium text-light-text dark:text-dark-text">
              {t('dashboard.userProgress.level', { level: userProgress.level })}
            </span>
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-semibold text-light-text dark:text-dark-text mb-2 mt-4">
            {t('dashboard.userProgress.achievements')}
          </h4>
          {userProgress.achievements.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {userProgress.achievements.map(ach => <AchievementItem key={ach.id} achievement={ach} />)}
            </ul>
          ) : (
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('dashboard.userProgress.noAchievements')}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserProgressCard;
