# 数据缺口分析

> **更新日期**: 2026-03-16
> **状态**: 6个数据源已整合，仍有可扩展空间

---

## 当前覆盖率

| 数据维度 | 覆盖范围 | 覆盖率 | 备注 |
|----------|----------|--------|------|
| ZIP码 | 20,608 / ~41,000 | ~50% | 只覆盖有UCMR5监测的系统 |
| 水系统 | 433,347 | 接近100% | 全美所有注册公共水系统 |
| PFAS | 26种化合物 | 优秀 | UCMR5 2023-25数据 |
| UCMR3 污染物 | 7-10种主要检出 | 良好 | 2013-15数据，较旧 |
| UCMR4 污染物 | 5-8种主要检出 | 良好 | 2018-20数据 |
| 铅铜 | PB90 + CU90 | 良好 | LCR 90th百分位 |
| 违规实测值 | 982,531条 | 良好 | 覆盖110K+水系统 |
| EWG标准 | 110种污染物 | 良好 | 手动从EWG提取 |

### 对比EWG网站

以 NJ1424001 (SOUTHEAST MORRIS COUNTY MUA) 为参考：
| 维度 | 我们 | EWG | 差距原因 |
|------|------|-----|----------|
| 检出污染物数 | 21 | ~28 | EWG有常规监测数据 |
| EWG超标数 | 9 | ~15 | 同上 |
| PFAS | 8种 | 8种 | 完全匹配 |
| 消毒副产物 | HAA5/9/6Br, TTHM | +更多细分 | EWG拆分更细 |
| 铅铜 | 有 | 有 | 匹配 |
| 放射性 | 部分（违规中） | 有 | 我们只在违规时显示 |

---

## 最大缺口：常规合规监测数据

### 问题描述
我们只在以下情况显示污染物：
1. **超标违规时** — violations 表（只有违规才有记录）
2. **UCMR 监测时** — UCMR3/4/5 是特定时期的监测计划
3. **LCR 检测时** — 只有铅和铜

但 EWG 显示的是**所有常规监测结果**，即使没有超过 EPA 限值。例如：
- 砷检出 3 ppb（EPA限值10 ppb，没有违规），但 EWG 标准是 0.004 ppb，超标 750 倍
- 硝酸盐 5 ppm（EPA限值10 ppm），但 EWG 标准 0.14 ppm，超标 36 倍

这些"合法但不健康"的数据正是 EWG 的核心价值，也是我们最大的缺口。

### 获取途径
1. **EPA ECHO API** — 可按水系统查询详细监测数据
   - 端点: `https://echodata.epa.gov/echo/sdw_rest_services.get_systems`
   - 限制: 需要大量 API 调用（每个水系统单独查询）
   - 工程量: 大（需要爬取 ~50K 活跃系统）

2. **各州数据平台** — 部分州有公开下载
   - 加州: California Water Boards EDT (SDWIS3/SDWIS4)
   - 已有 CA 的 SDWIS4.tab (1.7 GB)，但只是加州数据
   - 其他州覆盖不均匀

3. **Consumer Confidence Reports (CCR)** — 年度水质报告
   - PDF 格式，无法批量提取
   - 每个水系统自行发布

### 建议
如果要填补此缺口，最可行的方案是通过 EPA ECHO REST API 批量获取活跃 CWS 系统的监测数据。需要：
- 筛选约 50,000 个活跃 CWS 系统
- 逐一查询最近 5 年的监测结果
- 预计 API 调用量大，需要限流和错误处理
- 数据量可能达到数 GB

---

## 其他缺口

### 缺口 2：EWG 标准别名不完整

部分 EPA 污染物名称未映射到 EWG 标准：

**已处理的别名**:
- `CHROMIUM-6` → `CHROMIUM (HEXAVALENT)` ✅
- `TTHM` → `TOTAL TRIHALOMETHANES (TTHMS)` ✅
- `HAA9` → `HALOACETIC ACIDS (HAA9)` ✅
- `COMBINED RADIUM` → `RADIUM-226` ✅

