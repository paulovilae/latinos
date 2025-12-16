
import React from 'react';
import { MOCK_NEWS_ARTICLES } from '../constants';
import NewsArticleCard from './NewsArticleCard';
import ParallaxSection from './ParallaxSection';

const NewsPage: React.FC = () => {
  return (
    <div className="animate-fade-in-up">
      <ParallaxSection imageUrl="https://picsum.photos/seed/news_hero/1920/600" minHeight="min-h-[40vh]" overlayOpacity={0.6}>
        <h1 className="text-5xl font-bold text-white">Market News & AI Insights</h1>
        <p className="text-xl text-gray-200 mt-4 max-w-2xl">
          Stay updated with the latest market trends and analysis, enhanced by AI summaries.
        </p>
      </ParallaxSection>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_NEWS_ARTICLES.map(article => (
            <NewsArticleCard key={article.id} article={article} showSummaryButton={true} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
    