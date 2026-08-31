---
status: active
last_updated: 2026-08-31
---

# ZH-LAO V2 Executable Spec System

本规范在既有 V2 文档体系上增加 **Executable Spec Layer** 与其派生的 **Implementation Blueprint Layer**。它不替代产品、Domain、API、Public Contract、Design Brief、Execution Brief、Implementation Report 或既有 Gate；它负责把高层设计压缩成稳定 Requirement、可验证契约，以及足够接近伪代码的实现蓝图，使“强推理 AI 负责想清楚、实现 AI 负责按图落地”成为仓库级协议，而不是聊天习惯。

```text
Authoritative specification
  Product / Domain / Contract authority
        ↓
  Requirement → Use Case → Contract → Acceptance Scenario / State Machine
        ↓
  canonical *.spec.json
        ↓
Derived implementation guidance
  Execution Brief → Implementation Blueprint
        ↓
Implementation and independent evidence
  Code → Test → independently executed machine checks → Gate evidence
```

Implementation Blueprint 是 **derived guidance**，不是新的产品事实源。它必须服从 frozen migration、ADR、权威 Markdown、Public Contract 与 canonical spec；发生冲突时不得靠修改 Blueprint 覆盖上游事实。

本系统从新增或实质变更的 Domain/跨域契约开始采用。既有 Markdown 文档不会被追溯性地标为“已覆盖”，既有实施 Task 也不会因为本规范升级而自动失效，直到对应 Domain/Task 显式采用本层。

## 1. 与当前控制面的关系

现有生命周期扩展为：

```text
Frozen DB / Architecture
→ Product Semantics
→ Use Cases
→ API / Public Contract
→ Design Audit
→ DESIGN_GATE
→ Execution Brief
→ Implementation Blueprint
→ Implementation
→ Tests / Audit
→ DOMAIN_GATE
→ FROZEN
```

接入点如下：

| 当前工件 / Gate | 新增要求 | 不改变的事实 |
| --- | --- | --- |
| Product Semantics、Use Cases、API、Public Contract | 为 mandatory、可验证承诺分配 Requirement ID，并在 canonical spec 记录其来源 | Markdown 继续保存完整的人类语义与决策理由 |
| Design Gate | canonical spec 的 requirement、scenario、state-machine 和 contract 引用通过 `spec:check` | Design Gate 仍只授权进入实现准备，不声明实现完成 |
| Execution Brief | 列出本次必须覆盖的 Requirement IDs、验收场景、测试命令、路径边界和预期 Gate | Brief 不得重编号或暗中新增产品需求 |
| Implementation Blueprint | 把冻结设计编译成 exact file/symbol map、伪代码、事务/并发/错误/安全策略与测试矩阵，并绑定 base commit / spec SHA | Blueprint 不得成为新的 requirement authority，也不得改变 frozen contract |
| Implementation Report / Domain Gate | 附加由机器检查的 derived evidence；每个 mandatory Requirement 必须有实现、测试及实际 check 结果 | 既有安全、并发、DB、架构和回归审计仍是 Gate 条件 |
| DEVELOPMENT_CONTROL_CENTER / Lifecycle Matrix / Progress | 只展示 manifest、report 与 machine gate 产物派生出的状态 | 这些页面仍不是 Domain Gate 的事实源 |

相关控制页的事实优先级扩展为：

```text
Final Gate / independent audit + machine gate evidence
→ Implementation Report
→ Current code + tests / CI
→ Task Manifest / events
→ Progress / Control Center / Lifecycle Matrix
```

Blueprint 的权威优先级始终低于其全部输入 authority。

## 2. Requirement ID 规则

每个 mandatory、可验证的行为、约束、安全属性、并发属性、契约或状态转换必须有一个稳定 ID：

```text
<DOMAIN>-<AREA>-<NNN>
```

例如：`CNT-SEC-001`、`LRN-API-014`、`AUD-STATE-006`、`OPS-RBAC-003`。跨域 requirement 使用拥有该业务语义的 Domain 前缀；纯全局规则使用 `SYS-`。

- `DOMAIN` 使用现有 Domain 缩写；不得因文件名或重排而改变。
- `AREA` 是稳定语义类别，例如 `CORE`、`UC`、`API`、`PUB`、`SEC`、`CON`、`STATE`、`DB`、`RBAC`；不是实施层或任务编号。
- `NNN` 从 `001` 开始递增；已发布的 ID 永不复用、永不重号。
- 更细的说明、测试或场景使用关联 ID，例如 `CNT-SEC-001-AS01`；它们不替代 Requirement ID。
- 已废弃 requirement 保留 ID 并标记 `superseded` / `deferred`，注明 replacement 或原因；不得删除后复用。
- 一个 requirement 只能由一个 canonical spec 定义。其他文档只链接该 ID。

