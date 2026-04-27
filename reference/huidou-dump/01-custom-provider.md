# 灰豆 — 自定义模型供应商（Custom Provider）功能解析

> 来源：反编译 `huidou-ai-comics.exe` v(unknown)，对照当前项目仓库。
> 文件：`sources/tauri.localhost/assets/index-CMG-ejQn.js`

## 1. 功能概述

灰豆在原项目 5 个内置 provider（`doubao`, `gemini`, `openai`, `kie`, `fal`）之外，
新增了 **"custom" 第六个 provider**——它本身不是真正的供应商，而是一个**可指向上述任一内置 provider 的代理槽位**：

- 用户在设置里选 `custom` provider
- 选一个 **target**（gemini / openai / doubao / kie / fal）
- 配一份 API key + 自定义模型清单
- 之后用 `custom` provider 生图时，请求按 target 的协议格式发出

适用场景：用户想用 **Gemini 协议但走某个第三方中转站**，或维护多套 key/模型清单不想跟正式槽位混。

## 2. 后端命令签名（4 个新命令）

```rust
// 设置当前 custom 指向哪个内置 provider
#[tauri::command]
async fn configure_custom_provider(target_provider_id: String) -> Result<(), String>;

// 读取当前配置
#[tauri::command]
async fn get_custom_provider_config() -> Result<CustomProviderConfig, String>;

#[derive(Serialize)]
struct CustomProviderConfig {
    target_provider_id: String,        // "gemini" | "openai" | "doubao" | "kie" | "fal"
    supported_models: Vec<String>,     // e.g. ["nano-banana-2", "nano-banana-pro"]
}

// 列出可选 target（即内置 provider id 列表）
#[tauri::command]
async fn list_custom_provider_targets() -> Result<Vec<String>, String>;

// 工厂重置（清所有配置/项目/缓存）
#[tauri::command]
async fn factory_reset() -> Result<(), String>;
```

**Web fallback**（非 Tauri 环境直接返回常量，无需后端）：

```ts
const FALLBACK_TARGETS = ["doubao", "gemini", "openai", "kie", "fal"];
const FALLBACK_CONFIG = {
  target_provider_id: "gemini",
  supported_models: ["nano-banana-2", "nano-banana-pro"],
};
```

## 3. 前端三个核心函数（混淆后变量名 → 推测原名）

```ts
// Xv → configureCustomProvider
async function configureCustomProvider(targetProviderId: string) {
  console.info("[AI] configure_custom_provider", { targetProviderId });
  if (!isTauri()) return;
  return await invoke("configure_custom_provider", { targetProviderId });
}

// qv → getCustomProviderConfig
async function getCustomProviderConfig(): Promise<CustomProviderConfig> {
  if (isTauri()) return await invoke("get_custom_provider_config");
  return {
    target_provider_id: "gemini",
    supported_models: ["nano-banana-2", "nano-banana-pro"],
  };
}

// eq → listCustomProviderTargets
async function listCustomProviderTargets(): Promise<string[]> {
  if (isTauri()) return await invoke("list_custom_provider_targets");
  return ["doubao", "gemini", "openai", "kie", "fal"];
}
```

## 4. Settings Store 扩展（Zustand persisted）

新字段（在原 `settings-storage` v11 中追加；版本号 11，含 migrate）：

```ts
{
  // 旧版仅有的：apiKeys, customApiBaseUrl, customApiModel ...

  // 新增（custom provider 子系统）
  customTargetProviderId: string;        // default "gemini"
  customSupportedModels: string[];       // default ["nano-banana-2","nano-banana-pro"]
  customProviderApiKeys: Record<string, string>;  // 按 targetId 分别存 key

  // setters
  setCustomTargetProviderId(id: string): void;        // .trim().toLowerCase()
  setCustomSupportedModels(models: string[]): void;   // 去重 + 取最后一段（去掉 vendor/ 前缀）
  setCustomProviderApiKey(targetId: string, key: string): void;
}
```

**模型清单规范化逻辑**（`setCustomSupportedModels`）：

```ts
Array.from(new Set(
  list.map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.split("/").pop() ?? s)   // "google/nano-banana-pro" → "nano-banana-pro"
))
```

**Migrate 函数**（v11）做的事：

- 把旧 `apiKeys` 透传，并 `customProviderApiKeys` 按 trim+lowercase 重新规范
- 兜底 `customTargetProviderId = "gemini"`、`customSupportedModels` 为空时填默认 2 个模型
- 旧版可能只有单字段 `apiKey`，迁移到 `apiKeys.ppio`

## 5. 启动期初始化流程（`App` 顶层 useEffect）

```ts
useEffect(() => {
  (async () => {
    const { customTargetProviderId, customProviderApiKeys,
            setCustomSupportedModels, setCustomTargetProviderId } = settings.getState();
    const targetId = (customTargetProviderId || "gemini").trim().toLowerCase();

    // 1) 通知后端：custom 当前指向哪个 target
    await configureCustomProvider(targetId);

    // 2) 把对应的 key 同步给后端（注意：set_api_key 的 provider 名固定写 "custom"）
    const apiKey = customProviderApiKeys?.[targetId];
    if (apiKey && apiKey.trim().length > 0) {
      await setApiKey("custom", apiKey);
    }

    // 3) 拉回后端权威配置，回写前端
    const cfg = await getCustomProviderConfig();
    if (cfg.target_provider_id) setCustomTargetProviderId(cfg.target_provider_id);
    setCustomSupportedModels(cfg.supported_models ?? []);
  })();
}, []);
```

→ **后端持有 source-of-truth**，前端启动时双向同步一次。

## 6. 设置面板交互

打开设置 → API Key 区，"custom" 项展开如下：

