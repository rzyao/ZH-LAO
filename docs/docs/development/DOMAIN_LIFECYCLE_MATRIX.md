---
layout: page
sidebar: false
aside: false
outline: false
footer: false
pageClass: domain-lifecycle-matrix-page
status: control-matrix
last_updated: 2026-08-31
---

状态图例：<span class="st st-pass">通过 / 完成</span> <span class="st st-frozen">契约已冻结</span> <span class="st st-ready">已就绪</span> <span class="st st-blocked">阻塞 / 失败</span> <span class="st st-pending">待处理</span> <span class="st st-recovered">已恢复</span> <span class="st st-na">不适用 / 未采用 / 不追溯</span>

> 本页是 **当前 `main` 的派生控制视图**，不是新的产品、数据库或 Gate 事实源。状态只能由权威产品设计、领域设计、数据库契约、Task Manifest、Implementation Report、测试 / CI 与独立 Gate 证据推导；不得因为本页显示某状态而反向宣称 Gate PASS。

## 一、标准 Domain 生命周期

Domain 生命周期回答的是：**这个领域要做什么、做到什么程度、业务如何成立、需要保存哪些事实、对外提供什么契约，最后如何实现并验收。**

数据库不是生命周期起点。正确顺序是先确定产品和业务，再推导领域模型与数据模型：

```text
产品定义
  ├─ 产品目标
  ├─ 用户价值
  ├─ 功能范围
  └─ 明确不做什么
↓
业务设计
  ├─ Use Case
  ├─ 用户 / 运营流程
  ├─ 业务规则
  ├─ Workflow
  └─ 状态机
↓
领域设计
  ├─ Domain boundary
  ├─ canonical fact owner
  ├─ aggregate / entity / value semantics
  └─ cross-domain responsibility
↓
数据设计
  ├─ logical data model
  ├─ table / column / constraint / index
  ├─ logical UUID / internal PK policy
  └─ migration
↓
契约设计
  ├─ API Contract
  ├─ Public Contract
  ├─ Cross-Domain Contract
  └─ Event Contract
↓
可靠性与治理设计
  ├─ 权限 / 安全
  ├─ 事务
  ├─ 并发
  ├─ 幂等 / 重试
  ├─ 审计
  └─ 一致性策略
↓
设计门禁
↓
可执行规格（已采用的 Domain / Task）
↓
实现准备
  ├─ Execution Brief
  ├─ Implementation Blueprint
  ├─ Requirement / State Machine / Test Trace
  └─ base commit / spec SHA / authority snapshot
↓
后端实现与验证
↓
后台 / 客户端 / 跨域集成（按 Domain 需要并行）
↓
领域验收门禁
↓
领域已完成
↓
进入系统级集成
```

### 1. 产品定义

先回答“为什么做”和“做到哪里”。至少明确：

```text
目标用户 / 使用者
用户价值
核心能力
功能范围
本期必须做
本期明确不做
成功条件
```

数据库、当前代码和已有表结构不得反向决定产品应该有什么功能。

### 2. 业务设计

把产品目标转换成可执行的业务语义：Use Case、用户 / 运营流程、业务规则、Workflow 与状态机。

**状态机必须显式出现。** 只要业务存在生命周期、异步任务、资金、权限状态或不可逆状态，就必须定义 states、initial state、terminal states、legal transitions、guards、trigger、side effects、retry / idempotency / concurrency 语义，并在实现阶段验证合法转换与非法转换。

### 3. 领域设计

在业务语义明确以后，确定：

```text
哪个 Domain 拥有什么事实
canonical owner 是谁
哪些是 aggregate / entity / value
哪些事实属于本 Domain
哪些只允许通过 logical reference / contract 使用
```

不得因为数据库已经存在某张表，就反向赋予本 Domain 不属于它的业务责任。

### 4. 数据设计

数据模型由产品、业务和领域事实推导。此阶段才确定表、字段、约束、索引、ID 与 migration。

