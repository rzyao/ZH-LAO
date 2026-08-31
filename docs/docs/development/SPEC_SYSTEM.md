---
status: active
last_updated: 2026-08-31
---

# ZH-LAO Executable Spec System

本规范定义 ZH-LAO 的 **Spec-Driven AI Development** 协议。目标不是增加一层“说明文档”，而是把已经裁决的产品 / Domain / Feature / System 事实编译成稳定、可检查、可追踪的 machine-readable specification，再由 Implementation Blueprint 把实现自由度压缩到局部编码层。

```text
Authoritative Markdown / Migration / ADR / Public Contract
        ↓
Requirement → Use Case → Contract → Acceptance Scenario / State Machine
        ↓
canonical executable spec
        ↓
DESIGN_GATE（包含 spec:check）
        ↓
Task Manifest → Execution Brief → Implementation Blueprint
        ↓
Implementation → Test → Machine Evidence → Independent Audit
        ↓
Domain / Feature / System Gate
```

Executable Spec 是 **MUST BE TRUE 的可执行索引层**；它不复制完整业务说明，也不取代 frozen migration、ADR、Domain authority、Feature authority 或 Public Contract。

Implementation Blueprint 是 **derived implementation guidance**，权威永远低于其输入 authority 与 canonical spec。

## 1. 默认采用规则

从本规范启用后，**新的正式开发 Task 默认必须使用 Executable Spec**。不得再使用“如采用 / 可选采用”作为 Implementation Worker 自行跳过 Spec 的理由。

允许豁免仅限：

1. `legacy_pre_spec`：本规范启用前已经存在、且本次不发生实质 design / contract revision 的历史 Task；
2. `docs_only`：纯文档整理，不改变任何 observable product / contract / implementation behavior；
3. `private_refactor`：只改变私有实现细节，不改变 observable behavior、public contract、DB contract、state machine 或 requirement；
4. `recovery_no_semantic_change`：只恢复已冻结行为，不改变 requirement / contract / state machine。

任何豁免都必须在 Task Manifest 中显式记录：

```yaml
executable_spec:
  required: false
  exemption: docs_only | private_refactor | legacy_pre_spec | recovery_no_semantic_change
  reason: <repository-grounded reason>
```

只要 Task 新增或实质改变下列任一内容，豁免立即失效：

```text
产品可观察行为
API / Public Contract
DB contract
state machine
permission / security invariant
concurrency / idempotency invariant
cross-domain contract
acceptance behavior
```

既有已完成 Domain 不做追溯性伪造 coverage；它们原有 Gate / FROZEN 事实继续有效。下一次发生实质设计/契约变更时再正式 adopt。

## 2. Spec Scope：Domain / Feature / System

Executable Spec 的 scope 不再等同于 Domain。正式支持：

```text
domain   → 一个业务 Domain 自己拥有的 canonical behavior
feature  → 一个端到端用户/运营能力，跨 Backend/Admin/Mobile/Integration
system   → Foundation / Infrastructure / 全局系统能力
```

canonical path：

```text
docs/docs/development/specs/
├── domains/<scope-id>.spec.json
├── features/<scope-id>.spec.json
└── system/<scope-id>.spec.json
```

示例：

```text
domain:content
feature:login
system:mobile-foundation
```

Feature Spec 不得复制参与 Domain 的 canonical 业务事实；它只拥有端到端编排、体验、integration 与 acceptance 中真正属于 Feature 的 requirement，并通过 contract reference 指向 Domain authority。

## 3. Registry 与 Coverage Authority

正式 adoption 的唯一 registry：

```text
docs/docs/development/specs/index.json
```

格式：

```json
{
  "schema_version": "1.1",
  "adopted_scopes": [
    { "scope_type": "domain", "scope_id": "content" }
  ]
}
```

只有进入 `adopted_scopes` 的 scope 才可以宣称 Executable Spec Coverage。

人类可读覆盖视图：

```text
docs/docs/development/SPEC_COVERAGE_MATRIX.md
```

它是 derived view；如果与 `index.json` 冲突，以 `index.json` + checker 结果为准。

## 4. Requirement ID

每个 mandatory、可验证的行为、约束、安全属性、并发属性、契约或状态转换必须拥有稳定 ID：

```text
<PREFIX>-<AREA>-<NNN>
```

常见 AREA：

```text
CORE  UC  API  PUB  SEC  CON  STATE  DB  RBAC
```

示例：

```text
CNT-SEC-001
LRN-API-014
AUD-STATE-006
OPS-RBAC-003
LOGIN-UC-002
SYS-001
```

规则：

- ID 发布后永不复用；
- 文件移动、Task 重排、Blueprint 重生成都不能改变 Requirement ID；
- superseded/deferred requirement 保留原 ID 与状态，不删除后重号；
- 一个 Requirement 只能由一个 canonical spec 定义；其他文档只引用；
- acceptance scenario 使用关联 ID，例如 `CNT-SEC-001-AS01`。

