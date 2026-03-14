# Viven Water — Premium Landing Page

![Viven Water Hero](https://res.cloudinary.com/dsyxtnpgm/image/upload/q_auto,f_auto/v1772610478/product_qu6sev.webp)

A high-end, immersive landing page built for **Viven Water Systems Inc.** This application showcases the Viven All-in-One Wellness Kitchen Faucet using cinematic scrolling, 3D interactive elements, and a medical-tech "vibe coding" aesthetic.

## 🌟 Key Features & UX Highlights

*   **Cinematic Scroll Animations**: Powered by `GSAP` and `ScrollTrigger`, delivering Apple-like narrative scrolling experiences.
*   **1 vs 1 Comparison Matrix**: A responsive competitor analysis grid. On mobile, it smartly degrades into a swipeable capsule-tab interface to prevent horizontal scrolling fatigue.
*   **3D Interactive Hardware Finishes**: A native app-like experience allowing users to swipe through product colors. On mobile, tapping a product triggers a full 3D card flip to reveal specifications.
*   **Responsive Typography Architecture**: Dynamically scales massive bold headers (`text-7xl`) on desktop down to highly legible, tightly-leaded variants on mobile (`text-4xl`).
*   **Glassmorphism UI**: Heavy use of `backdrop-blur`, subtle borders, and `mix-blend-multiply` effects to ground the product securely within its environment.

## 🛠️ Tech Stack

*   **Framework**: [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) (Extensively customized for arbitrary values and complex grid structures)
*   **Animation Engine**: [GSAP (GreenSock)](https://gsap.com/)
*   **Typography**: Custom local font family (`TT Commons Pro` & `TT Commons Pro Mono`)
*   **Asset Management**: Cloudinary (Dynamic `q_auto,f_auto` format delivery)

## 📁 Project Structure

The project strictly follows a monolithic, "Mission Control" structure optimized for rapid AI iteration.

```
src/
├── App.jsx                        # "Mission Control" - Assembles all sections and global states.
├── constants/data.js              # "The Brain" - Centralized text, video URLs, and configuration arrays.
├── components/
│   ├── Icons.jsx                  # Centralized SVG Library
│   ├── Common/UI.jsx              # Reusable atoms (Buttons, Labels, ScrollReveals)
│   └── Sections/                  # Page Building Blocks
│       ├── Header.jsx             # Navigation (Sticky & Glassmorphic)
│       ├── Hero.jsx               # The cinematic opening hook
│       ├── ComparisonSection.jsx  # "The Status Quo" vs "Viven Standard" bento cards
│       ├── ProblemSection.jsx     # "Daily Exposure" animated water drop risk analysis
│       ├── ProductAnatomySection.jsx # Hardware breakdown with GSAP staggered reveals
│       ├── TechnologySection.jsx  # The dynamic market comparison table
│       ├── ProductFinishesSection.jsx # The 3D flip card color configurator
│       ├── TeamSection.jsx        # Founder bios & brand trust logos
│       └── Footer.jsx             # High-conversion CTA and specs dashboard
```

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* npm

### Installation
1. Clone the repository and navigate into the directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Production Build
To create an optimized production build:
```bash
npm run build
```
This will generate static assets in the `dist/` directory, ready to be deployed to Netlify, Vercel, or any static hosting service. Ensure all changes pass the strict linter:
```bash
npm run lint
```

## 📐 Development Guidelines (Redlines)

This project has been meticulously crafted by humans and AI working in tandem. When making updates, please adhere to the rules outlined in `GEMINI.md` and `AI_COLLABORATION.md`.

*   **Zero-Loss Content**: Never replace real text/copy with placeholders (e.g., `Lorem Ipsum`).
*   **String Safety**: Always use backticks (` `) in `constants/data.js` to prevent apostrophe breaks.  
*   **Animation Scope**: Always scope GSAP animations using `useRef` and `useGSAP`. Avoid global DOM querying.
*   **Asset Performance**: Do not commit large binary files or local videos. Always source media from the established Cloudinary CDN links.

## 📝 开发日志 (Development Log)

### 2026-03-14 23:45 (UTC+8)

#### 1. Safari 浏览器全方位兼容性深度优化
针对 Safari 浏览器在视频播放、CSS 特效和硬件加速渲染方面的多个经典问题进行了专项修复，确保在 iOS 和 macOS 上的完美表现：
*   **视频自动播放策略增强**：由于 Safari 对自动播放有极其严格的静音检测机制，我们为 Hero 和 ProductAnatomy 的所有视频显式设置了 `defaultMuted` 属性，并在 React 的 `useEffect` 生命周期中强制执行 `.play()` 逻辑。同时优化了 Cloudinary 视频分发参数（`q_auto,f_auto`），确保 Safari 能够加载最兼容的 MP4 编码。
*   **毛玻璃（Glassmorphism）特效修复**：Tailwind 默认的 `backdrop-blur` 类在部分 Safari 版本中无法生效。通过在全局 CSS 中注入针对性的 `-webkit-backdrop-filter` 补丁，修复了 Header、卡片及浮窗的背景模糊效果。
*   **圆角截断渲染修复（Safari Rounded Corner Bug）**：解决了 Safari 在执行硬件加速动画（如 Scale 或 Translate）时，`overflow: hidden` 容器圆角偶尔会“破裂”或失效的问题。通过注入 `.safari-rounded-fix`（使用 `-webkit-mask-image` 径向渐变技巧和 `translateZ(0)`）强制 Safari 重新计算渲染层，确保动画过程中圆角始终平滑。

#### 2. 文案排版与视觉节奏精确微调
*   **标题与交互整合**：将 `ProductAnatomySection` 的核心标题更新为 "High flow rates, no more waiting."，并采用嵌套技术将 "Molecular Hydrogen" 的交互式浮窗解释直接整合进 `h2` 标签内部，在不破坏标题样式的前提下增加了信息深度。
*   **视觉节奏压缩**：为了提升阅读的连贯性，大幅度压缩了产品解构部分各文案块之间的间距（将 `space-y` 调至最小）。同时优化了行间距（Leading），使三段核心信息在视觉上合并为一个紧凑的功能说明块。
*   **对比卡片比例调整**：将 "Other Faucets" 卡片内的图片缩放比例精确下调至 `1.3` 倍，并同步压缩了卡片底部特征列表的行高与垂直边距，使左右两张对比卡片在不同分辨率下都显得更加精致、不臃肿。

#### 3. 遥测集成与生产环境构建修复
*   **Meta Pixel 全量集成**：成功接入 **Meta Pixel (Facebook Pixel)** 追踪代码（ID: 1418490656124660），实现全站 PageView 事件的自动遥测。
*   **符合 HTML 规范的构建修复**：解决了 Vite 在 `npm run build` 时报出的 HTML 解析错误。根据 W3C 标准，将包含图片标签的 `<noscript>` 块从 `<head>` 移至 `<body>` 起始位置，既保证了遥测数据的准确性，又消除了构建警告。

---
*© 2026 Viven Water Systems Inc. All Rights Reserved.*