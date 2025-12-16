import React from 'react';
import { SocialLink } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SocialLinksProps {
  links: SocialLink[];
  className?: string;
  iconSize?: string;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ links, className = "flex space-x-4", iconSize = "h-5 w-5" }) => {
  const { t } = useLanguage();
  return (
    <div className={className}>
      {links.map((link) => (
        <a
          key={link.name} // name is now a translation key
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(link.name)}
          className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          {link.icon({ className: iconSize })}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;