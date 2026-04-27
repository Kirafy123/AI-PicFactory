# 灰豆 — 图片处理流水线（Image Pipeline）解析

> 来源：反编译 `huidou-ai-comics.exe`
> 涉及命令：11 个图片相关 Tauri 命令

## 1. 命令总览（命名收敛）

灰豆把所有图片相关命令命名统一为 `*_image_source` / `*_storyboard_*`。**核心抽象 = "image source"**：一个统一的图片引用（可能是 dataURL / app:/ 协议路径 / 文件路径），由后端负责解析与持久化。

| 命令 | 入参 | 返回 | 用途 |
|---|---|---|---|
| `prepare_node_image_source` | `{ source, maxPreviewDimension=512 }` | `{ imageUrl, previewImageUrl, width, height, ... }` | 上传/接收图片后做规范化 + 生成预览 |
| `prepare_node_image_binary` | `{ bytes: number[], extension, maxPreviewDimension=512 }` | 同上 | 直接从二进制（剪贴板/文件读）规范化 |
| `persist_image_source` | `{ source }` | `imagePath` | dataURL → 落盘成 app 资源 |
| `crop_image_source` | `{ payload: CropPayload }` | `imagePath` | 按矩形裁剪 |
| `split_image_source` | `{ source, rows, cols, lineThickness=0 }` | `imagePath[]` | 按网格切分（含分割线宽度） |
| `merge_storyboard_images` | `{ payload: MergePayload }` | `MergeResult` | 多图合成分镜大图（含文字注解） |
| `read_storyboard_image_metadata` | `{ source }` | `StoryboardMeta \| null` | 读取嵌入的分镜元数据 |
| `embed_storyboard_image_metadata` | `{ source, metadata }` | `imagePath` | 把网格信息+frameNotes 嵌入 PNG |
| `save_image_source_to_path` | `{ source, targetPath }` | `void` | 另存到指定文件 |
| `save_image_source_to_directory` | `{ source, targetDir, suggestedFileName }` | `savedPath` | 另存到目录（自动起名） |
| `copy_image_source_to_clipboard` | `{ source }` | `void` | 复制到系统剪贴板 |

## 2. 详细签名（前端调用层）

```ts
// 准备节点图（最常用入口：上传后调用）
async function prepareNodeImageSource(source: string, maxPreviewDimension = 512)
  : Promise<NodeImagePayload>;

async function prepareNodeImageBinary(
  bytes: Uint8Array,           // 注：发送时被 Array.from() 转成 number[]
  extension: string,           // "png" | "jpg" | "jpeg" | "webp" | ...
  maxPreviewDimension = 512,
): Promise<NodeImagePayload>;

// 工具处理
async function cropImageSource(payload: {
  source: string;
  aspectRatio: string;        // "1:1" | "16:9" | "free" | ...
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}): Promise<string /* imagePath */>;

async function splitImageSource(
  source: string,
  rows: number,
  cols: number,
  lineThickness = 0,          // 像素，分割线宽度（实际上是间隙）
): Promise<string[]>;

// 分镜合成
async function mergeStoryboardImages(payload: MergePayload): Promise<MergeResult>;

// 元数据
async function readStoryboardImageMetadata(source: string)
  : Promise<{ gridRows: number; gridCols: number; frameNotes: string[] } | null>;
async function embedStoryboardImageMetadata(
  source: string,
  metadata: { gridRows: number; gridCols: number; frameNotes: string[] },
): Promise<string>;

// 持久化 / 输出
async function persistImageSource(source: string): Promise<string>;
async function saveImageSourceToPath(source: string, targetPath: string): Promise<void>;
async function saveImageSourceToDirectory(
  source: string, targetDir: string, suggestedFileName: string,
): Promise<string>;
async function copyImageSourceToClipboard(source: string): Promise<void>;
```

## 3. 关键 Payload 结构

### 3.1 `MergePayload`（分镜合成）

