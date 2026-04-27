# 灰豆 — 生成任务调度（submit + poll 模式）解析

> 来源：反编译 `huidou-ai-comics.exe`
> 涉及命令：`generate_image`（保留）、`submit_generate_image_job`（新）、`get_generate_image_job`（新）

## 1. 设计动机：从同步阻塞到任务化

当前项目只有一个 `generate_image` 命令——**同步阻塞**等结果。问题：

- 一张大图 30~120s 起步，期间任意网络抖动/重启 → 任务全丢
- 不支持后台进行，UI 必须保持挂起
- 不能跨节点并发管理（每个节点都各自 await）

灰豆改成 **任务化（job pattern）**：

- `submit_generate_image_job(request)` → **立即返回** `jobId`（任务进入后端队列）
- 前端把 `jobId` 存入节点 state，**写盘持久化**
- 前端独立轮询协程 `setInterval` `get_generate_image_job(jobId)`，按状态推进
- 用户重启 app 后，未完成的 job 会被 **自动恢复轮询**（因为 jobId 在节点里）

`generate_image`（同步版）仍然保留作为兼容/简单路径。

## 2. 命令签名

```rust
// 同步版（兼容路径，简单生图）
#[tauri::command]
async fn generate_image(request: GenerateImageRequest) -> Result<String /* image source */, String>;

// 异步版（推荐路径）
#[tauri::command]
async fn submit_generate_image_job(request: GenerateImageRequest) -> Result<String /* jobId */, String>;

#[tauri::command]
async fn get_generate_image_job(job_id: String) -> Result<JobStatusPayload, String>;
```

### 2.1 `GenerateImageRequest`

```rust
struct GenerateImageRequest {
    prompt: String,
    model: String,                       // e.g. "kie/...", "fal/...", "newapi/...", "custom/..."
    size: String,                        // e.g. "1024x1024" | "1024x1536"
    aspect_ratio: String,                // "1:1" | "16:9" | "free"
    reference_images: Vec<String>,       // base64 dataURLs（前端已规范化）
    extra_params: serde_json::Value,     // provider-specific 自由字段
}
```

### 2.2 `JobStatusPayload`

```rust
struct JobStatusPayload {
    status: JobStatus,                   // "queued" | "running" | "succeeded" | "failed" | "not_found"
    result: Option<String>,              // succeeded 时的 image source
    error: Option<String>,               // failed 时的错误信息（前端会作为 details 展示）
    // 可选：progress, queue_position, started_at, ...
}

enum JobStatus { Queued, Running, Succeeded, Failed, NotFound }
```

**5 种 status 的前端处理**：

| status | 前端动作 |
|---|---|
| `queued` / `running` | 等 1400ms 继续轮询 |
| `succeeded` | 写入节点 imageUrl/previewImageUrl，清 isGenerating，**break 退出轮询** |
| `failed` | 弹错误提示（仅当 sessionId 匹配当前会话时），清 job 状态 |
| `not_found` | 当作 failed 处理，error 信息为 `"generation job not found"` |

## 3. 前端 wrapper

```ts
// 同步版
async function generateImage(req: GenerateImageRequest): Promise<string> {
  const result = await invoke("generate_image", { request: req });
  if (typeof result !== "string") throw new Error("non-string payload");
  if (!result.trim()) throw new Error("empty image source");
  return result.trim();
}

// 异步提交
async function submitGenerateImageJob(req: GenerateImageRequest): Promise<string /* jobId */> {
  const jobId = await invoke("submit_generate_image_job", { request: req });
  if (typeof jobId !== "string" || !jobId.trim())
    throw new Error("submit_generate_image_job returned invalid job id");
  return jobId.trim();
}

// 查询状态
async function getGenerateImageJob(jobId: string): Promise<JobStatusPayload> {
  const r = await invoke("get_generate_image_job", { jobId });
  if (!r || typeof r !== "object" || typeof r.status !== "string")
    throw new Error("get_generate_image_job returned invalid payload");
  return r;
}
```

## 4. 节点 state 扩展（持久化字段）

每个 ExportImageNode（生成节点）新增：

