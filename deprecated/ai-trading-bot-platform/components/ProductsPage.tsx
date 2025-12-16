
import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../constants';
import { Product } from '../types';
import Button from './Button';
import Card from './Card';
import ParallaxSection from './ParallaxSection';
import { FaCheckCircle } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { t } = useLanguage();
  return (
    <Card className="flex flex-col h-full transform hover:scale-105 transition-transform duration-300 bg-light-card dark:bg-dark-card" id={product.id}>
      {product.imageUrl && <img src={product.imageUrl} alt={t(product.name)} className="w-full h-56 object-cover" />}
      <div className="p-6 flex-grow">
        <h3 className="text-2xl font-bold text-light-accent dark:text-dark-accent mb-3">{t(product.name)}</h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">{t(product.description)}</p>
        
        <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mt-6 mb-2">{t('product.keyBenefits')}</h4>
        <ul className="space-y-1 text-light-text-secondary dark:text-dark-text-secondary mb-6">
          {product.benefits.map((benefitKey, index) => (
            <li key={index} className="flex items-center">
              <FaCheckCircle className="text-light-positive dark:text-dark-positive mr-2 flex-shrink-0" />
              {t(benefitKey)}
            </li>
          ))}
        </ul>

        <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mt-6 mb-2">{t('product.pricingTiers')}</h4>
        <div className="space-y-4">
          {product.pricing.map((tier, index) => (
            <div key={index} className="border border-light-border dark:border-dark-border p-4 rounded-md bg-light-bg dark:bg-dark-bg">
              <h5 className="font-semibold text-light-accent dark:text-dark-accent">{t(tier.tier)} - <span className="text-light-text dark:text-dark-text font-normal">{tier.price}</span></h5>
              <ul className="list-disc list-inside text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {tier.features.map((featureKey, fIndex) => (
                  <li key={fIndex}>{t(featureKey)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 mt-auto border-t border-light-border dark:border-dark-border">
        <Link to="/register">
          <Button variant="secondary" fullWidth>{t('product.getStartedWith', { productName: t(product.name) })}</Button>
        </Link>
      </div>
    </Card>
  );
}

const ProductsPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up">
      <ParallaxSection imageUrl="https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJsb2NrY2hhaW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=1200&q=70" minHeight="min-h-[40vh]" overlayOpacity={0.7}>
        <h1 className="text-5xl font-bold text-white">{t('productsPage.title', {defaultValue: "Our Trading Bot Solutions"})}</h1>
        <p className="text-xl text-gray-200 mt-4 max-w-2xl">
          {t('productsPage.subtitle', {defaultValue: "Explore our range of AI-powered trading bots, designed for performance and ease of use."})}
        </p>
      </ParallaxSection>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10">
          {MOCK_PRODUCTS.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;