```ts
type MergePayload = {
  frameSources: string[];          // 每格图片的 source（顺序按行优先 row-major）
  rows: number;
  cols: number;
  cellGap: number;                 // 格间间隙，px
  outerPadding: number;            // 外边距，px
  noteHeight: number;              // 文字注释占用高度（仅 notePlacement="bottom" 时有意义）
  fontSize: number;                // px，由 referenceFrameHeight × percent 推导
  backgroundColor: string;         // CSS color
  maxDimension: number;            // 输出最长边上限（缩放）
  showFrameIndex: boolean;         // 是否绘制序号 "01"...
  showFrameNote: boolean;          // 是否绘制注释文字
  notePlacement: "bottom" | "overlay";  // 注释位置
  imageFit: "cover" | "contain";   // 单格内的填充模式
  frameIndexPrefix: string;        // 序号前缀（如 "#" / "Frame "）
  textColor: string;
  frameNotes: string[];            // 长度 = rows*cols
};

type MergeResult = {
  imagePath: string;               // 合成后图片路径
  canvasWidth: number;
  canvasHeight: number;
  textOverlayApplied: boolean;     // 后端是否已绘制文字（false 时前端会兜底再画一层）
};
```

**关键发现**：后端 *尝试* 自己绘制文字，但若 `textOverlayApplied=false`，前端会调用 `o$(...)` 在合成图上**再叠一层文字**作为 fallback。意味着后端 Rust 端文字渲染是可选实现。

### 3.2 `NodeImagePayload`（推测结构，需要从 `prepare_*` 调用站点二次确认）

```ts
type NodeImagePayload = {
  imageUrl: string;            // 原图 source（可能是 app://path 或 dataURL）
  previewImageUrl: string;     // 预览图 source（边长 ≤ maxPreviewDimension）
  width: number;
  height: number;
  // 可能还有 mimeType / fileSize 等
};
```

### 3.3 `StoryboardMeta`（嵌入 PNG 的元数据）

```ts
type StoryboardMeta = {
  gridRows: number;
  gridCols: number;
  frameNotes: string[];        // 每格的备注文字
};
```

实际嵌入方式：通过 PNG `tEXt` / `iTXt` 块（推测，需 Rust 端用 `png` crate 写入自定义 chunk，建议 keyword `Storyboard-Copilot/Meta` 存 JSON）。

## 4. 关键流程

### 4.1 上传图片 → 节点

```
File/Drop/Paste
  ↓
[binary]  → prepareNodeImageBinary(bytes, ext, 512)
[dataURL] → prepareNodeImageSource(dataURL, 512)
  ↓
后端：
  1. 解析二进制
  2. 落盘到 app_data_dir/images/<uuid>.<ext>
  3. 生成预览：等比缩放至最长边 ≤ 512，写入 ..._preview.<ext>
  4. 读宽高
  5. 返回 { imageUrl: app://..., previewImageUrl: app://...preview, width, height }
  ↓
节点持有两个 URL：
  - imageUrl       → 给模型/工具的"原图"
  - previewImageUrl → 给画布渲染的"预览图"（性能关键）
```

### 4.2 裁剪流程（含前端兜底）

```ts
async cropImage(source, params) {
  try {
    return await cropImageSource({ source, aspectRatio, cropX, cropY, cropWidth, cropHeight });
  } catch {
    // 兜底：在 Canvas 里本地裁
    const img = await loadImage(source);
    const canvas = ...;
    canvas.drawImage(...);
    return toDataURL(canvas);
  }
}
```

→ **后端裁剪是首选，失败 fallback 到前端 canvas**。Rust 端可用 `image` crate 实现。

### 4.3 切割流程（分镜拆解）

```ts
const meta = await readStoryboardImageMetadata(source);   // 先看图里有没有元数据
const rows = params.rows ?? meta?.gridRows ?? 3;
const cols = params.cols ?? meta?.gridCols ?? 3;
const lineThicknessPx = await resolveSplitLineThicknessPx(source, rows, cols, percent, fallbackPx);
const frames = await splitImageSource(source, rows, cols, lineThicknessPx);
// frames 长度 = rows*cols，按 row-major 排列
```

