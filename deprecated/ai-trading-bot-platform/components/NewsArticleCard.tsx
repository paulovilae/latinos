import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { geminiSummarizeText } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface NewsArticleCardProps {
  article: NewsArticle;
  showSummaryButton?: boolean;
}

const NewsArticleCard: React.FC<NewsArticleCardProps> = ({ article, showSummaryButton = true }) => {
  const { t, language } = useLanguage(); // language for date formatting
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetSummary = async () => {
    // Note: article.content itself might be a translation key for the full article.
    // For AI summary, we'd need the actual text content in a specific language (likely English for the model).
    // This example assumes article.content IS the text, not a key.
    const fullContentText = t(article.content); // If content is a key
    // const fullContentText = article.content; // If content is already text

    if (!fullContentText) {
      setError(t('error.noContentForSummary'));
      return;
    }
    setIsLoadingSummary(true);
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        // Fallback for local dev when API_KEY might not be set in process.env directly
        // This is NOT secure for production.
        // In a real app, API key management is crucial.
        console.warn("API_KEY not found in process.env. Attempting mock or placeholder.");
        // const mockApiKey = "YOUR_TEST_API_KEY"; // For testing only
        // if(!mockApiKey) throw new Error(t('error.apiKeyMissing'));
        // const summarizedText = await geminiSummarizeText(fullContentText, mockApiKey);
        throw new Error(t('error.apiKeyMissingOrInvalid')); // More realistic error
      }
      const summarizedText = await geminiSummarizeText(fullContentText, apiKey);
      setSummary(summarizedText);
    } catch (err: any) {
      console.error("Error fetching summary:", err);
      setError(err.message || t('error.summaryFailed'));
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const formattedDate = new Date(article.date).toLocaleDateString(language, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Card className="flex flex-col h-full animate-fade-in-up bg-light-card dark:bg-dark-card">
      {article.imageUrl && <img src={article.imageUrl} alt={t(article.title)} className="w-full h-48 object-cover" />}
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-light-accent dark:text-dark-accent mb-2">{t(article.title)}</h3>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">{t('news.dateLabel')}: {formattedDate}</p>
        {article.source && <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">{t('news.sourceLabel')}: {t(article.source)}</p>}
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">{t(article.summary)}</p>

        {summary && (
          <div className="mt-4 p-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md">
            <h4 className="text-sm font-semibold text-light-accent dark:text-dark-accent mb-1">{t('news.aiSummary')}:</h4>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{summary}</p>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-light-negative dark:text-dark-negative">{error}</p>}
      </div>
      {showSummaryButton && (
        <div className="p-4 border-t border-light-border dark:border-dark-border">
          <Button 
            onClick={handleGetSummary} 
            isLoading={isLoadingSummary} 
            disabled={isLoadingSummary || !article.content}
            variant="secondary"
            size="sm"
            fullWidth
          >
            {isLoadingSummary ? t('news.generatingSummary') : (summary ? t('news.regenerateSummary') : t('news.getAiSummary'))}
          </Button>
           {!article.content && <p className="text-xs text-center text-light-negative dark:text-dark-negative mt-1">{t('error.noContentForSummary')}</p>}
        </div>
      )}
    </Card>
  );
};

export default NewsArticleCard;