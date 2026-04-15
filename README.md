# Latinos-rust

Rust/Loco trading app built on the shared Vilaros OS / ImagineOS runtime.

## Purpose

- Algorithmic trading platform for strategy design, signal evaluation, and backtesting
- Bot management surface for research and execution workflows
- Rust-first shell over shared platform capabilities, tools, and workflows

## Ownership boundary

- `Apps/Latinos-rust` owns UI, routes, dashboards, and trading-specific presentation.
- Shared orchestration and memory stay in platform services such as Hera and Memento.
- Trading business tools and workflows belong in repo-level assets, not ad hoc controller logic.

## Product scope

`Latinos` is the trading app in the portfolio. It is not a legal or talent product. Its current role is to provide a focused operating surface for:

- signal review
- bot operations
- market analysis
- backtesting
- strategy workflows

Public route: `https://latinos.paulovila.org`

## Run

```bash
cargo run -- start -e development
```

## Architecture note

`Latinos-rust` follows the same Rust-first platform direction as the other apps: fast server-rendered UI, shared orchestration through Hera, scoped data access through Memento, and app-specific tools/workflows kept outside the shell when they represent durable business logic.
