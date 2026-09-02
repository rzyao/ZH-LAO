# Stage 2 — Spec System Consolidation Design

> 目标：以官方 **GitHub Spec Kit** 作为 ZH-LAO 未来唯一的 Feature Spec 工作流，
> 废弃自建 **Executable Spec System**，但保留其中有价值的治理规则。
> 本文件为**设计稿**；未执行迁移、未删除文件、未填写 constitution、未改动业务代码与产品需求（见末尾 §9）。

---

## 0. 当前状态盘点

### 0.1 Spec Kit 已安装且功能完整（无需从零引入）

| 组件 | 路径 | 说明 |
| --- | --- | --- |
| 核心技能 ×9 | `.claude/skills/speckit-{specify,plan,constitution,implement,tasks,analyze,checklist,clarify,converge}/` | 已就绪 |
| 模板 ×5 | `.specify/templates/{spec,plan,tasks,checklist,constitution}-template.md` | 已就绪 |
| 脚本 | `.specify/scripts/powershell/{check-prerequisites,common,create-new-feature,resolve-template,setup-plan,setup-tasks}.ps1` | 技能依赖 |
| 工作流 | `.specify/workflows/speckit/workflow.yml` | `specify → review-spec → plan → review-plan → tasks → implement` |
| Constitution | `.specify/memory/constitution.md` | **= 未填写的模板**（逐字等同 `constitution-template.md`） |
| 配置 | `.specify/{init-options,integration,workflow-registry}.json` | `ai=claude`、`script=ps`、`speckit_version=1.0.3` |

**结论**：Spec Kit 是「装好但没点亮」状态——只差填写 constitution 与补齐少量模板/指令。这正是本设计要做的事。

### 0.2 自建 Executable Spec 生态（待废弃）

| 文件 | 实际状态 | 处置（见 §7） |
| --- | --- | --- |
| `docs/docs/development/SPEC_SYSTEM.md` | 17 节、541 行、完整 | 标记 `superseded`，保留为历史 |
| `docs/docs/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE.md` | 存在 | 废弃（能力并入 plan 模板） |
| `docs/docs/development/specs/index.json` | 仅 1 个 adopted scope | 废弃 |
| `docs/docs/development/specs/executable-spec.schema.json` | 存在 | 废弃 |
| `docs/docs/development/specs/domains/content.spec.json` | 唯一已 adopt 的 spec | 废弃（义务图迁入 spec 模板段） |
| `docs/docs/development/specs/README.md` | 存在 | 废弃 |
| `docs/docs/development/SPEC_COVERAGE_MATRIX.md` | **从未创建** | 无需处置 |
| `scripts/check_executable_specs.py` | 存在（旧 checker） | 废弃（由 `/speckit-analyze` + CI 取代） |

> 旧 `specs/evidence/`、`specs/changes/` 目录**从未建立**，故无 evidence JSON / change record 遗留物需迁移。

---

## 1. 能力逐项映射（A/B/C/D/E）

判定口径：
- **A** = Spec Kit 原生已有（技能/模板/工作流已提供机制）
- **B** = 应写入 Constitution（全仓库非协商的治理原则）
- **C** = 应通过模板扩展（在 spec/plan 模板加段）
- **D** = 应通过 AGENTS.md / repository instructions / extensions 钩子实现（AI 操作规程）
- **E** = 可以废弃（旧 Executable Spec 特有、Spec Kit 原生机制更优或更重）

