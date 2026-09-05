# 发布就绪检查：管理端通用数据表增强

> Feature：`admin-data-table-enhancement`｜日期：2026-09-05｜结论：**有条件可发布（仅内部灰度）**

## 概要

实现、代码审查、全链路验证和隔离自动化测试已通过。迁移 `1340_content_letter_batch_tasks.sql` 只新增两张 Content 表，适合先部署 schema、验证后再开启应用功能；生产回退优先回退应用且保留表，已有任务后不得执行破坏性 schema 回退。

不建议直接全面发布：真实内容管理员账号缺失 `content.lo_letters.read`，真实业务路径未完成；本功能尚未接入可关闭的开关；外部监控提供方、SBOM/SCA 与构建溯源未配置。

| 类别 | 状态 | 行动项 |
| --- | :---: | ---: |
| 开关、灰度与回退 | ⚠️ | 2 |
| 文档 | ✅ | 1 |
| 监控与可观测性 | ⚠️ | 2 |
| 数据分析 | ⚠️ | 1 |
| 部署依赖 | ⚠️ | 3 |
| 安全与供应链 | ⚠️ | 3 |

## 既有质量门禁

| 门禁 | 结果 |
| --- | :---: |
| 实施前审查 | 已跳过（用户直接进入实施） |
| 代码审查 | 通过，遗留 F-011/F-013 中等事项 |
| 全链路验证 | 通过，已接受 F-011/F-013/F-015 告警 |
| 测试执行 | 隔离测试通过；真实内容管理员路径由用户跳过 |

## 灰度与回退

**策略：内部优先。** 先对拥有 Content 管理权限的内部操作员启用，观察 24 小时；确认无队列阻塞、错误率或延迟告警后再扩大。登记的候选开关见 `flags/registry.yml`，但代码尚未接入，不能把登记本身当作开关。

**回退：条件可逆。** 停止任务准入并回退应用版本；保留新增数据库表及已有任务/结果。只有表中没有任务数据时，才可按 `migrations/rollback.sql` 回退 schema；存在数据时需要 Content Owner 与数据库操作员批准并验证备份。

## 发布前行动项

| # | 类别 | 行动 | 优先级 | 状态 |
| ---: | --- | --- | :---: | :---: |
| 1 | 灰度 | 将候选开关实际接入 admin 入口和 batch task 准入，默认关闭，并验证可关闭 | MUST | TODO |
| 2 | 测试 | 使用具备 `content.lo_letters.read/write/review/publish` 的内容管理员账号完成真实路径验证 | MUST（全面发布前） | TODO |
| 3 | 迁移 | 在目标环境按 schema-first 执行 1340、只读 validation、备份与 worker 就绪检查 | MUST | TODO |
| 4 | 监控 | 将 `monitoring/alerts.yml` 和 SLO 接入实际告警平台，指定 Content 值班人 | MUST（扩大范围前） | TODO |
| 5 | 供应链 | 生成 SBOM 并运行 OSV/许可证扫描 | MUST | TODO |
| 6 | 构建 | 在发布工作流加入 build provenance attestation | SHOULD | TODO |
| 7 | 分析 | 建立批量提交→完成→失败重试漏斗 | SHOULD | TODO |
| 8 | 文档 | 发布公告说明批量操作、二次确认、结果和重试规则 | SHOULD | TODO |

## 部署与安全

- Development：✅ 本地 API 与隔离测试可运行。
- Staging/Production：⚠️ 尚无已验证的账号、迁移执行记录、监控或开关接入证据。
- 新运行配置：`CONTENT_LETTER_BATCH_SIZE`（默认 50）与 `CONTENT_LETTER_BATCH_CONCURRENCY`（默认 4）应在目标环境复核。
- 生产依赖审计无已知漏洞；Syft/OSV-Scanner 在当前环境不可用，详见 `supply-chain/README.md`。
- 权限由 Content/Operations 契约控制；当前测试账号被服务端正确拒绝，说明不能将未授权测试当成功路径。

## 结论

**有条件可发布（仅内部灰度）。** 可以先部署 schema 和应用，但不得扩大到全面可用，直到 MUST 项完成；若接受例外，必须明确接受“无真实内容管理员路径验证、无实际 kill switch、无已应用监控/SCA”的风险。
