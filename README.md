
## 📝 开发日志 (Development Log)

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
