# Viven Water × EPA 水质数据系统 — 项目总览

> **最新状态**: 全量数据生成完成，6个数据源整合，20,608个ZIP覆盖全美
> **架构**: 预生成静态JSON + Nginx直接服务，无运行时服务器
> **最后更新**: 2026-03-16

---

## 项目简介

本项目是 **Viven Water** 产品网站的水质数据营销工具。用户在 vivenwater.com 输入邮编（ZIP code），即可查看：
- 当地供水系统的污染物检测结果
- 对比 EWG（环境工作组）健康标准 vs EPA 法定限值
- PFAS "永久化学物"检测
- 铅铜检测（LCR）
- EPA 违规记录
- 过滤器推荐（引导购买 Viven 产品）

**生产域名**: `vivenwater.com`
**数据页路由**: `/datacheck/:zip`

---

## 两个代码仓库

所有代码、数据、脚本现在统一在 `vivenwater_website/designer/` 下：

### 项目结构
```
vivenwater_website/designer/
├── src/                          ← React 前端源码
│   ├── pages/DataCheckPage.jsx   ← 水质报告展示页
│   ├── components/Sections/      ← IntegratedScanner 等组件
│   └── App.jsx                   ← 路由配置
├── public/                       ← Vite 静态文件（含 20,608 个 JSON 报告）
│   ├── *.json                    ← 预生成的 ZIP 报告
│   └── locations.json            ← 模糊搜索索引
├── backend/
│   ├── generate.py               ← **核心**：报告生成器
│   ├── src/
│   │   ├── ewg_standards.py      ← 110 种 EWG 健康标准
│   │   ├── app.py                ← Flask API（旧版/开发用）
│   │   └── water_lookup.py       ← 查询逻辑（旧版）
│   ├── scripts/
│   │   ├── build_database.py     ← 初始数据库构建
│   │   ├── import_additional_data.py  ← 导入 UCMR3/4 + LCR
│   │   ├── import_violations_enforcement.py ← 导入增强版违规
│   │   ├── quick_update.py       ← 快速数据更新
│   │   └── download_with_proxy.py ← 代理下载 EPA 数据
│   ├── data/
│   │   ├── water_quality.db      ← SQLite 数据库（1.16 GB）
│   │   ├── sdwa/                 ← SDWA 原始 CSV 文件
│   │   ├── ucmr3/                ← UCMR3 原始 TSV
│   │   ├── ucmr4/                ← UCMR4 原始 TSV
│   │   ├── raw/                  ← EPA 原始下载数据
│   │   └── backups/              ← 数据库备份
│   ├── reports/                  ← 生成的 JSON 报告输出目录
│   ├── docs/                     ← 本文档所在位置
│   └── nginx.conf                ← 生产 Nginx 配置
└── .env.development              ← VITE_API_URL=（空，本地模式）
```

---

## 当前架构（2026-03-16）

```
用户访问 vivenwater.com/datacheck/90210
    ↓
React SPA（Vite 构建）
    ↓
fetch(`/reports/90210.json`)   ← 开发模式从 public/ 读
    或                           ← 生产模式从 Nginx 读
fetch(`https://api.vivenwater.com/reports/90210`)
    ↓
