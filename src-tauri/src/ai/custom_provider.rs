use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use std::time::Duration;

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tracing::info;

use crate::ai::error::AIError;
use crate::ai::{
    AIProvider, GenerateRequest, ProviderRegistry, ProviderTaskHandle, ProviderTaskPollResult,
    ProviderTaskSubmission,
};

/// Allowed target providers for the Custom slot.
/// 灰豆原列表为 [doubao, gemini, openai, kie, fal]，本项目只保留实际有 Rust 实现的 [grsai, kie]
/// （即用 grsai 替换 fal，并去掉 doubao/gemini/openai）。
pub const ALLOWED_TARGETS: &[&str] = &["grsai", "kie"];
pub const DEFAULT_TARGET: &str = "grsai";
pub const DEFAULT_MODELS: &[&str] = &["nano-banana-pro", "nano-banana-2"];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomProviderConfig {
    pub target_provider_id: String,
    pub supported_models: Vec<String>,
}

#[derive(Debug)]
struct CustomProviderState {
    target_provider_id: String,
    supported_models_per_target: HashMap<String, Vec<String>>,
}

impl Default for CustomProviderState {
    fn default() -> Self {
        let mut models_per_target = HashMap::new();
        for target in ALLOWED_TARGETS {
            models_per_target.insert(
                (*target).to_string(),
                DEFAULT_MODELS.iter().map(|m| (*m).to_string()).collect(),
            );
        }
        Self {
            target_provider_id: DEFAULT_TARGET.to_string(),
            supported_models_per_target: models_per_target,
        }
    }
}

pub struct CustomProvider {
    state: RwLock<CustomProviderState>,
}

impl CustomProvider {
    pub fn new() -> Self {
        Self {
            state: RwLock::new(CustomProviderState::default()),
        }
    }

    fn current_target(&self) -> String {
        self.state.read().unwrap().target_provider_id.clone()
    }

    pub fn snapshot_config(&self) -> CustomProviderConfig {
        let state = self.state.read().unwrap();
        let target = state.target_provider_id.clone();
        let models = state
            .supported_models_per_target
            .get(&target)
            .cloned()
            .unwrap_or_else(|| DEFAULT_MODELS.iter().map(|m| (*m).to_string()).collect());
        CustomProviderConfig {
            target_provider_id: target,
            supported_models: models,
        }
    }

    pub fn configure(&self, target_provider_id: &str) -> Result<(), AIError> {
        let target = target_provider_id.trim().to_lowercase();
        if !ALLOWED_TARGETS.iter().any(|t| *t == target.as_str()) {
            return Err(AIError::Provider(format!(
                "unknown custom target: {} (allowed: {:?})",
                target, ALLOWED_TARGETS
            )));
        }
        let mut state = self.state.write().unwrap();
        state.target_provider_id = target.clone();
        state
            .supported_models_per_target
            .entry(target)
            .or_insert_with(|| DEFAULT_MODELS.iter().map(|m| (*m).to_string()).collect());
        Ok(())
    }

    pub fn set_supported_models(
        &self,
        target_provider_id: &str,
        models: Vec<String>,
    ) -> Result<(), AIError> {
        let target = target_provider_id.trim().to_lowercase();
        if !ALLOWED_TARGETS.iter().any(|t| *t == target.as_str()) {
            return Err(AIError::Provider(format!(
                "unknown custom target: {}",
                target
            )));
        }
        let normalized: Vec<String> = {
            let mut seen = std::collections::HashSet::new();
            let mut out = Vec::new();
            for raw in models {
                let trimmed = raw.trim().to_string();
                if trimmed.is_empty() {
                    continue;
                }
                let last = trimmed
                    .rsplit('/')
                    .next()
                    .map(|s| s.to_string())
                    .unwrap_or(trimmed);
                if seen.insert(last.clone()) {
                    out.push(last);
                }
            }
            out
        };
        let mut state = self.state.write().unwrap();
        state.supported_models_per_target.insert(target, normalized);
        Ok(())
    }

    /// Strip "custom/" prefix and forward the actual model id.
    fn unwrap_model(model: &str) -> String {
        model
            .strip_prefix("custom/")
            .map(|s| s.to_string())
            .unwrap_or_else(|| model.to_string())
    }

    fn target_provider(
        registry: &ProviderRegistry,
        target_id: &str,
    ) -> Result<Arc<dyn AIProvider>, AIError> {
        registry
            .get_provider(target_id)
            .cloned()
            .ok_or_else(|| AIError::Provider(format!("target provider not found: {}", target_id)))
    }
}

impl Default for CustomProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl AIProvider for CustomProvider {
    fn name(&self) -> &str {
        "custom"
    }

    fn supports_model(&self, model: &str) -> bool {
        model.starts_with("custom/")
    }

    fn list_models(&self) -> Vec<String> {
        let state = self.state.read().unwrap();
        let target = state.target_provider_id.clone();
        state
            .supported_models_per_target
            .get(&target)
            .cloned()
            .unwrap_or_default()
            .into_iter()
            .map(|m| format!("custom/{}", m))
            .collect()
    }

    async fn set_api_key(&self, api_key: String) -> Result<(), AIError> {
        let target_id = self.current_target();
        let registry = crate::ai::registry();
        let target = Self::target_provider(registry, &target_id)?;
        target.set_api_key(api_key).await
    }

