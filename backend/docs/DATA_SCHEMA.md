# 数据库 Schema 文档

> **数据库**: `ca-water-quality/data/water_quality.db`
> **大小**: 1,159 MB
> **引擎**: SQLite 3
> **更新日期**: 2026-03-16

---

## 表结构总览

| 表名 | 记录数 | 用途 | 导入脚本 |
|------|--------|------|----------|
| `water_systems` | 433,347 | 全美公共供水系统 | `build_database.py` |
| `zip_to_pwsid` | 31,085 | ZIP码→水系统映射 | `build_database.py` |
| `violations` | 5,403,056 | EPA违规+执法记录 | `import_violations_enforcement.py` |
| `pfas_results` | 1,821,066 | UCMR5 PFAS检测 | `build_database.py` |
| `ucmr3_results` | 847,343 | UCMR3检测 (2013-15) | `import_additional_data.py` |
| `ucmr4_results` | 932,854 | UCMR4检测 (2018-20) | `import_additional_data.py` |
| `lcr_samples` | 917,453 | 铅铜规则样本 | `import_additional_data.py` |
| `contaminant_codes` | 871 | EPA污染物编号→名称 | `build_database.py` |
| `contaminant_reference` | 33 | 参考标准数据 | `build_database.py` |
| `metadata` | 5 | 数据库元信息 | `build_database.py` |

---

## 1. water_systems — 公共供水系统

```sql
CREATE TABLE water_systems (
    pwsid TEXT PRIMARY KEY,        -- 水系统ID，格式：州代码+7位数字 (如 NJ1424001)
    name TEXT,                     -- 系统名称
    city_name TEXT,                -- 所在城市
    state_code TEXT,               -- 州代码 (如 NJ, CA, TX)
    population_served INTEGER,     -- 服务人口
    service_connections INTEGER,   -- 服务连接数
    primary_source_code TEXT,      -- 水源类型代码
    pws_type_code TEXT             -- 系统类型代码
);
```

**水源类型代码** (`primary_source_code`):
| 代码 | 含义 |
|------|------|
| `GW` | Groundwater 地下水 |
| `GWP` | Purchased Groundwater 外购地下水 |
| `SW` | Surface Water 地表水 |
| `SWP` | Purchased Surface Water 外购地表水 |
| `GU` | Groundwater under surface water influence |

**系统类型代码** (`pws_type_code`):
| 代码 | 含义 |
|------|------|
| `CWS` | Community Water System 社区供水（居民用，generate.py 优先选择） |
| `NTNCWS` | Non-transient Non-community 非临时非社区（如学校） |
| `TNCWS` | Transient Non-community 临时非社区（如加油站） |

**索引**: `CREATE INDEX idx_water_systems_state ON water_systems(state_code)`

---

## 2. zip_to_pwsid — ZIP码映射

```sql
CREATE TABLE zip_to_pwsid (
    zipcode TEXT NOT NULL,         -- 5位ZIP码
    pwsid TEXT NOT NULL,           -- 对应水系统ID
    PRIMARY KEY (zipcode, pwsid)
);
```

**索引**: `CREATE INDEX idx_zip_zipcode ON zip_to_pwsid(zipcode)`

**说明**: 一个 ZIP 可能对应多个水系统。`generate.py` 选择 `population_served` 最大的 CWS 系统。

**覆盖**: 20,608 个唯一 ZIP 码

---

## 3. violations — EPA违规+执法记录

```sql
CREATE TABLE violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pwsid TEXT NOT NULL,
    violation_id TEXT NOT NULL,
    facility_id TEXT,
    compl_per_begin_date TEXT,     -- 合规期开始，格式 MM/DD/YYYY
    compl_per_end_date TEXT,       -- 合规期结束
    violation_code TEXT,
    violation_category_code TEXT,  -- MCL/MR/TT/Other
    is_health_based INTEGER DEFAULT 0,  -- 1=健康相关违规
    contaminant_code TEXT,         -- EPA污染物编号 (如 2950=TTHM)
    viol_measure REAL,             -- 实际测量值（可为NULL）
    unit_of_measure TEXT,          -- MG/L, UG/L, PCI/L 等
    federal_mcl TEXT,              -- 联邦最大污染物限值
    state_mcl TEXT,                -- 州最大污染物限值
    is_major_viol INTEGER DEFAULT 0,
    violation_status TEXT,         -- Resolved / Open / 等
    rule_code TEXT,
    rule_family_code TEXT
);
```

