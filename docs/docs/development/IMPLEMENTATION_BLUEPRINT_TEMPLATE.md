---
status: active
last_updated: 2026-08-31
---

# Implementation Blueprint Template

Implementation Blueprint 是 **derived implementation guidance**：把已经通过 Design Gate 的产品/Domain/Contract 设计编译成接近伪代码的代码级实施说明。它帮助实现 Worker 降低重新做架构推理的需求，但永远不能覆盖 frozen migration、ADR、权威 Markdown、Public Contract 或 canonical spec。

> 使用本模板时，删除无关示例并填写真实 repository evidence。不得为了“完整”而虚构 symbol、path、SQL、test 或 Gate。

## 0. Blueprint Metadata

```yaml
blueprint_id: {TASK_ID}-BLUEPRINT
version: 1
status: ready

task_id: {TASK_ID}
domain: {domain}
track: backend | admin | client
implementation_role: backend_worker | admin_worker | client_worker

repository: rzyao/ZH-LAO
branch: main
base_commit: {40-char commit sha}

design_gate:
  name: {DOMAIN_DESIGN_GATE}
  result: PASS
  evidence_path: {path}

execution_brief:
  path: {path}

canonical_spec:
  adopted: true | false
  path: {path-or-null}
  sha256: {64-char-sha256-or-null}

upstream_snapshots:
  - path: {public-contract-or-authority-path}
    commit_or_sha: {snapshot}
```

## 1. Authority and Scope

### 1.1 Authority order

按本 Task 的真实来源列出，至少覆盖：

```text
Frozen migration / accepted ADR
→ authoritative Domain docs
→ canonical spec（若 adopted）
→ Design Gate
→ Execution Brief
→ this Blueprint
```

Blueprint 与更高优先级 source 冲突时：**更高优先级 source 胜出，Implementation Worker STOP 并报告 `SPEC_CONFLICT`。**

### 1.2 Allowed paths

```text
{exact path/glob}
```

### 1.3 Forbidden paths

```text
{exact path/glob}
```

### 1.4 Explicit non-goals

- `{not in this Task}`
- `{must not be “顺手” implemented}`

## 2. Requirement Trace

每个 mandatory Requirement 必须至少映射一次。

| Requirement ID | Authority / Scenario | Target file(s) | Target symbol(s) | Test(s) |
| --- | --- | --- | --- | --- |
| `{REQ-ID}` | `{path}#{section}` / `{AS-ID}` | `{path}` | `{symbol}` | `{test path}::{case}` |

若 Domain 尚未 adopted canonical spec，使用 Design/Execution Brief 中已有的稳定 requirement/use-case 标识；不得临时发明与未来 canonical ID 冲突的编号体系。

## 3. File Change Map

只列本 Task 需要的文件级变化。

### CREATE

```text
{path}
Purpose: {why this file must exist}
Requirements: {REQ IDs}
```

### MODIFY

```text
{path}
Existing symbols touched: {symbols}
Required change: {concise change}
Requirements: {REQ IDs}
```

### DELETE

```text
{path or NONE}
Reason: {why deletion is authorized}
```

### TEST

```text
{test path}
Covers: {REQ IDs / scenarios}
```

## 4. Symbol Contracts

为每个新建或实质修改的 public/application/repository symbol 写到可直接实现的粒度。

```ts
// pseudocode — not source code
interface Input {
  field: Type;
}

type Result =
  | { kind: '...'; ... }
  | { kind: '...'; ... };

class Service {
  execute(input: Input): Promise<Result>;
}
```

每个 symbol 说明：

```text
Visibility: public | module-internal | private
Owns requirements: {REQ IDs}
Inputs: {semantic constraints}
Outputs: {semantic constraints}
Must call: {dependency symbols/contracts}
Must not call: {forbidden dependency}
Observable invariants: {list}
```

## 5. Ordered Pseudocode / Data Flow

每个非平凡 use case 写成顺序步骤，不只写“实现业务逻辑”。