| # | 能力 | Spec Kit 原生？ | 分类 | 落点 / 理由 |
| --- | --- | --- | --- | --- |
| 1 | **Requirement IDs** | ✅ FR-/SC-/US- 原生 ID 方案 | **A** + B + C | 机制=A。ZH-LAO 稳定性不变量（ID 永不复用、文件移动不改 ID、superseded 保留原 ID、一个 Requirement 仅一个 canonical 定义）→ **B**。`<PREFIX>-<AREA>-<NNN>` 前缀格式 → **C**（可选约定，建议保留 AREA 作 domain 范围元数据，但非强制；主 ID 采用 Spec Kit 原生 FR-/SC-/US-） |
| 2 | **Use Cases** | ✅ User Stories（US-###）+ acceptance scenarios | **A** | 原生即等价物。use_case↔requirement 交叉引用由 Traceability（C）承载 |
| 3 | **Acceptance Scenarios** | ✅ User Stories 内 acceptance + GWT 惯用法；analyze 查覆盖 | **A** + B | 机制=A。「每个可观察 Requirement 必须有 GWT acceptance scenario」+ scenario ID（如 `FR-012-AS01`）→ **B**（Constitution 原则）+ **C**（模板约定） |
| 4 | **State Machines** | ❌ 无一等公民构造 | **C** + B | 在 spec 模板加 `## State Machines` 段（states/initial/terminal/transitions/guards/owning FR）→ **C**。「凡生命周期/异步/资金/权限/不可逆语义必须显式声明状态机、测试须覆盖合法/非法/guard/terminal/并发」→ **B** |
| 5 | **Contract References** | ⚠️ plan 提 Data Model，但无正式 contract-ref 字段 | **C** + B | 在 spec/plan 模板加 `## Contract References` 段（repo-relative `path` + `kind` + `symbol`）→ **C**。「引用必须指向真实仓库产物（OpenAPI/Zod/frozen HTTP/frozen migration/event schema）；frozen migration 是物理 DB 真相，spec 只引用不复制；禁止伪造未实现 symbol」→ **B** |
| 6 | **Traceability** | ⚠️ analyze 出覆盖摘要、converge 回溯 gap | **A** + C + B | 机制=A（analyze/coverage）。spec 模板可选加 `## Traceability` 义务图段 → **C**。「一个测试可覆盖多 Requirement，但 evidence 必须逐项列映射」→ **B** |
| 7 | **Decision Budget** | ❌ 无 LOCKED/CONSTRAINED/FREE 分层 | **B** + C | 「LOCKED（API/Public/DB contract、state transition、transaction boundary、error semantics、security/RBAC、cross-domain）= 实现不得修改；CONSTRAINED=私有分解；FREE=局部变量/格式化」→ **B**。在 plan 模板加 `## Locked Decisions` 段列出本特性被锁定的决策 → **C** |
| 8 | **Conflict Protocol** | ⚠️ analyze 把 constitution 冲突标 CRITICAL、converge 有 STOP | **B** + D | 「产品/Requirement 冲突必须 STOP，不得自行选一个版本」→ **B**（核心）。`SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT` 三态与「禁止自行改 Requirement、偷改 Public Contract、改 frozen migration、用『当前代码更合理』覆盖 authority」→ **D**（AGENTS.md 操作规程） |
| 9 | **Evidence** | ⚠️ converge/implement 跑真实测试，但无 SHA JSON | **B** + E | 「evidence=真实执行结果且 req→test 映射；『全部测试通过』『代码应该覆盖』『只引目录』『Blueprint 伪代码』均不算 evidence」→ **B**。`evidence.json` + `source_spec_sha256` + `--require-evidence` 机器机制 → **E**（由 `/speckit-analyze` + `/speckit-converge` + CI 取代，过重且维护成本高） |
| 10 | **Gates** | ✅ workflow 内 review-spec / review-plan 人工门；analyze 为实施前门 | **A** + B + E | 人工评审门=A。「Grounding Gate：声称 PASS 前必须 re-ground 到当前 main，给出 source path / exact heading/symbol/field / current commit / authority 交叉验证；聊天上下文不是 authority」→ **B**。旧 `spec:check` 机器门（`check_executable_specs.py`）→ **E**（由 analyze + CI 取代） |
| 11 | **Blueprint binding** | ❌ plan.md + tasks.md 近似，但无 base_commit/sha256 绑定产物 | **C** + B | 在 plan 模板加 `Authority Snapshot`（base_commit / 引用的权威文档版本 / 锁定决策）段 → **C**。「plan 权威 < 输入权威 < canonical spec；plan 必须记录 base_commit 与权威源引用」→ **B**。独立 `IMPLEMENTATION_BLUEPRINT_TEMPLATE.md` 全格式 → **E**（折叠进 plan.md，不单独成产物） |