已有冻结 migration 仍然是当前实现必须尊重的 physical truth；如果后续设计发现必须调整，只能通过明确的设计变更和增量 migration，不能修改已执行历史 migration。

### 5. 契约设计

在领域责任与数据事实明确后，设计 API、Public、Cross-Domain 与 Event Contract。API 必须从 Use Case 推导，不得按“一张表一个 CRUD”生成。

### 6. 可靠性与治理设计

安全、权限、事务、并发、幂等、重试、审计与一致性不是开发末期补丁，必须在设计阶段明确，在 Blueprint 中固化，在实现与测试阶段验证。

### 7. 设计门禁

设计门禁证明“做什么、业务如何成立、状态如何变化、数据如何承载、契约如何交互、可靠性约束是什么”已经明确。它不证明代码已经完成。

### 8. 可执行规格

采用 Executable Spec System 的 Domain / Task，需要把 mandatory Requirement、Acceptance Scenario、State Machine 与 Contract reference 写入 canonical spec。既有已完成任务不会因为本协议出现而追溯性判失败；新任务、实质设计变更或显式 adopted Task 应按 `SPEC_SYSTEM.md` 执行。

### 9. 实现准备

实现准备把已经通过设计门禁的事实转换成实现 AI 可以机械执行的输入：Execution Brief + Implementation Blueprint。Blueprint 必须尽量明确 exact path、symbol、伪代码、事务、并发、幂等、错误、安全、状态转换、测试矩阵、实现顺序和 Decision Budget，并绑定仓库 snapshot。

### 10. 后端实现与验证

后端阶段包含编码、单元测试、集成测试、状态转换测试、安全 / 权限测试、事务 / 并发 / 幂等测试与回归验证。通过后状态应表达为 **后端已验证 / 后端契约可消费**，不得再把它写成“整个 Domain 已冻结”。

### 11. 消费者与跨域集成

后端契约稳定后，按 Domain 实际需要并行推进：

```text
后台轨
客户端轨
跨域集成轨
```

某个轨道可以 `N/A`，但不能因为 Backend PASS 就自动视为 Admin / Client / Integration 完成。

### 12. 领域验收

只有适用的后端、后台、客户端、跨域集成与必要回归证据全部满足后，才允许聚合为 **领域验收 PASS / 领域已完成**。生产就绪不是单 Domain 生命周期的末端状态，而属于后面的系统级生命周期。

## 二、任务启动前置核验

**任务启动核验不是 Domain 生命周期第一阶段。** 它是任何已有 Domain / Task 在开始、恢复、切换 AI、重大变更或长时间中断后继续工作之前的控制动作。

它只回答：**当前真实起点是什么，我们现在能否安全地从生命周期中的某个位置继续。**

至少核验：

```text
当前 main / BASE_COMMIT
当前产品与设计 authority
当前数据库 / migration physical truth
当前架构 / ADR
当前上游依赖与 contract snapshot
当前代码与测试状态
当前 Task Manifest / claim / allowed paths
canonical spec SHA / Blueprint snapshot（如适用）
当前 blocker / drift / recovery 状态
初始 typecheck / lint / test / build / architecture checks（按 Task 需要）
```

任务启动核验的结果应该是：

```text
TASK_START_CHECK = PASS | BLOCKED
CURRENT_LIFECYCLE_POSITION = <当前应继续的生命周期阶段>
BASE_COMMIT = <sha>
DRIFT = NONE | REVALIDATED | MATERIAL
BLOCKERS = <count / list>
```

存在 `DB_CONFLICT`、`CONTRACT_DRIFT`、`DOCUMENT_CONFLICT`、`DEPENDENCY_NOT_READY`、`SPEC_CONFLICT` 或 `REPOSITORY_DRIFT` 时，不得靠实现 AI 自行猜测解决。

异常路径同样不属于线性生命周期：

