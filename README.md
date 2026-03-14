
## 📝 开发日志 (Development Log)
工程问题不是点一个神奇按钮就可以完成的。
你可能觉得只是看看怎么回事，但背后需要付出几个小时去排除问题和迭代解决方案并且进行大量的修改。
我使用ai助手跟我一起记录一段典型的debug排除记录 ：）

---

### 2026-03-14-19-00-00 · Safari 视频兼容性完整排查报告

#### 背景

网站首页 Hero Section 背景视频在 iPad Safari 上始终显示黑屏，其他所有内容正常。Safari 在视频无法播放时不报任何错误，只是静默黑屏，导致排查极为困难，共经历六轮。

---

#### 第一轮：Safari 视频播放通用兼容性修复

**假设：** Safari 对自动播放有更严格的策略，旧版 iOS 有额外要求。

**修复内容：**
- Cloudinary URL 从 `f_auto` 改为 `f_mp4,vc_h264`，防止 CDN 推送 Safari 不支持的格式
- 修复播放时序：等 `readyState >= 2` 或 `canplay` 事件后再调用 `.play()`
- 添加 `webkit-playsinline` 兼容 iOS 9/10
- 添加 `preload="auto"` 和 `poster` 封面图

**结果：** 无效。

---

#### 第二轮：CSS Filter 渲染 Bug

**发现：** Safari 已知缺陷——CSS `filter` 直接加在 `<video>` 元素上时，合成层创建异常，画面全黑。Chrome 不受影响，开发阶段无法发现。

**修复：** 将 `filter: brightness(95%) contrast(105%)` 从 `<video>` 移至外层 `<div>`。

**结果：** 无效。

---

#### 第三轮：GPU 合成层 + 渲染 Fallback

**假设：** Safari 未为视频元素分配独立 GPU 渲染层。

**修复：**
- 给 `<video>` 加 `transform: translate3d(0,0,0)` 强制开启 GPU 合成层
- 添加 `timeupdate` 3 秒超时 Fallback：若视频未触发 `timeupdate`，自动切换为静态封面图

**结果：** Fallback 未触发（说明视频在解码），但画面依然黑屏。

---

#### 第四轮：更换 Cloudinary 视频资产

**操作：** 重新导出 H.264 版本上传至 Cloudinary（`v1773485850`），绕过格式转换参数。

**结果：** 首次加载 autoplay 失效（Cloudinary on-demand 转码延迟），刷新后 autoplay 正常，iPad Safari 依然黑屏。

---

#### 第五轮：截图分析 + 根本原因确认

用户提供 iPad Safari 截图，显示页面只有 `<section>` 的 CSS 径向渐变背景（暗色 + 中央灰白光晕），`<video>` 元素完全透明。

**根本原因：原始视频以 AV1 编码上传。**

AV1 在 Apple 设备上的支持情况：

| 设备 | 支持 AV1 |
|------|---------|
| iPhone 15+（A17 芯片） | 支持 |
| iPad Pro M4 | 支持 |
| 其他所有 iPhone / iPad | **不支持** |
| macOS Safari 17+ | 支持 |
| macOS Safari 16 及以下 | **不支持** |

Cloudinary 的 `vc_h264` 参数对此视频未能生效（可能判断原文件已"足够优化"跳过了转码）。

---

#### 第六轮（当前方案）：本地托管 + 双格式多源

**策略：** 脱离 Cloudinary 格式判断，将视频托管在 Hostinger VPS，同时提供 AV1 和 H.264 两个版本：

```
public/videos/
├── Herosection_av1.mp4   (1.9MB，Chrome/Firefox)
└── Herosection_h264.mp4  (3.7MB，Safari)
```

代码使用 `<source>` 多源，浏览器按 codec 支持自动选择：
- Safari → 跳过 AV1 → 选 H.264
- Chrome/Firefox → 选 AV1（体积小 ~50%）

构建验证：`npm run build` 通过，无警告（2.08s）。

---

#### 待完成事项

| 事项 | 状态 |
|------|------|
| 部署到 Hostinger VPS | 待部署 |
| iPad Safari 验证视频正常播放 | 待验证 |
| （可选）H.264 重编码为 Baseline Profile 提升旧设备兼容性 | 可选 |
| （可选）清理 Cloudinary 旧视频资产 | 可选 |

---

#### 经验总结

1. Safari 视频播放失败不报错，必须主动排查
2. AV1 在 Apple 生态覆盖率极低，面向消费者的视频必须提供 H.264 fallback
3. Cloudinary 的自动转码在实际使用中有不确定性，关键视频建议手动控制格式
4. `<source>` 多源写法是视频兼容性的最佳实践

---

### 2026-03-14-17-30-00 · AV1 编码问题确认 + H.264 测试版本上线

#### Hero Section 视频 Safari 黑屏 — 根本原因锁定（`Hero.jsx`）

**结论：** 此前所有代码层面的修复（filter 位置、GPU 合成层、播放时序、格式协商）均未能解决问题，判断根本原因不在代码，而在**视频源文件编码格式**。

**原因分析：** 原始视频（`v1772180303`）推测以 AV1 编码上传至 Cloudinary。AV1 在 Safari 上兼容性极差——仅 Safari 17（macOS Sonoma）及搭载 A17 芯片的 iPhone 15 以上机型支持硬件解码，旧版 Safari 和绝大多数 iOS 设备完全无法播放，且不报错只显示黑屏。Cloudinary 的 `vc_h264` 转换参数理论上应强制重编码，但实际可能未生效或存在转码延迟。

