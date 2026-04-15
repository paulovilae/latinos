//! `SeaORM` Entity for latinos_backtests — updated with global tenancy fields.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "latinos_backtests")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub bot_id: Option<i32>,
    pub range: Option<String>,
    pub market: Option<String>,
    pub symbol: Option<String>,
    pub interval: Option<String>,
    #[sea_orm(column_type = "Float", nullable)]
    pub initial_capital: Option<f32>,
    pub status: String,
    pub results: Option<Json>,
    pub submitted_at: DateTimeWithTimeZone,
    pub completed_at: Option<DateTimeWithTimeZone>,
    /// If true, this backtest result is shared across all users (global cache).
    pub is_global: bool,
    /// The user (or system admin) that owns this backtest entry.
    pub owner_id: Option<i32>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::latinos_bots::Entity",
        from = "Column::BotId",
        to = "super::latinos_bots::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    LatinosBots,
}

impl Related<super::latinos_bots::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::LatinosBots.def()
    }
}