    fn supports_task_resume(&self) -> bool {
        let target_id = self.current_target();
        let registry = crate::ai::registry();
        registry
            .get_provider(&target_id)
            .map(|t| t.supports_task_resume())
            .unwrap_or(false)
    }

    async fn submit_task(
        &self,
        request: GenerateRequest,
    ) -> Result<ProviderTaskSubmission, AIError> {
        let target_id = self.current_target();
        let registry = crate::ai::registry();
        let target = Self::target_provider(registry, &target_id)?;
        let mut req = request;
        req.model = Self::unwrap_model(&req.model);
        target.submit_task(req).await
    }

    async fn poll_task(
        &self,
        handle: ProviderTaskHandle,
    ) -> Result<ProviderTaskPollResult, AIError> {
        let target_id = self.current_target();
        let registry = crate::ai::registry();
        let target = Self::target_provider(registry, &target_id)?;
        target.poll_task(handle).await
    }

    async fn generate(&self, request: GenerateRequest) -> Result<String, AIError> {
        let target_id = self.current_target();
        let registry = crate::ai::registry();
        let target = Self::target_provider(registry, &target_id)?;
        let mut req = request;
        req.model = Self::unwrap_model(&req.model);
        target.generate(req).await
    }
}

// --- Global handle ---

static CUSTOM_PROVIDER: std::sync::OnceLock<Arc<CustomProvider>> = std::sync::OnceLock::new();

pub fn custom_provider_handle() -> Arc<CustomProvider> {
    CUSTOM_PROVIDER
        .get_or_init(|| Arc::new(CustomProvider::new()))
        .clone()
}

// --- Persistence (SQLite) ---

fn resolve_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(app_data_dir.join("projects.db"))
}

fn open_db(app: &AppHandle) -> Result<Connection, String> {
    let path = resolve_db_path(app)?;
    let conn = Connection::open(path).map_err(|e| format!("Failed to open db: {}", e))?;
    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(|e| format!("WAL: {}", e))?;
    conn.busy_timeout(Duration::from_millis(3000))
        .map_err(|e| format!("busy_timeout: {}", e))?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS custom_provider_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          target_provider_id TEXT NOT NULL,
          supported_models_json TEXT NOT NULL
        );
        "#,
    )
    .map_err(|e| format!("init custom_provider_state: {}", e))?;
    Ok(conn)
}

pub fn load_state_from_db(provider: &CustomProvider, app: &AppHandle) -> Result<(), String> {
    let conn = open_db(app)?;
    let mut stmt = conn
        .prepare("SELECT target_provider_id, supported_models_json FROM custom_provider_state WHERE id = 1")
        .map_err(|e| format!("prepare: {}", e))?;
    let row = stmt.query_row([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    });
    match row {
        Ok((target, models_json)) => {
            let map: HashMap<String, Vec<String>> =
                serde_json::from_str(&models_json).unwrap_or_default();
            let mut state = provider.state.write().unwrap();
            if ALLOWED_TARGETS.iter().any(|t| *t == target.as_str()) {
                state.target_provider_id = target;
            }
            for (k, v) in map {
                if ALLOWED_TARGETS.iter().any(|t| *t == k.as_str()) {
                    state.supported_models_per_target.insert(k, v);
                }
            }
            Ok(())
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(()),
        Err(e) => Err(format!("query custom_provider_state: {}", e)),
    }
}

pub fn persist_state_to_db(provider: &CustomProvider, app: &AppHandle) -> Result<(), String> {
    let (target, json) = {
        let state = provider.state.read().unwrap();
        let json = serde_json::to_string(&state.supported_models_per_target)
            .map_err(|e| format!("serialize: {}", e))?;
        (state.target_provider_id.clone(), json)
    };
    let conn = open_db(app)?;
    conn.execute(
        r#"
        INSERT INTO custom_provider_state (id, target_provider_id, supported_models_json)
        VALUES (1, ?1, ?2)
        ON CONFLICT(id) DO UPDATE SET
          target_provider_id = excluded.target_provider_id,
          supported_models_json = excluded.supported_models_json
        "#,
        params![target, json],
    )
    .map_err(|e| format!("upsert: {}", e))?;
    Ok(())
}

// --- Tauri commands ---

#[tauri::command]
pub async fn configure_custom_provider(
    app: AppHandle,
    target_provider_id: String,
) -> Result<(), String> {
    info!("configure_custom_provider: {}", target_provider_id);
    let provider = custom_provider_handle();
    provider
        .configure(&target_provider_id)
        .map_err(|e| e.to_string())?;
    persist_state_to_db(&provider, &app)?;
    Ok(())
}

#[tauri::command]
pub async fn get_custom_provider_config() -> Result<CustomProviderConfig, String> {
    Ok(custom_provider_handle().snapshot_config())
}

#[tauri::command]
pub async fn list_custom_provider_targets() -> Result<Vec<String>, String> {
    Ok(ALLOWED_TARGETS.iter().map(|s| s.to_string()).collect())
}

#[tauri::command]
pub async fn set_custom_supported_models(
    app: AppHandle,
    target_provider_id: String,
    models: Vec<String>,
) -> Result<CustomProviderConfig, String> {
    let provider = custom_provider_handle();
    provider
        .set_supported_models(&target_provider_id, models)
        .map_err(|e| e.to_string())?;
    persist_state_to_db(&provider, &app)?;
    Ok(provider.snapshot_config())
}
