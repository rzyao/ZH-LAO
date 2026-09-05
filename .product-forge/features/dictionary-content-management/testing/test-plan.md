# Dictionary Content Management Test Plan

测试计划只记录可追溯的覆盖意图；`implemented` 不代表本次环境已完成端到端或 PostgreSQL 执行。

| ID | Journey / edge | Test level | Status | Evidence / target |
|---|---|---|---|---|
| TC-DICT-001 | STEP-001 | Playwright | passed | `apps/admin/e2e/content-management.spec.ts` dictionary JRN-001 |
| TC-DICT-002 | STEP-002 | Playwright + API | passed | same journey; parent UUID, lock payload and request key |
| TC-DICT-003 | STEP-003 | Playwright | passed | `content-management.spec.ts` JRN-002：版本比较明确显示“词典聚合（有变化）” |
| TC-DICT-004 | EDGE-001 | HTTP | implemented | `dictionary-management.test.ts` denied write permission causes no save/audit |
| TC-DICT-005 | EDGE-002 | HTTP/use-case | implemented | `dictionary-management.test.ts` stale lock rejects save and a second audit |
| TC-DICT-006 | EDGE-003 | domain/use-case | implemented | `dictionary-snapshot.test.ts`, `dictionary-management.test.ts` |
| TC-DICT-007 | STEP-004 | HTTP/use-case | implemented | `dictionary-management.test.ts`：合法、已发布的跨语言 Word 目标允许提交 |
| TC-DICT-008 | STEP-005 | HTTP/state machine | implemented | `dictionary-management.test.ts`：审核状态机与驳回原因必填 |
| TC-DICT-009 | STEP-006 | HTTP/repository | implemented in unit; PostgreSQL pending | post-commit audit boundary test |
| TC-DICT-010 | EDGE-004 | use-case | implemented in part | `dictionary-management.test.ts` disabled example target blocks submit; add archived/no-published variants |
| TC-DICT-011 | EDGE-005 | HTTP/domain | implemented | `dictionary-management.test.ts`：无审核权限不写 revision/audit；空驳回原因不改变 pending revision |
| TC-DICT-012 | EDGE-006 | PostgreSQL integration | passed | `dictionary-postgres.test.ts`：词典物化失败时 revision 与 `zh_words` 投影均回滚 |
| TC-DICT-013 | EDGE-007 | HTTP | implemented | `dictionary-management.test.ts` replay behavior |
| TC-DICT-014 | EDGE-012 | HTTP | implemented | post-commit audit failure replay stays refresh-required |
| TC-DICT-015 | STEP-007 | HTTP | implemented | `dictionary-public.test.ts` lookup and detail projection |
| TC-DICT-016 | STEP-008 | PostgreSQL integration | passed | `dictionary-postgres.test.ts`：搜索结果稳定、游标续页不重复且不遗漏 |
| TC-DICT-017 | EDGE-008 | HTTP | implemented | `dictionary-public.test.ts` no lookup match returns not-found |
| TC-DICT-018 | EDGE-009 | HTTP | implemented | `dictionary-public.test.ts` empty search yields empty array/null cursor |
| TC-DICT-019 | EDGE-010 | HTTP | implemented | `dictionary-public.test.ts` invalid cursor, language and limit are rejected |
| TC-DICT-020 | EDGE-011 | PostgreSQL integration | passed | `dictionary-postgres.test.ts`：draft/rejected/disabled/archived 父内容零泄露；已发布 equivalent 目标失效后也从公开详情移除 |
| TC-DICT-021 | JRN-003 e2e contract | API contract | implemented | `dictionary-public.test.ts` 覆盖 lookup、search、detail 的公开响应合同 |

隔离 PostgreSQL 已完成迁移验证；TC-DICT-012、TC-DICT-016 与 TC-DICT-020 已通过。