```text
{UseCase}.execute(input)

1. Validate {field} against {schema/contract}.
2. Load {aggregate/reference} via {repository.symbol}.
3. If {condition}:
      return/throw {exact domain result}.
4. Start transaction {only if required}.
5. Lock/read/write in this exact semantic order:
      a. ...
      b. ...
6. Call {public contract} with {logical ID}, never internal PK.
7. Commit transaction.
8. Map domain result to {HTTP/public response/event}.
9. Do not expose {internal fields}.
```

必须明确所有主要分支：happy path、not found、validation、conflict、forbidden、provider unavailable、retry/idempotent replay 等适用情况。

## 6. Persistence / Transaction / Concurrency / Idempotency

### Persistence intent

```text
Repository method: {symbol}
Table(s): {same-domain tables only unless contract explicitly says otherwise}
Lookup key: {logical/public/internal according to authority}
Expected cardinality: {0..1 / 1 / many}
```

必要时可写 SQL-like intent：

```sql
-- pseudocode only
SELECT ...
FROM schema.table
WHERE stable_key = $1
FOR UPDATE; -- only when authority requires locking
```

### Transaction boundary

```text
BEGIN at: {application/repository boundary}
Inside transaction:
1. ...
2. ...
COMMIT after: ...
Rollback on: ...
```

### Concurrency

```text
Race to prevent: {description}
Mechanism: unique constraint | row lock | advisory lock | compare-and-set | none
Retry semantics: {description}
```

### Idempotency

```text
Idempotency key/source: {field}
Replay result: {same result / existing resource / rejected duplicate}
Side effects repeated?: NO/YES with reason
```

如果这些语义未由 authority 裁决，不得由实现 Worker现场决定；标记为 `IMPLEMENTATION_BLOCKER`。

## 7. Error Mapping

| Condition | Domain result/error | HTTP / Public mapping | Retryable? | Requirement |
| --- | --- | --- | --- | --- |
| `{condition}` | `{error}` | `{status/code}` | yes/no | `{REQ-ID}` |

禁止把数据库错误文本直接当成 API contract。

## 8. Security / RBAC / Privacy Constraints

明确：

```text
Authentication required: yes/no
Permission key(s): {domain.resource.action}
Ownership checks: {exact rule}
Audit event/log: {required action}
Sensitive fields never returned/logged: {fields}
Cross-domain identifiers: logical UUID only where required
```

## 9. Integration / Public Contract Calls

| Consumer → Provider | Contract path/symbol | Input identity | Failure behavior | Forbidden shortcut |
| --- | --- | --- | --- | --- |
| `{domain}` → `{domain}` | `{path}::{symbol}` | `{logical id}` | `{mapped behavior}` | direct cross-domain SQL |

## 10. Test Matrix

测试必须从 Requirement / acceptance scenario 派生，而不是只覆盖代码行。

| Test ID | Given | When | Then | File / case | Requirements |
| --- | --- | --- | --- | --- | --- |
| `T-01` | `{precondition}` | `{action}` | `{observable result}` | `{path}::{case}` | `{REQ IDs}` |

至少考虑：

- happy path；
- validation / malformed input；
- not found；
- permission/ownership；
- duplicate/idempotent replay；
- legal/illegal state transition；
- concurrency/race（若适用）；
- provider/dependency unavailable（若适用）；
- internal ID / sensitive field leakage；
- cross-domain boundary violations；
- regression required by Execution Brief。

## 11. Implementation Order

把工作拆成最小可验证顺序：

```text
01. {types/schemas}
02. {repository primitive}
03. {application service}
04. {HTTP/public adapter}
05. {composition/wiring}
06. {unit/integration tests}
07. {architecture/security/concurrency tests}
08. {full required checks}
```

每一步写明完成条件；不要让 Worker 自行重排会改变事务/契约语义的步骤。

## 12. Decision Budget

### LOCKED — Implementation Worker 不得改变

- `{API path / request / response}`
- `{public interfaces}`
- `{transaction boundary}`
- `{state transition}`
- `{error semantics}`
- `{cross-domain contract}`
- `{security / permission invariant}`
- `{DB invariant}`

