import json
import yaml

with open('/home/paulo/Programs/apps/latinos/dify_custom_tools_schema.json', 'r') as f:
    spec = json.load(f)

# Hardcode a pristine stripped-down Swagger/OpenAPI YAML
pristine_spec = {
    "openapi": "3.0.1",
    "info": {
        "title": "Latinos Financial Tools",
        "version": "1.0.0",
        "description": "Calculates RSI, MACD, and MA based on historical data blocks."
    },
    "servers": [
        {"url": "https://apilatinos.paulovila.org"}
    ],
    "paths": {
        "/api/dify/tools/rsi": {
            "post": {
                "operationId": "calculate_rsi",
                "summary": "Calculate RSI",
                "description": "Calculates the Relative Strength Index (RSI).",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["close_prices"],
                                "properties": {
                                    "close_prices": {
                                        "type": "array",
                                        "items": {"type": "number"},
                                        "description": "Array of close prices"
                                    },
                                    "period": {
                                        "type": "integer",
                                        "default": 14,
                                        "description": "Calculation period"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Success"
                    }
                }
            }
        },
        "/api/dify/tools/macd": {
            "post": {
                "operationId": "calculate_macd",
                "summary": "Calculate MACD",
                "description": "Calculates the Moving Average Convergence Divergence.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["close_prices"],
                                "properties": {
                                    "close_prices": {
                                        "type": "array",
                                        "items": {"type": "number"}
                                    },
                                    "fast_period": {"type": "integer", "default": 12},
                                    "slow_period": {"type": "integer", "default": 26},
                                    "signal_period": {"type": "integer", "default": 9}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Success"
                    }
                }
            }
        },
        "/api/dify/tools/ma": {
            "post": {
                "operationId": "calculate_ma",
                "summary": "Calculate Moving Average",
                "description": "Calculates SMA or EMA.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["close_prices"],
                                "properties": {
                                    "close_prices": {
                                        "type": "array",
                                        "items": {"type": "number"}
                                    },
                                    "period": {"type": "integer", "default": 14},
                                    "type": {"type": "string", "default": "sma"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Success"
                    }
                }
            }
        }
    }
}

with open('/home/paulo/Programs/apps/latinos/dify_custom_tools.yaml', 'w') as f:
    yaml.dump(pristine_spec, f, sort_keys=False)

print("Created dify_custom_tools.yaml")
