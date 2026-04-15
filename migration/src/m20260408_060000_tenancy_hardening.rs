use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Add owner_id to latinos_opportunities
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("latinos_opportunities"))
                    .add_column(
                        ColumnDef::new(Alias::new("owner_id"))
                            .integer()
                            .null(), // Initially null for existing records
                    )
                    .add_column(
                        ColumnDef::new(Alias::new("is_global"))
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await?;

        // 2. Add foreign key for owner_id in latinos_opportunities
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_latinos_opportunities_owner_id")
                    .from(Alias::new("latinos_opportunities"), Alias::new("owner_id"))
                    .to(Alias::new("latinos_users"), Alias::new("id"))
                    .on_delete(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_latinos_opportunities_owner_id")
                    .table(Alias::new("latinos_opportunities"))
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("latinos_opportunities"))
                    .drop_column(Alias::new("owner_id"))
                    .drop_column(Alias::new("is_global"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}
