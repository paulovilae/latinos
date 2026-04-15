use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, serde::Serialize, serde::Deserialize)]
#[sea_orm(table_name = "latinos_bots")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub owner_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    // Dead columns kept in model for DB compat, but not used in views
    pub dify_app_id: Option<String>,
    pub tags: Option<Json>,
    pub is_wasm: bool,
    pub live_trading: bool,
    pub signal_manifest: Option<Json>,
    pub manifest_version: Option<i32>,
    pub manifest_status: Option<String>,
    pub manifest_migration_note: Option<String>,
    /// 'trading' | 'utility' | 'analysis' — used to filter Arena to real trading bots.
    pub bot_type: String,
    /// Unique webhook secret for TradingView / Alpaca signal authentication.
    pub webhook_token: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