**汇总**：11 项能力中——
- 原生可覆盖（A 为主）：#1 机制、#2、#3 机制、#6 机制、#10 机制 → **5 项**
- 升级为 Constitution 原则（B）：#1 稳定性、#3 强制 GWT、#4 强制状态机、#5 引用真实性、#6 映射规则、#7 决策预算、#8 STOP、#9 证据真实性、#10 Grounding、Code≠Authority、Canonical Fact 单一归属 → **~11 条原则**
- 模板扩展（C）：#4 状态机段、#5 契约引用段、#6 追溯段、#7 锁定决策段、#11 权威快照段 → **5 段**
- 操作规程（D）：#8 冲突三态、Stage 6 五项特别设计 → **AGENTS.md + extensions 钩子**
- 废弃（E）：#9 evidence JSON/SHA、#10 旧 checker、#11 独立 Blueprint 模板、#1 AREA 前缀格式（可选弃）→ **4 项**

---

## 2. 应写入 Constitution 的原则草案（B 类，Stage 3 才落盘）

> 以下为**设计内容**，本 Stage 不写入文件。

```
I. Source of Truth 优先级（取代旧控制中心链顶端的「Canonical Executable Spec」）
   Frozen Physical Migration（涉物理 DB）
   → Accepted ADR / Frozen Architecture Contract
   → Canonical Product / Domain Docs
   → Upstream Frozen Public Contracts
   → Constitution（本文件，非协商）
   → Spec Kit spec.md / plan.md / tasks.md（constitutional 工作流产物）
   注：Spec Kit 产物权威低于其输入 authority；AI/手工声明不得自证 Gate PASS。

II. 现有代码是工程现实，不是产品权威
   实现阶段不得因「当前代码行为」反向创造产品需求；
   代码与 spec 冲突时，冲突按 §VIII 处理，不得用「代码更合理」覆盖 authority。

III. Requirement ID 稳定性
   spec 采用 Spec Kit 原生 FR-/SC-/US- ID；ID 发布后永不复用；
   文件移动/Task 重排不改变 ID；superseded Requirement 保留原 ID；
   一个 Requirement 仅一个 canonical 定义，其他文档只引用。

IV. 可验证性
   每个可观察 Requirement 至少关联一个 Given/When/Then acceptance scenario；
   acceptance scenario 是验收与测试设计输入，非示例。

V. 状态机强制
   凡生命周期/异步任务/资金/权限/发布/不可逆状态语义，spec 必须显式声明状态机
   （states/initial/terminal/legal transitions/guards/owning FR）；
   测试须覆盖合法 transition、非法 rejection、guard、terminal、并发/重试/幂等。

VI. 契约引用真实性
   Contract Reference 指向真实仓库产物（OpenAPI/Zod/frozen HTTP/frozen migration/event schema）；
   frozen migration 是物理 DB 真相，spec 只引用不复制第二套 schema；
   禁止为未实现的 Domain 伪造 OpenAPI/TS symbol/test。

VII. 决策预算（LOCKED）
   实现不得修改 LOCKED 决策：API/Public/DB contract、state transition、
   transaction boundary、error semantics、security/RBAC invariant、cross-domain boundary。
   私有分解（CONSTRAINED）与局部变量/格式化（FREE）由实现者自定。

VIII. 冲突必须 STOP
   产品/Requirement 冲突（SPEC_CONFLICT）、缺超出决策预算的实现裁决（IMPLEMENTATION_BLOCKER）、
   生成后 main 发生 material change（REPOSITORY_DRIFT）均 STOP；
   禁止自行改 Requirement、偷改 Public Contract、改 frozen migration、扩大 Task scope、
   用聊天记忆替代仓库 evidence、用「代码更合理」覆盖 authority。

IX. Evidence 真实性
   evidence = 真实执行结果且逐项映射 Requirement→test/check；
   「全部测试通过」「代码应该覆盖」「只引目录」「Blueprint 伪代码」均不算 evidence；
   AI/Implementation Report/手工 JSON/Blueprint 都不能自证 PASS。

X. Grounding Gate
   声称 Gate PASS 前必须 re-ground 到当前 main：source path、exact heading/symbol/field、
   current commit、authority 交叉验证、可复现 evidence；聊天上下文不是 authority。

XI. Canonical Fact 单一归属（沿用 ADR-018）
   一个业务事实仅一个 authoritative owner；跨域经 logical UUID + Domain Service/Event/Outbox；
   禁止跨域直接写库与复制事实；Read Model/Snapshot 非第二事实源。
```

