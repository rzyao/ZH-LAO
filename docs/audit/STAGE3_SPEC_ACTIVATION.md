# Stage 3 — Activate Spec Kit Governance

**Repository**: `C:\project\ZH-LAO`
**Design baseline**: `docs/audit/STAGE2_SPEC_CONSOLIDATION.md`（已批准）
**Date**: 2026-09-02
**Status**: ✅ COMPLETE — Stage 3 已落地，按要求停止（未进入迁移 / 删除 / 新 Spec 生成）。

---

## 0. 执行摘要

Stage 3 的目标是把 GitHub **Spec Kit 1.0.3** 实际激活为 ZH-LAO 的**唯一 Feature Spec 工作流**，并以 Constitution + 模板 + AGENTS.md 三层承接 Stage 2 设计的治理约束。

- 本机已安装的 Spec Kit 1.0.3 **确实支持** extension hook 机制（`extensions.yml` 的 `hooks.before_specify / before_plan / before_analyze / before_checklist`），但**不随附**任何「读取权威文档 / 扫描现有代码」的可调用命令。因此 Stage 2 §4/§6 设想的接地自动化只能回退到 **Constitution + 模板区块 + AGENTS.md**（这是允许的回退路径，已在 Constitution 中写明）。
- Spec Kit 原生产物（`spec.md / plan.md / tasks.md`）的权威**低于**其输入 authority（Constitution 原则 I）。
- 旧自建 Executable Spec System 全部标记 `superseded`，**保留不删**（符合 req #6 / #7 / #8）。
- 唯一未解决 blocker：`content.spec.json` 中 55 个 `CNT-*` Requirement ID 在 canonical 域文档树 `docs/docs/domains/content/` 中**无唯一权威来源** → 按 req #7 STOP，原样保留并标记 `superseded`，未删除、未丢失。

---

## 1. 实际修改文件（9 tracked files）

> 来源：`git status --short` + `git diff --stat`（2026-09-02）。

| # | 文件 | 改动 | 作用 |
| --- | --- | --- | --- |
| 1 | `.specify/memory/constitution.md` | 新增（初始为模板，现重写为 ZH-LAO Constitution v1.0.0） | 非协商治理层：原则 I–XI + Spec 工作流权威 + AI Agent 接地规则 |
| 2 | `.specify/templates/spec-template.md` | +3 区块（State Machines / Contract References / Traceability） | 强制生命周期/契约/追踪 |
| 3 | `.specify/templates/plan-template.md` | +2 区块（Locked Decisions / Authority Snapshot） | 锁定决策预算 + 接地快照 |
| 4 | `docs/AGENTS.md` | +11 行（§"Spec Kit 操作规程"） | AI Agent 接地操作规程 |
| 5 | `docs/docs/development/DEVELOPMENT_CONTROL_CENTER.md` | 9 行改 | SOT 链顶置 Constitution；Spec 规则改指向 Spec Kit；删除 Executable Spec 行 |
| 6 | `docs/docs/governance/design-register.md` | D-154 改写 | D-154 声明 Spec Kit 为唯一 Feature Spec 工作流 |
| 7 | `docs/docs/development/SPEC_SYSTEM.md` | status `active`→`superseded` + 顶部 SUPERSEDED 横幅 | 旧系统退休（保留） |
| 8 | `docs/docs/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE.md` | status `active`→`superseded` + 横幅 | 旧模板退休（保留） |
| 9 | `docs/docs/development/specs/README.md` | status `active`→`superseded` + 横幅 | 旧 spec 索引退休（保留） |
| 10 | `docs/docs/development/specs/index.json` | +`"_status":"superseded"` | 索引退休标记 |
| 11 | `docs/docs/development/specs/executable-spec.schema.json` | +`"$comment":"SUPERSEDED by GitHub Spec Kit..."` | schema 退休标记 |
| 12 | `docs/docs/development/specs/domains/content.spec.json` | 顶部 +`"_status":"superseded"`（2 行改） | 55 个 CNT-* ID 原样保留，未删 |

> 注：`.claude/`、`.specify/`、`docs-inventory.csv`、`docs-tree.txt`、`docs/audit/` 为 Stage 1/2/3 期间已存在的 **untracked** 项，非本 Stage 新增；`git diff --stat` 统计为 `9 files changed, 28 insertions(+), 10 deletions(-)`（第 1–9 行对应上表 1–9，模板/Constitution 属 untracked 不计入 stat）。

**约束遵守**：本 Stage **未编辑任何业务代码、未编辑任何产品需求、未生成新 Feature spec、未执行 `/speckit.specify`**（符合 req #10）。

---

## 2. Constitution 最终原则（`.specify/memory/constitution.md` v1.0.0）