**当前处置：** 重新导出 H.264 编码版本视频并上传至 Cloudinary（`v1773485850`），替换页面引用的视频 URL 作为测试，待验证 Safari 播放正常后确认问题来源。

---

### 2026-03-14-16-30-00 · 三次修复

#### Hero Section 视频 Safari 合成层修复 + 渲染 Fallback（`Hero.jsx`）

**背景：** 前两轮修复（格式协商、filter 位置）之后视频在 Safari 上仍黑屏，判断根本原因是 Safari 未为视频元素提升独立的 GPU 合成层。

*   **强制 GPU 合成层**：给 `<video>` 元素加上 `WebkitTransform: 'translate3d(0,0,0)'` / `transform: 'translate3d(0,0,0)'`。Safari 对 `absolute` 定位的 video 有时不主动创建独立合成层，导致画面无法合成到屏幕上；`translate3d` 是触发层提升的标准做法。
*   **`timeupdate` 渲染 Fallback**：挂载后监听视频的 `timeupdate` 事件，若 3 秒内该事件从未触发（说明 Safari 未能正常渲染视频），自动切换 `videoFallback` state，将视频替换为同一封面图的静态背景 `<div>`，确保用户不会看到黑屏。

构建验证：`npm run build` 通过，无警告（1.99s）。

---

### 2026-03-14-15-45-00 · 二次修复

#### Hero Section 视频黑屏根本原因修复（`Hero.jsx`）

**问题复现：** 上次修复后视频在 Safari 上仍然显示黑屏。

**根本原因：** Safari 有一个已知的渲染 bug —— CSS `filter` 属性直接写在 `<video>` 元素上时，Safari 在创建合成层（compositing layer）时处理异常，导致视频画面全黑。视频本身实际在正常解码播放，只是 Safari 的合成渲染出错。Chrome/Firefox 完全不受影响，因此在开发阶段难以发现。

**修复：** 将 `filter: brightness(95%) contrast(105%)` 从 `<video>` 元素移至外层包裹 `<div>`，`<video>` 本身不附加任何 filter，Safari 即可正常渲染画面。

构建验证：`npm run build` 通过，无警告（1.94s）。

---

### 2026-03-14-15-00-00 · 初次修复

#### Hero Section 视频 Safari 兼容性修复（`Hero.jsx`）

针对 Safari 在播放 Hero Section 背景视频时出现的几个经典问题进行了修复：

*   **强制 MP4/H.264 编码**：原 Cloudinary URL 使用 `f_auto`（自动格式协商），可能因 Accept 头误判导致 Safari 收到不支持的格式。改为明确指定 `f_mp4,vc_h264`，确保所有 Safari 版本（macOS/iOS）始终获得可播放的 H.264 MP4 流。
*   **播放时序修复**：原逻辑在挂载后直接调用 `.play()`，Safari 加载视频比 Chrome 慢，容易在 `readyState < 2` 时调用失败。改为检查 `readyState >= 2` 后立即播放，否则监听 `canplay` 事件再触发，避免静默失败。
*   **旧版 iOS Safari 兼容**：通过 `setAttribute('webkit-playsinline', '')` 补充 iOS 9/10 以下旧版 Safari 所需的 webkit 私有属性。
*   **加载体验改善**：添加 `preload="auto"` 提示浏览器主动预加载视频；添加 `poster` 属性（Cloudinary 自动生成的视频首帧缩略图），消除 Safari 视频加载期间的黑屏。

构建验证：`npm run build` 通过，无警告（Vite 7.3.1，102 模块，1.86s）。

---

### 2026-03-14-23-45-00

#### 1. Safari 浏览器全方位兼容性深度优化
针对 Safari 浏览器在视频播放、CSS 特效和硬件加速渲染方面的多个经典问题进行了修复，确保在 iOS 和 macOS 上的表现：
*   **视频自动播放策略增强**
*   **毛玻璃（Glassmorphism）特效修复**：Tailwind 默认的 `backdrop-blur` 类在部分 Safari 版本中无法生效。通过在全局 CSS 中注入针对性的 `-webkit-backdrop-filter` 补丁，修复了 Header、卡片及浮窗的背景模糊效果。
*   **圆角截断渲染修复（Safari Rounded Corner Bug）**：解决了 Safari 在执行硬件加速动画（如 Scale 或 Translate）时，`overflow: hidden` 容器圆角偶尔会“破裂”或失效的问题。通过注入 `.safari-rounded-fix`（使用 `-webkit-mask-image` 径向渐变技巧和 `translateZ(0)`）强制 Safari 重新计算渲染层，确保动画过程中圆角始终平滑。

#### 2. 文案排版与视觉节奏微调

#### 3. 遥测集成与生产环境构建修复
*   **Meta Pixel 全量集成**：成功接入 **Meta Pixel (Facebook Pixel)** 追踪代码（ID: 1418490656124660），实现全站 PageView 事件的自动遥测。
*   **符合 HTML 规范的构建修复**：解决了 Vite 在 `npm run build` 时报出的 HTML 解析错误。根据 W3C 标准，将包含图片标签的 `<noscript>` 块从 `<head>` 移至 `<body>` 起始位置，既保证了遥测数据的准确性，又消除了构建警告。

---