**索引**:
- `CREATE INDEX idx_violations_pwsid ON violations(pwsid)`
- `CREATE INDEX idx_violations_health ON violations(pwsid, is_health_based)`

**数据来源**: `SDWA_VIOLATIONS_ENFORCEMENT.csv` (3.8 GB)
- 原始 15.1M 行 → 去重后 5.4M（按 PWSID+VIOLATION_ID，保留最高 viol_measure）
- 982,531 条有 `viol_measure` 实测值
- 557,262 条是 `is_health_based = 1`
- 覆盖 110,819 个水系统
- 160 种不同的 `contaminant_code`

**重要**: `compl_per_begin_date` 格式是 `MM/DD/YYYY`，`generate.py` 中有特殊解析逻辑转换为 `YYYY-MM-DD` 进行日期比较。

---

## 4. pfas_results — UCMR5 PFAS检测

```sql
CREATE TABLE pfas_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pwsid TEXT NOT NULL,
    contaminant TEXT NOT NULL,     -- PFAS名称 (如 PFOA, PFOS)
    analytical_result_value REAL,  -- 检测值，单位 µg/L (ppb)
    analytical_result_sign TEXT,   -- "=" 表示检出, "<" 表示未检出
    mrl REAL,                      -- 方法报告限值
    units TEXT,                    -- 固定为 µg/L
    collection_date TEXT,          -- 采样日期
    detected INTEGER DEFAULT 0,   -- 1=检出
    state TEXT,
    sample_id TEXT
);
```

**索引**: `CREATE INDEX idx_pfas_pwsid ON pfas_results(pwsid)`

**单位注意**: 数据库中值为 µg/L (= ppb)。PFAS EWG 标准为 ppt。
**转换**: `generate.py` 中 `value_ppt = raw_value * 1000.0`

**覆盖**: 26 种 PFAS 化合物，13,952 个 ZIP 有检出 (67.7%)

---

## 5. ucmr3_results — UCMR3 检测 (2013-2015)

```sql
CREATE TABLE ucmr3_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pwsid TEXT NOT NULL,
    contaminant TEXT NOT NULL,     -- 如 chromium-6, 1,4-dioxane, strontium
    analytical_result_value REAL,  -- 检测值，单位 µg/L (ppb)
    analytical_result_sign TEXT,
    mrl REAL,
    units TEXT,
    collection_date TEXT,
    detected INTEGER DEFAULT 0,
    state TEXT,
    sample_id TEXT
);
```

**索引**: `CREATE INDEX idx_ucmr3_pwsid ON ucmr3_results(pwsid)`

**注意**: 导入时跳过了 UCMR3 中的 PFAS 化合物（PFOA, PFOS, PFBS, PFHpA, PFHxS, PFNA），因为 UCMR5 有更新的数据。

**主要污染物**: chromium-6, 1,4-dioxane, strontium, vanadium, chlorate, molybdenum, cobalt

---

## 6. ucmr4_results — UCMR4 检测 (2018-2020)

```sql
CREATE TABLE ucmr4_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pwsid TEXT NOT NULL,
    contaminant TEXT NOT NULL,     -- 如 HAA9, HAA5, HAA6Br, manganese
    analytical_result_value REAL,  -- 检测值，单位 µg/L (ppb)
    analytical_result_sign TEXT,
    mrl REAL,
    units TEXT,
    collection_date TEXT,
    detected INTEGER DEFAULT 0,
    state TEXT,
    sample_id TEXT
);
```

**索引**: `CREATE INDEX idx_ucmr4_pwsid ON ucmr4_results(pwsid)`

**主要污染物**: HAA9, HAA5, HAA6Br, manganese, 蓝藻毒素

**注意**: HAA9 和 HAA6Br 是手动添加到 `ewg_standards.py` 的，EWG 标准为 0.06 ppb。

---

## 7. lcr_samples — 铅铜规则样本

