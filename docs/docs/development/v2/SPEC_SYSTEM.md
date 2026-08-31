---
status: active
last_updated: 2026-08-31
---

# ZH-LAO V2 Executable Spec System

本规范在既有 V2 文档体系上增加 **Executable Spec Layer**。它不替代产品、Domain、API、Public Contract、Design Brief、Execution Brief、Implementation Report 或既有 Gate；它把其中可验证的承诺赋予稳定 ID、可解析映射和可独立复跑的证据。

```text
Authoritative specification
  Requirement → Use Case → Contract → Acceptance Scenario / State Machine
                                      ↓
Derived traceability and evidence
  Implementation → Test → independently executed machine checks → Gate evidence
```

本系统从新增或实质变更的 Domain/跨域契约开始采用。既有 Markdown 文档不会被追溯性地标为“已覆盖”，直到该 Domain 提交自己的 canonical spec 与独立证据。

## 1. 与当前控制面的关系

现有生命周期保持不变：

```text
Frozen DB / Architecture → Product Semantics → Use Cases → API / Public Contract
→ Design Audit → DESIGN_GATE → Execution Brief → Implementation
→ Tests / Audit → DOMAIN_GATE → FROZEN
```

Executable Spec Layer 的接入点如下：

| 当前工件 / Gate | 新增要求 | 不改变的事实 |
| --- | --- | --- |
| Product Semantics、Use Cases、API、Public Contract | 为 mandatory、可验证承诺分配 Requirement ID，并在 canonical spec 记录其来源 | Markdown 继续保存完整的人类语义与决策理由 |
| Design Gate | canonical spec 的 requirement、scenario、state-machine 和 contract 引用通过 `spec:check` | Design Gate 仍只授权进入 Backend Entry Audit，不声明实现完成 |
| Execution Brief | 列出本次必须覆盖的 Requirement IDs、验收场景、测试命令和预期 Gate check | Brief 不得重编号或暗中新增产品需求 |
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

## 2. Requirement ID 规则

每个 mandatory、可验证的行为、约束、安全属性、并发属性、契约或状态转换必须有一个稳定 ID：

```text
<DOMAIN>-<AREA>-<NNN>
```

例如：`CNT-SEC-001`、`LRN-API-014`、`AUD-STATE-006`、`OPS-RBAC-003`。跨域 requirement 使用拥有该业务语义的 Domain 前缀；纯全局规则使用 `SYS-`。

- `DOMAIN` 使用现有 Domain 缩写；不得因文件名或重排而改变。
- `AREA` 是稳定的语义类别，例如 `CORE`、`UC`、`API`、`PUB`、`SEC`、`CON`、`STATE`、`DB`、`RBAC`；不是实施层或任务编号。
- `NNN` 从 `001` 开始递增；已发布的 ID 永不复用、永不重号。
- 更细的说明、测试或场景使用关联 ID，例如 `CNT-SEC-001-AS01`；它们不替代 Requirement ID。
- 已废弃 requirement 保留 ID 并标记 `superseded` / `deferred`，注明 replacement 或原因；不得删除后复用。
- 一个 requirement 只能由一个 canonical spec 定义。其他文档只链接该 ID。

## 3. Authoritative Spec 与 Derived View

### 3.1 Authoritative

每个采用本系统的 Domain 在 `docs/docs/development/v2/specs/<domain>.spec.json` 维护 canonical、版本控制的 machine-readable spec。它必须定义：

- requirements 及其 Markdown authority references；
- use cases 与 requirement 映射；
- API / public / DB / event / state-machine contract references；
- acceptance scenarios；
- 状态、合法 transition、guard 与 terminal-state 语义。

`*.spec.json` 不复制完整 Markdown，也不取代 frozen migration、ADR 或 Public Contract。冲突时仍按现有 Source-of-Truth 规则解决；canonical spec 必须在同一变更中修正或进入 Spec Change Protocol。

### 3.2 Derived

`docs/docs/development/v2/specs/evidence/<domain>.evidence.json` 是 derived evidence，必须精确绑定 source spec 的 SHA-256。它记录 implementation references、test references、check 命令和实际执行结果，不能定义或修改 requirement 语义。

以下均为 derived views，不得独立宣称 Gate PASS：traceability matrix、Control Center、Lifecycle Matrix、Progress、Implementation Report 的摘要、测试报告和 CI 页面。

如果 canonical spec 与其 evidence SHA 不一致：

```text
SPEC_DRIFT = FAIL
dependent implementation gate = NOT PASS
```

## 4. Traceability 完整性

每个 `mandatory` requirement 在 Domain Gate 前必须具有一条完整链路：

```text
Requirement ID
→ at least one Use Case
→ at least one API/Public/DB/Event/State-machine contract reference
→ implementation reference
→ test reference
→ executed gate check / immutable evidence
```

一个 test 可以覆盖多个 requirement，但 evidence 必须逐项列出映射。只写“全量测试通过”、只引用类/目录、或让 AI 叙述“应该覆盖”都不是 traceability evidence。

## 5. Machine-readable Contract 规则

Machine-readable contract 是对精确、可自动解析或验证事实的规范层，不是另一份 Markdown 摘要。

