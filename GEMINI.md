# Viven Water — Project Context & AI Coding Guide

## 🚨 MANDATORY EXECUTION PROTOCOL (REDLINE)
**Every AI agent MUST perform these checks BEFORE concluding a task:**
1.  **Static Validation**: Run `npm run build` and `npm run lint`. Ensure zero errors in `src/`.
2.  **Zero-Loss Content Check**: If refactoring components, verify that data (Team members, copy, lists) matches the source 100%. **NO PLACEHOLDERS ALLOWED.**
3.  **Visual Integrity**: 
    - **Logo Parity**: In TeamSection, always use `items-center` and custom `scale` (e.g., Kohler 1.5x) to ensure horizontal visual balance between different brand logos.
    - **Mobile Sliders**: Interactive horizontal sliders (ProblemSection) must include pagination dots and `snap-center` behavior.
4.  **String Safety**: Always use backticks (`` ` ``) in `data.jsx`.
5.  **Git Sanitization**: Never commit large binaries (.pdf) or backup folders unless explicitly requested.
6.  **Shell Commands**: **DO NOT USE `&&`** to chain commands. This is a win32 environment; run commands sequentially in separate calls.
7.  **Git & README**: 
    - Always document progress incrementally in the `README.md` when requested (incremental updates for each set of changes).
    - Commit messages must be concise and **MUST NOT** include any "Gemini" or AI-agent signatures.
    - Synchronize code to: `https://github.com/BananaWong/viven_u_need_to_know.git`.

---

> **Note for AI Agents:** This project follows a strict "Vibe Coding" optimization strategy. Adhere to the established aesthetics and structural guidelines at all times.

## 1. Project Overview
A high-end, immersive landing page for Viven Water. 
- **Tech Stack:** React 19, Vite 7, Tailwind CSS 3.4, GSAP (Animations), Supabase (Backend).
- **Core Aesthetic:** Minimalist, premium, medical-tech professional.

## 2. File Structure
- `src/App.jsx`: The "Mission Control". Contains all section components and layout logic. Keep this file small and clean.
- `src/components/Icons.jsx`: Centralized SVG library. Access via `<Icons.Name />`.
- `src/constants/data.jsx`: The "Brain". Contains all text, video URLs, and configuration arrays (Risk data, Calendar events, Finishes).
- `STYLE_SPEC.md`: Foundational design system (colors, spacing, typography).

## 3. Visual & Styling Rules (Do Not Break)
- **Aspect Ratio Locking:** The `FamilyCalendarSection` uses a parent container with `aspect-ratio: 2.27 / 1` (on desktop) to perfectly fit a 320px sidebar + a 16:9 full-bleed video. Do NOT use fixed heights here.
- **Typography:**
  - Primary Font: **TT Commons Pro** (Sans).
  - Label/Mono Font: **TT Commons Pro Mono** (Real monospace variant).
  - Tailwind Config: `font-sans` and `font-mono` are explicitly mapped to these local families.
- **Video Display:** Prefer `object-cover` for full-bleed sections. Use `q_auto,f_auto` Cloudinary parameters for all video URLs.

## 4. Coding Standards & AI Guidelines
- **Data Updates:** Modify `src/constants/data.jsx` ONLY when asked to change content (text, videos, schedule). Do not inline data back into `App.jsx`.
- **Terminology:** "Build" (建构) specifically means generating static production files (e.g., `npm run build`). Do NOT create ZIP archives unless the user explicitly asks for a compressed package.
- **String Syntax:** In `data.jsx`, **always use backticks (`` ` ``)** for strings to avoid syntax errors with apostrophes.
- **Hidden Components:** The `ConvenienceSection` (comparison slider) is currently commented out in `App.jsx`. **DO NOT DELETE IT.** It is kept for future marketing phases.
- **GSAP Animations:** Animations are scoped via the `useGSAP` hook and `useRef`. If DOM elements are moved or HTML tags are changed (e.g., `<p>` to `<h2>`), you **MUST** update the corresponding GSAP `scrollTrigger` selectors.
- **Tailwind Grid & Layout:** For complex matrices (like the Market Comparison table), DO NOT mix arbitrary `col-span` values in odd-numbered grids. Always use a highly divisible system like `grid-cols-12` for precise widths. Use `whitespace-pre-line` and explicit `\n` in strings for controlled wrapping in tight grid columns.
- **Icon Rendering:** Before using a new icon (e.g., `<Icons.Box />`), you **MUST** verify it is exported in `src/components/Icons.jsx`. Failing to do so will cause a fatal React crash.

## 5. Deployment & Build
- **Build Command:** `npm run build`
- **Build Output:** `dist/`
- Ensure all new font files are registered in `src/fonts.css` to be included in the Vite bundle.

---

## 6. DataCheck — 水质数据查询系统 (2026-03-16 新增)

### 概述
DataCheck 是集成在 vivenwater.com 的水质查询营销工具。用户输入 ZIP 码，查看当地水质污染数据（vs EWG 健康标准），引导购买 Viven 净水器。

**路由**: `/datacheck/:zip`
**核心页面**: `src/pages/DataCheckPage.jsx`

### 架构：预生成静态 JSON，无运行时 API
- `backend/generate.py` 读取 SQLite 数据库，为全美 **20,608 个 ZIP** 各生成一个 JSON 文件
- 开发模式：JSON 放在 `public/` 目录，Vite 直接服务
- 生产模式：JSON 由 Nginx 在 `api.vivenwater.com` 服务
- **无 Flask/FastAPI 运行时依赖**

### 数据库位置及来源
```
backend/data/water_quality.db  (1.16 GB, SQLite)
```
**6 个 EPA 数据源**:
| 来源 | 表名 | 记录数 |
|------|------|--------|
| UCMR5 PFAS (2023-25) | pfas_results | 1,821,066 |
| UCMR3 (2013-15) | ucmr3_results | 847,343 |
| UCMR4 (2018-20) | ucmr4_results | 932,854 |
| 铅铜规则 LCR | lcr_samples | 917,453 |
| EPA 违规+执法 | violations | 5,403,056 |
| 水系统信息 | water_systems | 433,347 |

### 关键文件
| 文件 | 作用 |
|------|------|
| `backend/generate.py` | 核心报告生成器（~800行） |
| `backend/src/ewg_standards.py` | 110 种 EWG 健康标准数据 |
| `src/pages/DataCheckPage.jsx` | 报告展示页（PFAS区、污染物区、违规区、过滤器CTA） |
| `src/components/Sections/IntegratedScanner.jsx` | 首页 ZIP 模糊搜索框 |
| `public/locations.json` | 20,600 条 ZIP→城市映射（模糊搜索用） |
| `backend/docs/PROJECT_OVERVIEW.md` | 完整技术文档 |
| `backend/docs/DATA_SCHEMA.md` | 数据库表结构文档 |
| `backend/docs/DATA_GAPS.md` | 数据缺口分析 |

### 常用命令
```bash
cd backend

# 生成全部报告（~43秒）
python generate.py

# 测试单个 ZIP
python generate.py --zip 07927

# 复制到前端
cp reports/*.json ../public/
```

### 数据更新流程（每季度）
```bash
cd backend
python scripts/build_database.py --force           # 步骤1: 基础数据库
python scripts/import_additional_data.py            # 步骤2: UCMR3/4 + LCR
python scripts/import_violations_enforcement.py     # 步骤3: 增强违规数据（必须！替换步骤1的数据）
python generate.py                                   # 步骤4: 生成报告
cp reports/*.json ../public/                          # 步骤5: 复制到前端
```

### 注意事项
- **`VITE_API_URL`**: 开发模式为空（`.env.development`），代码用 `??` 不是 `||` 防止 fallback 到生产 URL
- **单位转换**: PFAS µg/L→ppt (×1000)，LCR mg/L→ppb (×1000)，在 `generate.py` 中处理
- **污染物别名**: EPA 和 EWG 对同一污染物用不同名称，`VIOLATION_ALIASES` 字典做映射
- **去重**: UCMR3 的 "chromium" 和 "chromium-6" 都映射到 EWG "CHROMIUM (HEXAVALENT)"，按 EWG key 去重
- **参考系统**: NJ1424001 (ZIP 07927), EWG 页面 https://www.ewg.org/tapwater/system.php?pws=NJ1424001

---
*Last Updated: March 16, 2026*