```text
ANY LIFECYCLE STAGE
↓
SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT / DEPENDENCY_DRIFT / GATE_FAIL
↓
恢复 / 重新核验
↓
返回原生命周期阶段或原 Gate
```

## 三、Domain 生命周期总矩阵

> “可执行规格”和“实现蓝图”采用非追溯原则：既有已完成任务缺少这些新工件不会被反向判失败；尚未开始实现或发生实质变更的任务应优先迁入新流程。任务启动核验不作为生命周期列；每次真正启动 Task 时单独执行。

| 领域 | 产品定义 | 业务设计 | 状态机 | 领域 / 数据设计 | 契约设计 | 可靠性设计 | 可执行规格 | 设计门禁 | 实现准备 | 后端验证 | 后台轨 | 客户端轨 | 跨域集成 | 领域验收 | 当前阻塞 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-na">历史设计未按新协议单列</span> | <span class="st st-frozen">既有数据契约已冻结</span> | <span class="st st-frozen">Auth / Session / Device 契约可消费</span> | <span class="st st-pass">既有实现已验证</span> | <span class="st st-na">未采用；不追溯</span> | <span class="st st-pass">通过</span> | <span class="st st-na">历史 Backend Task 已执行；不追溯 Blueprint</span> | <span class="st st-pass">已验证</span> | <span class="st st-na">未单列</span> | <span class="st st-pending">待客户端收口</span> | <span class="st st-ready">契约可消费</span> | <span class="st st-pending">未聚合验收</span> | 无当前 Backend 阻塞 | 客户端 Task 启动时先做任务启动核验，再从客户端轨继续 |
| Platform | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-na">历史设计未按新协议单列</span> | <span class="st st-frozen">既有数据契约已冻结</span> | <span class="st st-frozen">Runtime contracts 已冻结</span> | <span class="st st-pass">既有设计 / 实现通过</span> | <span class="st st-na">未采用；不追溯</span> | <span class="st st-pass">通过</span> | <span class="st st-na">历史 Backend Task 已执行；新 Admin Task 应使用 Blueprint</span> | <span class="st st-pass">已验证</span> | <span class="st st-pending">Stage A 已完成；Stage B 待处理</span> | <span class="st st-pending">待客户端收口</span> | <span class="st st-ready">Operations RBAC integration contract 已设计</span> | <span class="st st-pending">未聚合验收</span> | Admin Stage B 尚未收口 | Platform Admin Stage B 启动前做任务启动核验 → Blueprint → 执行 |
| Operations | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-na">历史设计未按新协议单列</span> | <span class="st st-frozen">既有数据契约已冻结</span> | <span class="st st-frozen">RBAC / Audit contract 可消费</span> | <span class="st st-pass">RBAC / Audit 已验证</span> | <span class="st st-na">未采用；不追溯</span> | <span class="st st-pass">通过</span> | <span class="st st-na">历史 Backend Task 已执行；Admin Task 尚未建立</span> | <span class="st st-pass">已验证</span> | <span class="st st-pending">轨道缺失</span> | <span class="st st-na">不适用（后台控制面）</span> | <span class="st st-ready">RBAC / Audit owner 可消费</span> | <span class="st st-pending">未聚合验收</span> | Admin track 尚未建立 | 建立 Operations Admin Task → 任务启动核验 → Brief / Blueprint |
| Content | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pending">业务流程已设计；需按新协议显式确认</span> | <span class="st st-frozen">既有数据契约已冻结</span> | <span class="st st-pass">API / Public / Domain boundaries 已设计</span> | <span class="st st-pending">设计覆盖；runtime race / 并发验证待实现</span> | <span class="st st-na">当前未 adopted</span> | <span class="st st-pass">通过</span> | <span class="st st-pending">Execution Brief 已就绪；Blueprint 待补</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">既有入口审计失败 / 未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">Identity / Audio / Learning 边界已设计；runtime 待实现</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">CONTENT_GATE 尚未通过；存在文档漂移注意项</span> | Content Backend Task 启动核验 → 显式确认状态机 → 补 Blueprint → 实现 |
| Learning | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pending">需按新协议显式确认状态 / transition</span> | <span class="st st-frozen">既有数据契约已冻结</span> | <span class="st st-pass">Progress / mastery / review / practice contracts 已设计</span> | <span class="st st-pending">设计不变量已定义；实现验证待执行</span> | <span class="st st-na">当前未 adopted</span> | <span class="st st-pass">通过</span> | <span class="st st-blocked">依赖满足后重新生成 / 校验 Brief 与 Blueprint</span> | <span class="st st-blocked">未开始</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Content trusted scoring + Identity UUID</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 CONTENT_GATE</span> | Content PASS 后启动 Learning Task 核验 → 状态机 / Blueprint → Backend |
| Audio Production | <span class="st st-recovered">恢复后通过</span> | <span class="st st-recovered">恢复后通过</span> | <span class="st st-ready">TTS polling / retry / lease / batch 已设计；待规格化</span> | <span class="st st-frozen">9-table Slot / Task 数据契约已冻结</span> | <span class="st st-pass">Content / Asset / Operations boundaries 已设计</span> | <span class="st st-ready">Concurrency matrix 已设计；实现验证待执行</span> | <span class="st st-na">当前未 adopted</span> | <span class="st st-recovered">恢复后通过</span> | <span class="st st-blocked">Execution Brief / Blueprint 尚未创建</span> | <span class="st st-blocked">未开始</span> | <span class="st st-pending">Workbench requirements 已设计；实现未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Content；Operations 已可用</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">CONTENT_GATE 未通过</span> | Content PASS 后启动 Audio 实现 Task 核验 → Brief → Blueprint → Backend |
| Social | <span class="st st-pass">产品范围已有权威文档</span> | <span class="st st-pending">正式 Application 业务设计未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-frozen">数据库契约已有冻结基线；正式设计仍需从业务语义验证</span> | <span class="st st-pending">Application contracts 未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-na">未 adopted</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-ready">Identity UUID / Trust report boundary 已有基线</span> | <span class="st st-pending">未开始</span> | 尚未正式排期 | Social Task 启动核验后，从业务设计开始，不从数据库反推功能 |
| Chat | <span class="st st-pass">产品范围已有权威文档</span> | <span class="st st-pending">正式 Application 业务设计未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-frozen">数据库契约已有冻结基线；正式设计仍需从业务语义验证</span> | <span class="st st-blocked">需要 Identity + Social public contracts</span> | <span class="st st-pending">未设计</span> | <span class="st st-na">未 adopted</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Social 所需契约</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Social</span> | Social 所需契约稳定后启动 Chat Task 核验 → 业务设计 |
| Commerce | <span class="st st-pass">产品范围已有权威文档</span> | <span class="st st-pending">正式 Application 业务设计未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-frozen">数据库契约已有冻结基线；正式设计仍需从业务语义验证</span> | <span class="st st-blocked">需要 Identity + Chat logical UUID / contract</span> | <span class="st st-pending">未设计</span> | <span class="st st-na">未 adopted</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Chat 所需契约</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Chat</span> | Chat 所需契约稳定后启动 Commerce Task 核验 → 业务设计 / 状态机 |
| Rewards | <span class="st st-pass">产品范围已有权威文档</span> | <span class="st st-pending">正式 Application 业务设计未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-frozen">数据库契约已有冻结基线；正式设计仍需从业务语义验证</span> | <span class="st st-blocked">依赖 Commerce Event Contract</span> | <span class="st st-pending">未设计</span> | <span class="st st-na">未 adopted</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Commerce event contract</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Commerce</span> | Commerce Event Contract 稳定后启动 Rewards Task 核验 → 业务设计 / 状态机 |
| Trust & Safety | <span class="st st-pass">产品范围已有权威文档</span> | <span class="st st-pending">正式 Application 业务设计未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-frozen">数据库契约已有冻结基线；trust.reports canonical</span> | <span class="st st-blocked">需要上游 subject / report contracts</span> | <span class="st st-pending">未设计</span> | <span class="st st-na">未 adopted</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖 Identity + Social + Chat + Commerce subject contracts</span> | <span class="st st-pending">未开始</span> | <span class="st st-blocked">依赖上游 subject contracts</span> | 上游 subject contracts 稳定后启动 Trust Task 核验 → 业务设计 / 状态机 |

