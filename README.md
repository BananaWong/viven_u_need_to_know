
## 📝 开发日志 (Development Log)

### 2026-03-14 · 二次修复 (UTC+8)

#### Hero Section 视频黑屏根本原因修复（`Hero.jsx`）

**问题复现：** 上次修复后视频在 Safari 上仍然显示黑屏。

**根本原因：** Safari 有一个已知的渲染 bug —— CSS `filter` 属性直接写在 `<video>` 元素上时，Safari 在创建合成层（compositing layer）时处理异常，导致视频画面全黑。视频本身实际在正常解码播放，只是 Safari 的合成渲染出错。Chrome/Firefox 完全不受影响，因此在开发阶段难以发现。

**修复：** 将 `filter: brightness(95%) contrast(105%)` 从 `<video>` 元素移至外层包裹 `<div>`，`<video>` 本身不附加任何 filter，Safari 即可正常渲染画面。

构建验证：`npm run build` 通过，无警告（1.94s）。

---

### 2026-03-14 (UTC+8)

#### Hero Section 视频 Safari 兼容性修复（`Hero.jsx`）

针对 Safari 在播放 Hero Section 背景视频时出现的几个经典问题进行了修复：

*   **强制 MP4/H.264 编码**：原 Cloudinary URL 使用 `f_auto`（自动格式协商），可能因 Accept 头误判导致 Safari 收到不支持的格式。改为明确指定 `f_mp4,vc_h264`，确保所有 Safari 版本（macOS/iOS）始终获得可播放的 H.264 MP4 流。
*   **播放时序修复**：原逻辑在挂载后直接调用 `.play()`，Safari 加载视频比 Chrome 慢，容易在 `readyState < 2` 时调用失败。改为检查 `readyState >= 2` 后立即播放，否则监听 `canplay` 事件再触发，避免静默失败。
*   **旧版 iOS Safari 兼容**：通过 `setAttribute('webkit-playsinline', '')` 补充 iOS 9/10 以下旧版 Safari 所需的 webkit 私有属性。
*   **加载体验改善**：添加 `preload="auto"` 提示浏览器主动预加载视频；添加 `poster` 属性（Cloudinary 自动生成的视频首帧缩略图），消除 Safari 视频加载期间的黑屏。

构建验证：`npm run build` 通过，无警告（Vite 7.3.1，102 模块，1.86s）。

---

### 2026-03-14 23:45 (UTC+8)

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