**Source of Truth Priority 链**（谁赢冲突）：
```text
Constitution（非协商）
→ Frozen Physical Migration（触及物理 DB 时）
→ Accepted ADR / Frozen Architecture Contract
→ Canonical Product / Domain Docs
→ Upstream Frozen Public Contracts
→ Spec Kit spec.md / plan.md / tasks.md（权威低于其输入 authority）
```

**Core Principles I–XI**：
- **I. Source of Truth Priority** — 冲突时取链中更高层；聊天上下文永非 authority。
- **II. Existing Code Is Engineering Reality, Not Product Authority** — 不得从代码反推需求；代码与权威冲突按 VIII STOP。
- **III. Requirement ID Stability** — 用 Spec Kit 原生 `FR-`/`SC-`/`US-`；发布后 ID 不复用、不重排改名；superseded 保留原 ID。
- **IV. Verifiability (Given/When/Then)** — 每条可观测需求至少 1 个 GWT 验收场景；场景 ID 稳定可追溯。
- **V. State Machines Mandatory Where Lifecycle Exists** — 生命周期/异步/钱/权限/发布/不可逆语义必须声明状态机；测试须覆盖合法转换/非法拒绝/guard/终态/并发重试幂等。
- **VI. Contract Reference Reality** — Contract Reference 只指向真实仓库产物（OpenAPI/Zod/frozen HTTP/frozen migration/事件 schema）；frozen migration 是物理 DB 真相，spec 引用它而非复制第二份 schema；禁止为未实现域伪造 OpenAPI/TS 符号/测试。
- **VII. Decision Budget (LOCKED)** — 实现不得改 LOCKED 决策（API/Public/DB 契约、状态转换、事务边界、错误语义、安全/RBAC 不变量、跨域边界）；CONSTRAINED（私有分解）/FREE（局部变量/格式）归实现者。
- **VIII. Conflict Must STOP** — `SPEC_CONFLICT` / `IMPLEMENTATION_BLOCKER` / `REPOSITORY_DRIFT` 一律 STOP 并报告 exact sources+IDs；禁止自改 Requirement、静改 Public Contract、改 frozen migration、扩 Task 范围、用聊天记忆替换仓库证据、用「代码更合理」覆盖 authority；**不得猜测**。
- **IX. Evidence Reality** — 证据 = 真实执行结果 + 逐条 Requirement→test/check 映射；「全测通过」/「代码应覆盖」/「仅引目录」/「Blueprint 伪代码」均非证据；AI/实现报告/手递 JSON/Blueprint 不得自证 PASS。
- **X. Grounding Gate** — 宣称 Gate PASS 前须重新接地当前 `main`：source path、exact heading/symbol/field、current commit、authority 交叉验证、可复现证据；聊天上下文非 authority。
- **XI. Canonical Fact Single Ownership (ADR-018)** — 一个业务事实只有一个权威 owner；跨域仅经 logical UUID + Domain Service/Event/Outbox；禁止跨域直写与事实复制；Read Model/Snapshot 非第二事实源。

**Spec Workflow Authority**：GitHub Spec Kit 为**唯一** Feature Spec 工作流；Executable Spec System 已 `superseded`，仅留历史。链路：`/speckit.specify → .plan → .tasks → .analyze → .implement → .converge`。

**Grounding Rules for AI Agents**（4 条，详见 §4）通过 `docs/AGENTS.md` + 模板区块强制；这是 extension-hook 机制的**允许回退**。

**Governance**：本 Constitution 取代一切其他 Spec 实践；修订须 design-register 条目（D-xxx）+ 批准 + 迁移说明；所有 PR/评审须验证 I–XI 合规。

---

## 3. 模板变化

### 3.1 `spec-template.md`（插入 3 个 mandatory/required 区块，位于 Success Criteria 之前）
- **`## State Machines`**（required， Constitutional 原则 V）：每个有生命周期的实体一个 block — `States` / `Initial` / `Terminal` / `Owning FR` / `Transitions` 表（From|To|Guard|Event）；注解要求测试覆盖合法转换/非法拒绝/guard/终态/并发重试幂等。
- **`## Contract References`**（required， Constitutional 原则 VI）：只指向真实仓库产物 — `Path` / `Kind`(openapi|zod|http|migration|event|markdown) / `Symbol` / `Notes`；frozen migration 是物理 DB 真相，禁止为未实现域伪造契约。
- **`## Traceability`**：`Requirement → Use Case → Contract → Acceptance Scenario → State Machine` 映射表，落实原则 IV。