## 四、横切质量与异常控制矩阵

这些项目不是“主生命周期后半段的阶段”，而是在可靠性设计、Blueprint、实现和 Gate 中持续被定义与验证。

| 领域 | 契约 / 事件 / 后台任务 | 安全 / 权限 | 事务 / 并发 / 幂等 | 回归 / CI | 漂移 / 恢复 |
| --- | --- | --- | --- | --- | --- |
| Identity | OTP / Provider / Session runtime | <span class="st st-pass">已验证</span> | <span class="st st-pass">既有实现已验证</span> | <span class="st st-pass">Backend 回归通过</span> | <span class="st st-na">无 active recovery</span> |
| Platform | Runtime control-plane logic | <span class="st st-pass">既有设计 / 实现通过</span> | <span class="st st-pass">既有实现已验证</span> | <span class="st st-pending">Backend 通过；Admin live E2E 待处理</span> | <span class="st st-na">无 active recovery</span> |
| Operations | 无独立 queue；RBAC / Audit owner | <span class="st st-pass">RBAC / Audit 已验证</span> | <span class="st st-pass">既有实现已验证</span> | <span class="st st-pass">Backend 回归通过</span> | <span class="st st-na">无 active recovery</span> |
| Content | 仅真实消费者需要时落 Outbox | <span class="st st-pending">设计覆盖；实现验证待执行</span> | <span class="st st-pending">runtime race / 并发验证待实现</span> | <span class="st st-pending">实现回归未运行</span> | <span class="st st-pending">注意文档漂移；Task 启动前重验</span> |
| Learning | 真实消费者成立后再落事件 | <span class="st st-pending">设计不变量已定义；实现验证待执行</span> | <span class="st st-pending">实现验证待执行</span> | <span class="st st-pending">实现回归未运行</span> | <span class="st st-na">无 active recovery</span> |
| Audio Production | TTS polling worker / retry / lease / batch | <span class="st st-pending">设计完成；实现验证待执行</span> | <span class="st st-ready">Concurrency matrix 已设计；实现验证待执行</span> | <span class="st st-pending">Design audit 通过；实现 CI 未开始</span> | <span class="st st-recovered">错误设计包已清理并恢复</span> |
| Social | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-na">无 active recovery</span> |
| Chat | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-na">无 active recovery</span> |
| Commerce | <span class="st st-pending">Payment / outbox application flows 未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-na">无 active recovery</span> |
| Rewards | <span class="st st-pending">Reward consumer / delivery application 未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-na">无 active recovery</span> |
| Trust & Safety | <span class="st st-pending">Moderation / enforcement application flows 未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-na">无 active recovery</span> |

