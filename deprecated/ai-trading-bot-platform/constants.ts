import React from 'react';
import { Product, Testimonial, NewsArticle, ContactInfo, SocialLink, BotConfiguration, BotStrategy, TrainingModule, UserProgress } from './types';
// Changed from 'react-icons/fa' to 'react-icons/fa6'
import { FaTwitter, FaLinkedin, FaGithub, FaFacebook, FaBookOpen, FaGraduationCap, FaLightbulb } from 'react-icons/fa6';


export const APP_NAME_KEY = "appName"; // Translation key for app name

// Note: For a real multilingual app, these string values would be keys
// that are then looked up in the language JSON files.
// For example, name: 'products.starterBot.name'
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'product.starterBot.name',
    description: 'product.starterBot.description',
    benefits: [
        'product.starterBot.benefit1', 
        'product.starterBot.benefit2', 
        'product.starterBot.benefit3',
        'product.starterBot.benefit4'
    ],
    pricing: [
      { 
        tier: 'product.starterBot.tierFree.name', 
        price: '$0/mo (14 days)', 
        features: ['product.starterBot.tierFree.feature1', 'product.starterBot.tierFree.feature2', 'product.starterBot.tierFree.feature3'] 
      },
      { 
        tier: 'product.starterBot.tierStarter.name', 
        price: '$29/mo', 
        features: ['product.starterBot.tierStarter.feature1', 'product.starterBot.tierStarter.feature2', 'product.starterBot.tierStarter.feature3'] 
      },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y3J5cHRvfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 'prod_2',
    name: 'product.proTrader.name',
    description: 'product.proTrader.description',
    benefits: [
        'product.proTrader.benefit1', 
        'product.proTrader.benefit2', 
        'product.proTrader.benefit3',
        'product.proTrader.benefit4'
    ],
    pricing: [
      { 
        tier: 'product.proTrader.tierPro.name', 
        price: '$99/mo', 
        features: ['product.proTrader.tierPro.feature1', 'product.proTrader.tierPro.feature2', 'product.proTrader.tierPro.feature3', 'product.proTrader.tierPro.feature4'] 
    },
      { 
        tier: 'product.proTrader.tierEnterprise.name', 
        price: 'Custom', 
        features: ['product.proTrader.tierEnterprise.feature1', 'product.proTrader.tierEnterprise.feature2', 'product.proTrader.tierEnterprise.feature3'] 
    },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1621405788930-bcee940d0783?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGNyeXB0b3xlbnwwfHwwfHx8MA&auto=format&fit=crop&w=500&q=60'
  }
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test_1',
    name: 'Sarah L.',
    role: 'testimonial.role.dayTrader',
    quote: 'testimonial.sarahL.quote',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  {
    id: 'test_2',
    name: 'John B.',
    role: 'testimonial.role.cryptoEnthusiast',
    quote: 'testimonial.johnB.quote',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 'test_3',
    name: 'Alex K.',
    role: 'testimonial.role.financialAdvisor',
    quote: 'testimonial.alexK.quote',
    avatarUrl: 'https://randomuser.me/api/portraits/men/78.jpg'
  }
];

export const MOCK_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news_1',
    title: 'news.article1.title',
    date: '2023-10-26', // Use ISO date for easier parsing/localization
    summary: 'news.article1.summary',
    content: 'news.article1.content', // This would be the full content
    imageUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y3J5cHRvfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
    source: 'news.source.financialTimesAI'
  },
  {
    id: 'news_2',
    title: 'news.article2.title',
    date: '2023-10-20',
    summary: 'news.article2.summary',
    content: 'news.article2.content',
    imageUrl: 'https://images.unsplash.com/photo-1640090310249-1MITf0161a40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFpJTIwdHJhZGluZ3xlbnwwfHwwfHx8MA&auto=format&fit=crop&w=500&q=60',
    source: 'news.source.bloombergCrypto'
  },
  {
    id: 'news_3',
    title: 'news.article3.title',
    date: '2023-10-15',
    summary: 'news.article3.summary',
    content: 'news.article3.content',
    imageUrl: 'https://images.unsplash.com/photo-1631589323470-38ca41775f77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGFpJTIwdHJhZGluZ3xlbnwwfHwwfHx8MA&auto=format&fit=crop&w=500&q=60',
    source: 'news.source.reuters'
  }
];

export const CONTACT_INFORMATION: ContactInfo = {
  email: 'support@monochrome-ai-trader.dev',
  phone: '+1 (555) 000-0000',
  address: '123 Minimalist Way, Tech City, TC 10101'
};

export const SOCIAL_MEDIA_LINKS: SocialLink[] = [
  { name: 'social.twitter', url: 'https://twitter.com', icon: (props) => React.createElement(FaTwitter, props) },
  { name: 'social.linkedin', url: 'https://linkedin.com', icon: (props) => React.createElement(FaLinkedin, props) },
  { name: 'social.github', url: 'https://github.com', icon: (props) => React.createElement(FaGithub, props) },
  { name: 'social.facebook', url: 'https://facebook.com', icon: (props) => React.createElement(FaFacebook, props) },
];

export const INITIAL_BOT_CONFIGURATIONS: BotConfiguration[] = [
  { id: 'bot_001', name: 'My First BTC Scalper', marketPair: 'BTC/USD', strategy: BotStrategy.SCALPING, investmentAmount: 1000, riskLevel: 'medium', isActive: true },
  { id: 'bot_002', name: 'ETH Swing Trader', marketPair: 'ETH/USD', strategy: BotStrategy.SWING_TRADING, investmentAmount: 5000, riskLevel: 'high', isActive: false },
];


export const MOCK_TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'train_intro',
    titleKey: 'training.module.intro.title',
    descriptionKey: 'training.module.intro.description',
    estimatedTime: '15 min',
    icon: (props) => React.createElement(FaBookOpen, props),
  },
  {
    id: 'train_strategies',
    titleKey: 'training.module.strategies.title',
    descriptionKey: 'training.module.strategies.description',
    estimatedTime: '45 min',
    icon: (props) => React.createElement(FaLightbulb, props),
  },
  {
    id: 'train_risk',
    titleKey: 'training.module.risk.title',
    descriptionKey: 'training.module.risk.description',
    estimatedTime: '30 min',
    icon: (props) => React.createElement(FaGraduationCap, props),
  }
];

export const MOCK_INITIAL_USER_PROGRESS: UserProgress = {
  points: 1250,
  level: 3,
  achievements: [
    { id: 'ach_signup', nameKey: 'achievement.signup.name', descriptionKey: 'achievement.signup.description', achieved: true, iconUrl: '/icons/badge_generic.svg' },
    { id: 'ach_first_bot', nameKey: 'achievement.firstBot.name', descriptionKey: 'achievement.firstBot.description', achieved: true, iconUrl: '/icons/badge_bot.svg' },
    { id: 'ach_1000_points', nameKey: 'achievement.1000points.name', descriptionKey: 'achievement.1000points.description', achieved: true, iconUrl: '/icons/badge_points.svg' },
    { id: 'ach_first_trade', nameKey: 'achievement.firstTrade.name', descriptionKey: 'achievement.firstTrade.description', achieved: false, iconUrl: '/icons/badge_trade.svg' },
  ]
};