## 5. Canonical Spec

每个 adopted scope 的 canonical spec 至少定义：

```text
scope_type / scope_id
requirements
use_cases
contract references
acceptance_scenarios
state_machines
```

每个 Requirement 至少包含：

```text
id
status
normative statement
authority_refs
use_case_ids
contract_refs
acceptance_scenario_ids
state_machine_ids
```

canonical spec 不应把 Markdown 全文复制成 JSON。它的职责是：

> 把权威事实压缩成可机器遍历的 obligation graph。

冲突优先级仍遵守仓库事实源：frozen migration / ADR / authoritative Domain or Feature docs / Public Contract。发现冲突时必须修正 authority 与 canonical spec，不能让 JSON 私自覆盖上游事实。

## 6. Traceability

每个 mandatory Requirement 在最终实现 Gate 前必须能够追踪：

```text
Requirement
→ Use Case
→ Contract
→ Acceptance Scenario / State Machine
→ Implementation Blueprint mapping
→ implementation reference
→ test reference
→ executed gate check
```

只写以下内容都不算 evidence：

```text
“全部测试通过”
“代码应该覆盖”
只引用一个目录
只写测试命令但没有实际执行结果
Blueprint pseudocode
```

一个测试可以覆盖多个 Requirement，但 evidence 必须逐项列出映射。

## 7. Acceptance Scenario

每个可观察 Requirement 至少关联一个 `Given / When / Then` scenario：

```text
Given  前置事实
When   执行动作
Then   可观察结果 / invariant
```

Scenario 是验收与测试设计输入，不是 illustrative 示例。

## 8. State Machine

凡存在生命周期、异步任务、资金、权限、发布、不可逆状态的业务语义，必须显式声明：

```text
states
initial_state
terminal_states
legal transitions
guards
owning requirement IDs
```

测试至少覆盖：

```text
合法 transition
非法 transition rejection
guard
terminal-state behavior
并发 / retry / idempotency（适用时）
```

不得只在 prose 中暗示状态转换。

## 9. Machine-readable Contract

精确契约优先引用仓库真实 artifact：

- HTTP：OpenAPI / JSON Schema / Zod / frozen HTTP contract；
- public module：可执行 TypeScript schema/interface 或 frozen Public Contract；
- DB：frozen migration 是 physical truth；Spec 只引用，不复制第二套 schema；
- event：真实 event schema / authority；
- state machine：canonical spec + authoritative lifecycle docs。

每个 contract reference 至少有 repository-relative `path`，并尽量提供 `kind` 与稳定 `symbol`。

禁止为尚未实现的 Domain 伪造“已存在的 OpenAPI / TypeScript symbol / test”。如果 Blueprint 需要新 symbol，必须明确标记 CREATE。

## 10. Design Gate 中的 Spec Check

ZH-LAO **不新增独立 `SPEC_READY_GATE`**。避免 Gate 膨胀，Spec readiness 直接成为现有 Design Gate / Implementation Prep 的 mandatory input。

对 adopted scope：

```text
python scripts/check_executable_specs.py --scope <type:id>
```

Domain 兼容入口：

```text
python scripts/check_executable_specs.py --domain <domain>
```

只有 checker PASS，才允许把“Spec 结构完整”作为 Design/Prep 输入。

Checker 验证的是：

```text
registry
scope identity
Requirement ID
repository references
Requirement ↔ Use Case
Requirement ↔ Acceptance Scenario
Requirement ↔ State Machine
state / transition / guard
canonical/evidence SHA drift
implementation evidence coverage（--require-evidence）
```

Checker PASS 不等于 Domain/Feature/System Gate PASS。

CI 的 Docs Job 必须执行：

```text
python scripts/check_executable_specs.py
```

任何 adopted scope 结构失败都会使 CI 失败。

## 11. Derived Evidence

实现 evidence 保存于：

```text
docs/docs/development/specs/evidence/
├── domains/<scope-id>.evidence.json
├── features/<scope-id>.evidence.json
└── system/<scope-id>.evidence.json
```

Evidence 必须包含 canonical spec SHA-256：

```text
source_spec
source_spec_sha256
Requirement → implementation_refs / test_refs / check_ids
gate_checks → command / commit / exit_code / artifact
```

实现 Gate 前：

```text
python scripts/check_executable_specs.py --scope <type:id> --require-evidence
```

若 source SHA 不一致：

```text
SPEC_DRIFT = FAIL
```

AI、Implementation Report、手工 JSON、Blueprint 都不能自证 PASS。

## 12. Implementation Blueprint

Blueprint 是把冻结设计编译成代码级执行说明书。每个非平凡项至少回答：

