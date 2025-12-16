export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin'; // Added role
  progress?: UserProgress; // Added for gamification
}

export interface Product {
  id: string;
  name: string; // Will be a translation key e.g., products.prod_1.name
  description: string; // Translation key
  benefits: string[]; // Array of translation keys
  pricing: {
    tier: string; // Translation key
    price: string; // Can remain string or be translation key if structure varies
    features: string[]; // Array of translation keys
  }[];
  imageUrl?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string; // Translation key if role titles need translation
  quote: string; // Translation key
  avatarUrl?: string;
}

export interface NewsArticle {
  id: string;
  title: string; // Translation key
  date: string; // Should be formatted based on locale
  summary: string; // Translation key
  content: string; // Full content for AI summarization, could be translation key if source content varies
  imageUrl?: string;
  source?: string; // Translation key
}

export interface ContactInfo {
  email: string;
  phone?: string;
  address?: string;
}

export interface MarketDataPoint {
  time: string; // Could be timestamp or date string
  price: number;
  volume?: number;
}

export interface BotPerformanceData {
  botId: string;
  name: string;
  pnl: number; // Profit and Loss
  roi: number; // Return on Investment in percentage
  trades: number;
  winRate: number; // In percentage
  history: { date: string; value: number }[]; // For chart
}

export enum BotStrategy {
  MOVING_AVERAGE_CROSSOVER = "Moving Average Crossover", // Potentially translatable
  RSI_DIVERGENCE = "RSI Divergence",
  SCALPING = "Scalping",
  SWING_TRADING = "Swing Trading"
}

export interface BotConfiguration {
  id: string;
  name: string;
  marketPair: string; // e.g., BTC/USD
  strategy: BotStrategy;
  investmentAmount: number;
  riskLevel: 'low' | 'medium' | 'high'; // Potentially translatable
  isActive: boolean;
}

export interface SocialLink {
  name: string; // Name for aria-label, could be translation key
  url: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode; 
}

// For Gemini API related types
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

// New types for Training and Gamification
export interface TrainingModule {
  id: string;
  titleKey: string; // Translation key for title
  descriptionKey: string; // Translation key for description
  estimatedTime: string; // e.g., "30 minutes" - could be translatable
  contentUrl?: string; // Link to detailed content or interactive module
  icon?: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode; // Optional icon
}

export interface Achievement {
  id: string;
  nameKey: string; // Translation key
  descriptionKey: string; // Translation key
  iconUrl?: string; // Path to an icon image
  achieved: boolean;
}

export interface UserProgress {
  points: number;
  level: number;
  achievements: Achievement[];
}
