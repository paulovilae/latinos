import React from 'react';
import { Testimonial } from '../types';
import Card from './Card';
import { FaQuoteLeft } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  const { t } = useLanguage();
  return (
    <Card className="flex flex-col h-full animate-fade-in-up bg-light-card dark:bg-dark-card shadow-xl hover:shadow-2xl transition-shadow transform hover:-translate-y-1">
      <div className="p-6 flex-grow">
        <FaQuoteLeft className="text-4xl text-light-accent dark:text-dark-accent opacity-50 mb-4" />
        <p className="text-light-text-secondary dark:text-dark-text-secondary italic mb-6 text-md">&ldquo;{t(testimonial.quote)}&rdquo;</p>
      </div>
      <div className="px-6 py-4 bg-light-bg dark:bg-dark-bg border-t border-light-border dark:border-dark-border">
        <div className="flex items-center">
          {testimonial.avatarUrl && (
            <img className="h-12 w-12 rounded-full object-cover mr-4 border-2 border-light-border dark:border-dark-border" src={testimonial.avatarUrl} alt={testimonial.name} />
          )}
          <div>
            <p className="font-semibold text-light-text dark:text-dark-text">{testimonial.name}</p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{t(testimonial.role)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TestimonialCard;