---

## 3. 模板扩展草案（C 类）

### 3.1 `spec-template.md` 新增段
- `## State Machines`：每个有生命周期的实体一张表（states / initial / terminal / legal_transitions / guards / owning_FR）。
- `## Contract References`：`path` + `kind`(openapi|zod|http|migration|event) + `symbol` + 说明。
- `## Traceability`（可选）：Requirement → Use Case → Contract → Acceptance Scenario/State Machine 的义务图速查。

### 3.2 `plan-template.md` 新增段
- `## Locked Decisions`：列出本特性被锁定的 LOCKED 决策（来自权威文档/ADR/frozen migration），实现不可改。
- `## Authority Snapshot`：`base_commit`、`referenced_authority_docs`（带版本/commit）、`scope_type/scope_id`。

> 以上为设计内容，本 Stage 不改动模板文件。

---

## 4. AGENTS.md / Repository Instructions（D 类）

在 `docs/AGENTS.md` 增加「Spec Kit 操作规程」段（设计内容，本 Stage 不写入）：

1. **/speckit.specify 必须读取相关现有权威文档**：执行前先定位与本特性相关的 `domains/<x>/`、`adr/`、`architecture/`、frozen Public Contract，作为 spec 的事实输入；不得从空生成需求。
2. **/speckit.plan 必须检查现有代码/schema/API/contracts/architecture**：执行前扫描 `apps/**` 现有实现、`database/migrations/`、OpenAPI/Zod、frozen contract，识别已有行为与契约；plan 仅描述差异与新增，不重复已知事实。
3. **AI 不得因现有代码行为反向创造产品需求**：若代码与权威文档一致，照文档写；若代码与文档冲突，按 §VIII STOP。
4. **产品需求冲突必须 STOP**：出现 SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT 时停止并报告 exact sources + IDs，等待设计侧补齐，不得自行猜测。

### 4.1 推荐的 extensions 钩子（Spec Kit 原生机制）
在 `.specify/extensions.yml` 注册（Stage 3 才建）：
- `hooks.before_specify`：自动加载与本特性相关的 domain/ADR/contract 文档摘要。
- `hooks.before_plan`：强制运行一次「现有代码/schema/API/contract/architecture 扫描」并附结论。

> 这两项用 Spec Kit 原生 extension hook 机制实现，比旧 SPEC_SYSTEM 的脚本式约束更轻、可移植。

---

## 5. Stage 6 特别设计的落点映射