```sql
CREATE TABLE lcr_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pwsid TEXT NOT NULL,
    contaminant_code TEXT,         -- PB90 (铅) 或 CU90 (铜)
    sample_measure REAL,           -- 90th百分位值，单位 MG/L
    unit_of_measure TEXT,          -- 通常为 MG/L
    sample_date TEXT,              -- 采样日期
    result_sign TEXT,
    action_level REAL,             -- 行动级别（本数据集中为NULL）
    action_level_exceeded TEXT     -- 是否超标（本数据集中为NULL）
);
```

**索引**: `CREATE INDEX idx_lcr_pwsid ON lcr_samples(pwsid)`

**单位注意**: 值为 MG/L。铅 EWG 标准为 1 ppb，EPA 行动级别 15 ppb。
**转换**: `generate.py` 中 `val_ppb = lead["value"] * 1000.0`（MG/L → ppb）

**污染物代码**:
| 代码 | 含义 | EPA行动级别 | EWG标准 |
|------|------|------------|---------|
| `PB90` | 铅 90th百分位 | 15 ppb (0.015 mg/L) | 1 ppb |
| `CU90` | 铜 90th百分位 | 1,300 ppb (1.3 mg/L) | 300 ppb |

---

## 8. contaminant_codes — EPA污染物编号

```sql
CREATE TABLE contaminant_codes (
    code TEXT PRIMARY KEY,         -- EPA污染物编号 (如 2950, 1005)
    name TEXT NOT NULL             -- 污染物名称 (如 TTHM, Arsenic)
);
```

**常用编号对照**:
| 编号 | 名称 | 类型 |
|------|------|------|
| 2950 | TTHM (总三卤甲烷) | 消毒副产物 |
| 1005 | Arsenic 砷 | 无机物 |
| 1040 | Nitrate 硝酸盐 | 无机物 |
| 2456 | HAA5 (卤代乙酸) | 消毒副产物 |
| 4010 | Combined Radium 镭 | 放射性 |
| 4000 | Gross Alpha 总α | 放射性 |
| 1025 | Fluoride 氟化物 | 无机物 |
| 4006 | Combined Uranium 铀 | 放射性 |
| 1045 | Selenium 硒 | 无机物 |
| 5000 | Lead and Copper Rule | 铅铜 |
| 3100 | Coliform 大肠菌群 | 微生物 |

---

## 数据关联图

```
                    ┌──────────────────┐
                    │   用户输入 ZIP    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  zip_to_pwsid    │
                    │  ZIP → PWSID     │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────────────┐
          │                  │                          │
          ▼                  ▼                          ▼
  ┌──────────────┐  ┌───────────────┐          ┌──────────────┐
  │ water_systems │  │ pfas_results  │          │  violations  │
  │ (系统信息)    │  │ (UCMR5 PFAS)  │          │ (EPA违规)    │
  └──────────────┘  └───────────────┘          └──────┬───────┘
                                                      │
          ┌──────────────────┼──────────────────┐     │
          │                  │                  │     │
          ▼                  ▼                  ▼     ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
  │ ucmr3_results│  │ ucmr4_results│  │ contaminant_codes │
  │ (UCMR3)      │  │ (UCMR4)      │  │ (编号→名称)       │
  └──────────────┘  └──────────────┘  └──────────────────┘
          │                  │
          └──────────────────┘
                    │
                    ▼
          ┌──────────────┐
          │ lcr_samples  │
          │ (铅铜)       │
          └──────────────┘
```

**主键连接**: 所有表通过 `pwsid` (Public Water System ID) 关联

**PWSID 格式**: 州代码(2字母) + 7位数字，如 `NJ1424001`, `CA0110001`
- 数据库中没有空格（已验证所有表）
- 查询时直接 `WHERE pwsid = ?`，命中索引

---

## 数据导入顺序

```
1. build_database.py
   → water_systems, zip_to_pwsid, pfas_results, contaminant_codes, violations(基础版)

2. import_additional_data.py
   → ucmr3_results, ucmr4_results, lcr_samples

3. import_violations_enforcement.py
   → violations (替换为增强版：5.4M记录，982K有实测值)
```

**注意**: 步骤3会清空并替换步骤1中导入的 violations 数据。步骤1的基础版只有 1.18M 条记录和 62K 有实测值，步骤3的增强版有 5.4M 条和 982K 有实测值。

---

**文档版本**: 2.0
**更新日期**: 2026-03-16
