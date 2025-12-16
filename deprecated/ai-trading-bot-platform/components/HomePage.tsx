import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ParallaxSection from './ParallaxSection';
import Button from './Button';
import { MOCK_PRODUCTS, MOCK_TESTIMONIALS, MOCK_NEWS_ARTICLES, APP_NAME_KEY } from '../constants';
import TestimonialCard from './TestimonialCard';
import NewsArticleCard from './NewsArticleCard';
import Card from './Card';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth'; // For admin edit

interface EditableContentProps {
  initialContentKey: string;
  className?: string;
}

const EditableContent: React.FC<EditableContentProps> = ({ initialContentKey, className }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(t(initialContentKey));

  // In a real app, saving would call an API.
  // Here, we just update local state and assume `t` would eventually get updated content.
  const handleSave = () => {
    console.log("Saving content (mock):", content);
    // Potentially update a global state or refetch if content source changes
    setIsEditing(false);
     // For demo, we're not actually persisting this to translations
  };
  
  // Update content if language changes and not editing
  React.useEffect(() => {
    if (!isEditing) {
      setContent(t(initialContentKey));
    }
  }, [t, initialContentKey, isEditing]);


  if (user?.role === 'admin') {
    if (isEditing) {
      return (
        <div className={`border border-light-accent dark:border-dark-accent p-2 rounded ${className}`}>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[100px] p-2 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded"
          />
          <Button onClick={handleSave} size="sm" className="mt-2 mr-2">Save</Button>
          <Button onClick={() => { setIsEditing(false); setContent(t(initialContentKey));}} variant="outline" size="sm" className="mt-2">Cancel</Button>
        </div>
      );
    }
    return (
      <div className={`relative group ${className}`} onClick={() => setIsEditing(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}>
        <span dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        <span className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-light-accent dark:bg-dark-accent text-light-accent-text dark:text-dark-accent-text rounded-bl-md cursor-pointer">Edit</span>
      </div>
    );
  }

  return <span dangerouslySetInnerHTML={{ __html: t(initialContentKey).replace(/\n/g, '<br />') }} className={className} />;
};


const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="animate-fade-in-up">
      <ParallaxSection imageUrl="https://images.unsplash.com/photo-1518773553398-650c184e0bb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dGVjaG5vbG9neSUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=1200&q=70" minHeight="min-h-screen" overlayOpacity={0.75}>
        <div className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white"
              dangerouslySetInnerHTML={{ __html: t('homePage.heroTitle') }}
          />
          <EditableContent 
            initialContentKey="homePage.heroSubtitle" 
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-gray-200" 
          />
          <div className="space-x-4">
            <Link to="/register">
              <Button size="lg" variant="primary">{t('homePage.getStarted')}</Button>
            </Link>
            <Link to="/products">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-light-accent dark:hover:text-dark-accent">{t('homePage.learnMore')}</Button>
            </Link>
          </div>
        </div>
      </ParallaxSection>

      <section className="py-16 bg-light-bg dark:bg-dark-bg">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4 text-light-text dark:text-dark-text">{t('homePage.discoverBotsTitle')}</h2>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mb-12 max-w-2xl mx-auto">
            {t('homePage.discoverBotsSubtitle')}
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {MOCK_PRODUCTS.slice(0, 2).map(product => (
              <Card key={product.id} className="text-left transform hover:-translate-y-1 transition-transform duration-300">
                <img src={product.imageUrl} alt={t(product.name)} className="w-full h-48 object-cover rounded-md mb-6" />
                <h3 className="text-2xl font-semibold mb-3 text-light-accent dark:text-dark-accent">{t(product.name)}</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">{t(product.description)}</p>
                <Link to={`/products#${product.id}`}>
                  <Button variant="secondary" fullWidth>{t('product.viewDetails')}</Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ParallaxSection imageUrl="https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRlY2hub2xvZ3klMjBiYWNrZ3JvdW5kfGVufDB8fDB8fHww&auto=format&fit=crop&w=1200&q=70" minHeight="min-h-[500px]" overlayOpacity={0.8}>
        <h2 className="text-4xl font-bold mb-6 text-white">{t('homePage.whyChooseUsTitle')}</h2>
        <ul className="text-xl space-y-4 max-w-2xl text-gray-100">
          {[ 'homePage.featureA', 'homePage.featureB', 'homePage.featureC', 'homePage.featureD'].map(key => (
             <li key={key} className="flex items-center">
                <span className="text-light-highlight dark:text-dark-highlight mr-3 text-2xl">&#10003;</span> {t(key)}
             </li>
          ))}
        </ul>
      </ParallaxSection>
      
      <section className="py-16 bg-light-bg dark:bg-dark-bg">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-light-text dark:text-dark-text">{t('homePage.testimonialsTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {MOCK_TESTIMONIALS.slice(0,3).map(testimonial => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
           <div className="text-center mt-12">
            <Link to="/testimonials">
              <Button variant="outline">{t('homePage.viewAllTestimonials')}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-light-card dark:bg-dark-card">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-light-text dark:text-dark-text">{t('homePage.newsTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {MOCK_NEWS_ARTICLES.slice(0,3).map(article => (
               <NewsArticleCard key={article.id} article={article} showSummaryButton={false} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/news">
              <Button variant="primary">{t('homePage.readMoreNews')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;