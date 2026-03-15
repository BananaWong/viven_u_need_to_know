# DataCheck — 设计稿 & 实现方案
> vivenwater.com/datacheck/:zip
> 版本: 1.0 | 日期: 2026-03-15

---

## 一、产品逻辑

用户在首页看到 IntegratedScanner，输入邮编 → 跳转到 `/datacheck/90210`，看到自己家附近的真实水质数据。核心说服点：**你的水合法，但不安全**（EPA合规 vs EWG健康标准的差距）。页面底部推 Viven。

**数据流:**
```
用户输入邮编
  → 首页 IntegratedScanner 调用 GET /api/ping?zip=90210（快速检查，<200ms）
  → 有数据 → 跳转 /datacheck/90210
  → DataCheckPage 调用 GET /api/report/90210（完整报告，1-2s）
  → 渲染结果
```

---

## 二、后端改动

### 新增文件: `backend/src/ewg_standards.py`
存放116种污染物的EWG健康标准（已从EWG官网抓取），供API调用时做对比。

### 新增端点: `GET /api/ping`
```json
// Request: GET /api/ping?zip=90210
// Response (有数据):
{ "found": true, "zip": "90210", "system_count": 2 }

// Response (无数据):
{ "found": false, "zip": "99999" }
```
用途：首页scanner快速验证邮编，不需要等完整报告加载。

### 新增端点: `GET /api/report/<zipcode>`
返回完整水质报告，含EWG对比。结构：

```json
{
  "zip": "90210",
  "found": true,
  "primary_system": {
    "pwsid": "CA1910087",
    "name": "Los Angeles Dept of Water & Power",
    "population": 4000000,
    "source_type": "Surface Water",
    "city": "Los Angeles"
  },
  "risk_level": "HIGH",
  "risk_summary": {
    "epa_violations_5yr": 3,
    "health_based_violations": 2,
    "ewg_exceedances": 5,
    "pfas_detected": 7,
    "pfas_total_tested": 29
  },
  "contaminants": [
    {
      "name": "Arsenic",
      "detected_value": 0.5,
      "unit": "ppb",
      "epa_limit": 10,
      "epa_limit_str": "10 ppb",
      "ewg_limit": 0.004,
      "ewg_limit_str": "0.004 ppb",
      "exceeds_epa": false,
      "exceeds_ewg": true,
      "ewg_multiplier": 125,
      "health_effects": "Cancer; CNS harm; skin/heart disease risk",
      "source": "violation"
    }
  ],
  "pfas": [
    {
      "name": "PFOA",
      "detected_value": 12,
      "unit": "ppt",
      "epa_limit": 4,
      "ewg_limit": 0.09,
      "exceeds_epa": true,
      "exceeds_ewg": true,
      "ewg_multiplier": 133
    }
  ],
  "data_period": "2019–2024",
  "last_updated": "2026-02-12"
}
```

**数据源优先级（构建 contaminants 列表）：**
1. EPA健康违规记录（violations 表，is_health_based=true）
2. UCMR5 PFAS检测（pfas_results 表，detected=true）
3. 对每个检出污染物查 ewg_standards，计算超标倍数
4. 按 ewg_multiplier 降序排列（最吓人的排前面）

### CORS 更新
```python
origins = [
    "http://localhost:5173",
    "https://vivenwater.com",
    "https://www.vivenwater.com",
]
```

---

## 三、前端改动

### 3.1 新增路由 (App.jsx)
```jsx
import DataCheckPage from './pages/DataCheckPage';
<Route path="/datacheck/:zip" element={<DataCheckPage />} />
<Route path="/datacheck" element={<DataCheckPage />} />  // 无zip时留在页面内查询
```
react-router-dom 已安装，无需额外依赖。

### 3.2 IntegratedScanner 改造
**行为变化：**
- 输入邮编 → 点击 RUN DIAGNOSTIC
- 调用 `/api/ping?zip=XXXXX`
- 动画播放（同时等待API响应）
- 成功 → `navigate('/datacheck/90210')`
- 失败/未找到 → 显示 inline 错误状态（不跳转）

**API_BASE_URL:**
```js
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vivenwater.com'
```

