//! Migration: Add webhook_token and bot_type to latinos_bots
//!
//! - webhook_token: unique per-bot secret for TradingView/Alpaca webhook auth
//! - bot_type: 'trading' | 'utility' | 'analysis' for arena filtering

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Add webhook_token column (nullable, later we backfill)
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("latinos_bots"))
                    .add_column(
                        ColumnDef::new(Alias::new("webhook_token"))
                            .string_len(64)
                            .null(),
                    )
                    .to_owned(),
            )
            .await?;

        // 2. Add bot_type column with default 'trading'
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("latinos_bots"))
                    .add_column(
                        ColumnDef::new(Alias::new("bot_type"))
                            .string_len(50)
                            .not_null()
                            .default("trading"),
                    )
                    .to_owned(),
            )
            .await?;

        // 3. Classify known utility/non-trading bots
        let db = manager.get_connection();
        db.execute_unprepared(
            r#"UPDATE latinos_bots
               SET bot_type = 'utility'
               WHERE name LIKE 'UTILITY:%'
                  OR name LIKE 'MASTER:%'
                  OR name LIKE 'KYC%'
                  OR name ILIKE '%sentiment%'
                  OR name ILIKE '%movilo%'
                  OR name ILIKE '%sovereign kyb%'
                  OR name ILIKE '%ocr%';"#,
        )
        .await?;

        // 4. Backfill webhook tokens — use md5(random) which needs no extensions
        db.execute_unprepared(
            r#"UPDATE latinos_bots
               SET webhook_token = md5(random()::text || id::text || clock_timestamp()::text)
               WHERE webhook_token IS NULL;"#,
        )
        .await?;

        // 5. Add unique index on webhook_token
        manager
            .create_index(
                Index::create()
                    .unique()
                    .name("idx_latinos_bots_webhook_token")
                    .table(Alias::new("latinos_bots"))
                    .col(Alias::new("webhook_token"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_index(
                Index::drop()
                    .name("idx_latinos_bots_webhook_token")
                    .to_owned(),
            )
            .await?;
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("latinos_bots"))
                    .drop_column(Alias::new("webhook_token"))
                    .drop_column(Alias::new("bot_type"))
                    .to_owned(),
            )
            .await?;
        Ok(())
    }
}