## 五、系统级生命周期

生产就绪从 Domain 主矩阵移出，改为系统级生命周期：

| 系统阶段 | 准入条件 | 主要目标 |
| --- | --- | --- |
| 系统级集成 | 相关 Domain 已验收 / Public Contract 达到准入 | 跨域契约、事件、读模型、权限与幂等闭环 |
| 完整客户端集成 | Required APIs / Domain 验收状态可用 | Admin / Mobile 导航、权限、跨域用户旅程最终收口 |
| 全系统验收 | Product Feature Complete | E2E、Security、Performance、Recovery、Migration、CI |
| 生产就绪门禁 | Full-System Validation PASS | Deploy、Observability、Runbook、Provider、Backup / Recovery |
| 发布 | All mandatory release gates PASS | 正式发布 |

## 六、Gate 与状态语义

| 名称 | 证明什么 | 不证明什么 |
| --- | --- | --- |
| 任务启动核验 | 当前仓库、authority、数据库 physical truth、依赖、代码、Task 与初始验证足够确认“从生命周期哪一步继续” | 产品方向已经正确或设计已经完成 |
| 设计门禁 | 产品定义、业务规则、状态机、领域 / 数据设计、契约和可靠性约束足够明确 | 代码已实现 |
| 实现准备门禁 | Brief / Blueprint / snapshot 足够让实现 Worker 开工 | 实现正确 |
| 后端验证门禁 | 后端代码、测试及必要 runtime evidence 已通过 | Admin / Client / Domain 已完成 |
| 后台 / 客户端 / 集成门禁 | 对应消费轨道已完成 | 其他轨道已完成 |
| 领域验收门禁 | 该 Domain 所需全部轨道与必要回归已满足 | 全系统已生产就绪 |
| 生产就绪门禁 | 全系统具备上线条件 | 单个 commit 或单个 Domain 自行宣称即可上线 |

