---
status: baseline
last_updated: 2026-09-02
---

# Content Versioning & Review Domain（内容版本与审核发布）

> 状态：Domain Framework Draft  
> 领域：Content Domain & Operations Boundary  
> 职责：定义内容实体的不可变修订版本（Content Revision）、审核状态机、发布指针原子切换、乐观锁与幂等控制及 C 端可见性守卫。

---

## 1. 不可变版本模型（Immutable Content Revision）[PA, ADR-003]

### 1.1 核心设计准则
- **已发布内容不可原地修改**：一旦某版本内容正式发布上线（`Published`），该版本数据即永久冻结为历史快照，禁止执行任何 UPDATE 或 DELETE 操作。
- **后继修订机制**：对已发布内容的任何修改，必须基于当前发布版本克隆创建一个新的后继工作版本（Working Revision）。
- **活动工作版本守卫（Active Work Guard）**：同一内容实体在同一时刻**至多只能存在一个处于编辑或审核流程中的活动工作版本**，避免并发编辑导致版本分叉。

### 1.2 全量快照与差异记录（Snapshot & Hashes）
- 修订版本保存该条目完整的全量内容快照（`content_payload`）以及组成链关系快照；
- 维护 `content_hash`（用于内容查重与完整性验证）和 `audio_input_hash`（用于联动发音资产陈旧判定）。

---

## 2. 状态机与生命周期流转 [PA]

### 2.1 审核状态机（Review Status Flow）
```text
[Draft (草稿)]
   │ 提交审核
   ▼
[Pending Review (待审核)] ──(驳回)──► [Rejected (已驳回)]
   │                                     │
   │ 审核通过                             │ 重新编辑
   ▼                                     ▼
[Approved (已通过)] ─────────────► [Draft (草稿)]
   │
   │ 显式发布
   ▼
[Published (已正式发布)] ──(废弃/被取代)──► [Superseded (已归档)]
```

### 2.2 上线状态与审核状态解耦（Online Status Independence）
- **审核状态（Review Status）**：反映教研内容的质量与合规性审批状态（Draft / Pending Review / Approved / Published / Rejected / Superseded）。
- **上线状态（Online Status）**：反映运营层面的可用性状态（`online` 上线 / `offline` 下线 / `deleted` 软删除）。
- 两个状态维度互相正交：下线（`offline`）不会撤销已通过的审核，重新上线也无需重新走全量审核流程。

---

## 3. 正式指针原子切换与并发控制 [PA]

### 3.1 正式指针机制（Published Pointer）
- 内容主实体只维护指向当前正式版本的指针（`published_revision_id`）以及指向当前活动编辑版本的指针（`working_revision_id`）。
- 内容发布动作在单个数据库事务内完成：
  1. 将目标修订版本状态标记为 `Published`；
  2. 将实体主表的 `published_revision_id` 原子更新为该版本；
  3. 将旧发布版本标记为 `Superseded`（若适用）；
  4. 追加版本发布领域事件。

### 3.2 乐观锁与并发控制（Optimistic Locking）
- 所有版本变更与审核接口强制校验 `lock_version` 乐观锁版本号，防止并发写覆盖。
- 关键流转接口（提交、审核、发布）必须支持 `Idempotency-Key` 幂等控制。

### 3.3 审计与事件溯源（Domain Events）
- 所有状态流转、审核意见（`review_remark`）、操作人与时间均记录在追加式领域事件日志中，确保完整的生命周期可审计性。

---

## 4. C 端可见性守卫规则（Visibility Guard）[PA]

客户端（H5 / Mobile App / 小程序）对任何学习内容的读取，必须严格执行以下多重可见性守卫过滤：

```text
C 端可见内容 = (未软删除: online_status != 'deleted')
            ∩ (已上线: online_status == 'online')
            ∩ (已发布: 实体拥有合法 published_revision_id)
            ∩ (VIP 权限达标: user.vip_level >= content.vip_required)
            ∩ (底层组成依赖均已发布: Letters & Syllables & Words published)
```

**绝对安全红线**：严禁向客户端泄露草稿版本（Draft）、待审核版本（Pending Review）、已驳回版本（Rejected）或未经审核通过的音频与外部词典候选数据。

---

## 5. Engineering Reality 历史映射 [ER]

> 仅记录旧系统事实备查，不作为新系统架构依赖：
- 旧系统落点于 `lao_{letter,syllable,word,sentence,course}_revision` 表系列及 `lao_*_event` 事件表。
- 旧实体 `app_letter` / `app_syllable` 早期曾使用整型审核状态（`0-待完善 / 1-待审核 / 2-已通过 / 3-已驳回`），在演进中补齐了 `published_revision_id`。
- `ContentEntityResolver` 服务提供了 9 类实体的统一注册与受控多态解析。

---

## 6. 未决事项 [UNKNOWN]

1. **[UNKNOWN] 批量发布与版本发版快照包机制（Release Bundle）**：当前版本机制为单实体独立发布粒度，新系统需决策是否引入按单元或按课程的「发布版本包（Release Snapshots）」整体发版机制。
2. **[UNKNOWN] 多分支/多环境草稿协同流**：对于大规模课程重构，当前单工作版本限制（Active Work Guard）是否满足多人协作教研诉求待评估。
3. **[UNKNOWN] 审核流分级授权矩阵**：初审、复审、终审权限与人员角色（Auditor / Lead / Admin）的细粒度 RBAC 权限矩阵待完善。
