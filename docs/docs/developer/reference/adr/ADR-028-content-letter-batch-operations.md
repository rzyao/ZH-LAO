---
status: baseline
last_updated: 2026-09-05
---

# ADR-028：Content 字母异步批量操作

**状态：** 已接受

**日期：** 2026-09-05

## 背景

`/content/lo/letters` 需要支持当前筛选结果的跨页选择和批量提交审核、审核通过、驳回、正式发布及删除。目标数量无产品上限，因此同步请求无法稳定承载；现有 Content API 只有单条命令，`versioning-review.md` 也将批量发布列为未决项。

## 决策

1. 批量任务及其逐项目标/结果归 Content Domain；Operations 只提供 Operator 解析、精确 RBAC 授权与成功操作审计，不拥有任务状态。
2. 提交时在同一 Content 事务中解析当前选择，冻结每个目标 Content logical UUID 与适用的 Revision UUID，再将任务置为 `queued`。后续筛选结果变化不得改变已冻结目标。
3. 任务由后台 Worker 分批认领；每个目标独立事务、独立状态校验和权限复核，允许部分成功。任务本身没有产品数量上限，处理批次与并发度属于实现配置。
4. 失败项允许显式重试；已提交任务不可取消。任务与逐项结果长期保留，不提供删除/清理接口。
5. 所有批量动作都需要二次确认；`reject` 与 `archive`（UI 文案“删除”）要求非空原因。核心 Knowledge Content 不物理删除，“删除”统一转换为 `contents.status='archived'`。
6. 批量动作仅包括 `submit_review`、`approve`、`reject`、`publish`、`archive`；不包含上线/下线。
7. 状态机、权限和审计语义与单条命令相同，不得因批量入口放宽。任务 Worker 在每个处理批次前重新解析当前 Operator 与所需权限；权限被撤销后，未处理项记为 `skipped` 并使用 `FORBIDDEN`，不继续越权执行。
8. 通过新的前向 migration 新增 Content 任务表与明细表；任何既有冻结 migration 均不修改。

## 后果

- 新增长期事实会使 Content 表清单增加两张，字段和约束以 Content 数据库页为唯一权威。
- API 必须采用 ADR-023 顶层业务码信封，并为选择变化、任务状态和重试错误登记业务码。
- 查询字段、筛选白名单和排序白名单仍由字母列表契约独立定义；本 ADR 不允许 Worker 接受任意 SQL/字段表达式。

## 不采用

- 一个大事务全量回滚：目标无上限且会扩大锁范围，无法提供逐项结果。
- 仅在内存排队：不能满足长期结果、重启恢复与可审计性。
- Operations 拥有通用业务任务：会违反 Owner Domain 对业务状态的唯一所有权。
