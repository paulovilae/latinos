use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_opportunities"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("ticker"))
                            .string_len(50)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("research_id"))
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("score"))
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("confidence_score"))
                            .float()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(Alias::new("stance"))
                            .string_len(50)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Alias::new("thesis")).text().not_null())
                    .col(ColumnDef::new(Alias::new("catalysts")).json().not_null())
                    .col(ColumnDef::new(Alias::new("risks")).json().not_null())
                    .col(ColumnDef::new(Alias::new("key_metrics")).json().not_null())
                    .col(ColumnDef::new(Alias::new("disqualifier_flags")).json().not_null())
                    .col(ColumnDef::new(Alias::new("catalyst_windows")).json().not_null())
                    .col(
                        ColumnDef::new(Alias::new("research_date"))
                            .string_len(100)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("created_at"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Alias::new("updated_at"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("latinos_opportunities"))
                    .to_owned(),
            )
            .await
    }
}
