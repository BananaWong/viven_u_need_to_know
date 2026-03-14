# Viven Water — 交班文档

**更新时间：** 2026-03-14
**接手自：** Gemini CLI（上次更新 2026-03-12）
**本轮负责：** Claude Code (Sonnet 4.6)

---

## 一、项目当前状态

**总体状态：✅ 正常运行**

- 生产环境部署在 **Hostinger VPS**（非 Netlify，见下方注意事项）
- Safari 视频兼容性问题已完全解决，BrowserStack iPad Safari 真机测试通过
- `npm run build` 通过，无警告（Vite 7.3.1，102 模块）

---

## 二、技术栈

| 项目 | 版本 / 说明 |
|------|------------|
| React | 19 |
| Vite | 7.3.1 |
| Tailwind CSS | 3.4 |
| GSAP + SplitType | CDN 引入（`window.gsap`） |
| Supabase | 邮件订阅表单后端（`subscribers` 表） |
| 字体 | TT Commons Pro（本地，`src/fonts.css`） |
| 视频托管 | Hostinger VPS `/public/videos/`（已从 Cloudinary 迁移） |
| 图片/其他媒体 | Cloudinary CDN |

---

## 三、本轮主要工作：Safari 视频黑屏修复

Hero Section 背景视频在 iPad Safari 上长期黑屏，经过六轮排查最终解决。

**根本原因：** 原始视频以 AV1 编码上传，绝大多数 Apple 设备不支持 AV1。Safari 不报错，静默黑屏。

**最终方案：**
- 将 H.264 和 AV1 两个版本放在 `public/videos/`
- 使用 `<source>` 多源，Safari 选 H.264，Chrome 选 AV1（体积小约 50%）

**附带修复（代码层面）：**
- CSS `filter` 从 `<video>` 移至外层 `<div>`（Safari 合成层 bug）
- 添加 `transform: translate3d(0,0,0)` 强制 GPU 合成层
- 播放时序修复（`canplay` 事件等待）
- 添加 `timeupdate` 3 秒 fallback → 切静态封面图

详细记录见 `README.md` 开发日志。

---

## 四、文件结构说明

```
designer/
├── src/
│   ├── App.jsx                  # 主入口，所有 Section 的编排
│   ├── components/
│   │   ├── Sections/            # 各板块组件
│   │   ├── Common/              # 通用 UI 组件（Button 等）
│   │   └── Icons.jsx            # SVG 图标库，使用前必须先确认已导出
│   ├── constants/data.jsx       # 所有文案、视频 URL、配置数组
│   ├── hooks/useGSAP.js         # GSAP 封装
│   ├── lib/supabase.js          # Supabase 客户端
│   ├── index.css                # 全局样式 + Safari 兼容补丁
│   └── fonts.css                # 字体注册
├── public/
│   └── videos/
│       ├── Herosection_av1.mp4  # Hero 背景视频 AV1 版（1.9MB）
│       └── Herosection_h264.mp4 # Hero 背景视频 H.264 版（3.7MB）
├── GEMINI.md                    # AI 编码规范 + 项目上下文（重要，每次接手都要读）
├── AI_COLLABORATION.md          # 历史 AI agent 操作记录
├── STYLE_SPEC.md                # 设计系统（颜色、间距、字体规范）
├── build.sh                     # 自动化构建脚本（可选，支持 --deploy 参数）
└── README.md                    # 增量开发日志
```

---

## 五、⚠️ 注意事项

### 1. 部署平台已从 Netlify 迁移到 Hostinger VPS
以下文件是 **Netlify 遗留配置，已过时**，目前不影响功能但可考虑清理：
- `.netlify/` 目录
- `netlify.toml`
- `public/_headers`
- `public/_redirects`

### 2. 环境变量
`.env` 文件在 `.gitignore` 里，不会提交。部署时需要在 VPS 上单独配置：
- Supabase URL 和 anon key（参考 `.env.example`）

### 3. 视频资产
Hero Section 视频现在从本地 VPS 服务，**不再走 Cloudinary**。其他板块的视频（ProductAnatomy、FamilyCalendar）仍然在 Cloudinary。

### 4. ConvenienceSection
`App.jsx` 中有一个被注释掉的 `<ConvenienceSection />`（比较滑动器），**不要删除**，后续营销阶段会用到。

### 5. GSAP
通过 CDN 挂在 `window.gsap` 上，使用前需要 `if (!window.gsap) return` 保护。

---

## 六、待处理事项

| 事项 | 优先级 | 说明 |
|------|--------|------|
| 清理根目录散落文件 | 低 | `MobileFinishesDemo.jsx`、`compare3.cjs`、`1.png` 可删除 |
| 清理 Netlify 遗留文件 | 低 | `.netlify/`、`netlify.toml`、`public/_headers`、`public/_redirects` |
| H.264 重编码为 Baseline Profile | 可选 | 提升极旧款 iOS 设备兼容性（`-profile:v baseline -level 3.1`） |
| 清理 Cloudinary 旧视频资产 | 可选 | `v1772180303` 和 `v1773485850` 已不再使用 |
| Biohacker 变体同步 | 待定 | 见 `AI_COLLABORATION.md` Roadmap |

---

## 七、常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建，输出到 dist/
npm run lint     # ESLint 检查
./build.sh       # 自动化构建（含 lint + 体积报告）
./build.sh --deploy  # 构建 + rsync 部署（需设置 DEPLOY_TARGET 环境变量）
```

---

## 八、关键联系

- **GitHub：** `https://github.com/BananaWong/viven_u_need_to_know`
- **生产域名：** `vivenwater.com`
- **Supabase：** 邮件订阅，`subscribers` 表
- **Meta Pixel ID：** `1418490656124660`
- **Google Tag：** `G-3SZKWLYBQS`
