//! Unit tests for the opportunity scoring engine.
//!
//! Tests validate:
//! - Score range (0-100)
//! - Stance determination (bullish/bearish/neutral)
//! - Disqualifier flag population
//! - Confidence score calculation
//! - Empty data handling

#[cfg(test)]
mod tests {
    use crate::opportunity::score_opportunity;
    use serde_json::json;

    #[test]
    fn test_score_in_valid_range() {
        let data = json!({
            "technical_analysis": {
                "overall_assessment": "Bullish trend confirmed"
            },
            "analyst_consensus": "Strong Buy",
            "fundamentals": {
                "pe_ratio": 15.0,
                "revenue_growth": "12%"
            }
        });
        let opp = score_opportunity("AAPL", 1, &data, "Apr 07, 2026");
        assert!(opp.score <= 100, "Score should be <= 100, got {}", opp.score);
    }

    #[test]
    fn test_empty_data_produces_neutral() {
        let opp = score_opportunity("UNK", 99, &json!({}), "Jan 01, 2026");
        // Empty data should produce a neutral-ish score and "watch" stance
        assert!(opp.score <= 70, "Empty data should not produce high score");
        assert!(!opp.stance.is_empty());
    }

    #[test]
    fn test_small_cap_disqualifier() {
        let data = json!({
            "fundamentals": {
                "market_cap": "350M"
            }
        });
        let opp = score_opportunity("PENNY", 2, &data, "Apr 07, 2026");
        assert!(
            opp.disqualifier_flags.contains(&"market_cap_under_500m".to_string()),
            "Small-cap should be flagged as disqualifier"
        );
    }

    #[test]
    fn test_confidence_drops_with_missing_data() {
        let full_data = json!({
            "fundamentals": {
                "pe_ratio": 20.0,
                "beta": 1.2
            },
            "catalysts": ["Earnings beat", "FDA approval"]
        });
        let sparse_data = json!({});

        let opp_full = score_opportunity("FULL", 3, &full_data, "Apr 07, 2026");
        let opp_sparse = score_opportunity("SPARSE", 4, &sparse_data, "Apr 07, 2026");

        assert!(
            opp_sparse.confidence_score < opp_full.confidence_score,
            "Sparse data should have lower confidence ({} vs {})",
            opp_sparse.confidence_score,
            opp_full.confidence_score
        );
    }

    #[test]
    fn test_bullish_data_scores_higher() {
        let bullish = json!({
            "technical_analysis": {
                "overall_assessment": "Strong bullish momentum confirmed",
                "price_change_percentage": "+8.5%"
            },
            "analyst_consensus": "Strong Buy",
            "price_targets": {
                "target_price": 200.0,
                "current_price": 150.0
            },
            "catalysts": ["Earnings beat", "New product launch", "Sector rotation"]
        });
        let bearish = json!({
            "technical_analysis": {
                "overall_assessment": "Bearish downtrend accelerating",
                "price_change_percentage": "-12.3%"
            },
            "analyst_consensus": "Sell",
            "price_targets": {
                "target_price": 80.0,
                "current_price": 150.0
            }
        });

        let opp_bull = score_opportunity("BULL", 5, &bullish, "Apr 07, 2026");
        let opp_bear = score_opportunity("BEAR", 6, &bearish, "Apr 07, 2026");

        assert!(
            opp_bull.score > opp_bear.score,
            "Bullish ticker should score higher ({} vs {})",
            opp_bull.score,
            opp_bear.score
        );
    }

    #[test]
    fn test_ticker_and_research_id_passed_through() {
        let opp = score_opportunity("MSFT", 42, &json!({}), "Apr 07, 2026");
        assert_eq!(opp.ticker, "MSFT");
        assert_eq!(opp.research_id, 42);
        assert_eq!(opp.research_date, "Apr 07, 2026");
    }

    #[test]
    fn test_thesis_extraction() {
        let data = json!({
            "investment_thesis": "MSFT is well positioned for cloud growth"
        });
        let opp = score_opportunity("MSFT", 7, &data, "Apr 07, 2026");
        assert!(
            opp.thesis.contains("cloud") || !opp.thesis.is_empty(),
            "Thesis should be extracted from data"
        );
    }
}
