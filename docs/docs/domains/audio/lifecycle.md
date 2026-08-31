---
status: frozen
last_updated: 2026-08-31
---

# 工作流与状态机

本页定义 Audio Production 的业务状态、主流程、发布事务、批处理以及并发/幂等规则。

## 状态集合

| 对象 | 字段 | 状态 |
| --- | --- | --- |
| Audio Slot | `status` | `active` / `offline` |
| Audio Task | `status` | `pending_assignment` / `assigned` / `producing` / `pending_review` / `production_failed` / `approved` / `rejected` / `published` / `canceled` |
| Generation Attempt | `status` | `queued` / `submitting` / `processing` / `retry_wait` / `succeeded` / `failed` / `dead_letter` / `canceled` |
| Asset Version | `review_status` | `pending_review` / `approved` / `rejected` |
| Review | `decision` | `approved` / `rejected` / `approval_revoked` |
| Task Batch | `status` | `creating` / `completed` / `failed` / `canceled` |
| Batch Item | `result_status` | `created` / `skipped` / `failed` |

Audio Task 不使用 `needs_regeneration` 作为主状态；审核质量失败通过 `rejected + successor Task` 表达。

## 端到端主流程

```text
Content 产生音频需求
          ↓
       Audio Slot
          ↓
检查 official asset 是否 fresh
          ↓
无正式版本 / stale
          ↓
     创建 Audio Task
          ↓
┌───────────────────────┐
│                       │
TTS                 Human Recording
│                       │
Generation Attempt      管理员录音
│                       │
└──────────┬────────────┘
           ↓
      Asset Version
           ↓
      pending_review
           ↓
        Review
       /      \
 approved    rejected
    ↓           ↓
Task approved  Task rejected
    ↓           ↓
 Publish      清理资格 / successor Task
    ↓
official pointer
    ↓
Task published
```

## 技术失败路径

```text
Task producing
↓
Generation Attempt
↓
技术失败
↓
retry_wait / failed / dead_letter 等 Attempt 状态
↓
同一 Task 下继续新的/后续 Attempt
```

业务 Task 可以进入 `production_failed`，但技术重试仍属于同一次业务生产意图。

## 质量失败路径

```text
Asset Version
↓
Review rejected
↓
Task rejected
↓
旧 Task 结束
↓
需要重产时创建 successor Task
```

质量失败不能复用为技术 Retry 语义。

## 发布事务

发布必须原子完成：

```text
BEGIN
1. 验证 Asset Version.review_status == approved
2. 验证 Asset Version 属于目标 Slot
3. first_published_at 为空时写入首次发布时间
4. 更新 audio_slots.official_asset_version_id
5. Task → published
6. 写入 published Task Event
COMMIT
```

禁止出现：

```text
Task 已 published
但 Slot 仍指向旧 official asset
```

## Review 与 Publish

审核通过只改变“是否具备发布资格”；Publish 才改变当前正式版本。

```text
pending_review
↓
approved
↓
Publish
↓
published + official pointer 更新
```

因此 Review 与 Publish 必须是两个独立业务动作。

## Batch

Batch 只负责**批量创建 Audio Task**，不是长期跟踪所有子任务生命周期的 Workflow。

```text
Batch creating
↓
逐项 created / skipped / failed
↓
Batch completed / failed / canceled
```

创建阶段完成后，子 Task 继续进入 producing / review / publish 不反向改变 Batch 状态。

### Batch 幂等

```text
相同 idempotency key + 相同 request_hash
→ 返回原 Batch

相同 idempotency key + 不同 request_hash
→ 拒绝
```

## 并发与幂等

### 业务唯一性

通过 UNIQUE / Partial UNIQUE 等数据库约束保证：

- 不重复创建同一逻辑 Slot；
- 同一 Slot 不出现多个活动生产 Task；
- 一个 Task 不产生多个最终 Asset Version；
- 一个 Generation Attempt 不产生多个 Asset Version；
- 同一个 `asset_id` 不被多个 Audio Asset Version 重复引用。

### 请求幂等

使用明确的业务幂等键，例如：

```text
client_idempotency_key
request_id
batch idempotency key
```

客户端、Worker 或 TTS callback 重试不能制造重复业务事实。

### 乐观并发

Audio Task 使用 `lock_version` 保护后台多个操作者/流程同时更新时不发生静默覆盖。

### Attempt 运行并发

Generation Attempt 可使用：

```text
transport_retry_count
next_retry_at
lease_until
external_job_id
```

协调 Worker Retry、External Callback 与重复处理。

## 生命周期审计

`audio_task_events` 保存 Task 生命周期审计事实。

重要状态变化应有对应事件记录；事件不能替代 Task 当前状态，但必须能够解释关键生命周期变化。

## 测试要求

实现必须至少验证：

- 合法状态转换成功；
- 非法状态转换拒绝；
- 技术失败不会错误创建 successor Task；
- 审核 rejected 不会继续复用同一 Task 做质量重产；
- approved 不会自动成为 published；
- 发布事务保持 Task 与 official pointer 一致；
- 并发创建 Task 不破坏“一个 Slot 一个活动 Task”；
- Callback / Retry 重放保持幂等；
- Batch idempotency key 不可带不同 request hash 复用。