已有历史 Gate 文件不强制重命名；判断其语义时看它实际覆盖的证据，不看文件名。新 Task 应优先使用精确 Gate 语义，避免继续把 `BACKEND PASS`、`DOMAIN PASS`、`FROZEN` 混写。

## 七、维护规则

1. **本页是 derived view，不是 Gate 事实源。**
2. **产品 / 业务在前，数据在后。** 数据模型必须从产品目标、Use Case、业务规则与领域事实推导；已有数据库只作为当前 physical truth 与实现约束，不能反向决定产品功能。
3. **任务启动核验不是 Domain 生命周期阶段。** 它负责确认当前真实起点和应该从哪一步继续。
4. **有代码 commit ≠ 后端验证 PASS。** 必须有 Report / 测试 / 独立 Gate evidence。
5. **设计门禁 PASS → 实现准备，不再直接等价于 Backend Entry。** 新 Task 应先完成 Brief / Blueprint / drift check。
6. **状态机是业务设计一级组成。** 适用但未显式设计 / 验证时，不得用“Use Case 已完成”替代状态机证据。
7. **Backend PASS ≠ Domain COMPLETE。** 后台、客户端、跨域集成按适用性独立收口。
8. **Contract Frozen ≠ Domain Frozen。** 只冻结被明确命名的契约 / boundary。
9. **Recovery / Drift 是异常路径，不是线性末端阶段。** 修复后必须返回原 Gate 重新验证。
10. **Production Readiness 属于系统级生命周期。** 不在单 Domain 主生命周期里提前宣称。
11. **非追溯采用。** 已完成历史 Task 不因 Executable Spec / Blueprint 新协议自动失败；尚未实现、实质变更或显式 adopted 的 Task 应进入新流程。
12. **同一依赖链按 Gate 顺序推进；互不依赖且路径 / Contract 不冲突的实现轨可以并行。**
13. 本页只记录当前 `main` 能证实的状态；不确定保持 `— / 未开始 / 未采用`，不得靠聊天记忆补 PASS。
14. 状态变化时同步检查 `DEVELOPMENT_PROGRESS.md` 与 `DEVELOPMENT_CONTROL_CENTER.md`。
15. 表格保持标准 Markdown table；不要改成包含空行的 raw HTML `<table>`，避免 VitePress 将 `<tr>/<td>` 解析成文本。
16. 状态值使用本页 `.st` 徽章样式；不要退回无颜色的裸状态文本。
17. 主矩阵数据列固定宽度；长内容在固定列宽内换行，不得自动撑宽整页。