`.env.development`:  `VITE_API_URL=http://localhost:5001`
`.env.production`:   `VITE_API_URL=https://api.vivenwater.com`

---

## 四、DataCheck 页面设计

### 页面结构（从上到下）

```
┌─────────────────────────────────────────────────────┐
│  [Header — 复用现有组件]                              │
├─────────────────────────────────────────────────────┤
│  HERO BAND (深色，#1C1917)                           │
│                                                     │
│  WATER REPORT          [邮编重新查询 input]           │
│  Beverly Hills, CA · 90210                          │
│  Metropolitan Water District of So. Cal.            │
│  Population served: 18,606,473 · Source: Surface    │
│  Data period: 2019–2024                             │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  RISK SCORE BAND (米白 #FCFBF9)                     │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │  整体评分卡（三列）                        │       │
│  │                                          │       │
│  │  ● HIGH RISK    5      7     3           │       │
│  │               超EWG   PFAS  EPA违规      │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  CONTAMINANTS SECTION (白色)                         │
│                                                     │
│  LABEL: "WHAT'S IN YOUR WATER"                      │
│  H2: "5 contaminants exceed health guidelines"      │
│  subtext: 说明EWG标准比EPA严格，这是科学标准不是法律  │
│                                                     │
│  ┌── 污染物卡片 ──────────────────────────────────┐  │
│  │  [!] ARSENIC                        超标 125x  │  │
│  │  检出: 0.5 ppb                                 │  │
│  │                                               │  │
│  │  ████████████████████░░░░░░░  EWG: 0.004ppb  │  │
│  │  ████░░░░░░░░░░░░░░░░░░░░░░░  EPA: 10ppb      │  │
│  │                          ↑ 你的水在这里        │  │
│  │                                               │  │
│  │  健康风险: 癌症 · 神经系统损伤 · 皮肤病变      │  │
│  │  [EPA合法 ✓]  [超EWG标准 ✗]                  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [... 更多污染物卡片，accordion 可展开 ...]           │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  PFAS SECTION (#f9f5f0 暖米)                         │
│                                                     │
│  LABEL: "FOREVER CHEMICALS"                         │
│  H2: "7 of 29 PFAS compounds detected"             │
│                                                     │
│  grid 3列:                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐                      │
│  │ PFOA │  │ PFOS │  │ PFNA │  ...                 │
│  │12ppt │  │ 8ppt │  │ 4ppt │                      │
│  │133x  │  │ 27x  │  │ 17x  │                      │
│  │EWG   │  │ EWG  │  │ EWG  │                      │
│  └──────┘  └──────┘  └──────┘                      │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  CTA SECTION (深色 #1C1917)                          │
│                                                     │
│  H2: "Viven removes 99.9% of                        │
│        what's in your water."                       │
│                                                     │
│  横向列出过滤掉的污染物标签:                          │
│  [Arsenic] [PFOA] [PFOS] [Nitrate] [Lead] ...      │
│                                                     │
│  [RESERVE YOUR VIVEN →]  [VIEW SCIENCE PAGE]       │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┤
│  [Footer — 复用现有组件]                              │
└─────────────────────────────────────────────────────┘
```

---

## 五、视觉规格

### 颜色
| 用途 | 值 |
|------|-----|
| 页面背景 | `#FCFBF9` |
| Hero band | `#1C1917` |
| PFAS band | `#F9F5F0` |
| Accent orange | `#f2663b` / `#d94e24` |
| 危险红 | `#dc2626` (EPA违规) |
| 警告橙 | `#f2663b` (EWG超标) |
| 安全绿 | `#059669` (合规) |
| 卡片背景 | `white` |
| 卡片边框 | `stone-100` |

### 字体 (延续 DM Sans)
| 元素 | 规格 |
|------|------|
| LABEL (eyebrow) | `font-mono uppercase tracking-[0.2em] text-sm` |
| H2 | `text-3xl md:text-5xl font-semibold` |
| 污染物名称 | `text-lg font-semibold uppercase tracking-wide` |
| 数值 | `font-mono text-2xl font-bold` |
| 正文 | `text-sm text-stone-500` |

