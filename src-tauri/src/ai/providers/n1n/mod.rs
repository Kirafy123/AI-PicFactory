use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::{
    multipart::{Form, Part},
    Client,
};
use serde::Serialize;
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

use crate::ai::error::AIError;
use crate::ai::{
    AIProvider, GenerateRequest, ProviderTaskHandle, ProviderTaskPollResult, ProviderTaskSubmission,
};

const BASE_URL: &str = "https://api.n1n.ai";
const GENERATIONS_PATH: &str = "/v1/images/generations";
const EDITS_PATH: &str = "/v1/images/edits";

// Models routed to the generations endpoint
const GENERATE_MODEL: &str = "gpt-image-2";
// Models routed to the edits endpoint
const EDIT_MODEL: &str = "gpt-image-2-edit";

#[derive(Debug, Serialize)]
struct GenerationsBody {
    model: String,
    prompt: String,
    n: u32,
    size: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    quality: Option<String>,
}

pub struct N1nProvider {
    client: Client,
    api_key: Arc<RwLock<Option<String>>>,
}

impl N1nProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            api_key: Arc::new(RwLock::new(None)),
        }
    }

    fn strip_prefix(model: &str) -> &str {
        model.split_once('/').map(|(_, m)| m).unwrap_or(model)
    }

    /// Convert any reference image source (data URL, base64, file path, HTTP URL) to raw bytes.
    fn source_to_bytes(source: &str) -> Result<Vec<u8>, AIError> {
        let trimmed = source.trim();

        if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
            return Err(AIError::InvalidRequest(
                "HTTP URL reference images are not supported for N1N edits; use a local file or base64".to_string(),
            ));
        }

        // data URL: "data:image/png;base64,..."
        if let Some((meta, payload)) = trimmed.split_once(',') {
            if meta.starts_with("data:") && meta.ends_with(";base64") {
                return STANDARD
                    .decode(payload)
                    .map_err(|e| AIError::InvalidRequest(format!("base64 decode failed: {e}")));
            }
        }

        // Raw base64 heuristic
        let likely_base64 = trimmed.len() > 256
            && trimmed
                .chars()
                .all(|ch| ch.is_ascii_alphanumeric() || ch == '+' || ch == '/' || ch == '=');
        if likely_base64 {
            return STANDARD
                .decode(trimmed)
                .map_err(|e| AIError::InvalidRequest(format!("base64 decode failed: {e}")));
        }

        let path = if trimmed.starts_with("file://") {
            let raw = trimmed.trim_start_matches("file://");
            let decoded = urlencoding::decode(raw)
                .map(|r| r.into_owned())
                .unwrap_or_else(|_| raw.to_string());
            // Strip leading "/" before drive letter on Windows (e.g. /C:/...)
            let normalized = if decoded.starts_with('/')
                && decoded.len() > 2
                && decoded.as_bytes().get(2) == Some(&b':')
            {
                decoded[1..].to_string()
            } else {
                decoded
            };
            PathBuf::from(normalized)
        } else {
            PathBuf::from(trimmed)
        };

        std::fs::read(&path).map_err(|e| AIError::Io(e))
    }

    fn detect_mime(source: &str) -> &'static str {
        let lower = source.to_ascii_lowercase();
        if lower.contains("image/jpeg") || lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
            "image/jpeg"
        } else if lower.contains("image/webp") || lower.ends_with(".webp") {
            "image/webp"
        } else {
            "image/png"
        }
    }

    /// Extract result URL from the N1N response.
    /// The API wraps image results in a chat-completion envelope:
    /// { choices: [{ message: { content: "<url or data-url>" } }] }
    fn extract_result_url(body: &Value) -> Option<String> {
        let content = body
            .get("choices")
            .and_then(|c| c.as_array())
            .and_then(|arr| arr.first())
            .and_then(|choice| choice.get("message"))
            .and_then(|msg| msg.get("content"))
            .and_then(|c| c.as_str())?;

        let trimmed = content.trim();
        if trimmed.is_empty() {
            return None;
        }

        // Direct URL
        if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
            return Some(trimmed.to_string());
        }

        // Data URL
        if trimmed.starts_with("data:image/") {
            return Some(trimmed.to_string());
        }

        // Markdown image: ![...](url)
        if let Some(start) = trimmed.find("](") {
            let rest = &trimmed[start + 2..];
            if let Some(end) = rest.find(')') {
                let url = rest[..end].trim();
                if url.starts_with("http://") || url.starts_with("https://") {
                    return Some(url.to_string());
                }
            }
        }

        // Fallback: treat as raw base64 and wrap as data URL
        let likely_base64 = trimmed.len() > 256
            && trimmed
                .chars()
                .all(|ch| ch.is_ascii_alphanumeric() || ch == '+' || ch == '/' || ch == '=');
        if likely_base64 {
            return Some(format!("data:image/png;base64,{}", trimmed));
        }

        None
    }

    async fn generate_image(&self, request: &GenerateRequest) -> Result<String, AIError> {
        let api_key = self
            .api_key
            .read()
            .await
            .clone()
            .ok_or_else(|| AIError::InvalidRequest("N1N API key not set".to_string()))?;

        let body = GenerationsBody {
            model: GENERATE_MODEL.to_string(),
            prompt: request.prompt.clone(),
            n: 1,
            size: request.size.clone(),
            quality: None,
        };

        let endpoint = format!("{}{}", BASE_URL, GENERATIONS_PATH);
        info!("N1N generate: POST {endpoint} size={}", request.size);

        let response = self
            .client
            .post(&endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Accept", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = response.status();
        let raw = response.text().await?;

        if !status.is_success() {
            return Err(AIError::Provider(format!(
                "N1N generations API returned {status}: {raw}"
            )));
        }

        let parsed: Value = serde_json::from_str(&raw)?;
        Self::extract_result_url(&parsed).ok_or_else(|| {
            AIError::Provider(format!(
                "N1N generations response has no extractable image URL: {raw}"
            ))
        })
    }

    async fn edit_image(&self, request: &GenerateRequest) -> Result<String, AIError> {
        let api_key = self
            .api_key
            .read()
            .await
            .clone()
            .ok_or_else(|| AIError::InvalidRequest("N1N API key not set".to_string()))?;

        let reference_images = request
            .reference_images
            .as_ref()
            .filter(|imgs| !imgs.is_empty())
            .ok_or_else(|| {
                AIError::InvalidRequest(
                    "N1N edit requires at least one reference image".to_string(),
                )
            })?;

        // Use the first reference image as the primary edit source
        let first_source = &reference_images[0];
        let mime = Self::detect_mime(first_source);
        let ext = mime.split('/').nth(1).unwrap_or("png");
        let bytes = Self::source_to_bytes(first_source)?;

        let file_part = Part::bytes(bytes)
            .file_name(format!("image.{ext}"))
            .mime_str(mime)
            .map_err(|e| AIError::Provider(format!("mime error: {e}")))?;

        let mut form = Form::new()
            .part("image", file_part)
            .text("prompt", request.prompt.clone())
            .text("model", GENERATE_MODEL.to_string())
            .text("n", "1")
            .text("size", request.size.clone());

        // Attach additional reference images if present
        for extra in reference_images.iter().skip(1) {
            let extra_mime = Self::detect_mime(extra);
            let extra_ext = extra_mime.split('/').nth(1).unwrap_or("png");
            let extra_bytes = Self::source_to_bytes(extra)?;
            let extra_part = Part::bytes(extra_bytes)
                .file_name(format!("image.{extra_ext}"))
                .mime_str(extra_mime)
                .map_err(|e| AIError::Provider(format!("mime error: {e}")))?;
            form = form.part("image", extra_part);
        }

        let endpoint = format!("{}{}", BASE_URL, EDITS_PATH);
        info!("N1N edit: POST {endpoint} size={}", request.size);

        let response = self
            .client
            .post(&endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Accept", "application/json")
            .multipart(form)
            .send()
            .await?;

        let status = response.status();
        let raw = response.text().await?;

        if !status.is_success() {
            return Err(AIError::Provider(format!(
                "N1N edits API returned {status}: {raw}"
            )));
        }

        let parsed: Value = serde_json::from_str(&raw)?;
        Self::extract_result_url(&parsed).ok_or_else(|| {
            AIError::Provider(format!(
                "N1N edits response has no extractable image URL: {raw}"
            ))
        })
    }
}

#[async_trait::async_trait]
impl AIProvider for N1nProvider {
    fn name(&self) -> &str {
        "n1n"
    }

    fn supports_model(&self, model: &str) -> bool {
        let m = Self::strip_prefix(model);
        m == GENERATE_MODEL || m == EDIT_MODEL
    }

    async fn set_api_key(&self, api_key: String) -> Result<(), AIError> {
        *self.api_key.write().await = Some(api_key);
        Ok(())
    }

    fn supports_task_resume(&self) -> bool {
        true
    }

    async fn submit_task(&self, request: GenerateRequest) -> Result<ProviderTaskSubmission, AIError> {
        let model = Self::strip_prefix(&request.model);
        let result_url = if model == EDIT_MODEL {
            self.edit_image(&request).await?
        } else {
            self.generate_image(&request).await?
        };
        Ok(ProviderTaskSubmission::Succeeded(result_url))
    }

    async fn poll_task(&self, _handle: ProviderTaskHandle) -> Result<ProviderTaskPollResult, AIError> {
        Err(AIError::Provider("N1N provider does not use async polling".to_string()))
    }

    async fn generate(&self, request: GenerateRequest) -> Result<String, AIError> {
        let model = Self::strip_prefix(&request.model);
        if model == EDIT_MODEL {
            self.edit_image(&request).await
        } else {
            self.generate_image(&request).await
        }
    }
}
