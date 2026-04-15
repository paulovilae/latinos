use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "latinos_signals")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub bot_id: Option<i32>,
    pub r#type: String,
    pub name: Option<String>,
    pub payload: Option<Json>,
    pub emitted_at: DateTimeWithTimeZone,
    pub mode: String,
    pub delivery_status: String,
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