## 3. Authoritative Spec 与 Derived Artifacts

### 3.1 Authoritative

每个采用本系统的 Domain 在 `docs/docs/development/specs/<domain>.spec.json` 维护 canonical、版本控制的 machine-readable spec。它必须定义：

- requirements 及其 Markdown authority references；
- use cases 与 requirement 映射；
- API / public / DB / event / state-machine contract references；
- acceptance scenarios；
- 状态、合法 transition、guard 与 terminal-state 语义。

`*.spec.json` 不复制完整 Markdown，也不取代 frozen migration、ADR 或 Public Contract。冲突时仍按现有 Source-of-Truth 规则解决；canonical spec 必须在同一变更中修正或进入 Spec Change Protocol。

### 3.2 Derived Evidence

`docs/docs/development/specs/evidence/<domain>.evidence.json` 是 derived evidence，必须精确绑定 source spec 的 SHA-256。它记录 implementation references、test references、check 命令和实际执行结果，不能定义或修改 requirement 语义。

### 3.3 Derived Implementation Blueprint

Implementation Blueprint 是从 frozen design、Execution Brief、canonical spec 与**当前仓库结构**编译出的代码级说明书。标准模板：

`docs/docs/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE.md`

推荐按 Domain/Task 保存为：

```text
docs/docs/development/<domain-folder>/<TASK>_IMPLEMENTATION_BLUEPRINT.md
```

它必须绑定：

```text
repository
branch
base_commit
Task ID
Execution Brief
Design Gate
canonical spec path + source_spec_sha256（若该 Domain 已 adopted）
关键 upstream contract snapshot
```

Blueprint 可以失效、重生成或 supersede；Requirement ID 不因此变化。

以下均为 derived views，不得独立宣称 Gate PASS：Implementation Blueprint、traceability matrix、Control Center、Lifecycle Matrix、Progress、Implementation Report 摘要、测试报告和 CI 页面。

如果 canonical spec 与其 evidence SHA 不一致：

```text
SPEC_DRIFT = FAIL
dependent implementation gate = NOT PASS
```

如果 Blueprint 绑定的 spec SHA 或 authority snapshot 已发生实质变化：

```text
REPOSITORY_DRIFT = STOP
Blueprint must be regenerated or explicitly revalidated
```

## 4. Traceability 完整性

每个 `mandatory` requirement 在 Domain Gate 前必须具有完整链路：

```text
Requirement ID
→ at least one Use Case
→ at least one API/Public/DB/Event/State-machine contract reference
→ Implementation Blueprint mapping（采用 Blueprint 的 Task）
→ implementation reference
→ test reference
→ executed gate check / immutable evidence
```

Blueprint 的 Requirement Trace 表必须逐项说明：

```text
Requirement ID
→ target file(s)
→ target symbol(s)
→ algorithm / invariant
→ test scenario(s)
```

一个 test 可以覆盖多个 requirement，但 evidence 必须逐项列出映射。只写“全量测试通过”、只引用类/目录、或让 AI 叙述“应该覆盖”都不是 traceability evidence。

## 5. Machine-readable Contract 规则

Machine-readable contract 是对精确、可自动解析或验证事实的规范层，不是另一份 Markdown 摘要。

- HTTP 契约优先使用 OpenAPI/JSON Schema；内部 public contract 优先使用可执行 schema（如 Zod）或 JSON Schema，并明确 authoritative source。
- DB physical truth 仍是 frozen migration；spec 只引用 migration/accepted DB contract，不能在 JSON 中复制出第二套 schema。
- 每个 contract reference 必须有 `kind`、repository `path` 与稳定 `symbol` / operation / schema name。
- contract 生成的 TypeScript、文档页或客户端 SDK 均为 derived output，禁止反向修改为新事实。
- 无法机器表达的决策仍放在权威 Markdown，并标记为 `manual`；不得伪装成自动验证。

本层不为尚未实施的 Domain 虚构 OpenAPI、Zod、测试或 PASS。

## 6. 状态机与验收场景

凡有生命周期、异步任务、资金、权限或不可逆状态的业务语义，必须声明 state machine。每个 state machine 至少给出：

```text
states, initial state, terminal states, legal transitions, guards, owning requirements
```