| 特别设计要求 | 落点分类 | 实现方式 |
| --- | --- | --- |
| Existing code is engineering reality, not product authority | **B** + D | Constitution 原则 II + AGENTS.md 规程 3 + `before_plan` 钩子 |
| /speckit.specify 必须读取相关现有权威文档 | **D** | AGENTS.md 规程 1 + `before_specify` 钩子 |
| /speckit.plan 必须检查现有代码/schema/API/contracts/architecture | **D** | AGENTS.md 规程 2 + `before_plan` 钩子 |
| AI 不得因现有代码行为反向创造产品需求 | **B** + D | Constitution 原则 II + AGENTS.md 规程 3 |
| 产品需求冲突必须 STOP，不允许自行猜测 | **B** + D | Constitution 原则 VIII + AGENTS.md 规程 4 + analyze 的 CRITICAL 处理 |

---

## 6. 新的单一 Spec Kit 工作流设计

```
① 一次性：填写 .specify/memory/constitution.md（§2 原则，Stage 3 执行）
       扩展 spec/plan 模板（§3）、建 extensions.yml（§4.1）、扩 AGENTS.md（§4）

② /speckit.specify  → spec.md
       before_specify 钩子加载相关 domain/ADR/contract 文档
       Agent 仅编译权威事实为 FR/SC/US + GWT acceptance + 状态机/契约引用（按需）
       不凭空造需求

③ review-spec 门（人工 approve / reject）

④ /speckit.plan  → plan.md
       before_plan 钩子强制扫描现有代码/schema/API/contracts/architecture
       plan 含 Locked Decisions + Authority Snapshot(base_commit)
       仅描述差异与新增

⑤ review-plan 门（人工 approve / reject）

⑥ /speckit.tasks  → tasks.md（T### + 阶段 + 文件引用 + 并行标记）

⑦ /speckit.analyze → 只读一致性与覆盖分析
       冲突 Constitution MUST → CRITICAL → STOP（对应旧 SPEC_CONFLICT）

⑧ /speckit.implement → 实现，跑真实测试
       evidence = 执行结果 + req→test 映射（对应旧 Evidence 原则 IX）

⑨ /speckit.converge → 评估代码 vs spec/plan/tasks，追加剩余工作
       对应旧 REPOSITORY_DRIFT / 未覆盖项

⑩ CI：运行 analyze 等价检查；无自定义 checker
```

**与旧链路对比**：旧 `DESIGN_GATE → Task Manifest → Execution Brief → Implementation Blueprint → Evidence → Audit` 被压缩为 Spec Kit 的 `review-plan → tasks → analyze → implement → converge`。Blueprint 不再是独立产物（§11 C），Evidence 不再有 SHA JSON（§9 E），spec:check 机器门被 analyze+CI 取代（§10 E）。

---

## 7. 旧文件处置：废弃 / 保留 / 迁移

| 文件 | 处置 | 说明 |
| --- | --- | --- |
| `docs/docs/development/SPEC_SYSTEM.md` | **废弃（保留历史）** | 头部加 `status: superseded`，正文首行注明「被 Spec Kit 取代，见 constitution + AGENTS.md」；不删除 |
| `docs/docs/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE.md` | **废弃** | 能力并入 plan 模板（§3.2）；标记 superseded |
| `docs/docs/development/specs/index.json` | **废弃** | 唯一 scope 已并入 domain 文档；删除前确认 content.spec.json 义务无孤儿 ID |
| `docs/docs/development/specs/executable-spec.schema.json` | **废弃** | 不再需要独立 schema |
| `docs/docs/development/specs/domains/content.spec.json` | **废弃** | 义务图已可由 spec 模板段 + domain 文档覆盖；迁移前核对其 Requirement ID 是否已在 domain 文档有出处 |
| `docs/docs/development/specs/README.md` | **废弃** | — |
| `scripts/check_executable_specs.py` | **废弃** | 停止在 CI 调用；可改为薄包装调用 analyze，或直接删除（Stage 3 决定） |
| `docs/docs/governance/design-register.md` D-154 | **修订** | 「采用 Executable Spec Layer」→「采用 Spec Kit 作为唯一 Feature Spec 工作流」，事实源改指 constitution |
| `docs/docs/development/DEVELOPMENT_CONTROL_CENTER.md` §二 | **修订** | Source of Truth 链顶端加 Constitution；「Canonical Executable Spec」改为「Spec Kit spec（constitutional）」 |
| `docs/AGENTS.md` | **扩展** | 加 §4 操作规程 |
| `docs/governance/open-questions.md` | **保留** | 不受影响 |
| `docs/docs/adr/`、`docs/docs/domains/`、`docs/docs/product/`、`docs/docs/architecture/` | **保留** | 仍是事实源，Spec Kit 产物权威低于它们 |
| `.specify/memory/constitution.md` | **填写（Stage 3）** | 写入 §2 原则 |
| `.specify/templates/{spec,plan}-template.md` | **扩展（Stage 3）** | 加 §3 段 |
| `.specify/extensions.yml` | **新建（Stage 3）** | §4.1 钩子 |

