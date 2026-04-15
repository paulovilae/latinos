use serde_json::{json, Value};

fn sql_identifier(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return None;
    }

    if trimmed
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '_')
    {
        Some(trimmed.to_string())
    } else {
        None
    }
}

pub async fn query_rows(app: &str, query: &str) -> Vec<Value> {
    match crate::hera_ipc::execute_tool(
        "memento_query",
        json!({
            "app": app,
            "query": query,
        }),
    )
    .await
    {
        Ok(result) => result
            .get("rows")
            .and_then(|value| value.as_array())
            .cloned()
            .unwrap_or_default(),
        Err(error) => {
            tracing::warn!("Memento query failed for {}: {}", app, error);
            Vec::new()
        }
    }
}

pub async fn count_table(app: &str, table: &str) -> i64 {
    let Some(table) = sql_identifier(table) else {
        return 0;
    };

    let sql = format!("SELECT COUNT(*)::bigint as cnt FROM {}", table);
    query_rows(app, &sql)
        .await
        .into_iter()
        .find_map(|row| row.get("cnt").and_then(|value| value.as_i64()))
        .unwrap_or(0)
}