```
┌─ Custom ─────────────────────────────────┐
│ Provider:   [ gemini  ▼ ]   ← 切换 target  │
│ API Key:    [********]                   │
│ Supported Models (textarea, 一行一个):     │
│   nano-banana-2                          │
│   nano-banana-pro                        │
└──────────────────────────────────────────┘
```

**切 target 时的副作用**（精简版伪代码）：

```ts
async onTargetChange(newTarget) {
  setCustomTargetProviderId(newTarget);
  // 切到新 target 已存的 key（按 target 分别保存）
  const stored = settings.getState().customProviderApiKeys?.[newTarget] ?? "";
  setLocalApiKeyDraft({ ...prev, custom: stored });
  setCustomProviderApiKey(newTarget, stored);

  await configureCustomProvider(newTarget);
  const cfg = await getCustomProviderConfig();
  setCustomSupportedModelsTextarea(cfg.supported_models.join("\n"));
}
```

**保存按钮**：

```ts
async onSave() {
  for (const p of allProviders()) {
    const key = drafts[p.id] ?? "";
    setProviderApiKey(p.id, key);          // 写入 store
    await setApiKey(p.id, key);             // 同步后端
  }
  // custom 单独再走一遍 configure
  const target = customTargetDraft.trim().toLowerCase();
  setCustomTargetProviderId(target);
  await configureCustomProvider(target);
  const cfg = await getCustomProviderConfig();
  setCustomSupportedModels(cfg.supported_models ?? []);
}
```

## 7. 后端实现要点（你方实现指南）

### 7.1 状态存储

后端需维护一个全局可变状态（推荐 `Mutex<CustomProviderState>` 放进 `tauri::State`），并持久化到 SQLite 的 `settings` 表（或单独的 `custom_provider` 单行表）：

```rust
struct CustomProviderState {
    target_provider_id: String,           // 经校验，必须 ∈ ALLOWED_TARGETS
    supported_models_per_target: HashMap<String, Vec<String>>, // 按 target 维护各自模型清单
}

const ALLOWED_TARGETS: &[&str] = &["doubao", "gemini", "openai", "kie", "fal"];
```

### 7.2 `configure_custom_provider`

- 校验 `target_provider_id` 在白名单内
- 写入持久化
- **关键**：要让 `generate_image` 命令在收到 `provider="custom"` 时，按 `target_provider_id` 转发到对应内置 provider 的请求构造器
- 切换 target 时如果该 target 没有"该用户配的模型清单"，回退到默认 `["nano-banana-2","nano-banana-pro"]`

### 7.3 `get_custom_provider_config`

返回当前 target + 当前 target 对应的 supported_models。

### 7.4 `list_custom_provider_targets`

返回 ALLOWED_TARGETS 拷贝。

### 7.5 与 `set_api_key("custom", key)` 的协作

- 前端在切 target 时会**用同一个 provider 名 `"custom"`** 调用 `set_api_key`
- 后端要把 key 存在 `target_provider_id` 维度下（即"切了 target，自动切到对应 key"）。因此 `custom` 槽位的 key 在后端实际是 `Map<target_id, ApiKey>`，每次 `configure_custom_provider` 后激活的就是 `map[target_provider_id]`。

### 7.6 调用链总览

```
[UI] 选 target → setCustomTargetProviderId
              → configure_custom_provider(target)
              → set_api_key("custom", keyForTarget)
[UI] 点生成 → generate_image({ provider:"custom", model, prompt, ... })
[BE] generate_image 看到 "custom" → 读 state.target_provider_id
                                 → 用对应 provider 的请求构造器
                                 → 发请求
```

## 8. 实现 Checklist（落到当前项目）

- [ ] `src-tauri/src/commands/custom_provider.rs`：4 个新命令
- [ ] `src-tauri/src/state.rs`：`CustomProviderState` + `Mutex` 注入
- [ ] `src-tauri/src/lib.rs`：`.manage(state)` + `.invoke_handler` 注册
- [ ] SQLite：表 `custom_provider_state(id INTEGER PK CHECK(id=1), target TEXT, models_json TEXT, keys_json TEXT)`
- [ ] `src/commands/customProvider.ts`：3 个 invoke wrapper（含 web fallback）
- [ ] `src/stores/settingsStore.ts`：新增 3 个字段 + setter + migrate v→v+1
- [ ] `src/App.tsx`：启动 useEffect 同步逻辑
- [ ] `src/features/settings/SettingsPanel.tsx`（或同等位置）：custom 子面板（target 下拉 + key + models textarea）
- [ ] 模型注册表：`models/registry.ts` 增加 `custom` provider，其 `resolveRequest` 根据 `target_provider_id` 委托给对应内置 provider
- [ ] i18n：`settings.customProvider.*` 一组 key，zh+en 同步

## 9. 注意点 / 坑

1. **`set_api_key` 用 provider="custom"** 不是用真实 target id；后端必须自己映射到当前 target 的 key 槽。
2. **模型 ID 解析**：用户粘贴 `google/gemini-2.5-flash-image-preview` 这种完整路径时，前端会保留 `gemini-2.5-flash-image-preview`。后端发请求时如目标 provider 需要完整路径，要在构造请求时再补回 vendor 前缀（取决于具体 target SDK）。
3. **`configure_custom_provider` 不带 key**：key 走单独 `set_api_key`。两步要原子化或前端按顺序串行（当前实现是串行）。
4. **i18next 的 11 个事件**（`added/removed/loaded/...`）不是 Tauri 事件，是 i18next 内部，无需关心。
5. **factory_reset** 行为：清 SQLite 全表 + 清前端 localStorage（前端调用前应弹确认，并在调用后 `window.location.reload()`）。