**已知无 EWG 标准** (标记为 `None`):
- `FLUORIDE` — EWG 目前没有单独指南
- `HCFC-22` — 冷媒，非饮用水关注物
- `BROMOMETHANE` — 无 EWG 标准
- `CARBON, TOTAL` — 汇总指标，无独立标准

**可能遗漏**: 新出现的 EPA 违规污染物名称可能还没加入 `VIOLATION_ALIASES`。如果 `generate.py` 中 `ewg_lookup()` 的模糊匹配也找不到，该污染物会显示为无 EWG 对比数据。

### 缺口 3：UCMR 时效性

| UCMR | 时期 | 状态 |
|------|------|------|
| UCMR1 | 2001-2005 | 未导入（太旧） |
| UCMR2 | 2008-2010 | 未导入（太旧） |
| UCMR3 | 2013-2015 | ✅ 已导入 |
| UCMR4 | 2018-2020 | ✅ 已导入 |
| UCMR5 | 2023-2025 | ✅ 已导入（PFAS专项） |

UCMR3 数据已有 10+ 年历史，某些污染物水平可能已变化。但这是 chromium-6 等污染物的唯一全国性数据源。

### 缺口 4：小型水系统

UCMR 监测只覆盖服务人口 >3,300 的系统。小型社区水系统（NTNCWS/TNCWS）和私人水井不在我们的数据范围内。

### 缺口 5：实时性

所有数据都是历史数据（滞后 3-12 个月）。没有实时监测能力。建议每季度运行一次更新流程。

---

## SDWA 下载包中未使用的文件

`sdwa_downloads.zip` 包含以下文件，目前只使用了 LCR 和 VIOLATIONS_ENFORCEMENT：

| 文件 | 大小 | 已使用 | 潜在价值 |
|------|------|--------|----------|
| `SDWA_VIOLATIONS_ENFORCEMENT.csv` | 3.8 GB | ✅ | 违规+执法完整数据 |
| `SDWA_LCR_SAMPLES.csv` | 117 MB | ✅ | 铅铜检测 |
| `SDWA_FACILITIES.csv` | 159 MB | ❌ | 处理设施信息，低价值 |
| `SDWA_PUB_WATER_SYSTEMS.csv` | 123 MB | ❌ | 水系统详情（已有类似数据） |
| `SDWA_GEOGRAPHIC_AREAS.csv` | 39 MB | ❌ | 可补充 ZIP 映射 |
| `SDWA_SITE_VISITS.csv` | 368 MB | ❌ | 现场检查，低价值 |
| `SDWA_SERVICE_AREAS.csv` | 18 MB | ❌ | 服务区域，可扩展 ZIP 覆盖 |
| `SDWA_EVENTS_MILESTONES.csv` | 61 MB | ❌ | 事件里程碑 |
| `SDWA_PN_VIOLATION_ASSOC.csv` | 45 MB | ❌ | 违规通知关联 |
| `SDWA_REF_ANSI_AREAS.csv` | 0.1 MB | ❌ | 区域参考代码 |
| `SDWA_REF_CODE_VALUES.csv` | 0.1 MB | ❌ | 编号参考值 |

**可扩展项**: `SDWA_GEOGRAPHIC_AREAS.csv` 和 `SDWA_SERVICE_AREAS.csv` 可能帮助增加 ZIP 覆盖率（从 50% 提升到 ~70%+）。

---

## 优先级建议

### 高优先级
1. **获取常规监测数据** — 最大的差距，但工程量最大
2. **扩展 ZIP 覆盖率** — 使用 SERVICE_AREAS + GEOGRAPHIC_AREAS

### 中优先级
3. **定期更新流程自动化** — Cron job 或手动季度更新
4. **新 EWG 标准添加** — 关注 EWG 网站更新

### 低优先级
5. **导入 UCMR1/UCMR2** — 数据太旧，价值有限
6. **CCR 链接** — 为每个水系统生成 CCR 搜索链接

---

**文档版本**: 2.0
**更新日期**: 2026-03-16
