use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "latinos_backtests")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub bot_id: Option<i32>,
    pub market: String,
    pub range: Option<String>,
    pub status: String,
    pub submitted_at: DateTimeWithTimeZone,
    pub results: Option<Json>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