预生成的静态 JSON 文件（20,608个）
```

**关键设计**: 没有运行时 API 服务器。所有 ZIP 码的数据在构建时预计算为 JSON 文件，
由 Nginx 直接服务。这意味着：
- 零延迟查询（Nginx 直出文件）
- 无需 Flask/FastAPI 进程
- 极低服务器成本（$5-6/月 VPS 即可）
- 数据更新 = 重新运行 generate.py + 复制文件

---

## 数据源全景（6个来源）

| # | 数据源 | 表名 | 记录数 | 来源 | 覆盖内容 |
|---|--------|------|--------|------|----------|
| 1 | **UCMR5 PFAS** | `pfas_results` | 1,821,066 | EPA UCMR5 | 26种PFAS "永久化学物" |
| 2 | **UCMR3** (2013-15) | `ucmr3_results` | 847,343 | EPA UCMR3 | 铬-6、1,4-二恶烷、锶、钒、氯酸盐等 |
| 3 | **UCMR4** (2018-20) | `ucmr4_results` | 932,854 | EPA UCMR4 | HAA9、HAA5、HAA6Br、锰、蓝藻毒素等 |
| 4 | **铅铜规则 LCR** | `lcr_samples` | 917,453 | EPA SDWA | 铅(PB90)、铜(CU90) 90百分位值 |
| 5 | **违规记录** | `violations` | 5,403,056 | EPA SDWA | 全部违规+执法记录（982K有实测值） |
| 6 | **水系统信息** | `water_systems` | 433,347 | EPA SDWA | 系统名称、人口、水源类型等 |

**辅助表**:
- `zip_to_pwsid`: 31,085 条 ZIP→PWSID 映射（覆盖 20,608 个唯一 ZIP）
- `contaminant_codes`: 871 条 EPA 污染物编号→名称映射
- `contaminant_reference`: 33 条参考数据

### 数据库总览
```
文件: designer/backend/data/water_quality.db
大小: 1,159 MB (1.16 GB)
引擎: SQLite 3
```

### 关键统计
- **20,608** 个 ZIP 码覆盖（全美 50 州 + DC + 领土）
- **110** 种 EWG 健康标准（PFAS 24种 + 常规污染物 86种）
- **42%** 的 ZIP 有 PFAS 检出
- **100%** 的 ZIP 有额外污染物数据（UCMR3/4/LCR）
- **16%** 的 ZIP 有健康相关违规
- **982,531** 条违规记录包含实际测量值（覆盖 110,819 个水系统）

---

## 核心文件说明

> 所有文件路径相对于 `vivenwater_website/designer/`

### 数据管道（backend/scripts/）

| 文件 | 用途 |
|------|------|
| `backend/scripts/build_database.py` | 初始数据库构建（水系统、违规、PFAS） |
| `backend/scripts/import_additional_data.py` | 导入 UCMR3、UCMR4、LCR 数据 |
| `backend/scripts/import_violations_enforcement.py` | 导入增强版违规数据（3.8GB CSV → 5.4M记录） |
| `backend/scripts/quick_update.py` | 快速数据更新脚本 |
| `backend/scripts/download_with_proxy.py` | 通过代理下载 EPA 数据 |
| `backend/data/water_quality.db` | SQLite 数据库（1.16 GB） |
| `backend/data/sdwa/` | SDWA 原始 CSV 文件 |
| `backend/data/ucmr3/` | UCMR3 原始 TSV 文件 |
| `backend/data/ucmr4/` | UCMR4 原始 TSV 文件 |
| `backend/data/sdwa_downloads.zip` | SDWA 完整下载包（386 MB 压缩） |

### 报告生成器（backend/）

| 文件 | 用途 |
|------|------|
| `backend/generate.py` | **核心**：读取 SQLite，生成 20,608 个 ZIP JSON 报告 |
| `backend/src/ewg_standards.py` | 110 种 EWG 健康标准数据（手动从 EWG 网站提取） |
| `backend/src/app.py` | Flask API（旧版，开发用，生产不需要） |
| `backend/src/water_lookup.py` | 数据查询逻辑（旧版，generate.py 有自己的逻辑） |
| `backend/reports/` | 生成的 JSON 报告输出目录 |
| `backend/nginx.conf` | 生产 Nginx 配置模板 |
| `backend/update_and_generate.sh` | 更新+生成一条龙脚本 |

### React 前端（src/ + public/）

| 文件 | 用途 |
|------|------|
| `src/pages/DataCheckPage.jsx` | **核心**：水质报告展示页面（PFAS区、污染物区、违规区、CTA） |
| `src/components/Sections/IntegratedScanner.jsx` | 首页 ZIP 搜索框（模糊搜索、自动补全） |
| `src/App.jsx` | 路由配置（含 `/datacheck/:zip`） |
| `public/*.json` | 预生成的 JSON 报告（开发模式用） |
| `public/locations.json` | 20,600 条 ZIP→城市映射（模糊搜索用） |
| `.env.development` | `VITE_API_URL=`（空，开发模式从本地读） |

---

## generate.py 工作原理

### 数据流
```
SQLite DB
  ├─ zip_to_pwsid  ──→  获取 PWSID
  ├─ water_systems  ──→  系统信息（名称、人口、水源）
  ├─ pfas_results   ──→  PFAS 检测（µg/L → ppt 转换）
  ├─ ucmr3_results  ──→  UCMR3 检测（µg/L = ppb）
  ├─ ucmr4_results  ──→  UCMR4 检测（µg/L = ppb）
  ├─ lcr_samples    ──→  铅铜 90th%（mg/L → ppb 转换）
  └─ violations     ──→  健康违规（多种单位转换）
        ↓
  EWG Standards 对比（110种标准）
        ↓
  JSON 文件（per ZIP）
```

### 单位转换链
```
EPA 数据单位               EWG 标准单位
─────────────             ─────────────
MG/L (= ppm)  ──×1000──→  ppb
UG/L (= ppb)  ──直接──→   ppb
UG/L (= ppb)  ──×1000──→  ppt  (PFAS)
UG/L (= ppb)  ──÷1000──→  ppm  (Nitrate)
PCI/L          ──直接──→   pCi/L (放射性)
MG/L           ──×1000──→  ppb → ×1000 → ppt (PFAS from LCR)
```

### 污染物名称别名系统

EPA 各数据库对同一污染物使用不同名称，需要别名映射到 EWG 标准：

```python
VIOLATION_ALIASES = {
    "CHROMIUM-6":           "CHROMIUM (HEXAVALENT)",   # UCMR3 名 → EWG 名
    "CHROMIUM":             "CHROMIUM (HEXAVALENT)",   # 总铬 → 六价铬标准
    "HAA9":                 "HALOACETIC ACIDS (HAA9)", # UCMR4 名 → EWG 名
    "TTHM":                 "TOTAL TRIHALOMETHANES (TTHMS)",
    "COMBINED RADIUM":      "RADIUM-226",
    "GROSS ALPHA, EXCL...": "RADIUM-226",              # 最接近的 EWG 标准
    "FLUORIDE":             None,                       # 无 EWG 标准，跳过
    "HCFC-22":              None,                       # 无 EWG 标准，跳过
    ...
}
```

### 去重逻辑

同一水系统可能从多个数据源检测到相同污染物（如 UCMR3 的 "chromium" 和 "chromium-6" 都映射到 EWG 的 "CHROMIUM (HEXAVALENT)"）。去重按两个维度：
1. **名称去重**: `c["name"].lower()` 相同则跳过
2. **EWG 标准去重**: 不同名称映射到同一 EWG key 则跳过

保留 EWG multiplier 最高的那个。

### JSON 输出格式

```json
{
  "zip": "07927",
  "found": true,
  "generated_at": "2026-03-16",
  "system": {
    "pwsid": "NJ1424001",
    "name": "SOUTHEAST MORRIS COUNTY MUA",
    "city": "CEDAR KNOLLS",
    "state": "NJ",
    "population": 65000,
    "connections": 22000,
    "source_type": "Surface Water"
  },
  "risk_level": "HIGH",
  "summary": {
    "total_contaminants": 21,
    "ewg_exceedances": 9,
    "pfas_detected": 8,
    "pfas_total_tested": 30,
    "epa_health_violations": 0
  },
  "contaminants": [
    {
      "name": "PFOA",
      "type": "pfas",
      "value": 12.0,
      "unit": "ppt",
      "exceeds_ewg": true,
      "ewg_multiplier": 134,
      "epa_limit_str": "4 ppt",
      "ewg_limit_str": "0.09 ppt",
      "health_effects": "Cancer; reproductive and developmental harm..."
    }
  ],
  "other_contaminants": [
    {
      "name": "HAA9",
      "type": "ucmr4",
      "value": 66.464,
      "unit": "ppb",
      "exceeds_ewg": true,
      "ewg_multiplier": 1108,
      "health_effects": "Cancer; harm to fetal growth..."
    },
    {
      "name": "Lead",
      "type": "lcr",
      "value": 1.5,
      "unit": "ppb",
      "exceeds_ewg": true,
      "ewg_multiplier": 2,
      "health_effects": "Brain and nervous system damage..."
    }
  ],
  "violations": [
    {
      "contaminant_code": "2950",
      "contaminant_name": "TTHM",
      "measured_value": 0.088,
      "measured_unit": "ppb",
      "exceeds_ewg": true,
      "ewg_multiplier": 587,
      "status": "Resolved"
    }
  ]
}
```

### 前端三个展示区域
1. **PFAS "Forever Chemicals"** — `contaminants[]` — UCMR5 PFAS 检测，单位 ppt
2. **Additional Contaminants Detected** — `other_contaminants[]` — UCMR3/4 + LCR 数据
3. **EPA Violations & Regulated Contaminants** — `violations[]` — 健康相关违规

### 风险等级计算
```
HIGH:     有开放违规 OR 超EPA限值 OR 任何EWG倍数≥50
MODERATE: ≥3种PFAS检出 OR ≥2条违规 OR ≥3种污染物
LOW:      有任何污染物或违规
MINIMAL:  无数据
```

---

## 数据更新流程

### 完整更新步骤（建议每季度一次）

```bash
cd vivenwater_website/designer/backend

# 1. 下载最新 EPA 数据
python scripts/download_with_proxy.py          # 下载SDWA、UCMR5

# 2. 构建基础数据库
python scripts/build_database.py --force

# 3. 导入附加数据源
python scripts/import_additional_data.py       # UCMR3 + UCMR4 + LCR

# 4. 导入增强版违规（如果重新下载了SDWA）
python scripts/import_violations_enforcement.py

# 5. 生成所有 ZIP 报告
python generate.py

# 6. 复制到前端 public/ (开发用)
cp reports/*.json ../public/

# 7. 部署到 VPS (生产用)
rsync -avz reports/ user@vps:/var/www/vivenwater/reports/
```

### 快速重新生成（数据库未变，只是更新generate逻辑）
```bash
cd vivenwater_website/designer/backend
python generate.py
# ~43 秒完成 20,608 个 ZIP
```

### 测试单个 ZIP
```bash
python generate.py --zip 07927
```

---

## 前端开发

### 环境变量

| 文件 | 变量 | 值 | 说明 |
|------|------|-----|------|
| `.env.development` | `VITE_API_URL` | `（空）` | 开发模式从本地 `public/` 读 JSON |
| `.env.production` | `VITE_API_URL` | `https://api.vivenwater.com` | 生产模式从 Nginx 读 |

**注意**: 代码中使用 `??`（nullish coalescing）而非 `||`，因为空字符串是 falsy，`||` 会错误 fallback 到生产 URL：
```js
// ✅ 正确 — 空字符串保留，fetch 路径为 /07927.json（从 public/ 读取）
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ❌ 错误 — 空字符串被跳过，fallback 到生产 URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vivenwater.com';
```

涉及文件：`src/pages/DataCheckPage.jsx:8` 和 `src/components/Sections/IntegratedScanner.jsx:6`

### 开发模式
```bash
cd vivenwater_website/designer
npm run dev
# 访问 http://localhost:5173/datacheck/07927
# JSON 从 public/ 目录读取，不需要后端服务器
```

### 构建生产版本
```bash
npm run build
# dist/ 目录可部署到 Netlify/Vercel/Nginx
```

### 设计语言
- 主色: `#f2663b` / `#d94e24`（Viven 品牌橙）
- 背景: `#FCFBF9`（奶油色）
- 深色区: `#1C1917`
- 字体: Sora（标题）+ Inter/默认（正文）

---

## 生产部署

### Nginx 配置
- 配置文件: `designer/backend/nginx.conf`
- 域名: `api.vivenwater.com`
- SSL: Let's Encrypt
- JSON 文件位置: `/var/www/vivenwater/reports/`
- CORS: 允许 `https://vivenwater.com`
- 缓存: 1小时客户端、24小时CDN
- 路由: `/reports/90210` → `/var/www/vivenwater/reports/90210.json`

### 部署清单
1. [ ] 将 `designer/backend/reports/*.json` 上传到 VPS `/var/www/vivenwater/reports/`
2. [ ] 配置 Nginx（`nginx.conf`）
3. [ ] 申请 SSL 证书 (`certbot --nginx -d api.vivenwater.com`)
4. [ ] 前端构建 (`npm run build`) 并部署到 CDN
5. [ ] 更新 `.env.production` 的 `VITE_API_URL=https://api.vivenwater.com`

---

## 已知问题和限制

### 数据缺口
1. **常规监测数据缺失**: 我们只有"违规"记录和"监测计划"数据，缺少常规合规监测结果。这意味着如果某污染物在 EPA 限值内但超过 EWG 标准，且它不在 UCMR3/4 监测范围内，我们不会显示。这是 EWG 网站的核心数据来源之一。获取途径：EPA ECHO API 或各州数据库，工程量大。

2. **UCMR 时间跨度**: UCMR3 (2013-15) 和 UCMR4 (2018-20) 数据较旧。UCMR5 (2023-25) 是最新的但只覆盖 PFAS。

3. **小型水系统**: UCMR 只监测服务人口 >3,300 的系统。小型社区和私人水井不在覆盖范围内。

4. **某些 EWG 标准缺失别名**: 部分 EPA 数据中的污染物名称可能还没有映射到 EWG 标准，会显示为无 EWG 对比数据。

### 性能注意事项
- 数据库 1.16 GB，全量生成需约 43 秒（476 ZIP/s）
- 所有查询已优化为索引命中（移除了 `REPLACE(pwsid, ' ', '')` 函数调用）
- 生产环境只需 Nginx 服务静态文件，无运行时计算

### 前端已知问题
- `locations.json` 537KB，首次加载模糊搜索时需下载
- 某些移动设备上自动补全下拉可能需要调整样式

---

## 数据源下载链接

| 数据源 | URL | 大小 |
|--------|-----|------|
| SDWA 完整包 | https://echo.epa.gov/files/echodownloads/sdwa_downloads.zip | ~386 MB (压缩) |
| UCMR5 PFAS | https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule#5 | ~300 MB |
| UCMR3 | https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule#3 | 8.5 MB |
| UCMR4 | https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule#4 | 11 MB |
| EWG 标准 | https://www.ewg.org/tapwater/all-ewg-standards.php | 手动提取 |

---

## 参考对比

我们以 EWG 的 NJ1424001（SOUTHEAST MORRIS COUNTY MUA）为参考系统：
- **EWG 页面**: https://www.ewg.org/tapwater/system.php?pws=NJ1424001
- **我们的结果**: ZIP 07927, 21种污染物, 9个EWG超标
- **EWG 显示**: ~25-30种（他们有常规监测数据，我们缺这部分）

---

**文档版本**: 2.0
**更新日期**: 2026-03-16
**维护者**: Claude (Anthropic) + 项目所有者