- HTTP 契约优先使用 OpenAPI/JSON Schema；内部 public contract 优先使用可执行 schema（如 Zod）或 JSON Schema，并明确 authoritative source。
- DB physical truth 仍是 frozen migration；spec 只引用 migration/accepted DB contract，不能在 JSON 中复制出第二套 schema。
- 每个 contract reference 必须有 `kind`、repository `path` 与稳定 `symbol` / operation / schema name。
- contract 生成的 TypeScript、文档页或客户端 SDK 均为 derived output，禁止反向修改为新事实。
- 无法机器表达的决策仍放在权威 Markdown，并标记为 `manual`；不得伪装成自动验证。

本次基础设施只增加 schema 与 checker，不为尚未实施的 Domain 虚构 OpenAPI、Zod、测试或 PASS。

## 6. 状态机与验收场景

凡有生命周期、异步任务、资金、权限或不可逆状态的业务语义，必须声明 state machine。每个 state machine 至少给出：

```text
states, initial state, terminal states, legal transitions, guards, owning requirements
```

不得只在 prose 中暗示 transition。状态机测试必须覆盖合法 transition、非法 transition 被拒绝、guard 与幂等/重试语义。

每个可观察的 requirement 至少关联一个 acceptance scenario，以 `Given / When / Then` 表达前置事实、动作和可观察结果。scenario 绑定 requirement 和 use case；它既是验收语言，也是测试设计的来源，而不是可选示例。

## 7. Machine Gate 与独立性

`python scripts/check_executable_specs.py` 是本层的结构 Gate。它验证 canonical/derived 边界、ID、引用、traceability、scenario、state-machine 和 spec SHA drift。CI 的 Docs job 会运行该检查。

当 Domain 有 canonical spec 后，其 Domain Gate 前还必须使用：

```text
python scripts/check_executable_specs.py --domain <domain> --require-evidence
```

只有 checker 成功、相关测试/contract/architecture/DB command 的真实结果均成功、且现有独立审计无 BLOCKER/HIGH，才可把 machine-gate evidence 作为 Domain Gate 的输入。

**AI、实现 Worker、Implementation Report 或手工编辑 JSON 均不得自证 `PASS`。** 下列情形一律不是 PASS：

- evidence 没有对应 source spec SHA；
- mandatory requirement 缺 implementation、test 或 executed check；
- check 仅写命令/预期，未记录实际 exit code、commit 与可定位 artifact；
- 检查由同一变更的声明文本代替实际执行；
- 任何 checker、测试、contract、architecture、DB 或现有 mandatory Gate 失败/未执行。

Machine checker 的成功只说明它检查的结构/证据范围成功；它不覆盖人工设计判断，也不覆盖未接入的 Domain。

## 8. Spec Change Protocol

改变 requirement、contract、scenario、state machine 或其映射时，必须在同一 PR/提交中执行：

1. 以 `SC-<YYYY>-<NNN>` 创建 change record（可放在 PR 描述或 `specs/changes/`）；说明原因、owner、受影响 Requirement IDs、authority references、兼容性与 migration 判断。
2. 更新 authoritative Markdown 与 canonical spec；若有替代，保留旧 ID 的 `superseded` 记录和 replacement。
3. 失效或更新 derived evidence；source SHA 不一致时不得沿用旧 PASS。
4. 更新实现、tests、machine-readable contract 和 affected public consumers；必要时按既有规则先走 ADR / forward-only migration。
5. 重跑所有受影响 checks 与现有 Design/Implementation Gate；在 report 中记录实际结果。

紧急修复也不能绕过该协议；可以先标记 `RECOVERY_REQUIRED`，但不得把未确认的聊天推论写成 requirement。重大 finding 继续遵守 Control Center Grounding Gate。

## 9. 文件与采用流程

```text
docs/docs/development/v2/
├── SPEC_SYSTEM.md                         # 本规范（authoritative）
└── specs/
    ├── README.md                          # 目录与采用说明
    ├── executable-spec.schema.json        # canonical/derived 格式 schema
    ├── index.json                         # 已正式采用的 Domain registry
    ├── <domain>.spec.json                 # future: authoritative canonical spec
    └── evidence/<domain>.evidence.json    # future: derived evidence
scripts/check_executable_specs.py           # machine check
```

采用一个 Domain 的最小顺序是：先在 Design package 定义/冻结 requirement 和 scenario → 新增 canonical spec 并通过结构检查 → Design Gate 记录采用 → Execution Brief 列出 Required IDs 与 check commands → 实施后新增 evidence 并在 Domain Gate 使用 `--require-evidence`。

## 10. 当前状态

本系统基础设施已启用，但 `index.json` 当前没有将既有 Domain 追溯性声明为 adopted。因而：

```text
SPEC_SYSTEM_INFRASTRUCTURE_CHECK = PASS only after CI/checker succeeds
ANY_EXISTING_DOMAIN_EXECUTABLE_SPEC_COVERAGE = NOT_CLAIMED
```

这避免用新制度覆盖旧事实，也避免把文档基础设施误报为任一业务 Domain 的 Gate PASS。
