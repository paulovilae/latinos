use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260331_000001_stock_research"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("stock_research"))
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
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("owner_email"))
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("source"))
                            .string_len(32)
                            .not_null()
                            .default("manual"),
                    )
                    .col(ColumnDef::new(Alias::new("bot_id")).integer().null())
                    .col(
                        ColumnDef::new(Alias::new("raw_data"))
                            .json_binary()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("analysis_summary"))
                            .text()
                            .not_null()
                            .default(""),
                    )
                    .col(
                        ColumnDef::new(Alias::new("research_date"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE stock_research
                ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) NOT NULL DEFAULT '',
                ADD COLUMN IF NOT EXISTS source VARCHAR(32) NOT NULL DEFAULT 'manual',
                ADD COLUMN IF NOT EXISTS bot_id INTEGER NULL
                "#,
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_stock_research_ticker_date")
                    .table(Alias::new("stock_research"))
                    .col(Alias::new("ticker"))
                    .col(Alias::new("research_date"))
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_stock_research_owner_date")
                    .table(Alias::new("stock_research"))
                    .col(Alias::new("owner_email"))
                    .col(Alias::new("research_date"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table(Alias::new("stock_research"))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