```ts
type GenerationFields = {
  isGenerating: boolean;
  generationStartedAt: number | null;             // Date.now()
  generationDurationMs?: number;                  // 预期耗时（用于进度条）
  generationJobId: string | null;                 // ★ 关键持久化字段
  generationProviderId: string | null;            // 用于轮询前重新 set_api_key
  generationClientSessionId: string | null;       // 当前 app 启动会话 id (I3)
  generationStoryboardMetadata?: {                // 若是分镜任务，结果出来后嵌入元数据
    gridRows: number;
    gridCols: number;
    frameNotes: string[];
  };
  generationDebugContext?: {                      // 失败诊断用
    sourceType: "imageEdit" | "storyboard" | ...;
    providerId: string;
    requestModel: string;
    requestSize: string;
    requestAspectRatio: string;
    prompt: string;
    extraParams: any;
    referenceImageCount: number;
    referenceImagePlaceholders: string[];
    appVersion: string;
    osName: string;
    osVersion: string;
    osBuild: string;
    userAgent: string;
  };
  generationError: string | null;
  generationErrorDetails: string | null;
};
```

**`generationClientSessionId`** 的作用：

```ts
const I3 = `runtime-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
```

每次 app 启动生成一个新 session id。**只有 session 匹配的失败才弹错误提示**——因为重启后恢复的旧 job 失败了，用户不应突然看到很久之前任务的报错弹窗。

## 5. 轮询协程（核心逻辑）

```ts
const POLL_INTERVAL_MS = 1400;

useEffect(() => {
  const generatingNodes = nodes.filter(n =>
    n.type === "exportImage" &&
    n.data.isGenerating === true &&
    typeof n.data.generationJobId === "string" &&
    n.data.generationJobId.length > 0
  );

  for (const node of generatingNodes) {
    if (activePolls.current.has(node.id)) continue;       // 已经在轮询
    activePolls.current.add(node.id);

    (async () => {
      while (true) {
        // 重新读 state（节点可能已被删除/取消）
        const cur = useStore.getState().nodes.find(n => n.id === node.id);
        if (!cur) break;
        const { generationJobId: jobId, isGenerating, generationProviderId } = cur.data;
        if (!jobId || !isGenerating) break;

        // 轮询前确保 api key 已设置（重启后必须重新 set_api_key）
        if (generationProviderId) {
          const key = apiKeys[generationProviderId] ?? "";
          if (key) await setApiKey(generationProviderId, key).catch(console.warn);
        }

        const status = await getGenerateImageJob(jobId).catch(() => null);
        if (!status) { await sleep(POLL_INTERVAL_MS); continue; }

        if (status.status === "queued" || status.status === "running") {
          await sleep(POLL_INTERVAL_MS);
          continue;
        }

        if (status.status === "succeeded" && status.result?.trim()) {
          const prepared = await prepareNodeImageSource(status.result);   // 落盘 + 生成 preview
          // 若是分镜结果，嵌入 metadata
          let finalImageUrl = prepared.imageUrl;
          const meta = cur.data.generationStoryboardMetadata;
          if (meta && Number.isFinite(meta.gridRows) && Number.isFinite(meta.gridCols) && Array.isArray(meta.frameNotes)) {
            finalImageUrl = await embedStoryboardImageMetadata(prepared.imageUrl, meta).catch(() => prepared.imageUrl);
          }
          const finalPreview = prepared.previewImageUrl === prepared.imageUrl ? finalImageUrl : prepared.previewImageUrl;

          updateNode(node.id, {
            imageUrl: finalImageUrl,
            previewImageUrl: finalPreview,
            aspectRatio: prepared.aspectRatio,
            isGenerating: false,
            generationStartedAt: null,
            generationJobId: null,
            generationProviderId: null,
            generationClientSessionId: null,
            generationStoryboardMetadata: undefined,
            generationError: null,
            generationErrorDetails: null,
            generationDebugContext: undefined,
          });
          break;
        }

        // failed / not_found
        const errMsg = status.error
          ?? (status.status === "not_found" ? "generation job not found" : "generation failed");
        if (cur.data.generationClientSessionId === CURRENT_SESSION_ID) {
          // 仅当前会话才弹窗
          showErrorToast(errMsg, t("common.error"), status.error, buildDiagContext(...));
        }
        updateNode(node.id, { isGenerating: false, generationJobId: null, ... });
        break;
      }
      activePolls.current.delete(node.id);
    })();
  }
}, [nodes]);
```

**6 个关键设计点**：

1. **每节点一个独立循环**：`activePolls` Set 防止同节点开多个轮询
2. **每轮重读 state**：节点可能被用户中途删除/取消，必须及时退出
3. **轮询前重新 set_api_key**：app 重启后后端 key 状态丢失，每次轮询前补一次（成本低）
4. **session 匹配过滤**：失败弹窗只在当前会话弹，避免重启后被旧任务的弹窗打扰
5. **结果走 `prepare_node_image_source`**：API 返回的 image source 要再走一次规范化生成 preview
6. **分镜任务结果嵌入元数据**：`embedStoryboardImageMetadata` 失败也不阻塞，降级用原图

## 6. 提交流程

```ts
async function startGeneration(node) {
  // 1) 改 UI 状态
  updateNode(node.id, {
    isGenerating: true,
    generationStartedAt: Date.now(),
    generationDurationMs: model.expectedDurationMs ?? 60000,
    resultKind: "generic",
    displayName: deriveTitle(prompt),
  });

  try {
    // 2) 设 key
    await setApiKey(provider.providerId, apiKey);

    // 3) 提交
    const jobId = await submitGenerateImageJob({
      prompt,
      model: model.requestModel,           // e.g. "kie/foo", "custom/bar"
      size: ...,
      aspectRatio: ...,
      referenceImages: [...],
      extraParams: { ... },
    });

    // 4) 写 job 元数据到节点（持久化触发）
    updateNode(node.id, {
      generationJobId: jobId,
      generationSourceType: "imageEdit",
      generationProviderId: provider.providerId,
      generationClientSessionId: CURRENT_SESSION_ID,
      generationDebugContext: { ... },
    });
    // ↑ 提交完成，后续由轮询协程接管
  } catch (err) {
    // 同步阶段失败（比如网络断、参数非法）
    updateNode(node.id, { isGenerating: false, generationError: err.message });
  }
}
```

## 7. 后端实现要点（Rust）

### 7.1 内存队列（推荐 v1 方案）

```rust
type JobMap = HashMap<String /* jobId */, Arc<Mutex<JobEntry>>>;

