use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize)]
#[sea_orm(table_name = "latinos_trades")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub user_id: Option<i32>,
    pub bot_id: Option<i32>,
    pub symbol: String,
    pub side: String,
    pub price: f64,
    pub amount: f64,
    pub status: String,
    pub broker: Option<String>,
    pub broker_order_id: Option<String>,
    pub pnl: Option<f64>,
    pub timestamp: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