### 3.2 `plan-template.md`（插入 2 个区块，位于 Project Structure 之前）
- **`## Locked Decisions`**（原则 VII）：`Decision | Source | Why LOCKED` 表，列出本特性触及的所有 LOCKED 决策，实现不得修改。
- **`## Authority Snapshot`**（原则 X Grounding Gate）：`Base Commit` / `Scope Type+ID` / `Referenced Authority Docs` / `Existing Code/Schema/API/Contracts checked` 摘要，使 Gate PASS 可复现。
- 同文件 `## Constitution Check` 区块保留（Gate 在 Phase 0 前必须过，Phase 1 后再查）。

---

## 4. Agent Grounding 规则（`docs/AGENTS.md` 新增 §"Spec Kit 操作规程"）

ZH-LAO 的 Feature Spec 工作流**唯一**采用 GitHub Spec Kit（见 Constitution）。新增 5 条：

1. **`/speckit.specify` 前必须读取相关权威文档** — 先定位 `docs/domains/<domain>/`、`docs/adr/`、`docs/architecture/`、frozen Public Contract 作为 spec 事实输入；不得从空上下文生成需求。
2. **`/speckit.plan` 前必须检查现有代码/schema/API/contracts/architecture** — 扫描 `apps/**`、`database/migrations/`、`OpenAPI`/`Zod`、frozen contract；plan 只描述差异与新增，不重复已知事实。
3. **现有代码是工程现实，不是产品权威**（原则 II）— 一致照文档；冲突按 VIII STOP，不得用「代码更合理」覆盖 authority。
4. **产品需求冲突必须 STOP**（原则 VIII）— 出现 `SPEC_CONFLICT`/`IMPLEMENTATION_BLOCKER`/`REPOSITORY_DRIFT` 停止并报告 exact sources+IDs，等设计侧补齐；不得猜测或反向创造需求。
5. **禁止 AI 猜测产品需求** — 缺口由设计侧补齐；AI 不得替用户补造 Requirement，不得改写 frozen migration/Public Contract 来消冲突。

（与 Constitution `Grounding Rules for AI Agents` 4 条一一对应，表述落地为操作规程。）

---

## 5. 旧 Spec System retirement 状态

| 工件 | 原 status | 现 status | 处置 |
| --- | --- | --- | --- |
| `docs/docs/development/SPEC_SYSTEM.md` | active | **superseded** | 保留 + 顶部 SUPERSEDED 横幅；导出 `.specify/memory/constitution.md` 与 `docs/AGENTS.md` |
| `docs/docs/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE.md` | active | **superseded** | 保留 + 横幅 |
| `docs/docs/development/specs/README.md` | active | **superseded** | 保留 + 横幅 |
| `docs/docs/development/specs/index.json` | — | +`_status:"superseded"` | 保留 |
| `docs/docs/development/specs/executable-spec.schema.json` | — | +`$comment:SUPERSEDED` | 保留 |
| `docs/docs/development/specs/domains/content.spec.json` | — | +`_status:"superseded"` | 保留；55 个 CNT-* ID 原样不删（见 §8） |
| `scripts/check_executable_specs.py` | — | **未删**（req #8） | 保留；其引用见下 |

**`check_executable_specs.py` 引用清点（req #8，未删除）**：
- `docs/package.json` → `"spec:check": "python ../scripts/check_executable_specs.py"`（**唯一可执行调用方**）
- `docs/docs/development/workflow/TASK_MANIFEST_SCHEMA.md:201`（提及）
- `SPEC_SYSTEM.md`（5 处引用）
- `specs/README.md`（7 处引用）
- `executable-spec.schema.json`（1 处引用）
- **未发现任何 CI yaml 调用方**。

> 现状：旧系统已声明退休但文件全部保留；`spec:check` 脚本仍可被手动调用，未被移除，避免破坏既有工作流。正式下线 `spec:check` 与 `check_executable_specs.py` 需独立 Stage 并经 design-register 批准（不在本 Stage 范围）。

---

## 6. Spec Kit scripts 验证结果（req #9）

环境：Windows。**`pwsh`（PowerShell 7）不可用**；仅 **Windows PowerShell 5.1.26100.9168**。

验证对象：`.specify/scripts/powershell/check-prerequisites.ps1`

| 调用 | 结果 |
| --- | --- |
| `Get-Help` / `-Help` | exit 0（脚本可解析、帮助可用） |
| `-PathsOnly -Json`（无 feature 目录） | exit 1（预期：无 feature 目录，脚本按设计退出） |

结论：Spec Kit 的 PowerShell 脚本在 **WinPS 5.1** 下可正常解析与执行；Stage 2 标记的 R1 风险（"pwsh 缺失导致脚本不可运行"）**已解除**。后续 Spec Kit 自动化应统一走 Windows PowerShell 5.1，不要假设 `pwsh` 存在。

---

## 7. extensions / hooks 实际支持情况（req #1）

**验证方法**：Grep `.claude/skills/speckit-*/SKILL.md`，确认 1.0.3 各 skill 是否读取 `.specify/extensions.yml` 的 hook 定义。