---

## 8. 迁移顺序（Stage 3+ 执行，本 Stage 不动）

1. 填写 `constitution.md`（§2）。
2. 扩展 `spec-template.md` / `plan-template.md`（§3）。
3. 建 `.specify/extensions.yml` 钩子（§4.1）。
4. 扩展 `AGENTS.md`（§4）。
5. 修订 `DEVELOPMENT_CONTROL_CENTER.md` §二、`design-register.md` D-154。
6. 标记 `SPEC_SYSTEM.md` / `IMPLEMENTATION_BLUEPRINT_TEMPLATE.md` / `specs/` 树为 `superseded`。
7. 停用 `scripts/check_executable_specs.py`（CI 改跑 analyze 等价检查）。
8. 验证 `.specify/scripts/powershell/*.ps1` 在用户 Windows+Git Bash 环境可运行（见 §9 风险）。

---

## 9. 风险与未决项

- **R1（运维）**：Spec Kit 脚本为 PowerShell（`.specify/scripts/powershell/*.ps1`）。当前环境为 Windows + Git Bash，需确认 `pwsh` 可用且技能调用链能解析；否则需适配为 `.sh`/跨平台脚本。Stage 3 迁移前必须验证。
- **R2（技能可调用性）**：`.claude/skills/speckit-*` 是 Claude 集成技能；在 WorkBuddy 环境通过 Skill 工具调用路径需确认（本设计不依赖特定宿主，但 Execution 阶段要验证 `/speckit.*` 可触发）。
- **R3（Constitution 惰性）**：当前 constitution 未填写，analyze/converge 的「Constitution Authority」行为处于 inert 状态；在填写前，B 类原则实际不生效。
- **R4（content.spec.json 孤儿）**：迁移 specs/ 树前，需核对 `content.spec.json` 中 Requirement ID 是否都能在 `domains/content/` 文档找到出处，避免退休后丢失义务。
- **U1（待主会话裁决）**：AREA 前缀格式（#1 C）是否保留——建议保留为 domain 范围元数据而非强制 ID 格式，但非阻塞。
- **U2（待主会话裁决）**：旧 `check_executable_specs.py` 是改为 analyze 薄包装还是直接删除——建议 CI 改跑 analyze 后删除。

---

## 10. 合规声明（本 Stage 约束）

- ✅ 未修改任何业务代码（`apps/**` 未触碰）。
- ✅ 未修改任何产品需求（`docs/product/`、`domains/` 未改动）。
- ✅ 未执行迁移：constitution 未填写、模板未扩展、extensions 未建、AGENTS.md 未改、SPEC_SYSTEM 等未标记。
- ✅ 未删除任何文件（`specs/` 树、`check_executable_specs.py`、旧 SYSTEM 文档均保留）。
- ✅ 本文件落于 `docs/audit/`（VitePress `srcDir` 之外），不进站点、不触发 `scripts/check_md_links.py`。
- 仅产出本报告，供主会话评审后进入 Stage 3 迁移。
