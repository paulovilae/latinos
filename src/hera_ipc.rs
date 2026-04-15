use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::UnixStream;

#[derive(Serialize)]
pub struct HeraRequest {
    pub action: String,
    pub payload: Value,
}

#[derive(Deserialize, Debug)]
pub struct HeraResponse {
    pub status: String,
    pub data: Option<Value>,
    pub error: Option<String>,
}

/// Delegator to the central sovereign LLM orchestrator (Hera).
/// This replaces external third-party APIs like Dify.
pub async fn delegate_to_hera(action: &str, payload: Value) -> Result<Value, String> {
    let mut stream = UnixStream::connect("/tmp/hera-core.sock")
        .await
        .map_err(|e| {
            format!(
                "Failed to connect to Hera IPC at /tmp/hera-core.sock: {}",
                e
            )
        })?;

    let req = HeraRequest {
        action: action.to_string(),
        payload,
    };

    let req_string = serde_json::to_string(&req).unwrap();
    stream
        .write_all(req_string.as_bytes())
        .await
        .map_err(|e| format!("Failed to send to Hera: {}", e))?;

    // Hera might not close the socket immediately if it streams.
    // We should read until EOF or use a length-prefixed protocol.
    // Usually Unix Sockets in this OS read until the connection drops, but
    // let's read the full string.
    let mut buf = Vec::new();
    stream
        .read_to_end(&mut buf)
        .await
        .map_err(|e| format!("Failed to read from Hera: {}", e))?;

    if buf.is_empty() {
        return Err("Hera returned empty response".to_string());
    }

    let resp: HeraResponse = serde_json::from_slice(&buf)
        .map_err(|e| format!("Failed to parse Hera response: {}", e))?;

    if resp.status == "success" {
        Ok(resp.data.unwrap_or_default())
    } else {
        Err(resp
            .error
            .unwrap_or_else(|| "Unknown Hera error".to_string()))
    }
}

pub async fn execute_tool(tool_name: &str, arguments: Value) -> Result<Value, String> {
    delegate_to_hera(
        "execute_tool",
        serde_json::json!({
            "tool_name": tool_name,
            "arguments": arguments,
        }),
    )
    .await
    .and_then(|value| {
        value
            .get("result")
            .cloned()
            .ok_or_else(|| format!("Hera execute_tool returned no result for {}", tool_name))
    })
}
