use sea_orm_migration::prelude::*;

pub struct Migrator;

pub mod m20220101_000001_users;
pub mod m20260304_234822_contracts;
pub mod m20260315_221538_movilo_appointments;
pub mod m20260331_000001_stock_research;
pub mod m20260408_011000_opportunities;
pub mod m20260408_041000_update_opportunities_and_bots;
pub mod m20260408_060000_tenancy_hardening;
pub mod m20260408_070000_backtest_tenancy;
pub mod m20260409_000001_bot_webhook_token;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_users::Migration),
            Box::new(m20260304_234822_contracts::Migration),
            Box::new(m20260315_221538_movilo_appointments::Migration),
            Box::new(M20260317000001CreateLatinosTables),
            Box::new(m20260331_000001_stock_research::Migration),
            Box::new(m20260408_011000_opportunities::Migration),
            Box::new(m20260408_041000_update_opportunities_and_bots::Migration),
            Box::new(m20260408_060000_tenancy_hardening::Migration),
            Box::new(m20260408_070000_backtest_tenancy::Migration),
            Box::new(m20260409_000001_bot_webhook_token::Migration),
        ]
    }
}

/// Creates all 8 Latinos domain tables with `latinos_` prefix
pub struct M20260317000001CreateLatinosTables;

impl MigrationName for M20260317000001CreateLatinosTables {
    fn name(&self) -> &str {
        "m20260317_000001_create_latinos_tables"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for M20260317000001CreateLatinosTables {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ── 1. latinos_users ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_users"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("email"))
                            .string_len(255)
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("name"))
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("role"))
                            .string_len(50)
                            .not_null()
                            .default("user"),
                    )
                    .col(
                        ColumnDef::new(Alias::new("status"))
                            .string_len(50)
                            .not_null()
                            .default("active"),
                    )
                    .col(ColumnDef::new(Alias::new("avatar_url")).text())
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
            .await?;

        // ── 2. latinos_bots ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_bots"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Alias::new("owner_id")).integer().not_null())
                    .col(
                        ColumnDef::new(Alias::new("name"))
                            .string_len(255)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Alias::new("description")).text())
                    .col(
                        ColumnDef::new(Alias::new("status"))
                            .string_len(50)
                            .not_null()
                            .default("draft"),
                    )
                    .col(
                        ColumnDef::new(Alias::new("is_wasm"))
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(ColumnDef::new(Alias::new("wasm_hash")).string_len(128))
                    .col(
                        ColumnDef::new(Alias::new("live_trading"))
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(ColumnDef::new(Alias::new("dify_app_id")).string_len(128))
                    .col(ColumnDef::new(Alias::new("tags")).json())
                    .col(ColumnDef::new(Alias::new("signal_manifest")).json())
                    .col(ColumnDef::new(Alias::new("tp_percent")).float())
                    .col(ColumnDef::new(Alias::new("sl_percent")).float())
                    .col(ColumnDef::new(Alias::new("live_metrics")).json())
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
                    .foreign_key(
                        ForeignKey::create()
                            .from(Alias::new("latinos_bots"), Alias::new("owner_id"))
                            .to(Alias::new("latinos_users"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // ── 3. latinos_signals ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_signals"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Alias::new("bot_id")).integer())
                    .col(ColumnDef::new(Alias::new("type")).string_len(50).not_null())
                    .col(ColumnDef::new(Alias::new("name")).string_len(255))
                    .col(ColumnDef::new(Alias::new("payload")).json())
                    .col(
                        ColumnDef::new(Alias::new("emitted_at"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Alias::new("mode"))
                            .string_len(50)
                            .not_null()
                            .default("simulation"),
                    )
                    .col(
                        ColumnDef::new(Alias::new("delivery_status"))
                            .string_len(50)
                            .not_null()
                            .default("pending"),
                    )
                    .col(
                        ColumnDef::new(Alias::new("created_at"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Alias::new("latinos_signals"), Alias::new("bot_id"))
                            .to(Alias::new("latinos_bots"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        // ── 4. latinos_backtests ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_backtests"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Alias::new("bot_id")).integer())
                    .col(ColumnDef::new(Alias::new("range")).string_len(50))
                    .col(ColumnDef::new(Alias::new("market")).string_len(50))
                    .col(ColumnDef::new(Alias::new("symbol")).string_len(20))
                    .col(ColumnDef::new(Alias::new("interval")).string_len(10))
                    .col(
                        ColumnDef::new(Alias::new("initial_capital"))
                            .float()
                            .default(10000.0),
                    )
                    .col(
                        ColumnDef::new(Alias::new("status"))
                            .string_len(50)
                            .not_null()
                            .default("queued"),
                    )
                    .col(ColumnDef::new(Alias::new("results")).json())
                    .col(
                        ColumnDef::new(Alias::new("submitted_at"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(ColumnDef::new(Alias::new("completed_at")).timestamp_with_time_zone())
                    .foreign_key(
                        ForeignKey::create()
                            .from(Alias::new("latinos_backtests"), Alias::new("bot_id"))
                            .to(Alias::new("latinos_bots"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        // ── 5. latinos_trades ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_trades"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Alias::new("user_id")).integer())
                    .col(ColumnDef::new(Alias::new("bot_id")).integer())
                    .col(
                        ColumnDef::new(Alias::new("symbol"))
                            .string_len(20)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Alias::new("side")).string_len(10).not_null())
                    .col(ColumnDef::new(Alias::new("price")).double().not_null())
                    .col(
                        ColumnDef::new(Alias::new("amount"))
                            .double()
                            .not_null()
                            .default(1.0),
                    )
                    .col(
                        ColumnDef::new(Alias::new("status"))
                            .string_len(50)
                            .not_null()
                            .default("simulated"),
                    )
                    .col(ColumnDef::new(Alias::new("broker")).string_len(50))
                    .col(ColumnDef::new(Alias::new("broker_order_id")).string_len(128))
                    .col(ColumnDef::new(Alias::new("pnl")).double())
                    .col(
                        ColumnDef::new(Alias::new("timestamp"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Alias::new("latinos_trades"), Alias::new("user_id"))
                            .to(Alias::new("latinos_users"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Alias::new("latinos_trades"), Alias::new("bot_id"))
                            .to(Alias::new("latinos_bots"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        // ── 6. latinos_market_data ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_market_data"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .big_integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("symbol"))
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Alias::new("interval"))
                            .string_len(10)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Alias::new("open")).double().not_null())
                    .col(ColumnDef::new(Alias::new("high")).double().not_null())
                    .col(ColumnDef::new(Alias::new("low")).double().not_null())
                    .col(ColumnDef::new(Alias::new("close")).double().not_null())
                    .col(
                        ColumnDef::new(Alias::new("volume"))
                            .double()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(Alias::new("ts"))
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;

        // Index for fast lookups on market_data
        manager
            .create_index(
                Index::create()
                    .name("idx_latinos_market_data_symbol_interval_ts")
                    .table(Alias::new("latinos_market_data"))
                    .col(Alias::new("symbol"))
                    .col(Alias::new("interval"))
                    .col(Alias::new("ts"))
                    .unique()
                    .to_owned(),
            )
            .await?;

        // ── 7. latinos_formula_versions ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_formula_versions"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Alias::new("signal_id")).integer())
                    .col(
                        ColumnDef::new(Alias::new("version"))
                            .integer()
                            .not_null()
                            .default(1),
                    )
                    .col(ColumnDef::new(Alias::new("code")).text().not_null())
                    .col(
                        ColumnDef::new(Alias::new("language"))
                            .string_len(20)
                            .not_null()
                            .default("python"),
                    )
                    .col(ColumnDef::new(Alias::new("sandbox_result")).json())
                    .col(
                        ColumnDef::new(Alias::new("created_at"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                Alias::new("latinos_formula_versions"),
                                Alias::new("signal_id"),
                            )
                            .to(Alias::new("latinos_signals"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // ── 8. latinos_broker_connections ──
        manager
            .create_table(
                Table::create()
                    .table(Alias::new("latinos_broker_connections"))
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Alias::new("id"))
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Alias::new("user_id")).integer().not_null())
                    .col(
                        ColumnDef::new(Alias::new("broker"))
                            .string_len(50)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Alias::new("credentials_encrypted")).text())
                    .col(
                        ColumnDef::new(Alias::new("status"))
                            .string_len(50)
                            .not_null()
                            .default("pending"),
                    )
                    .col(ColumnDef::new(Alias::new("last_synced_at")).timestamp_with_time_zone())
                    .col(
                        ColumnDef::new(Alias::new("created_at"))
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                Alias::new("latinos_broker_connections"),
                                Alias::new("user_id"),
                            )
                            .to(Alias::new("latinos_users"), Alias::new("id"))
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let tables = vec![
            "latinos_broker_connections",
            "latinos_formula_versions",
            "latinos_market_data",
            "latinos_trades",
            "latinos_backtests",
            "latinos_signals",
            "latinos_bots",
            "latinos_users",
        ];
        for table in tables {
            manager
                .drop_table(
                    Table::drop()
                        .table(Alias::new(table))
                        .if_exists()
                        .to_owned(),
                )
                .await?;
        }
        Ok(())
    }
}
