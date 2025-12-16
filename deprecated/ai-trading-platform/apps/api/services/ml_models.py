"""
Machine Learning Models Service - Advanced ML models for trading analytics
"""

import asyncio
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import pickle
import json
from pathlib import Path

from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Conv1D, MaxPooling1D, Flatten
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

from loguru import logger
from config.settings import get_settings

settings = get_settings()


class MLModelsService:
    """Advanced ML models for trading predictions and analytics"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.model_metadata = {}
        self.models_dir = Path("models")
        self.models_dir.mkdir(exist_ok=True)
        self.ready = False
    
    async def initialize(self):
        """Initialize ML models"""
        logger.info("🤖 Initializing ML Models Service...")
        
        try:
            # Load existing models or create new ones
            await self._load_or_create_models()
            self.ready = True
            logger.info("✅ ML Models Service initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize ML models: {e}")
            self.ready = False
    
    def is_ready(self) -> bool:
        """Check if ML service is ready"""
        return self.ready
    
    async def _load_or_create_models(self):
        """Load existing models or create new ones"""
        model_configs = {
            'price_predictor': {
                'type': 'lstm',
                'description': 'LSTM model for price prediction',
                'features': ['open', 'high', 'low', 'close', 'volume', 'rsi', 'macd', 'bb_upper', 'bb_lower'],
                'target': 'future_price',
                'sequence_length': 60
            },
            'trend_classifier': {
                'type': 'gradient_boosting',
                'description': 'Gradient boosting for trend classification',
                'features': ['rsi', 'macd', 'bb_position', 'volume_ratio', 'price_change'],
                'target': 'trend_direction',
                'classes': ['bullish', 'bearish', 'sideways']
            },
            'volatility_predictor': {
                'type': 'random_forest',
                'description': 'Random forest for volatility prediction',
                'features': ['high_low_ratio', 'volume', 'atr', 'bb_width', 'price_change_std'],
                'target': 'future_volatility'
            },
            'risk_assessor': {
                'type': 'neural_network',
                'description': 'Neural network for risk assessment',
                'features': ['portfolio_beta', 'var_95', 'sharpe_ratio', 'max_drawdown', 'correlation_matrix'],
                'target': 'risk_score'
            },
            'sentiment_analyzer': {
                'type': 'transformer',
                'description': 'Transformer model for market sentiment analysis',
                'features': ['news_text', 'social_media_text', 'earnings_transcripts'],
                'target': 'sentiment_score'
            }
        }
        
        for model_name, config in model_configs.items():
            model_path = self.models_dir / f"{model_name}.pkl"
            metadata_path = self.models_dir / f"{model_name}_metadata.json"
            
            if model_path.exists() and metadata_path.exists():
                # Load existing model
                await self._load_model(model_name, model_path, metadata_path)
            else:
                # Create new model
                await self._create_model(model_name, config)
    
    async def _load_model(self, model_name: str, model_path: Path, metadata_path: Path):
        """Load existing model from disk"""
        try:
            # Load metadata
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Load model based on type
            if metadata['type'] == 'lstm':
                model = load_model(str(model_path).replace('.pkl', '.h5'))
            else:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
            
            # Load scaler if exists
            scaler_path = self.models_dir / f"{model_name}_scaler.pkl"
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    scaler = pickle.load(f)
                self.scalers[model_name] = scaler
            
            self.models[model_name] = model
            self.model_metadata[model_name] = metadata
            
            logger.info(f"✅ Loaded model: {model_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load model {model_name}: {e}")
    
    async def _create_model(self, model_name: str, config: Dict[str, Any]):
        """Create new model with given configuration"""
        try:
            if config['type'] == 'lstm':
                model = self._create_lstm_model(config)
            elif config['type'] == 'gradient_boosting':
                model = GradientBoostingClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=6,
                    random_state=42
                )
            elif config['type'] == 'random_forest':
                model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                )
            elif config['type'] == 'neural_network':
                model = self._create_neural_network(config)
            else:
                logger.warning(f"Unknown model type: {config['type']}")
                return
            
            self.models[model_name] = model
            self.model_metadata[model_name] = config
            
            # Create scaler
            if config['type'] in ['lstm', 'neural_network']:
                scaler = MinMaxScaler()
            else:
                scaler = StandardScaler()
            
            self.scalers[model_name] = scaler
            
            logger.info(f"✅ Created model: {model_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to create model {model_name}: {e}")
    
    def _create_lstm_model(self, config: Dict[str, Any]) -> Sequential:
        """Create LSTM model for time series prediction"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(config['sequence_length'], len(config['features']))),
            Dropout(0.2),
            LSTM(50, return_sequences=True),
            Dropout(0.2),
            LSTM(50),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        
        model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
        return model
    
    def _create_neural_network(self, config: Dict[str, Any]) -> Sequential:
        """Create neural network for classification/regression"""
        model = Sequential([
            Dense(128, activation='relu', input_shape=(len(config['features']),)),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dropout(0.2),
            Dense(1, activation='sigmoid' if 'risk' in config['description'] else 'linear')
        ])
        
        loss = 'binary_crossentropy' if 'risk' in config['description'] else 'mse'
        model.compile(optimizer=Adam(learning_rate=0.001), loss=loss, metrics=['accuracy' if 'risk' in config['description'] else 'mae'])
        return model
    
    async def predict_price(self, symbol: str, market_data: pd.DataFrame, horizon: int = 1) -> Dict[str, Any]:
        """Predict future price using LSTM model"""
        try:
            model = self.models.get('price_predictor')
            scaler = self.scalers.get('price_predictor')
            
            if not model or not scaler:
                return {"error": "Price prediction model not available"}
            
            # Prepare features
            features = self._prepare_features(market_data, 'price_predictor')
            
            # Scale features
            scaled_features = scaler.transform(features)
            
            # Create sequences for LSTM
            sequence_length = self.model_metadata['price_predictor']['sequence_length']
            if len(scaled_features) < sequence_length:
                return {"error": "Insufficient data for prediction"}
            
            X = []
            for i in range(sequence_length, len(scaled_features)):
                X.append(scaled_features[i-sequence_length:i])
            
            X = np.array(X)
            
            # Make prediction
            if isinstance(model, tf.keras.Model):
                predictions = model.predict(X[-1:])  # Predict next value
                prediction = float(predictions[0][0])
            else:
                prediction = float(model.predict(X[-1:].reshape(1, -1))[0])
            
            # Calculate confidence based on recent model performance
            confidence = await self._calculate_prediction_confidence('price_predictor', market_data)
            
            return {
                "symbol": symbol,
                "predicted_price": prediction,
                "current_price": float(market_data['close'].iloc[-1]),
                "price_change": prediction - float(market_data['close'].iloc[-1]),
                "price_change_percent": ((prediction - float(market_data['close'].iloc[-1])) / float(market_data['close'].iloc[-1])) * 100,
                "confidence": confidence,
                "horizon_hours": horizon,
                "timestamp": datetime.now().isoformat(),
                "model_used": "price_predictor"
            }
            
        except Exception as e:
            logger.error(f"Price prediction failed for {symbol}: {e}")
            return {"error": str(e), "symbol": symbol}
    
    async def classify_trend(self, symbol: str, market_data: pd.DataFrame) -> Dict[str, Any]:
        """Classify market trend using gradient boosting"""
        try:
            model = self.models.get('trend_classifier')
            scaler = self.scalers.get('trend_classifier')
            
            if not model or not scaler:
                return {"error": "Trend classification model not available"}
            
            # Prepare features
            features = self._prepare_features(market_data, 'trend_classifier')
            
            # Scale features
            scaled_features = scaler.transform(features[-1:])  # Use latest data point
            
            # Make prediction
            trend_proba = model.predict_proba(scaled_features)[0]
            trend_classes = model.classes_
            
            # Get the most likely trend
            max_idx = np.argmax(trend_proba)
            predicted_trend = trend_classes[max_idx]
            confidence = float(trend_proba[max_idx])
            
            # Create probability distribution
            trend_probabilities = {
                trend_classes[i]: float(trend_proba[i]) 
                for i in range(len(trend_classes))
            }
            
            return {
                "symbol": symbol,
                "predicted_trend": predicted_trend,
                "confidence": confidence,
                "trend_probabilities": trend_probabilities,
                "timestamp": datetime.now().isoformat(),
                "model_used": "trend_classifier"
            }
            
        except Exception as e:
            logger.error(f"Trend classification failed for {symbol}: {e}")
            return {"error": str(e), "symbol": symbol}
    
    async def predict_volatility(self, symbol: str, market_data: pd.DataFrame) -> Dict[str, Any]:
        """Predict future volatility using random forest"""
        try:
            model = self.models.get('volatility_predictor')
            scaler = self.scalers.get('volatility_predictor')
            
            if not model or not scaler:
                return {"error": "Volatility prediction model not available"}
            
            # Prepare features
            features = self._prepare_features(market_data, 'volatility_predictor')
            
            # Scale features
            scaled_features = scaler.transform(features[-1:])  # Use latest data point
            
            # Make prediction
            predicted_volatility = float(model.predict(scaled_features)[0])
            
            # Calculate current volatility for comparison
            returns = market_data['close'].pct_change().dropna()
            current_volatility = float(returns.std() * np.sqrt(252))  # Annualized
            
            return {
                "symbol": symbol,
                "predicted_volatility": predicted_volatility,
                "current_volatility": current_volatility,
                "volatility_change": predicted_volatility - current_volatility,
                "volatility_regime": "high" if predicted_volatility > 0.3 else "medium" if predicted_volatility > 0.15 else "low",
                "timestamp": datetime.now().isoformat(),
                "model_used": "volatility_predictor"
            }
            
        except Exception as e:
            logger.error(f"Volatility prediction failed for {symbol}: {e}")
            return {"error": str(e), "symbol": symbol}
    
    async def assess_portfolio_risk(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess portfolio risk using neural network"""
        try:
            model = self.models.get('risk_assessor')
            scaler = self.scalers.get('risk_assessor')
            
            if not model or not scaler:
                return {"error": "Risk assessment model not available"}
            
            # Prepare portfolio features
            features = self._prepare_portfolio_features(portfolio_data)
            
            # Scale features
            scaled_features = scaler.transform([features])
            
            # Make prediction
            if isinstance(model, tf.keras.Model):
                risk_score = float(model.predict(scaled_features)[0][0])
            else:
                risk_score = float(model.predict(scaled_features)[0])
            
            # Interpret risk score
            risk_level = "low" if risk_score < 0.3 else "medium" if risk_score < 0.7 else "high"
            
            return {
                "risk_score": risk_score,
                "risk_level": risk_level,
                "recommendations": self._generate_risk_recommendations(risk_score, portfolio_data),
                "timestamp": datetime.now().isoformat(),
                "model_used": "risk_assessor"
            }
            
        except Exception as e:
            logger.error(f"Portfolio risk assessment failed: {e}")
            return {"error": str(e)}
    
    def _prepare_features(self, data: pd.DataFrame, model_name: str) -> np.ndarray:
        """Prepare features for specific model"""
        config = self.model_metadata[model_name]
        features = []
        
        for feature in config['features']:
            if feature in data.columns:
                features.append(data[feature].values)
            else:
                # Calculate derived features
                if feature == 'rsi':
                    features.append(self._calculate_rsi(data['close']).values)
                elif feature == 'macd':
                    features.append(self._calculate_macd(data['close']).values)
                elif feature == 'bb_upper':
                    bb = self._calculate_bollinger_bands(data['close'])
                    features.append(bb['upper'].values)
                elif feature == 'bb_lower':
                    bb = self._calculate_bollinger_bands(data['close'])
                    features.append(bb['lower'].values)
                elif feature == 'price_change':
                    features.append(data['close'].pct_change().values)
                else:
                    # Default to zeros if feature not available
                    features.append(np.zeros(len(data)))
        
        return np.column_stack(features)
    
    def _prepare_portfolio_features(self, portfolio_data: Dict[str, Any]) -> List[float]:
        """Prepare features for portfolio risk assessment"""
        return [
            portfolio_data.get('beta', 1.0),
            portfolio_data.get('var_95', 0.05),
            portfolio_data.get('sharpe_ratio', 0.0),
            portfolio_data.get('max_drawdown', 0.0),
            portfolio_data.get('correlation_avg', 0.5)
        ]
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26) -> pd.Series:
        """Calculate MACD indicator"""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        return ema_fast - ema_slow
    
    def _calculate_bollinger_bands(self, prices: pd.Series, period: int = 20, std_dev: int = 2) -> Dict[str, pd.Series]:
        """Calculate Bollinger Bands"""
        sma = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        return {
            'upper': sma + (std * std_dev),
            'middle': sma,
            'lower': sma - (std * std_dev)
        }
    
    async def _calculate_prediction_confidence(self, model_name: str, data: pd.DataFrame) -> float:
        """Calculate prediction confidence based on recent model performance"""
        # Simplified confidence calculation
        # In production, this would use backtesting results
        return 0.75  # Default confidence
    
    def _generate_risk_recommendations(self, risk_score: float, portfolio_data: Dict[str, Any]) -> List[str]:
        """Generate risk management recommendations"""
        recommendations = []
        
        if risk_score > 0.7:
            recommendations.extend([
                "Consider reducing position sizes",
                "Implement stricter stop-loss orders",
                "Diversify across more asset classes",
                "Review correlation between positions"
            ])
        elif risk_score > 0.5:
            recommendations.extend([
                "Monitor positions closely",
                "Consider hedging strategies",
                "Review risk limits"
            ])
        else:
            recommendations.extend([
                "Current risk level is acceptable",
                "Consider opportunities for growth"
            ])
        
        return recommendations
    
    async def retrain_model(self, model_name: str, training_data: pd.DataFrame) -> Dict[str, Any]:
        """Retrain a specific model with new data"""
        try:
            if model_name not in self.models:
                return {"error": f"Model {model_name} not found"}
            
            model = self.models[model_name]
            config = self.model_metadata[model_name]
            
            # Prepare training data
            X = self._prepare_features(training_data, model_name)
            y = training_data[config['target']].values
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale data
            scaler = self.scalers[model_name]
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Retrain model
            if isinstance(model, tf.keras.Model):
                # LSTM or Neural Network
                history = model.fit(
                    X_train_scaled, y_train,
                    epochs=50,
                    batch_size=32,
                    validation_split=0.2,
                    callbacks=[EarlyStopping(patience=10)],
                    verbose=0
                )
                
                # Evaluate
                loss = model.evaluate(X_test_scaled, y_test, verbose=0)
                performance = {"loss": float(loss[0]), "mae": float(loss[1])}
                
            else:
                # Sklearn model
                model.fit(X_train_scaled, y_train)
                
                # Evaluate
                y_pred = model.predict(X_test_scaled)
                if hasattr(model, 'predict_proba'):
                    # Classification
                    accuracy = accuracy_score(y_test, y_pred)
                    performance = {"accuracy": float(accuracy)}
                else:
                    # Regression
                    mse = np.mean((y_test - y_pred) ** 2)
                    performance = {"mse": float(mse)}
            
            # Save retrained model
            await self._save_model(model_name)
            
            return {
                "model_name": model_name,
                "retrained": True,
                "performance": performance,
                "training_samples": len(X_train),
                "test_samples": len(X_test),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Model retraining failed for {model_name}: {e}")
            return {"error": str(e), "model_name": model_name}
    
    async def _save_model(self, model_name: str):
        """Save model to disk"""
        try:
            model = self.models[model_name]
            
            if isinstance(model, tf.keras.Model):
                # Save Keras model
                model_path = self.models_dir / f"{model_name}.h5"
                model.save(str(model_path))
            else:
                # Save sklearn model
                model_path = self.models_dir / f"{model_name}.pkl"
                with open(model_path, 'wb') as f:
                    pickle.dump(model, f)
            
            # Save scaler
            scaler_path = self.models_dir / f"{model_name}_scaler.pkl"
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scalers[model_name], f)
            
            # Save metadata
            metadata_path = self.models_dir / f"{model_name}_metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(self.model_metadata[model_name], f, indent=2)
            
            logger.info(f"✅ Saved model: {model_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save model {model_name}: {e}")
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about all loaded models"""
        return {
            "models": list(self.models.keys()),
            "model_metadata": self.model_metadata,
            "ready": self.ready,
            "timestamp": datetime.now().isoformat()
        }
    
    async def cleanup(self):
        """Cleanup ML service resources"""
        logger.info("🧹 Cleaning up ML Models Service...")
        self.models.clear()
        self.scalers.clear()
        self.model_metadata.clear()
        self.ready = False