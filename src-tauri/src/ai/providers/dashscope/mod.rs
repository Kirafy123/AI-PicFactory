use reqwest::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};
use tracing::info;

use crate::ai::error::AIError;
use crate::ai::{
    AIProvider, GenerateRequest, ProviderTaskHandle, ProviderTaskPollResult, ProviderTaskSubmission,
};

const API_BASE_URL: &str = "https://dashscope.aliyuncs.com/api/v1";
const VIDEO_SYNTHESIS_PATH: &str = "/services/aigc/video-generation/video-synthesis";
const TASK_QUERY_PATH: &str = "/tasks";
const POLL_INTERVAL_MS: u64 = 3000;

#[derive(Debug, Deserialize)]
struct DashScopeSubmitResponse {
    request_id: String,
    output: DashScopeSubmitOutput,
    #[serde(default)]
    code: Option<String>,
    #[serde(default)]
    message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DashScopeSubmitOutput {
    task_id: String,
    task_status: String,
}

#[derive(Debug, Deserialize)]
struct DashScopeTaskResponse {
    request_id: String,
    output: DashScopeTaskOutput,
}

#[derive(Debug, Deserialize)]
struct DashScopeTaskOutput {
    task_id: String,
    task_status: String,
    #[serde(default)]
    video_url: Option<String>,
    #[serde(default)]
    code: Option<String>,
    #[serde(default)]
    message: Option<String>,
}

pub struct DashScopeProvider {
    client: Client,
    api_key: Arc<RwLock<Option<String>>>,
}

impl DashScopeProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            api_key: Arc::new(RwLock::new(None)),
        }
    }

    fn sanitize_model(model: &str) -> String {
        model
            .split_once('/')
            .map(|(_, bare)| bare.to_string())
            .unwrap_or_else(|| model.to_string())
    }

    fn is_video_model(model: &str) -> bool {
        matches!(model, "wan2.7-t2v" | "wan2.7-i2v")
    }

    fn build_video_input(
        request: &GenerateRequest,
        model: &str,
    ) -> Value {
        let extra = request.extra_params.as_ref();

        let video_duration = extra
            .and_then(|p| p.get("video_duration"))
            .and_then(|v| v.as_f64())
            .unwrap_or(10.0) as i64;

        let video_resolution = extra
            .and_then(|p| p.get("video_resolution"))
            .and_then(|v| v.as_str())
            .unwrap_or("720P")
            .to_string();

        let ratio = extra
            .and_then(|p| p.get("ratio"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .or_else(|| Some(request.aspect_ratio.clone()))
            .unwrap_or_else(|| "16:9".to_string());

        let prompt_extend = extra
            .and_then(|p| p.get("prompt_extend"))
            .and_then(|v| v.as_bool())
            .unwrap_or(true);

        let watermark = extra
            .and_then(|p| p.get("watermark"))
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let first_frame_url = extra
            .and_then(|p| p.get("first_frame_url"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let last_frame_url = extra
            .and_then(|p| p.get("last_frame_url"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        info!(
            "[DashScope build_video_input] model={}, duration={}, resolution={}, ratio={}, first_frame={}, last_frame={}",
            model,
            video_duration,
            video_resolution,
            ratio,
            if first_frame_url.is_empty() { "none" } else { "set" },
            if last_frame_url.is_empty() { "none" } else { "set" }
        );

        let mut input = json!({
            "prompt": request.prompt,
        });

        // Build media array for I2V model
        if model == "wan2.7-i2v" {
            let mut media = Vec::new();

            if !first_frame_url.is_empty() {
                media.push(json!({
                    "type": "first_frame",
                    "url": first_frame_url
                }));
            }

            if !last_frame_url.is_empty() {
                media.push(json!({
                    "type": "last_frame",
                    "url": last_frame_url
                }));
            }

            if !media.is_empty() {
                input["media"] = json!(media);
            }
        }

        let parameters = json!({
            "resolution": video_resolution,
            "duration": video_duration,
            "prompt_extend": prompt_extend,
            "watermark": watermark,
        });

        // Add ratio for T2V model
        let parameters = if model == "wan2.7-t2v" {
            let mut params = parameters.as_object().unwrap().clone();
            params.insert("ratio".to_string(), json!(ratio));
            json!(params)
        } else {
            parameters
        };

        json!({
            "model": model,
            "input": input,
            "parameters": parameters
        })
    }

    async fn submit_task(
        &self,
        api_key: &str,
        request: &GenerateRequest,
        model: &str,
    ) -> Result<String, AIError> {
        let endpoint = format!("{}{}", API_BASE_URL, VIDEO_SYNTHESIS_PATH);
        let body = Self::build_video_input(request, model);

        info!("[DashScope submitTask] endpoint={}, model={}", endpoint, model);

        let response = self
            .client
            .post(&endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("X-DashScope-Async", "enable")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = response.status();
        let raw_response = response.text().await.unwrap_or_default();

        if !status.is_success() {
            return Err(AIError::Provider(format!(
                "DashScope submit task failed {}: {}",
                status, raw_response
            )));
        }

        let response_body = serde_json::from_str::<DashScopeSubmitResponse>(&raw_response)
            .map_err(|err| {
                AIError::Provider(format!(
                    "DashScope submit task invalid JSON: {}; raw={}",
                    err, raw_response
                ))
            })?;

        if let Some(code) = response_body.code {
            return Err(AIError::Provider(format!(
                "DashScope submit task error: {} - {}",
                code,
                response_body.message.unwrap_or_default()
            )));
        }

        Ok(response_body.output.task_id)
    }

    async fn poll_task_once(
        &self,
        api_key: &str,
        task_id: &str,
    ) -> Result<ProviderTaskPollResult, AIError> {
        let endpoint = format!("{}{}/{}", API_BASE_URL, TASK_QUERY_PATH, task_id);

        let response = self
            .client
            .get(&endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await?;

        let status = response.status();
        let raw_response = response.text().await.unwrap_or_default();

        if !status.is_success() {
            return Err(AIError::Provider(format!(
                "DashScope query task failed {}: {}",
                status, raw_response
            )));
        }

        let response_body = serde_json::from_str::<DashScopeTaskResponse>(&raw_response)
            .map_err(|err| {
                AIError::Provider(format!(
                    "DashScope query task invalid JSON: {}; raw={}",
                    err, raw_response
                ))
            })?;

        let output = response_body.output;

        match output.task_status.as_str() {
            "SUCCEEDED" => {
                if let Some(video_url) = output.video_url {
                    Ok(ProviderTaskPollResult::Succeeded(video_url))
                } else {
                    Err(AIError::Provider(
                        "DashScope task succeeded but no video_url".to_string(),
                    ))
                }
            }
            "FAILED" => {
                let error_msg = format!(
                    "DashScope task failed: {} - {}",
                    output.code.unwrap_or_else(|| "Unknown".to_string()),
                    output.message.unwrap_or_else(|| "No error message".to_string())
                );
                Ok(ProviderTaskPollResult::Failed(error_msg))
            }
            "PENDING" | "RUNNING" => Ok(ProviderTaskPollResult::Running),
            "UNKNOWN" => Ok(ProviderTaskPollResult::Running),
            other => Err(AIError::Provider(format!(
                "DashScope unexpected task status: {}",
                other
            ))),
        }
    }

    async fn poll_task_until_complete(
        &self,
        api_key: &str,
        task_id: &str,
    ) -> Result<String, AIError> {
        loop {
            match self.poll_task_once(api_key, task_id).await? {
                ProviderTaskPollResult::Running => {
                    sleep(Duration::from_millis(POLL_INTERVAL_MS)).await
                }
                ProviderTaskPollResult::Succeeded(url) => return Ok(url),
                ProviderTaskPollResult::Failed(message) => {
                    return Err(AIError::TaskFailed(message))
                }
            }
        }
    }
}

impl Default for DashScopeProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl AIProvider for DashScopeProvider {
    fn name(&self) -> &str {
        "dashscope"
    }

    fn supports_model(&self, model: &str) -> bool {
        matches!(
            Self::sanitize_model(model).as_str(),
            "wan2.7-t2v" | "wan2.7-i2v"
        )
    }

    fn list_models(&self) -> Vec<String> {
        vec![
            "dashscope/wan2.7-t2v".to_string(),
            "dashscope/wan2.7-i2v".to_string(),
        ]
    }

    async fn set_api_key(&self, api_key: String) -> Result<(), AIError> {
        let mut key = self.api_key.write().await;
        *key = Some(api_key);
        Ok(())
    }

    fn supports_task_resume(&self) -> bool {
        true
    }

    async fn submit_task(
        &self,
        request: GenerateRequest,
    ) -> Result<ProviderTaskSubmission, AIError> {
        let api_key = self
            .api_key
            .read()
            .await
            .clone()
            .ok_or_else(|| AIError::InvalidRequest("API key not set".to_string()))?;

        let model = Self::sanitize_model(&request.model);

        if !Self::is_video_model(&model) {
            return Err(AIError::InvalidRequest(format!(
                "DashScope provider only supports video models, got: {}",
                model
            )));
        }

        let task_id = self.submit_task(&api_key, &request, &model).await?;

        Ok(ProviderTaskSubmission::Queued(ProviderTaskHandle {
            task_id,
            metadata: None,
        }))
    }

    async fn poll_task(
        &self,
        handle: ProviderTaskHandle,
    ) -> Result<ProviderTaskPollResult, AIError> {
        let api_key = self
            .api_key
            .read()
            .await
            .clone()
            .ok_or_else(|| AIError::InvalidRequest("API key not set".to_string()))?;

        self.poll_task_once(&api_key, &handle.task_id).await
    }

    async fn generate(&self, request: GenerateRequest) -> Result<String, AIError> {
        let api_key = self
            .api_key
            .read()
            .await
            .clone()
            .ok_or_else(|| AIError::InvalidRequest("API key not set".to_string()))?;

        let model = Self::sanitize_model(&request.model);

        info!(
            "[DashScope Request] model: {}, prompt: {}",
            model, request.prompt
        );

        if !Self::is_video_model(&model) {
            return Err(AIError::InvalidRequest(format!(
                "DashScope provider only supports video models, got: {}",
                model
            )));
        }

        let task_id = self.submit_task(&api_key, &request, &model).await?;
        self.poll_task_until_complete(&api_key, &task_id).await
    }
}
