# 数据清理日志

## 2026-03-16 清理 — 删除已导入DB的原始文件

**清理前总大小**: 12 GB
**清理后总大小**: ~1.2 GB
**释放空间**: ~10.8 GB

### 删除的文件

| 文件/目录 | 大小 | 删除原因 | 恢复方式 |
|-----------|------|----------|----------|
| `raw/sdwa/` | 4.8 GB | 旧版SDWA原始CSV，已通过 `sdwa_downloads.zip` 重新下载并导入 | 重新下载: https://echo.epa.gov/files/echodownloads/sdwa_downloads.zip |
| `sdwa/SDWA_VIOLATIONS_ENFORCEMENT.csv` | 3.8 GB | 已导入 violations 表 (5.4M记录) | 从 `sdwa_downloads.zip` 解压 |
| `sdwa/SDWA_LCR_SAMPLES.csv` | 118 MB | 已导入 lcr_samples 表 (917K记录) | 从 `sdwa_downloads.zip` 解压 |
| `backups/` | 758 MB | 2个旧版DB备份 (2026-02-12)，数据已过时 | 不需要恢复 |
| `sdwa_downloads.zip` | 386 MB | SDWA完整下载包，所有内容已提取并导入 | 重新下载同上 |
| `raw/sdwa_national.zip` | 386 MB | `raw/sdwa/` 的压缩包 | 同上 |
| `raw/ucmr5/` | 300 MB | UCMR5 PFAS原始数据，已导入 pfas_results 表 (1.8M记录) | 重新下载: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule#5 |
| `ucmr3/` | 177 MB | UCMR3原始TSV，已导入 ucmr3_results 表 (847K记录) | 重新下载: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule#3 |
| `ucmr4/` | 148 MB | UCMR4原始TSV，已导入 ucmr4_results 表 (932K记录) | 重新下载: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule#4 |
| `ucmr3.zip` | 8.5 MB | 已解压的UCMR3压缩包 | 同上 |
| `ucmr4.zip` | 11 MB | 已解压的UCMR4压缩包 | 同上 |
| `raw/pws_facilities.csv` | 2.7 MB | 加州专用旧数据，全美数据已在DB中 | 不需要恢复 |
| `raw/microplastics_samples.csv` | 284 KB | 微塑料研究数据，未使用 | 不需要恢复 |
| `processed/` | 8 KB | 空目录 | 不需要恢复 |
| `update.log` | 1 KB | 旧日志 | 不需要恢复 |
| `update_output.log` | 4 KB | 旧日志 | 不需要恢复 |

### 保留的文件

| 文件 | 大小 | 原因 |
|------|------|------|
| `water_quality.db` | 1.16 GB | **核心数据库** — 包含所有6个数据源，generate.py 依赖 |
| `raw/data_dictionary.pdf` | 212 KB | EPA数据字典参考文档 |
| `raw/mcls_dlrs_phgs.pdf` | 264 KB | 加州MCL/PHG官方参考文档 |

### 重新导入流程（如需恢复原始数据）

```bash
cd backend

# 1. 下载 SDWA 数据
# 访问 https://echo.epa.gov/files/echodownloads/sdwa_downloads.zip
# 解压到 data/sdwa/

# 2. 下载 UCMR3/4/5
# https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
# UCMR3 → data/ucmr3/UCMR3_All.txt
# UCMR4 → data/ucmr4/UCMR4_All.txt
# UCMR5 → data/raw/ucmr5/

# 3. 重建数据库
python scripts/build_database.py --force
python scripts/import_additional_data.py
python scripts/import_violations_enforcement.py

# 4. 重新生成报告
python generate.py
cp reports/*.json ../public/
```
