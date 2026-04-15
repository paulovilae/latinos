use sea_orm::entity::prelude::*;
pub use super::_entities::latinos_opportunities::{ActiveModel, Model, Entity, Column};
pub type LatinosOpportunities = Entity;

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, _insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        Ok(self)
    }
}