**分割线（line thickness）语义**：
- `lineThickness` 是像素值，含义是**网格之间的间隙宽度**（即每个 cell 之间的 gap，会从图片中"扣掉"这部分）
- 前端 `localSplit` 兜底实现确认了这个语义：`l = imgW - (cols-1)*gap`，余量再均分到各 cell
- 上限：单条间隙不能让 cell 宽/高 < 1px，超过就抛 `"分割线过粗，无法完成切割"`
- 算法：`splitIntoSegments(total, n)` 把多余像素均匀分到前 `n%total` 个 cell（保证总和恰好）

```rust
// Rust 端核心
fn split_into_segments(total: u32, n: u32) -> Vec<u32> {
    let base = total / n;
    let extra = total % n;
    (0..n).map(|i| base + if i < extra { 1 } else { 0 }).collect()
}
```

### 4.4 合成流程（rebuild 分镜大图）

```
读 referenceFrameHeight（参考第一张图的 naturalHeight）
  ↓
fontSize = clamp(referenceFrameHeight * percent/100, 10, 240)
noteHeight = (showFrameNote && bottom) ? max(fontSize*1.7, 24) : 0
  ↓
mergeStoryboardImages(payload)
  → 后端按 rows*cols 网格绘制
  → 每格按 imageFit (cover/contain) 适配
  → 缩到 maxDimension
  → 返回 MergeResult
  ↓
若 result.textOverlayApplied == false 且 (showFrameIndex || showFrameNote):
  前端 o$(...) 再叠文字层 → 输出最终路径
```

→ **后端可以只实现"图像拼接，不画字"**（让 `textOverlayApplied=false`），前端会负责文字。这是个**降低 Rust 端复杂度的关键开关**。

### 4.5 元数据嵌入/读取

```
切分前：embedStoryboardImageMetadata(source, { gridRows, gridCols, frameNotes })
       → 在 PNG 中写入 chunk，返回新 imagePath
合并后：merge 输出图自动嵌入元数据（推测，实际由后端处理）
切分时：readStoryboardImageMetadata(source) → 自动恢复 rows/cols/frameNotes
```

→ **作用**：用户保存合成后的分镜大图，下次拖回画布时自动识别原网格结构和注释，"导出再导入"可无损往返。

## 5. 后端实现要点（Rust）

### 5.1 image source 抽象

```rust
enum ImageSource {
    DataUrl(String),           // "data:image/png;base64,..."
    AppPath(String),           // app://localhost/path 或 file://
    AbsolutePath(PathBuf),
}

fn parse_image_source(s: &str) -> Result<ImageSource>;
fn load_image_bytes(src: &ImageSource) -> Result<(Vec<u8>, ImageFormat)>;
fn persist_bytes(bytes: &[u8], ext: &str) -> Result<PathBuf>;  // → app_data_dir/images/<uuid>.<ext>
```

### 5.2 推荐 crates

| 用途 | crate |
|---|---|
| 图片解码/编码 | `image` |
| 缩放（高质量） | `image::imageops::FilterType::Lanczos3` |
| PNG 元数据 chunk | `png` (低层 API) 或自己写 |
| Base64 | `base64` |
| 临时文件 | `tempfile` |
| 剪贴板 | `tauri-plugin-clipboard-manager` 已存在 |

### 5.3 prepareNodeImage* 实现骨架

```rust
#[tauri::command]
async fn prepare_node_image_source(source: String, max_preview_dimension: u32) -> Result<NodeImagePayload, String> {
    let (bytes, fmt) = load_image_bytes(&parse_image_source(&source)?)?;
    let img = image::load_from_memory_with_format(&bytes, fmt)?;
    let (w, h) = (img.width(), img.height());
    let original_path = persist_bytes(&bytes, ext_of(fmt))?;
    let preview_path = make_preview(&img, max_preview_dimension, ext_of(fmt))?;
    Ok(NodeImagePayload {
        image_url: app_url(&original_path),
        preview_image_url: app_url(&preview_path),
        width: w, height: h,
    })
}
```

`make_preview` 关键：

```rust
fn make_preview(img: &DynamicImage, max_dim: u32, ext: &str) -> Result<PathBuf> {
    let (w, h) = (img.width(), img.height());
    let scale = (max_dim as f32 / w.max(h) as f32).min(1.0);
    let nw = (w as f32 * scale) as u32;
    let nh = (h as f32 * scale) as u32;
    let resized = img.resize_exact(nw, nh, FilterType::Lanczos3);
    let path = preview_path_for(...);
    resized.save(&path)?;
    Ok(path)
}
```

