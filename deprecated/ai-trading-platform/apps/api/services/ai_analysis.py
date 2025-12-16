"""
AI Analysis Service with Ollama Integration
Provides AI-powered market analysis, risk assessment, and trading insights
"""

import asyncio
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

import pandas as pd
import numpy as np
from loguru import logger
import ollama
import httpx

from config.settings import get_settings

settings = get_settings()


class AIAnalysisService:
    """AI Analysis Service using Ollama for local AI processing"""
    
    def __init__(self):
        self.client = ollama.AsyncClient(host=settings.OLLAMA_URL)
        self.models = {
            'market_analysis': 'llama3.1:70b',
            'risk_assessment': 'llama3.1:8b',
            'strategy_optimization': 'mixtral:8x7b',
            'sentiment_analysis': 'llama3.1:8b'
        }
        self.model_status = {}
        self.initialized = False
    
    async def initialize_models(self):
        """Initialize and verify AI models"""
        logger.info("🤖 Initializing AI models...")
        
        try:
            # Check available models
            available_models = await self.client.list()
            available_model_names = [model['name'] for model in available_models['models']]
            
            # Pull missing models
            for purpose, model_name in self.models.items():
                if model_name not in available_model_names:
                    logger.info(f"Pulling model {model_name} for {purpose}...")
                    await self.client.pull(model_name)
                
                # Test model
                try:
                    test_response = await self.client.generate(
                        model=model_name,
                        prompt="Test prompt",
                        options={'num_predict': 10}
                    )
                    self.model_status[purpose] = True
                    logger.info(f"✅ Model {model_name} ready for {purpose}")
                except Exception as e:
                    logger.error(f"❌ Model {model_name} failed for {purpose}: {e}")
                    self.model_status[purpose] = False
            
            self.initialized = True
            logger.info("🎯 AI models initialization complete")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI models: {e}")
            self.initialized = False
    
    def is_ready(self) -> bool:
        """Check if AI service is ready"""
        return self.initialized and any(self.model_status.values())
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on AI models"""
        try:
            models_status = {}
            for purpose, model_name in self.models.items():
                try:
                    # Quick test generation
                    response = await self.client.generate(
                        model=model_name,
                        prompt="Health check",
                        options={'num_predict': 5}
                    )
                    models_status[purpose] = {
                        'status': 'healthy',
                        'model': model_name,
                        'response_time': response.get('total_duration', 0) / 1e9  # Convert to seconds
                    }
                except Exception as e:
                    models_status[purpose] = {
                        'status': 'unhealthy',
                        'model': model_name,
                        'error': str(e)
                    }
            
            return {
                'service_status': 'healthy' if self.is_ready() else 'unhealthy',
                'models': models_status,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'service_status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def analyze_market_conditions(self, symbol: str, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI-powered market analysis"""
        try:
            # Prepare market context
            context = self._prepare_market_context(symbol, market_data)
            
            prompt = f"""
            Role: You are a quantitative hedge fund manager with 20+ years of experience in financial markets.
            
            Market Data Analysis for {symbol}:
            {context}
            
            Provide a comprehensive market analysis with:
            1. Market sentiment (bullish/bearish/neutral) with confidence score (0-1)
            2. Key support and resistance levels
            3. Technical indicators interpretation
            4. Position sizing recommendations (1-10 scale)
            5. Risk factors to monitor
            6. Entry/exit signals
            7. Time horizon recommendations
            
            Format your response as valid JSON with the following structure:
            {{
                "sentiment": "bullish|bearish|neutral",
                "confidence": 0.85,
                "support_levels": [price1, price2],
                "resistance_levels": [price1, price2],
                "technical_signals": {{
                    "rsi": "overbought|oversold|neutral",
                    "macd": "bullish|bearish|neutral",
                    "moving_averages": "bullish|bearish|neutral"
                }},
                "position_sizing": 7,
                "risk_factors": ["factor1", "factor2"],
                "entry_signals": ["signal1", "signal2"],
                "exit_signals": ["signal1", "signal2"],
                "time_horizon": "short|medium|long",
                "summary": "Brief analysis summary"
            }}
            """
            
            response = await self.client.generate(
                model=self.models['market_analysis'],
                prompt=prompt,
                options={
                    'temperature': 0.3,  # Lower temperature for more consistent analysis
                    'num_predict': 1000
                }
            )
            
            # Parse AI response
            analysis = self._parse_ai_response(response['response'])
            
            # Add metadata
            analysis['timestamp'] = datetime.now().isoformat()
            analysis['symbol'] = symbol
            analysis['model_used'] = self.models['market_analysis']
            
            return analysis
            
        except Exception as e:
            logger.error(f"Market analysis failed for {symbol}: {e}")
            return {
                'error': str(e),
                'symbol': symbol,
                'timestamp': datetime.now().isoformat()
            }
    
    async def assess_risk(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI-powered risk assessment"""
        try:
            context = self._prepare_risk_context(portfolio_data)
            
            prompt = f"""
            Role: You are a risk management expert specializing in algorithmic trading systems.
            
            Portfolio Risk Assessment:
            {context}
            
            Analyze the risk profile and provide:
            1. Overall risk score (1-10, where 10 is highest risk)
            2. Risk factors breakdown
            3. Correlation risks
            4. Concentration risks
            5. Market exposure analysis
            6. Recommended risk mitigation strategies
            7. Position size adjustments
            
            Format as JSON:
            {{
                "overall_risk_score": 6,
                "risk_breakdown": {{
                    "market_risk": 7,
                    "concentration_risk": 5,
                    "correlation_risk": 6,
                    "liquidity_risk": 4
                }},
                "risk_factors": ["factor1", "factor2"],
                "mitigation_strategies": ["strategy1", "strategy2"],
                "position_adjustments": {{
                    "reduce_exposure": ["asset1", "asset2"],
                    "increase_diversification": true
                }},
                "max_portfolio_risk": 0.15,
                "recommended_stop_loss": 0.05,
                "summary": "Risk assessment summary"
            }}
            """
            
            response = await self.client.generate(
                model=self.models['risk_assessment'],
                prompt=prompt,
                options={'temperature': 0.2, 'num_predict': 800}
            )
            
            risk_analysis = self._parse_ai_response(response['response'])
            risk_analysis['timestamp'] = datetime.now().isoformat()
            risk_analysis['model_used'] = self.models['risk_assessment']
            
            return risk_analysis
            
        except Exception as e:
            logger.error(f"Risk assessment failed: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def optimize_strategy(self, strategy_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI-powered strategy optimization"""
        try:
            context = self._prepare_strategy_context(strategy_data)
            
            prompt = f"""
            Role: You are a quantitative strategy developer with expertise in algorithmic trading optimization.
            
            Strategy Optimization Request:
            {context}
            
            Analyze and optimize the trading strategy:
            1. Performance bottlenecks identification
            2. Parameter optimization suggestions
            3. Risk-adjusted return improvements
            4. Market regime adaptations
            5. Execution efficiency enhancements
            
            Format as JSON:
            {{
                "optimization_score": 8,
                "bottlenecks": ["bottleneck1", "bottleneck2"],
                "parameter_suggestions": {{
                    "stop_loss": 0.03,
                    "take_profit": 0.08,
                    "position_size": 0.05
                }},
                "performance_improvements": {{
                    "expected_sharpe_improvement": 0.15,
                    "expected_return_improvement": 0.03,
                    "risk_reduction": 0.02
                }},
                "market_adaptations": ["adaptation1", "adaptation2"],
                "execution_improvements": ["improvement1", "improvement2"],
                "summary": "Optimization summary"
            }}
            """
            
            response = await self.client.generate(
                model=self.models['strategy_optimization'],
                prompt=prompt,
                options={'temperature': 0.4, 'num_predict': 1000}
            )
            
            optimization = self._parse_ai_response(response['response'])
            optimization['timestamp'] = datetime.now().isoformat()
            optimization['model_used'] = self.models['strategy_optimization']
            
            return optimization
            
        except Exception as e:
            logger.error(f"Strategy optimization failed: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def analyze_bot_performance(self, bot_config: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze trading bot performance and provide recommendations"""
        try:
            # Get performance data
            performance_data = bot_config.get('performance', {})
            config_data = bot_config.get('config', {})
            
            context = f"""
            Bot Configuration:
            - Type: {bot_config.get('botType', 'unknown')}
            - Risk Level: {config_data.get('riskLevel', 'medium')}
            - Asset Classes: {config_data.get('assetClasses', [])}
            - Max Position Size: {config_data.get('maxPositionSize', 5)}%
            
            Performance Metrics:
            - Total Return: {performance_data.get('totalReturn', 0)}%
            - Win Rate: {performance_data.get('winRate', 0)}%
            - Sharpe Ratio: {performance_data.get('sharpeRatio', 0)}
            - Max Drawdown: {performance_data.get('maxDrawdown', 0)}%
            - Total Trades: {performance_data.get('totalTrades', 0)}
            """
            
            prompt = f"""
            Role: You are a trading bot performance analyst with deep expertise in algorithmic trading systems.
            
            Bot Performance Analysis:
            {context}
            
            Provide comprehensive performance analysis:
            1. Performance grade (A-F)
            2. Strengths and weaknesses
            3. Optimization recommendations
            4. Risk assessment
            5. Comparison to benchmarks
            
            Format as JSON:
            {{
                "performance_grade": "B+",
                "overall_score": 7.5,
                "strengths": ["strength1", "strength2"],
                "weaknesses": ["weakness1", "weakness2"],
                "recommendations": ["rec1", "rec2"],
                "risk_assessment": "moderate",
                "benchmark_comparison": {{
                    "vs_market": "outperforming",
                    "vs_peers": "average"
                }},
                "next_actions": ["action1", "action2"],
                "summary": "Performance analysis summary"
            }}
            """
            
            response = await self.client.generate(
                model=self.models['market_analysis'],
                prompt=prompt,
                options={'temperature': 0.3, 'num_predict': 800}
            )
            
            analysis = self._parse_ai_response(response['response'])
            analysis['timestamp'] = datetime.now().isoformat()
            analysis['bot_id'] = bot_config.get('id')
            analysis['model_used'] = self.models['market_analysis']
            
            return analysis
            
        except Exception as e:
            logger.error(f"Bot performance analysis failed: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _prepare_market_context(self, symbol: str, market_data: Dict[str, Any]) -> str:
        """Prepare market data context for AI analysis"""
        try:
            context_parts = [f"Symbol: {symbol}"]
            
            if 'price' in market_data:
                context_parts.append(f"Current Price: ${market_data['price']}")
            
            if 'change' in market_data:
                context_parts.append(f"24h Change: {market_data['change']}%")
            
            if 'volume' in market_data:
                context_parts.append(f"Volume: {market_data['volume']}")
            
            if 'technical_indicators' in market_data:
                indicators = market_data['technical_indicators']
                context_parts.append("Technical Indicators:")
                for indicator, value in indicators.items():
                    context_parts.append(f"  {indicator}: {value}")
            
            return "\n".join(context_parts)
        except Exception as e:
            logger.error(f"Failed to prepare market context: {e}")
            return f"Symbol: {symbol}\nLimited data available"
    
    def _prepare_risk_context(self, portfolio_data: Dict[str, Any]) -> str:
        """Prepare portfolio risk context for AI analysis"""
        try:
            context_parts = ["Portfolio Risk Analysis:"]
            
            if 'positions' in portfolio_data:
                context_parts.append(f"Total Positions: {len(portfolio_data['positions'])}")
                
            if 'total_value' in portfolio_data:
                context_parts.append(f"Total Portfolio Value: ${portfolio_data['total_value']}")
            
            if 'daily_pnl' in portfolio_data:
                context_parts.append(f"Daily P&L: {portfolio_data['daily_pnl']}%")
            
            return "\n".join(context_parts)
        except Exception as e:
            logger.error(f"Failed to prepare risk context: {e}")
            return "Limited portfolio data available"
    
    def _prepare_strategy_context(self, strategy_data: Dict[str, Any]) -> str:
        """Prepare strategy context for AI analysis"""
        try:
            context_parts = ["Strategy Analysis:"]
            
            if 'name' in strategy_data:
                context_parts.append(f"Strategy: {strategy_data['name']}")
            
            if 'performance' in strategy_data:
                perf = strategy_data['performance']
                context_parts.append(f"Current Performance: {perf}")
            
            return "\n".join(context_parts)
        except Exception as e:
            logger.error(f"Failed to prepare strategy context: {e}")
            return "Limited strategy data available"
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response and extract JSON"""
        try:
            # Try to find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback: return raw response
                return {
                    'raw_response': response_text,
                    'parsed': False
                }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return {
                'raw_response': response_text,
                'parse_error': str(e),
                'parsed': False
            }
        except Exception as e:
            logger.error(f"Unexpected error parsing AI response: {e}")
            return {
                'error': str(e),
                'raw_response': response_text,
                'parsed': False
            }
    
    async def cleanup(self):
        """Cleanup AI service resources"""
        logger.info("🧹 Cleaning up AI Analysis Service...")
        self.initialized = False
        self.model_status.clear()