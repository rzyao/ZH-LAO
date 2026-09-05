# Gate Review: 管理端通用数据表增强

> Feature: `admin-data-table-enhancement` | Updated: 2026-09-05 | Reviewed against: `79feb6f7b82221da52e8f6bc1cd5f67d4694b415` + 已批准的未提交权威变更
> Risk: 🔴 high（跨 workspace + 数据迁移的结构性风险）→ routing: code-review gate ready for explicit human approval

## Summary

| Severity | Open | Acknowledged | Resolved |
| --- | ---: | ---: | ---: |
| ❌ CRITICAL | 0 | 0 | 2 |
| 🔶 HIGH | 0 | 0 | 7 |
| 🔸 MEDIUM | 2 | 0 | 2 |
| ▪️ LOW | 0 | 0 | 1 |

**Gate verdict:** READY FOR HUMAN APPROVAL — 建议 **APPROVE WITH CONDITIONS**。CRITICAL/HIGH 已全部修复并通过三维复审；保留单任务吞吐优化与 retry 幂等契约决策两个 MEDIUM。

## Findings by cohort

### Contract and authority

- **F-001** · ✅ RESOLVED · `plan/authority` · D-167、ADR-028、Content 数据库/API、版本审核与 ADR-023 已全部映射；未从代码或 Product Forge 工件反向覆盖权威。

### Architecture and data integrity

- **F-002** · ✅ RESOLVED · `plan/data-integrity` · 计划采用 `1340` 前向迁移、Content 持久化任务、提交时冻结 UUID、逐项事务、`SKIP LOCKED`、权限复核与事务内成功审计。

### Coverage and verification

- **F-003** · ✅ RESOLVED · `plan/coverage` · 5/5 Must Have、12/12 FR、6/6 NFR 与 6/6 API 均有实现和测试映射；无新增端点或事件。

### Task breakdown

- 58 个任务分为 8 个阶段：Setup 3、Foundation 8、US-001 11、US-002 4、US-003 7、US-004 11、US-005 10、Polish 4。
- 19 个测试先行任务均位于对应实现之前；任务尺寸为 S 6、M 21、L 31、XL 0。
- 任务覆盖 5/5 Must Have、FR-010～FR-021、TC-001～TC-012、TC-E2E-001～003 和全部 6 个 API operationId。
- 预计涉及 67 个唯一路径：新增 33，修改或复用 34；没有未知 workspace 前缀或重复任务 ID。

### Code review (Phase 6B)

- **F-004** · ✅ RESOLVED · CRITICAL · `source: code-review` · savepoint 回滚与写后失败 PostgreSQL 回归测试通过；未保留部分业务写入或成功审计。
- **F-005** · ✅ RESOLVED · HIGH · `source: code-review` · 当前页全选按当前页 UUID 成员关系判断，部分选择和另一页等量选择负向测试通过。
- **F-006** · ✅ RESOLVED · HIGH · `source: code-review` · 固定操作列接入单行选择，并用该行 `available_actions` 限制可执行动作；E2E 已验证。
- **F-007** · ✅ RESOLVED · HIGH · `source: code-review` · 分页 owner history、刷新、错误恢复和重开详情均已接入并通过 E2E。
- **F-008** · ✅ RESOLVED · HIGH · `source: code-review` · 未预期动作错误先回滚原事务，再由独立恢复事务安全失败所有未完成项、重算计数并支持 owner retry；处理器级 PostgreSQL 测试通过。
- **F-009** · ✅ RESOLVED · HIGH · `source: code-review` · load/poll/retry 均有可访问错误恢复；隐藏页暂停、恢复可见立即续轮询且防止重入，回归测试通过。
- **F-010** · ✅ RESOLVED · HIGH · `source: code-review` · 专项分层覆盖门、49 个 HTTP 契约测试与 4 条命名 E2E 全部通过；列设置、固定列、分页、任务终态刷新均有证据。
- **F-011** · ❌ OPEN · MEDIUM · `source: code-review` · `dimension: quality` · `raised@79feb6f7b82221da52e8f6bc1cd5f67d4694b415` · task row lock 横跨单项业务动作，使单个大任务的 concurrency 退化为 1。证据：`process-lo-letter-batch.ts:54-82`、`postgres-lo-letter-batch-repository.ts:270-287`。修复：item-first claim，task 短锁更新并补 barrier 测试。
- **F-012** · ✅ RESOLVED · MEDIUM · `source: code-review` · 仅 draft 暴露 submit_review，与现有单条状态机一致。
- **F-013** · ❌ OPEN · MEDIUM · `source: code-review` · `dimension: patterns` · `raised@79feb6f7b82221da52e8f6bc1cd5f67d4694b415` · retry 的必填 Idempotency-Key 仅校验后丢弃，客户端每次生成新 key，且 canonical Content 契约未定义 retry 幂等语义。证据：`lo-letter-batch-routes.ts:297-304`、`api.ts:109-113`。修复：由 Content owner 决定移除下游头或正式批准并实现重放语义。
- **F-014** · ✅ RESOLVED · LOW · `source: code-review` · 下游 component-map 已指向真实 feature-local 实现。

## Cross-validation

| Check | Result |
| --- | --- |
| Must Have stories | PASS — 5/5 |
| Codebase integration | PASS — 数据库、Content、Worker、Operations 公共端口、DataTable、字母页均已覆盖 |
| Open product questions | PASS — 0 |
| Data model alignment | PASS — 两表、状态机、计数、幂等、长期保留一致 |
| NFR coverage | PASS — 6/6 |
| Journey/API consistency | PASS — 3 条旅程、6 个稳定 API ID |

## Validation evidence

| Check | Result |
| --- | --- |
| Placeholder scan | PASS — 仅 quickstart 中保留显式凭据占位符 |
| `git diff --check` | PASS |
| Traceability strict check | PASS — 0 errors, 0 warnings；58/58 tasks 均有需求映射 |
| Contract refinement | PASS — OpenAPI/AsyncAPI 无需变更 |
| Task structural checks | PASS — 58 IDs unique；`Paths`/`Size` 完整；19 个 test-first 标记完整 |

## Open risks

- 500 条及宽泛子串查询的索引只能在代表性数据上通过 `EXPLAIN (ANALYZE, BUFFERS)` 最终确认。
- Content 写入与 Operations 审计必须共享事务；若现有公共端口无法安全支持，实施阶段必须停止。
- 产品不限制目标数量，因此必须依靠活动任务准入、批次和并发配置保护运行容量。

## Verification (Phase 7)

- **F-015** · ⚠️ WARNING · `source: verify-full` · `layer: 6` · `raised@79feb6f7b82221da52e8f6bc1cd5f67d4694b415` · `.product-forge/features/admin-data-table-enhancement/README.md` 仍显示实施前/计划待批准的过期生命周期文案；这不影响实现或权威需求，但应在下一次治理状态变更时刷新。