### 污染物卡片详细规格
```
背景: white
圆角: rounded-2xl
边框: border border-stone-100
阴影: shadow-sm
左边框强调: border-l-4 border-l-[#f2663b]  (超EWG)
            border-l-4 border-l-red-500     (超EPA)

内部结构:
  Row 1: 污染物名  |  "XX× above EWG limit" badge
  Row 2: 进度条组  (EWG线 / EPA线 / 检出值)
  Row 3: 健康风险 tags
  Row 4: 状态 pills: [EPA Compliant ✓] [Exceeds EWG ✗]
```

### 超标倍数徽章
```
<5x    → 橙色  bg-orange-100 text-orange-700
5-50x  → 红色  bg-red-100 text-red-700
>50x   → 深红  bg-red-900 text-white
```

### 风险等级
| 级别 | 颜色 | 触发条件 |
|------|------|---------|
| HIGH | red | 有开放EPA健康违规，或 PFAS>5种检出 |
| MODERATE | orange | PFAS 1-5种，或历史健康违规>2 |
| LOW | yellow | 仅超EWG标准，无EPA违规 |
| MINIMAL | green | 无违规，无PFAS，无EWG超标 |

---

## 六、加载 & 空状态

### 加载中
```
┌──────────────────────────────────────┐
│     (skeleton cards, 3个占位)         │
│     ████████████  ░░░░░░░░          │
│     ████████  ░░░░░░░░░░░░          │
└──────────────────────────────────────┘
```
用 Tailwind `animate-pulse` 做 skeleton。

### 邮编不在数据库
```
找不到该邮编的水质数据
可能原因: 小型私井 / 数据库尚未收录

[← 返回重新查询]
[📩 通知我数据更新时] → 触发 email popup
```

### 该系统无违规/检出
```
MINIMAL RISK
Your area's tap water meets both federal and
EWG health guidelines. No violations on record.

[But here's why many Americans still filter...]
→ 展示一个教育性段落 + Viven CTA
```

---

## 七、SEO & Meta

每个 /datacheck/:zip 页面动态设置：
```html
<title>Beverly Hills, CA (90210) Water Quality Report | Viven</title>
<meta name="description" content="Your local water contains 5 contaminants exceeding health guidelines. See what's in Beverly Hills tap water and how to filter it." />
```
（通过 react-helmet 或直接操作 document.title）

---

## 八、文件清单

```
vivenwater_website/
├── backend/                          ← 已搬入 ✅
│   ├── src/
│   │   ├── app.py                    ← 需改: 加新端点
│   │   ├── water_lookup.py           ← 需改: 加EWG对比逻辑
│   │   └── ewg_standards.py          ← 待建: 116种标准数据
│   ├── data/
│   │   └── water_quality.db          ← 留在原处，见 data/README.txt
│   └── requirements.txt
│
└── designer/
    └── src/
        ├── App.jsx                   ← 需改: 加 /datacheck/:zip 路由
        ├── components/Sections/
        │   └── IntegratedScanner.jsx ← 需改: 真实API调用 + navigate
        └── pages/
            └── DataCheckPage.jsx     ← 待建: 完整结果页
```

---

## 九、开发顺序

```
Step 1  后端: 建 ewg_standards.py
Step 2  后端: 改 water_lookup.py，加EWG对比逻辑
Step 3  后端: 改 app.py，加 /api/ping 和 /api/report 端点
Step 4  前端: 改 App.jsx，加路由
Step 5  前端: 改 IntegratedScanner，接真实API
Step 6  前端: 建 DataCheckPage.jsx
Step 7  本地联调
Step 8  部署 (后端 → 服务器; 前端 npm run build → Netlify)
```

---

## 十、待确认事项

- [ ] 后端API子域名: `api.vivenwater.com` 还是 `vivenwater.com/api`?
- [ ] 数据无结果时: 显示空状态，还是触发 email popup?
- [ ] 污染物卡片: 默认全部展开，还是超过3个后 accordion?
- [ ] IntegratedScanner 所在的 Section: 目前在首页哪个位置？(ProblemSection 之后？)