### CONSTRAINED — 可在边界内选择

- `{private helper decomposition}`
- `{private symbol naming rules}`
- `{equivalent query/helper organization}`
- `{local refactoring boundaries}`

### FREE — 无需升级

- local variable names；
- formatting；
- comments；
- 等价且不影响 observable behavior / public contract / transaction semantics 的 private 实现细节。

> Manifest 可以收紧 Decision Budget，但不得由实现 Worker 放宽。

## 13. Conflict Protocol

实现 Worker 遇到以下情况必须使用精确状态，不得脑补：

### `SPEC_CONFLICT`

条件：两个或多个 authority / spec / brief / blueprint 语义不可同时满足。

必须报告：

```text
Conflicting sources
Requirement IDs
Exact incompatible statements/symbols
Smallest decision needed
```

### `IMPLEMENTATION_BLOCKER`

条件：缺少超出 Decision Budget 的必要设计决定。

必须报告：

```text
Missing decision
Why code cannot safely choose it
Affected files/symbols/requirements
Suggested authority owner
```

### `REPOSITORY_DRIFT`

条件：`base_commit..latest_main` 改动可能让 Blueprint 过期。

先检查：

```text
Blueprint file
Task Manifest
canonical spec / spec SHA
Execution Brief / Design Gate
owned/shared/exclusive paths
upstream public contracts
frozen migration / ADR / architecture authority
referenced target symbols
```

无实质影响：记录 `DRIFT_REVALIDATED` 后继续。

有实质影响：STOP，由 Spec Compiler 重生成或 revalidate Blueprint。

## 14. Pre-Implementation Drift Check

Implementation Worker 在第一处代码修改前填写：

```text
BLUEPRINT_BASE_COMMIT = {sha}
LATEST_MAIN = {sha}
BASE_MATCH = YES | NO
SPEC_SHA_MATCH = YES | NO | N/A
AUTHORITY_DRIFT = NONE | IRRELEVANT | MATERIAL
RESULT = PROCEED | DRIFT_REVALIDATED | REPOSITORY_DRIFT_STOP
```

## 15. Definition of Done

当前 Task 只有同时满足以下条件才算实现完成：

- [ ] 所有 Required Requirement IDs 有实际实现 mapping；
- [ ] File Change Map 与真实 diff 一致，未越权写 forbidden path；
- [ ] LOCKED decisions 全部保持；
- [ ] required tests 已实现且真实执行；
- [ ] required typecheck/lint/build/architecture/security/concurrency checks 已执行；
- [ ] canonical spec evidence（若 adopted）绑定正确 source SHA；
- [ ] Implementation Report 记录 actual commit / test evidence；
- [ ] Domain Gate 由独立证据裁决，而不是 Blueprint 自证；
- [ ] 没有未报告的 SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT。

## 16. Implementation Worker Handoff

Blueprint 最后一段应给实现 Worker 一个无需重新设计的执行摘要：

```text
START FROM: {base_commit}
READ FIRST: {manifest}, {brief}, {blueprint}, {spec/contract sources}
IMPLEMENT IN ORDER: {01..N}
DO NOT CHANGE: {LOCKED summary}
RUN: {exact commands}
STOP ON: SPEC_CONFLICT | IMPLEMENTATION_BLOCKER | MATERIAL REPOSITORY_DRIFT
FINAL EVIDENCE: {report/evidence/gate paths}
```

### Precision Gate

在把 Blueprint 交给实现 Worker 前，Spec Compiler 必须逐项确认：

```text
Can the Worker identify every target file without architecture discovery?
Can the Worker identify every public/application symbol it must create or modify?
Can the Worker implement the main algorithm without inventing business semantics?
Are transaction/concurrency/idempotency decisions explicit where relevant?
Are error/security/public-contract boundaries explicit?
Are tests specified from observable scenarios?
Is the remaining freedom limited to CONSTRAINED/FREE choices?
```

任一答案为 `NO`，Blueprint 尚未达到“接近伪代码级别”，不得标记 ready。
