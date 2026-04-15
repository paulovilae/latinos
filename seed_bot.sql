INSERT INTO latinos_bots (name, description, status, owner_id, live_trading, manifest_version, manifest_status, manifest_migration_note, signal_manifest)
VALUES (
  'Astute AST Engine Bot',
  'A sample bot featuring our new recursive LogicNode AST for investor-grade research.',
  'published',
  2,
  false,
  1,
  'native',
  'Created newly using AST schema',
  '{
    "version": 1,
    "symbol": "NVDA",
    "timeframe": "1d",
    "direction": "long_only",
    "entry": {
      "type": "group",
      "logic": "AND",
      "nodes": [
        {
          "type": "condition",
          "left": {
            "indicator": "RSI",
            "params": {
              "period": 14
            }
          },
          "operator": "lt",
          "right": {
            "value": 40.0
          }
        }
      ]
    },
    "exit": {
      "type": "group",
      "logic": "AND",
      "nodes": [
        {
          "type": "condition",
          "left": {
            "indicator": "RSI",
            "params": {
              "period": 14
            }
          },
          "operator": "gt",
          "right": {
            "value": 70.0
          }
        }
      ]
    },
    "execution": {
      "order_type": "market",
      "time_in_force": "gtc"
    },
    "risk": {
      "max_position_size": 0.10,
      "max_drawdown_limit": 0.05
    }
  }'::jsonb
);