```text
WHERE    exact file
WHAT     exact/new/modified symbol
INPUT    request / command / function input
OUTPUT   result / response / event
HOW      ordered pseudocode / data flow
STATE    transaction / lock / idempotency / concurrency
FAIL     error branches / mapping
BOUNDARY public/cross-domain contract
TEST     exact test target + scenario
```

Blueprint 必须绑定：

```text
repository
branch
base_commit
Task ID
Execution Brief
canonical spec path
source_spec_sha256
authority snapshot
```

Decision Budget：

```text
LOCKED
- API/Public/DB contract
- state transition
- transaction boundary
- error semantics
- security/RBAC invariant
- cross-domain boundary

CONSTRAINED
- private helper decomposition
- internal private symbol naming
- query/helper organization

FREE
- local variable
- formatting/comment
- 无法影响 observable behavior 的等价私有细节
```

Implementation Worker 不得修改 LOCKED 决策。

## 13. Task Manifest 强制绑定

新正式开发 Task 默认：

```yaml
executable_spec:
  required: true
  scope_type: domain | feature | system
  scope_id: content
  path: docs/docs/development/specs/domains/content.spec.json
  sha256: <64-char sha256>
```

Implementation Task 还必须：

```yaml
implementation_blueprint:
  required: true
  path: ...
  base_commit: ...
  canonical_spec:
    adopted: true
    scope_type: domain
    scope_id: content
    path: ...
    sha256: ...
```

Manifest 不能通过 `required: false` 沉默跳过；必须使用第 1 节允许的 exemption 并写 reason。

## 14. Conflict Protocol

实现阶段只允许以下停止结论：

### `SPEC_CONFLICT`

canonical spec、authority、Public Contract、migration、Blueprint 无法同时满足。

处理：STOP；列出 exact sources + Requirement IDs；Implementation Worker 不得自行选一个版本。

### `IMPLEMENTATION_BLOCKER`

设计不冲突，但缺少超出 Decision Budget 的实现必要裁决。

处理：STOP；报告最小缺口；由设计/Spec Compiler 补齐。

### `REPOSITORY_DRIFT`

Blueprint 生成后，main 的 authority / spec SHA / owned path / target symbol / upstream contract 发生 material change。

处理：比较 `base_commit..latest_main`；无关变化可记录 `DRIFT_REVALIDATED`，有实质影响必须重生成/重验证 Blueprint。

禁止通过以下手段继续：

- 自行改 Requirement；
- 偷改 Public Contract；
- 改 frozen migration；
- 扩大 Task scope；
- 用聊天记忆替代 repository evidence；
- 用“当前代码更合理”覆盖 authority。

## 15. Spec Change Record

改变已经 adopted 的 Requirement、Contract、Acceptance Scenario、State Machine 或其映射时，必须创建永久 change record：

```text
docs/docs/development/specs/changes/SC-YYYY-NNN.yaml
```

**PR 描述不能代替 change record。** PR / commit message 可以引用它，但 canonical 记录必须进入仓库。

Change Record 至少说明：

```text
change_id
reason
owner/scope
affected Requirement IDs
authority references
compatibility impact
DB / migration impact
consumer impact
required revalidation
```

同一变更还必须：

1. 更新 authoritative docs 与 canonical spec；
2. superseded Requirement 保留旧 ID；
3. 失效或更新旧 evidence；
4. 失效 / regenerate / revalidate Blueprint；
5. 更新 implementation/tests/consumers（适用时）；
6. 重跑 checker 与既有 Gate。

纯 private implementation detail 且 observable behavior 不变，不需要 SC；Blueprint snapshot 如过时仍应更新。

首次把已冻结 authority **编码成 canonical spec**，若没有改变任何业务语义，不属于 Spec Change，不需要伪造 SC。

## 16. 文件布局

```text
docs/docs/development/
├── SPEC_SYSTEM.md
├── SPEC_COVERAGE_MATRIX.md
├── IMPLEMENTATION_BLUEPRINT_TEMPLATE.md
└── specs/
    ├── README.md
    ├── executable-spec.schema.json
    ├── index.json
    ├── domains/*.spec.json
    ├── features/*.spec.json
    ├── system/*.spec.json
    ├── evidence/
    │   ├── domains/*.evidence.json
    │   ├── features/*.evidence.json
    │   └── system/*.evidence.json
    └── changes/SC-YYYY-NNN.yaml
scripts/check_executable_specs.py
```

## 17. 标准生命周期

```text
产品 / Domain / Feature / System 设计
→ Requirement IDs
→ Use Cases
→ Workflows / State Machines
→ Contracts
→ Acceptance Scenarios
→ canonical Executable Spec
→ spec:check
→ DESIGN_GATE
→ Task Manifest
→ Execution Brief
→ Implementation Blueprint
→ Implementation
→ Tests
→ Derived Evidence
→ --require-evidence
→ Independent Audit
→ Domain / Feature / System Gate
→ FROZEN / DELIVERED
```

这条链路是新正式开发的默认路径，而不是可选增强。
