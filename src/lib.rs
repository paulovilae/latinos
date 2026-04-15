pub mod app;
pub mod backtest;
pub mod bot_engine;
pub mod broker;
pub mod controllers;
pub mod hera_ipc;
pub mod indicators;
pub mod legacy_adapter;
pub mod manifest_eval;
pub mod market_data;
pub mod memento_query;
pub mod models;
pub mod observability;
pub mod opportunity;
pub mod risk_engine;
pub mod universe_scanner;
pub mod shadow_seeding;
pub mod walk_forward;

#[cfg(test)]
mod backtest_tests;
#[cfg(test)]
mod opportunity_tests;
#[cfg(test)]
mod walk_forward_tests;