### 5.4 split 实现

注意 row-major 顺序、分割线"扣除"语义：

```rust
fn split(img: &DynamicImage, rows: u32, cols: u32, gap: u32) -> Result<Vec<DynamicImage>> {
    let total_w = img.width().saturating_sub(gap * (cols - 1));
    let total_h = img.height().saturating_sub(gap * (rows - 1));
    if total_w < cols || total_h < rows { return Err("分割线过粗，无法完成切割".into()); }
    let widths = split_into_segments(total_w, cols);
    let heights = split_into_segments(total_h, rows);

    let mut xs = Vec::with_capacity(cols as usize);
    let mut x = 0u32;
    for c in 0..cols { xs.push(x); x += widths[c as usize]; if c < cols-1 { x += gap; } }
    let mut ys = Vec::with_capacity(rows as usize);
    let mut y = 0u32;
    for r in 0..rows { ys.push(y); y += heights[r as usize]; if r < rows-1 { y += gap; } }

    let mut out = Vec::with_capacity((rows*cols) as usize);
    for r in 0..rows {
        for c in 0..cols {
            let cell = img.crop_imm(xs[c as usize], ys[r as usize], widths[c as usize], heights[r as usize]);
            out.push(cell);
        }
    }
    Ok(out)
}
```

### 5.5 PNG 元数据嵌入（推荐方案）

在 PNG 写一个 `tEXt` chunk：

```rust
// 用 png crate 重新编码图片，添加自定义 text chunk
let mut encoder = png::Encoder::new(file, w, h);
encoder.add_text_chunk("StoryboardCopilotMeta".into(), serde_json::to_string(&meta)?)?;
let mut writer = encoder.write_header()?;
writer.write_image_data(&rgba_bytes)?;
```

读取时遍历 chunks 找 `StoryboardCopilotMeta` 反序列化即可。

> JPEG 没有标准 text chunk，可考虑写到 EXIF UserComment（用 `kamadak-exif` 读，写需自己拼）；或者 **强制只在 PNG 上支持元数据嵌入**（推荐，灰豆很可能也只支持 PNG）。

### 5.6 merge 实现简化策略

```rust
// 先实现"不画字"版本：只拼图 + 留白
// 返回 textOverlayApplied=false，前端兜底画字
fn merge_no_text(payload: MergePayload) -> Result<MergeResult> {
    // 1) 加载所有 frame，按 imageFit cover/contain 缩放到 cellW × cellH
    // 2) 计算总画布尺寸
    //    canvasW = outerPadding*2 + cols*cellW + (cols-1)*cellGap
    //    canvasH = outerPadding*2 + rows*(cellH + noteHeight) + (rows-1)*cellGap
    // 3) 填背景色，逐格 paste
    // 4) 缩到 maxDimension（保持长宽比）
    // 5) 嵌入 StoryboardMeta(gridRows, gridCols, frameNotes)
    // 6) 落盘，返回 { imagePath, canvasWidth, canvasHeight, textOverlayApplied: false }
}
```

→ 第一版完全可以跳过 Rust 端文字绘制，让前端 `o$()` 接管。后续 v2 再做 Rust 端 text rendering（用 `ab_glyph` + `imageproc::drawing::draw_text_mut`）。

### 5.7 save_to_directory 文件名冲突处理

```rust
fn unique_path(dir: &Path, suggested: &str) -> PathBuf {
    let p = dir.join(suggested);
    if !p.exists() { return p; }
    let stem = ...;
    let ext = ...;
    for i in 1.. {
        let candidate = dir.join(format!("{stem} ({i}).{ext}"));
        if !candidate.exists() { return candidate; }
    }
}
```

## 6. 当前项目命令的迁移映射

