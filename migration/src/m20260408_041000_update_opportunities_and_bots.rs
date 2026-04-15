use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Update latinos_opportunities
        manager
            .alter_table(
                Table::alter()
                    .table(LatinosOpportunities::Table)
                    .add_column(ColumnDef::new(LatinosOpportunities::VisibilityScope).string().not_null().default("global_feed"))
                    .add_column(ColumnDef::new(LatinosOpportunities::VisibilityKey).string().null())
                    .to_owned(),
            )
            .await?;

        // Update latinos_bots
        manager
            .alter_table(
                Table::alter()
                    .table(LatinosBots::Table)
                    .add_column(ColumnDef::new(LatinosBots::ManifestVersion).integer().null())
                    .add_column(ColumnDef::new(LatinosBots::ManifestStatus).string().null())
                    .add_column(ColumnDef::new(LatinosBots::ManifestMigrationNote).text().null())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(LatinosBots::Table)
                    .drop_column(LatinosBots::ManifestVersion)
                    .drop_column(LatinosBots::ManifestStatus)
                    .drop_column(LatinosBots::ManifestMigrationNote)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(LatinosOpportunities::Table)
                    .drop_column(LatinosOpportunities::VisibilityScope)
                    .drop_column(LatinosOpportunities::VisibilityKey)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(Iden)]
enum LatinosOpportunities {
    Table,
    VisibilityScope,
    VisibilityKey,
}

#[derive(Iden)]
enum LatinosBots {
    Table,
    ManifestVersion,
    ManifestStatus,
    ManifestMigrationNote,
}