**结论：机制确实支持**。9 个 speckit skill 均在执行前检查 `.specify/extensions.yml` 的以下 hook 键：
- `hooks.before_specify`
- `hooks.before_plan`
- `hooks.before_analyze`
- `hooks.before_checklist`

hook `command` 引用按 **dots → hyphens** 翻译（例：`speckit.git.commit` → `/speckit-git-commit`），且**必须是真实可调用命令**。

**关键限制**：Spec Kit 1.0.3 **不随附**任何「读取权威文档」或「扫描现有代码」的 grounding 命令。因此 Stage 2 §4/§6 设想的"扩展 hook 自动接地"在当前安装下**无现成命令可挂**。

**采用回退（已在 Constitution 写明，符合约束）**：
- grounding 自动化通过 **Constitution（原则 II/VIII/X）+ 模板区块（State Machines/Contract References/Traceability/Locked Decisions/Authority Snapshot）+ `docs/AGENTS.md` 操作规程** 三处静态强制实现。
- 若未来安装提供 grounding 命令，可在 `.specify/extensions.yml` 挂 `before_specify` / `before_plan` 指向该命令，无需改动 Constitution/模板。

> 即：机制可用，但本仓库选择"文档层强制"而非"命令层 hook"，因为前者零依赖、零外部命令风险，且满足 req #1「只用已安装版本真正支持的能力，不存在就用 Constitution+模板+AGENTS.md 等价实现」。

---

## 8. 未解决 blocker（req #7）

**Blocker：`content.spec.json` 的 55 个 `CNT-*` Requirement ID 无唯一权威来源。**

核实过程：
- `content.spec.json` 内部 `references` 指向 `docs/docs/development/05-content/*`（PRODUCT/USECASES/API/PUBLIC/DB_CORE/DB_REV/OPS_RBAC）。
- 但按 SOT 链，**canonical 域文档**归 `docs/docs/domains/content/`。
- Grep `docs/docs/domains/content/` 中 `CNT-` 出现次数 = **0** → 55 个 ID（`CNT-UC`×34 / `CNT-SEC`×4 / `CNT-STATE`×4 / `CNT-API`×3 / `CNT-PUB`×3 / `CNT-CON`×2 / `CNT-CORE`×2 / `CNT-DB`×2 / `CNT-RBAC`×1）在该 canonical 树中**无定义/无归属**。
- 即：这些 ID 的"唯一权威来源"无法确认。

按 req #7 **STOP**：
- **未删除** `content.spec.json`，**未丢失**任何 CNT-* ID。
- 仅在 JSON 顶部追加 `"_status":"superseded"`，使其在治理上明确退休、但内容原样保留。
- 该文件不应作为 Spec Kit 的 Requirement 权威来源；其 55 个 ID 待主架构会话在 `docs/docs/domains/content/` 中补齐权威定义后，方可迁移为 Spec Kit 原生 `FR-/SC-/US-` 或正式 supersede。

**其他非阻塞观察**：
- `docs/docs/development/05-content/` 等"development 树"文档大量出现 `superseded` 字样（属历史 content 设计文档自身状态，与本 Stage 无关），不影响上述结论。
- `spec:check` 脚本与 `check_executable_specs.py` 仍可被调用（见 §5），正式下线需独立 Stage。

---

## 9. 结论与后续（Stop Here）

Stage 3 已落地：
- ✅ 真实核实 Spec Kit 1.0.3 的 extension/hook 机制（支持，但无 grounding 命令 → 回退文档层）。
- ✅ Constitution 填充 Stage 2 §2 治理原则（I–XI）。
- ✅ spec/plan 模板扩展 5 个区块。
- ✅ AGENTS.md 扩展 5 条接地规则。
- ✅ 控制中心 + D-154 声明 Spec Kit 为唯一工作流。
- ✅ 旧 Executable Spec System 标记 superseded（保留不删）。
- ✅ content.spec.json 按 req #7 STOP，55 ID 保留。
- ✅ check_executable_specs.py 引用清点，未删。
- ✅ PowerShell 脚本在 WinPS 5.1 验证可运行。
- ✅ 已跑 `git diff` / `git status`（§1）。

**Stop**：未进入迁移、未删除旧系统实体、未生成新 Feature spec、未执行 `/speckit.specify`。后续可选动作（不在本 Stage）：
1. 主架构会话在 `docs/docs/domains/content/` 补齐 55 个 CNT-* 的权威定义 → 再决定迁移或正式 supersede。
2. 独立 Stage 经 design-register 批准下线 `spec:check` 与 `check_executable_specs.py`。
3. 若后续安装 grounding 命令，在 `.specify/extensions.yml` 挂 `before_specify`/`before_plan`。