| 当前项目命令 | 灰豆等价 | 备注 |
|---|---|---|
| `load_image` | `prepare_node_image_source` | 改名 + 加 `maxPreviewDimension` 参数 + 返回 preview |
| `persist_image_binary` | `prepare_node_image_binary` | 入参从 bytes 改成 `{bytes, extension, maxPreviewDimension}`，返回结构化 payload |
| `split_image` | `split_image_source` | 加 `lineThickness` 参数 |
| `save_image_source_to_downloads` | `save_image_source_to_directory` | 通用化，支持任意目录 |
| `save_image_source_to_app_debug_dir` | ❌ 删除 | 灰豆移除调试用命令 |
| 无 | `crop_image_source` | 新增（替代前端 canvas 裁剪） |
| 无 | `merge_storyboard_images` | 新增 |
| 无 | `read/embed_storyboard_image_metadata` | 新增（PNG 元数据） |
| 无 | `save_image_source_to_path` | 新增（已知绝对路径另存） |
| 无 | `copy_image_source_to_clipboard` | 新增 |

## 7. 前端模块组织（推测目录）

```
src/features/canvas/
├── application/
│   └── toolProcessor.ts           // process(toolKind, source, params): switch crop/annotate/split/storyboard
├── infrastructure/
│   └── imageGateway.ts            // 11 个 invoke wrapper 集中放这里
├── tools/
│   ├── splitGateway.ts            // { split: (src, rows, cols, gap) => splitImageSource(...) }
│   └── ...
└── domain/
    └── canvasNodes.ts             // 节点字段 imageUrl + previewImageUrl 双通道
```

## 8. 实现 Checklist

- [ ] `src-tauri/src/image/source.rs`：`ImageSource` 解析 + `load_bytes` + `persist`
- [ ] `src-tauri/src/image/preview.rs`：`make_preview` （Lanczos3）
- [ ] `src-tauri/src/image/split.rs`：`split` + `split_into_segments`
- [ ] `src-tauri/src/image/crop.rs`：`crop`
- [ ] `src-tauri/src/image/merge.rs`：v1 不画字版本
- [ ] `src-tauri/src/image/metadata.rs`：PNG `tEXt` chunk 读写
- [ ] `src-tauri/src/image/clipboard.rs`：用 `tauri-plugin-clipboard-manager`
- [ ] `src-tauri/src/commands/image.rs`：11 个 #[tauri::command] 入口（薄壳）
- [ ] `src-tauri/src/lib.rs`：注册全部命令
- [ ] `src/commands/imageSource.ts`：11 个前端 invoke wrapper
- [ ] `src/features/canvas/application/toolProcessor.ts`：调用 wrapper，crop 失败兜底 canvas
- [ ] `src/features/canvas/domain/canvasNodes.ts`：`imageUrl` + `previewImageUrl` 双字段（性能要求）
- [ ] 渲染层用 `previewImageUrl`，模型/工具用 `imageUrl`（CLAUDE.md 第 7 节性能规范已有此约束）

## 9. 注意点 / 坑

1. **bytes 序列化代价**：前端 `Array.from(uint8Array)` 把每字节变成 JSON number，**MB 级图片会非常慢**。建议长期改用 base64 dataURL（走 `prepare_node_image_source`）或 Tauri v2 的 IPC 二进制通道。短期保持 `prepare_node_image_binary` 的 number[] 兼容。
2. **`maxPreviewDimension=512`** 是默认，但 `prepareNodeImageSource` 里某调用站点用了 `i`（变量）传入 → 不同节点尺寸可调。
3. **split 的 lineThickness 是"间隙"不是"线"**：不画线条，是从图片中扣掉这部分像素。如果你的产品语义是"在图片上画一条分割线再切"，行为会不一样，要明确。
4. **merge 的 `imageFit`**：`cover` 会裁掉溢出部分，`contain` 会留白（用 backgroundColor 填充）。
5. **元数据嵌入只对 PNG 可靠**：建议合成输出强制用 PNG 编码（即使输入是 JPEG）；导出"成品" save_to_path 时再尊重用户的目标扩展名（重新编码）。
6. **app:// 协议路径**：返回给前端的 `imageUrl` 必须是 `convertFileSrc(absPath, "asset")` 的结果，否则 WebView 加载不到。
7. **持久化目录**：用 `tauri::path::BaseDirectory::AppData`，且需要在 `tauri.conf.json` 的 `assetProtocol.scope` 中允许该目录被前端读取。