<style>
.domain-lifecycle-matrix-page .VPContent,
.domain-lifecycle-matrix-page .VPPage,
.domain-lifecycle-matrix-page main,
.domain-lifecycle-matrix-page .content-container {
  width: 100% !important;
  max-width: none !important;
}
.domain-lifecycle-matrix-page .VPContent,
.domain-lifecycle-matrix-page main {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.domain-lifecycle-matrix-page h2,
.domain-lifecycle-matrix-page h3,
.domain-lifecycle-matrix-page > p,
.domain-lifecycle-matrix-page > blockquote,
.domain-lifecycle-matrix-page > pre {
  margin-left: 12px;
  margin-right: 12px;
}
.domain-lifecycle-matrix-page table {
  display: block !important;
  width: calc(100vw - 8px) !important;
  max-width: none !important;
  margin: 10px 4px 24px !important;
  overflow-x: auto !important;
  white-space: normal;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 11.5px;
  line-height: 1.35;
}
.domain-lifecycle-matrix-page table:first-of-type th,
.domain-lifecycle-matrix-page table:first-of-type td {
  box-sizing: border-box;
  width: 124px !important;
  min-width: 124px !important;
  max-width: 124px !important;
  padding: 7px 8px;
  vertical-align: top;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.domain-lifecycle-matrix-page table:first-of-type th:first-child,
.domain-lifecycle-matrix-page table:first-of-type td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
  width: 112px !important;
  min-width: 112px !important;
  max-width: 112px !important;
  font-weight: 700;
  background: var(--vp-c-bg-soft);
}
.domain-lifecycle-matrix-page table thead th {
  font-weight: 700;
  background: var(--vp-c-bg-soft);
}
.st {
  display: inline-block;
  box-sizing: border-box;
  max-width: 100%;
  margin: 1px 2px 2px 0;
  padding: 2px 6px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.35;
  white-space: normal;
  text-align: center;
}
.st-pass { color: #166534; background: #dcfce7; border-color: #86efac; }
.st-frozen { color: #3730a3; background: #e0e7ff; border-color: #a5b4fc; }
.st-ready { color: #1d4ed8; background: #dbeafe; border-color: #93c5fd; }
.st-blocked { color: #b91c1c; background: #fee2e2; border-color: #fca5a5; }
.st-pending { color: #92400e; background: #fef3c7; border-color: #fcd34d; }
.st-recovered { color: #6d28d9; background: #ede9fe; border-color: #c4b5fd; }
.st-na { color: #4b5563; background: #f3f4f6; border-color: #d1d5db; }
.dark .st-pass { color: #86efac; background: rgba(22,101,52,.28); border-color: #166534; }
.dark .st-frozen { color: #c7d2fe; background: rgba(55,48,163,.32); border-color: #4f46e5; }
.dark .st-ready { color: #bfdbfe; background: rgba(29,78,216,.28); border-color: #2563eb; }
.dark .st-blocked { color: #fecaca; background: rgba(185,28,28,.28); border-color: #dc2626; }
.dark .st-pending { color: #fde68a; background: rgba(146,64,14,.30); border-color: #b45309; }
.dark .st-recovered { color: #ddd6fe; background: rgba(109,40,217,.30); border-color: #7c3aed; }
.dark .st-na { color: #d1d5db; background: rgba(75,85,99,.30); border-color: #6b7280; }
@media (max-width: 768px) {
  .domain-lifecycle-matrix-page h2,
  .domain-lifecycle-matrix-page h3,
  .domain-lifecycle-matrix-page > p,
  .domain-lifecycle-matrix-page > blockquote,
  .domain-lifecycle-matrix-page > pre {
    margin-left: 8px;
    margin-right: 8px;
  }
  .domain-lifecycle-matrix-page table:first-of-type th,
  .domain-lifecycle-matrix-page table:first-of-type td {
    width: 112px !important;
    min-width: 112px !important;
    max-width: 112px !important;
  }
}
</style>