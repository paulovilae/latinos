use sea_orm::entity::prelude::*;
pub use super::_entities::stock_research::{ActiveModel, Model, Entity, Column};
pub type StockResearch = Entity;

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, _insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        Ok(self)
    }
}

