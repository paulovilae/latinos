use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("latinos_backtests"))
                    .add_column(
                        ColumnDef::new(Alias::new("is_global"))
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .add_column(
                        ColumnDef::new(Alias::new("owner_id"))
                            .integer()
                            .null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("latinos_backtests"))
                    .drop_column(Alias::new("is_global"))
                    .drop_column(Alias::new("owner_id"))
                    .to_owned(),
            )
            .await
    }
}