不得只在 prose 中暗示 transition。状态机测试必须覆盖合法 transition、非法 transition 被拒绝、guard 与幂等/重试语义。

每个可观察的 requirement 至少关联一个 acceptance scenario，以 `Given / When / Then` 表达前置事实、动作和可观察结果。scenario 绑定 requirement 和 use case；它既是验收语言，也是测试设计的来源，而不是可选示例。

## 7. Implementation Blueprint 精度标准

Blueprint 的目标不是“再写一份 Implementation Plan”，而是把剩余设计自由度压缩到局部编码层。每个非平凡实现项至少回答：

```text
WHERE   → exact file path
WHAT    → exact/new/modified symbol
INPUT   → request / command / function input
OUTPUT  → return / response / event
HOW     → ordered pseudocode / data flow
STATE   → transaction / locking / idempotency / concurrency semantics
FAIL    → error branches and mapping
BOUNDARY→ public contract / cross-domain dependency
TEST    → exact test file + scenarios
```

Blueprint 必须包含：

1. Task Metadata 与 authority snapshot；
2. Required Requirement IDs；
3. Allowed / Forbidden Paths；
4. File Change Map（CREATE / MODIFY / DELETE / TEST）；
5. Symbol Contracts；
6. ordered pseudocode / data flow；
7. transaction boundaries；
8. concurrency / idempotency rules；
9. error mapping；
10. security / permission constraints；
11. integration / public contract calls；
12. test matrix；
13. implementation order；
14. Decision Budget；
15. Conflict Protocol；
16. Definition of Done。

### 7.1 Decision Budget

每份 Blueprint 必须将实现决策分为：

```text
LOCKED
- API path / request / response
- public interfaces
- DB / transaction boundary
- state transitions
- error semantics
- cross-domain contract
- permission / security invariants

CONSTRAINED
- private helper decomposition
- internal private symbol names
- query/helper organization
- local refactoring within declared boundaries

FREE
- local variable names
- formatting
- comments
- equivalent private implementation details that cannot affect observable behavior
```

Implementation Worker 不得修改 `LOCKED` 决策；超出 `CONSTRAINED` 范围必须升级为冲突，而不是自行“优化设计”。

### 7.2 Blueprint 不是代码生成模板

Blueprint 可以包含 TypeScript/SQL-like pseudocode，但不得伪造实际存在的 symbol、migration、contract 或 test。若当前仓库没有足够事实支持 exact symbol，Spec Compiler 必须把它标成明确的 CREATE decision，而不是假装已存在。

## 8. 强设计 / 机械实现协作模型

推荐职责切分：

```text
design_worker = Architect / Spec Compiler
  Repository Audit
  → Product / Architecture reasoning
  → Executable Spec
  → Design Gate
  → Execution Brief
  → Implementation Blueprint

backend_worker / admin_worker / client_worker = Implementation Worker
  Verify snapshot
  → implement Blueprint
  → tests
  → evidence
  → Gate
```

实现 Worker 的默认原则是：**发现设计缺口时不上升为架构师。**

只能在 Decision Budget 允许范围内自行决策。否则使用下面的 Conflict Protocol。

## 9. Conflict Protocol

实现阶段至少区分三类停止原因：

### `SPEC_CONFLICT`

Blueprint、Execution Brief、canonical spec、Public Contract、frozen migration/ADR 之间存在不可同时满足的语义冲突。

处理：STOP；给出 exact sources / Requirement IDs；不得自行选择一个版本继续。

### `IMPLEMENTATION_BLOCKER`

设计本身不冲突，但 Blueprint 缺少实现所必需且超出 Decision Budget 的信息，例如未裁决 transaction ownership、error semantics 或 public boundary。

处理：STOP；报告最小缺口；由 Spec Compiler 补齐 Blueprint/authority。

### `REPOSITORY_DRIFT`

Blueprint 生成后的 main 已修改其 authority、spec SHA、owned/shared path、关键 symbol 或 upstream contract，导致 Blueprint 可能过期。

处理：对 `base_commit..latest_main` 做相关性检查。若变化与 Blueprint 无关，可以继续并记录 `DRIFT_REVALIDATED`；若有实质影响，STOP 并重生成/重验证 Blueprint。

禁止用以下方式处理上述冲突：

- Implementation Worker 自行修改 requirement；
- 偷改 Public Contract 以适配实现；
- 改 frozen migration；
- 扩大 Task scope；
- 用“当前代码看起来更合理”覆盖 authority；
- 用聊天上下文替代 repository evidence。

## 10. Machine Gate 与独立性