struct JobEntry {
    status: JobStatus,
    request: GenerateImageRequest,
    result: Option<String>,
    error: Option<String>,
    created_at: Instant,
}

struct JobRegistry {
    jobs: Arc<Mutex<JobMap>>,
}
```

### 7.2 提交命令

```rust
#[tauri::command]
async fn submit_generate_image_job(
    request: GenerateImageRequest,
    app: AppHandle,
    registry: State<'_, JobRegistry>,
) -> Result<String, String> {
    let job_id = Uuid::new_v4().to_string();
    let entry = Arc::new(Mutex::new(JobEntry {
        status: JobStatus::Queued,
        request: request.clone(),
        result: None,
        error: None,
        created_at: Instant::now(),
    }));
    registry.jobs.lock().unwrap().insert(job_id.clone(), entry.clone());

    // 后台执行
    tokio::spawn(async move {
        {
            let mut e = entry.lock().unwrap();
            e.status = JobStatus::Running;
        }
        let result = run_generation(&request, &app).await;
        let mut e = entry.lock().unwrap();
        match result {
            Ok(image_source) => { e.status = JobStatus::Succeeded; e.result = Some(image_source); }
            Err(err)         => { e.status = JobStatus::Failed; e.error = Some(err.to_string()); }
        }
    });

    Ok(job_id)
}
```

### 7.3 查询命令

```rust
#[tauri::command]
async fn get_generate_image_job(
    job_id: String,
    registry: State<'_, JobRegistry>,
) -> Result<JobStatusPayload, String> {
    let map = registry.jobs.lock().unwrap();
    match map.get(&job_id) {
        Some(entry) => {
            let e = entry.lock().unwrap();
            Ok(JobStatusPayload {
                status: e.status,
                result: e.result.clone(),
                error: e.error.clone(),
            })
        }
        None => Ok(JobStatusPayload {
            status: JobStatus::NotFound,
            result: None,
            error: None,
        }),
    }
}
```

### 7.4 `run_generation` 路由（按 model 前缀）

```rust
async fn run_generation(req: &GenerateImageRequest, app: &AppHandle) -> Result<String> {
    let provider = match parse_provider_prefix(&req.model) {
        "kie/"    => ProviderImpl::Kie,
        "fal/"    => ProviderImpl::Fal,
        "newapi/" | "custom/" => ProviderImpl::NewApi,   // 走 OpenAI-style 中转
        "token/"  => ProviderImpl::TokenBased,
        _ if req.model.starts_with("doubao") => ProviderImpl::Doubao,
        _ if req.model.starts_with("gemini") => ProviderImpl::Gemini,
        _ if req.model.starts_with("openai") => ProviderImpl::OpenAI,
        _ => return Err("unknown model"),
    };
    provider.generate(req).await
}
```

### 7.5 `not_found` 的语义

job 不在 map 里时返回 `NotFound`，**不要返回错误**。这种情况发生在：
- app 重启后内存丢失（v1 内存队列必然如此）
- jobId 错误（理论不应发生）

→ 前端拿到 `not_found` 当 failed 处理。**这个语义意味着 v1 不需要持久化 job 队列**——重启后旧 job 自动 fail，用户重新发起即可。

### 7.6 v2 进阶：持久化 job

如果想做到"重启后 job 继续"，需要：
- SQLite 表 `generate_jobs(id, request_json, status, result, error, created_at)`
- 启动时把 `Queued/Running` 的 job 重建为 `Failed`（无法判断是否真在跑），或重建为 `Queued` 重新执行
- 推荐 v1 不做，让前端 session 过滤机制兜底

## 8. 前端引用图片压缩（关键性能优化）

`y5(t)` 函数（按 model 前缀决定如何处理 `referenceImages`）：

```ts
async function preprocessReferenceImages(req) {
  const isKie = req.model.startsWith("kie/");
  const isFal = req.model.startsWith("fal/");
  const isToken = req.model.startsWith("token/");
  const isNewApi = req.model.startsWith("newapi/") || req.model.startsWith("custom/");

  return Promise.all(req.referenceImages.map(async (src) => {
    if (isToken) return await compressTo640(src);    // ★ token/ 模型：压缩到 ≤640px JPEG q=0.6
    if (isKie || isFal || isNewApi) return await toBase64DataUrl(src);  // 仅转 dataURL，不压缩
    return await toCustomFormat(src);                // 其他 provider：可能转特定格式
  }));
}
```

`compressTo640` 关键参数：
- 上限：`max(width, height) ≤ 640`
- 输出：`canvas.toDataURL("image/jpeg", 0.6)`
- 加 base64 校验（`/^[A-Za-z0-9+/]*={0,2}$/`），失败时清洗空白字符再重试

→ **token/ 模型**（按 token 计费的中转）走压缩通道节省成本；其他 provider 直传。

## 9. 实现 Checklist

- [ ] `src-tauri/src/jobs/registry.rs`：`JobRegistry` + `JobEntry` 内存队列
- [ ] `src-tauri/src/jobs/runner.rs`：`run_generation` 路由 + provider 实现
- [ ] `src-tauri/src/commands/generate.rs`：3 个命令（generate_image / submit / get）
- [ ] `src-tauri/src/lib.rs`：`.manage(JobRegistry::default())`
- [ ] `src/commands/generation.ts`：3 个 wrapper
- [ ] `src/features/canvas/domain/canvasNodes.ts`：ExportImageNode 增 12 个 generation 字段
- [ ] `src/features/canvas/application/generationPoller.ts`：全局轮询协程 hook（基于 nodes 列表）
- [ ] `src/App.tsx`：挂载 generationPoller
- [ ] `src/features/canvas/nodes/ExportImageNode.tsx`：进度条 UI（基于 generationStartedAt / generationDurationMs）
- [ ] `src/lib/imageCompress.ts`：`compressTo640` 工具
- [ ] `src/features/canvas/application/aiGateway.ts`：`preprocessReferenceImages` + 4 个 provider 前缀分支
- [ ] 持久化：generation 字段必须进 `nodes_json`（自动包含），但 `generationDebugContext` 可考虑剔除以减小快照体积
- [ ] CURRENT_SESSION_ID 常量：`runtime-${Date.now()}-${random}`，在 main 模块顶层定义

## 10. 注意点 / 坑

1. **CURRENT_SESSION_ID 不能持久化**——每次启动新生成。否则失败弹窗的"会话过滤"机制就失效了。
2. **轮询间隔 1400ms**：实测取值，平衡用户感知速度和后端压力。可做成可配置。
3. **轮询协程是 fire-and-forget**：错误不能让循环死掉，所有 IO 都要 `.catch(() => null)` 兜底。
4. **节点状态依赖**：循环里**每轮重读 state**，不要 closure 捕获（节点可能被删/字段被改）。
5. **set_api_key 在轮询前调用**：是因为后端 key 是进程内状态。如果做了**持久化 key 到磁盘**就不需要每轮调一次。
6. **succeeded 后清空字段**：`generationJobId`、`generationProviderId`、`generationClientSessionId`、`generationStoryboardMetadata`、`generationDebugContext` 都要清，否则节点再次被打开/恢复时会误判为"还在生成"。
7. **`generationDebugContext` 体积**：包含 OS/UA/参数等，大量节点时累计可观，建议失败提示完成后立即清。
8. **同步版 `generate_image` 的去留**：留作"快速生成预览"或不愿意做轮询的简单场景；新功能一律走 job 模式。