`python scripts/check_executable_specs.py` 是 Executable Spec Layer 的结构 Gate。它验证 canonical/derived 边界、ID、引用、traceability、scenario、state-machine 和 spec SHA drift。CI 的 Docs job会运行该检查。

当 Domain 有 canonical spec 后，其 Domain Gate 前还必须使用：

```text
python scripts/check_executable_specs.py --domain <domain> --require-evidence
```

只有 checker 成功、相关测试/contract/architecture/DB command 的真实结果均成功、且现有独立审计无 BLOCKER/HIGH，才可把 machine-gate evidence 作为 Domain Gate 的输入。

Blueprint 本身不自证实现正确，也不把 pseudocode 计为 implementation evidence。

**AI、实现 Worker、Implementation Report、Blueprint 或手工编辑 JSON 均不得自证 `PASS`。** 下列情形一律不是 PASS：

- evidence 没有对应 source spec SHA；
- mandatory requirement 缺 implementation、test 或 executed check；
- check 仅写命令/预期，未记录实际 exit code、commit 与可定位 artifact；
- 检查由同一变更的声明文本代替实际执行；
- 任何 checker、测试、contract、architecture、DB 或现有 mandatory Gate 失败/未执行。

Machine checker 的成功只说明它检查的结构/证据范围成功；它不覆盖人工设计判断，也不覆盖未接入的 Domain。

## 11. Spec / Blueprint Change Protocol

改变 requirement、contract、scenario、state machine 或其映射时，必须在同一 PR/提交中执行：

1. 以 `SC-<YYYY>-<NNN>` 创建 change record（可放在 PR 描述或 `specs/changes/`）；说明原因、owner、受影响 Requirement IDs、authority references、兼容性与 migration 判断。
2. 更新 authoritative Markdown 与 canonical spec；若有替代，保留旧 ID 的 `superseded` 记录和 replacement。
3. 失效或更新 derived evidence；source SHA 不一致时不得沿用旧 PASS。
4. 失效、重生成或明确 revalidate 受影响 Blueprint。
5. 更新实现、tests、machine-readable contract 和 affected public consumers；必要时按既有规则先走 ADR / forward-only migration。
6. 重跑所有受影响 checks 与现有 Design/Implementation Gate；在 report 中记录实际结果。

如果只改变 private implementation detail，且未改变任何 authority / Requirement / public behavior，则不需要创建 Spec Change Record；但 Blueprint 如已过时，应更新其 base snapshot 或标记 superseded。

紧急修复也不能绕过该协议；可以先标记 `RECOVERY_REQUIRED`，但不得把未确认的聊天推论写成 requirement。重大 finding 继续遵守 Control Center Grounding Gate。

## 12. 文件与采用流程

```text
docs/docs/development/
├── SPEC_SYSTEM.md                            # 本规范（authoritative）
├── IMPLEMENTATION_BLUEPRINT_TEMPLATE.md      # derived implementation template
└── specs/
    ├── README.md                             # registry 与采用说明
    ├── executable-spec.schema.json           # canonical/derived evidence schema
    ├── index.json                            # 已正式采用的 Domain registry
    ├── <domain>.spec.json                    # authoritative canonical spec
    └── evidence/<domain>.evidence.json       # derived evidence
scripts/check_executable_specs.py              # machine check
```

采用一个 Domain 的最小顺序：

```text
Design package 定义/冻结 requirement + scenario
→ canonical spec + structure check
→ Design Gate
→ Execution Brief
→ Implementation Blueprint
→ Implementation Worker
→ evidence
→ --require-evidence
→ Domain Gate
```

对于 **新采用 Executable Spec 的 implementation Task**，Task Manifest 必须指向 Blueprint。对于本规范启用前已存在的 Task，不做追溯性强制；只有当其 Manifest 显式设置 Blueprint required，或后续发生实质 design/contract revision 时，才升级到本流程。

## 13. 当前状态

本系统基础设施已启用，但 `index.json` 当前没有将既有 Domain 追溯性声明为 adopted。因而：

```text
SPEC_SYSTEM_INFRASTRUCTURE_CHECK = PASS only after CI/checker succeeds
IMPLEMENTATION_BLUEPRINT_PROTOCOL = ACTIVE_FOR_NEW_OR_EXPLICITLY_ADOPTED_TASKS
ANY_EXISTING_DOMAIN_EXECUTABLE_SPEC_COVERAGE = NOT_CLAIMED
```

这避免用新制度覆盖旧事实，也避免把文档/Blueprint 基础设施误报为任一业务 Domain 的 Gate PASS。
