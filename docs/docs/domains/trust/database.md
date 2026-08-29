---
status: baseline
last_updated: 2026-08-30
schema: trust
source_conversation_id: 6a93401c-51bc-83ea-aa6e-ac314a5af8c8
source_share_url: https://chatgpt.com/share/6a93401c-51bc-83ea-aa6e-ac314a5af8c8
---

# Trust & Safety 数据库（Schema `trust`）

本页是 Trust & Safety 域的数据库唯一事实源，内容来自「设计 Trust & Safety Domain」主架构会话（分享链接见上）的审计定稿。

## 状态说明

- **逻辑模型（表、字段、关系、约束、状态枚举、不可违反规则）：`baseline`。** 会话以「最终审计定稿」收尾并结论为「可以正式冻结」。
- **物理约定（主键类型、跨域引用是否建物理 FK）：`designing`，待主会话裁决。** 本会话全程采用 `uuid` 主键 + 只保留域内物理 FK + 跨域只存逻辑 ID 不建 FK，与全局 PostgreSQL 规范第 3/11/12 条（`bigint generated always as identity` + 保留并允许跨 Schema FK）冲突，且与 Commerce V1 的物理约定一致。该冲突由 [D-077/D-078](../../governance/design-register.md) 提出，并在本会话进一步确认为项目级普遍现象。**裁决前不得把本页 DDL 直接落 migration，也不得据此改动其他域或全局规范。**

## 域职责边界（先于表）

Trust & Safety 只拥有「举报 → 审核案件 → 证据 → 审核决定 → 安全处置 → 申诉」这条安全治理链路。它**不拥有**被审核的业务对象本身：

| 对象 | 真正所属域 | Trust 做什么 |
| --- | --- | --- |
| 用户账号 / 认证 / 登录 | Identity | 引用 `target_user_id`，发安全限制/封禁事实 |
| 社交资料 / 动态 / 图片 | Social | 可作为审核目标（`subject_type`）；`content_remove` 经领域事件由 Social 自行变更状态 |
| 会话 / 消息 | Chat | 可作为审核目标；`chat_send_restrict` 经领域事件由 Chat 自行执行 |
| 礼物 / 钱包 / 订单 | Commerce | 不处理资金与交易 |
| 奖励规则 | Rewards | 不处理 |
| 用户主动 Block | Social（`social_blocks`，D-034） | **不属于 Trust** |

关键原则：**Trust 只产生治理处置与处置历史，不直接 `UPDATE identity.* / social.* / chat.* / commerce.* / rewards.*`；跨域执行由各属主域消费领域事件完成（T&S-12）。**

## 全局约定（本会话重申，物理部分待裁决）

1. 主键：`uuid`（**待裁决**，与 D-007 冲突）。
2. 时间：`timestamptz`，服务端绝对时间。
3. 状态：`varchar(32) + CHECK`，不泛化 ENUM。
4. 业务规则不放入数据库触发器；核心治理事实（Evidence / Decision）不可变，正常业务禁止 UPDATE/DELETE。
5. **域内物理 FK**：`ON DELETE RESTRICT`，绝不使用 `ON DELETE CASCADE`（安全审计数据）。
6. **跨域引用**：只保存逻辑 ID，不建 PostgreSQL FK；通过 `subject_type + subject_id` / `reference_type + reference_id` 协议表达。

---

## 1. `trust.reports` — 不可变的用户举报事实

只保存用户提交举报这一事实；不保存审核结果或处理状态（处理状态从 `moderation_cases` 派生）。append-only，举报内容不允许后续编辑覆盖。

```sql
CREATE TABLE trust.reports (
    id uuid PRIMARY KEY,

    reporter_user_id uuid NOT NULL,            -- 逻辑引用 identity.users，不建 FK

    subject_type varchar(32) NOT NULL,
    subject_id   uuid NOT NULL,                -- 逻辑引用对应业务域对象，不建 FK

    reason_code varchar(32) NOT NULL,          -- 举报者观点，非违规事实（T&S-07）
    description text,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT reports_subject_type_check
        CHECK (subject_type IN (
            'user', 'social_profile', 'social_post',
            'social_post_image', 'chat_message', 'conversation'
        )),

    CONSTRAINT reports_reason_code_check
        CHECK (reason_code IN (
            'spam', 'harassment', 'hate', 'sexual_content', 'violence',
            'fraud', 'impersonation', 'illegal_content', 'privacy',
            'underage', 'other'
        ))
);

CREATE INDEX idx_reports_reporter_created
    ON trust.reports (reporter_user_id, created_at DESC);

CREATE INDEX idx_reports_subject_created
    ON trust.reports (subject_type, subject_id, created_at DESC);
```

> 审计修正（相对首版）：删除 `status` 与 `updated_at`。举报处理状态应从 `moderation_cases` 派生，避免 `report.status` 与 `case.status` 双事实源冲突。

---

## 2. `trust.moderation_cases` — 统一审核工作流（核心表）

统一承载用户举报审核、发布前审核、人工巡检、AI 自动检测、系统规则触发。一个用户举报最多生成一个案件（复审走 `appeals`，不新建 Case）。

```sql
CREATE TABLE trust.moderation_cases (
    id uuid PRIMARY KEY,

    source_type varchar(32) NOT NULL,
    report_id   uuid,                          -- 仅 user_report 来源非空；域内 FK

    subject_type varchar(32) NOT NULL,
    subject_id   uuid NOT NULL,

    priority varchar(16) NOT NULL DEFAULT 'normal',
    status   varchar(24) NOT NULL DEFAULT 'queued',

    assigned_reviewer_user_id uuid,            -- 逻辑引用审核员用户，不建 FK
    cancellation_code varchar(32),

    review_started_at timestamptz,
    closed_at         timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT moderation_cases_report_fk
        FOREIGN KEY (report_id) REFERENCES trust.reports(id) ON DELETE RESTRICT,

    CONSTRAINT moderation_cases_source_type_check
        CHECK (source_type IN (
            'user_report', 'pre_publish', 'manual_review',
            'automated_detection', 'system_rule'
        )),

    CONSTRAINT moderation_cases_subject_type_check
        CHECK (subject_type IN (
            'user', 'social_profile', 'social_post',
            'social_post_image', 'chat_message', 'conversation'
        )),

    CONSTRAINT moderation_cases_priority_check
        CHECK (priority IN ('low', 'normal', 'high', 'critical')),

    CONSTRAINT moderation_cases_status_check
        CHECK (status IN ('queued', 'in_review', 'resolved', 'cancelled')),

    CONSTRAINT moderation_cases_cancellation_code_check
        CHECK (cancellation_code IS NULL OR cancellation_code IN (
            'subject_unavailable', 'superseded', 'invalid_source', 'duplicate', 'other'
        )),

    -- user_report 必须带 report_id；其余来源必须不带
    CONSTRAINT moderation_cases_report_source_check
        CHECK (
            (source_type = 'user_report' AND report_id IS NOT NULL)
            OR (source_type <> 'user_report' AND report_id IS NULL)
        ),

    -- 用户举报产生的案件不允许被取消（避免举报被静默消解）
    CONSTRAINT moderation_cases_user_report_not_cancelled_check
        CHECK (source_type <> 'user_report' OR status <> 'cancelled'),

    -- cancelled 必须有原因；非 cancelled 不得有原因
    CONSTRAINT moderation_cases_cancellation_check
        CHECK (
            (status = 'cancelled' AND cancellation_code IS NOT NULL)
            OR (status <> 'cancelled' AND cancellation_code IS NULL)
        ),

    CONSTRAINT moderation_cases_lifecycle_check
        CHECK (
            (status = 'queued'     AND review_started_at IS NULL AND closed_at IS NULL)
            OR (status = 'in_review' AND review_started_at IS NOT NULL AND closed_at IS NULL)
            OR (status = 'resolved'  AND review_started_at IS NOT NULL AND closed_at IS NOT NULL)
            OR (status = 'cancelled' AND closed_at IS NOT NULL)
        ),

    CONSTRAINT moderation_cases_time_order_check
        CHECK (
            (review_started_at IS NULL OR review_started_at >= created_at)
            AND (closed_at IS NULL OR closed_at >= created_at)
            AND (review_started_at IS NULL OR closed_at IS NULL OR closed_at >= review_started_at)
        )
);

-- 一个 Report 最多一个 Case（V1）
CREATE UNIQUE INDEX uq_moderation_cases_report
    ON trust.moderation_cases (report_id) WHERE report_id IS NOT NULL;

-- 审核队列：优先级为业务顺序，必须用表达式索引，不能依赖 varchar 字典序 DESC
CREATE INDEX idx_moderation_cases_queue
    ON trust.moderation_cases (
        (CASE priority
            WHEN 'critical' THEN 4
            WHEN 'high'     THEN 3
            WHEN 'normal'   THEN 2
            WHEN 'low'      THEN 1
        END) DESC,
        created_at ASC
    ) WHERE status = 'queued';

CREATE INDEX idx_moderation_cases_reviewer
    ON trust.moderation_cases (assigned_reviewer_user_id, status, created_at)
    WHERE assigned_reviewer_user_id IS NOT NULL;

CREATE INDEX idx_moderation_cases_subject
    ON trust.moderation_cases (subject_type, subject_id, created_at DESC);
```

> 审计修正（相对首版）：新增 `cancellation_code` 及 `user_report_not_cancelled_check` / `cancellation_check` / `time_order_check`；队列索引由 `priority DESC` 改为表达式索引；删除 `idx_moderation_cases_source`。
> 应用层不变量：当 `source_type = user_report` 时，`case.subject_type/subject_id` 必须与 `report.subject_type/subject_id` 一致（T&S-04），由 Trust Application Service 同事务校验，不额外制造索引。

---

## 3. `trust.moderation_evidence` — 审核证据（不可变快照）

保存审核过程中依法合理取得的证据快照或引用。一旦形成不得修改或删除；补充证据只能新增。无 `updated_at`。

```sql
CREATE TABLE trust.moderation_evidence (
    id uuid PRIMARY KEY,

    case_id  uuid NOT NULL,
    appeal_id uuid,                           -- 申诉期间提交的补充证据；域内 FK，见下方 ALTER

    evidence_type varchar(32) NOT NULL,       -- 证据是什么
    source_type   varchar(24) NOT NULL,       -- 证据从哪来

    content_text text,
    storage_key  varchar(512),                -- Trust 自行控制的存储键，不依赖业务域 URL

    reference_type varchar(32),
    reference_id   uuid,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    content_sha256 varchar(64),               -- 证据完整性哈希（varchar + CHECK，非 char(64)）

    captured_at timestamptz NOT NULL,
    added_by_user_id uuid,                    -- 逻辑引用提交用户，不建 FK

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT moderation_evidence_case_fk
        FOREIGN KEY (case_id) REFERENCES trust.moderation_cases(id) ON DELETE RESTRICT,

    CONSTRAINT moderation_evidence_type_check
        CHECK (evidence_type IN (
            'text_snapshot', 'media_snapshot', 'object_reference', 'metadata_snapshot'
        )),

    CONSTRAINT moderation_evidence_source_check
        CHECK (source_type IN (
            'system', 'domain_snapshot', 'reporter', 'appellant', 'moderator'
        )),

    -- 来源决定是否有 added_by_user_id
    CONSTRAINT moderation_evidence_actor_check
        CHECK (
            (source_type IN ('system', 'domain_snapshot') AND added_by_user_id IS NULL)
            OR (source_type IN ('reporter', 'appellant', 'moderator') AND added_by_user_id IS NOT NULL)
        ),

    CONSTRAINT moderation_evidence_reference_type_check
        CHECK (reference_type IS NULL OR reference_type IN (
            'user', 'social_profile', 'social_post',
            'social_post_image', 'chat_message', 'conversation'
        )),

    CONSTRAINT moderation_evidence_reference_pair_check
        CHECK (
            (reference_type IS NULL AND reference_id IS NULL)
            OR (reference_type IS NOT NULL AND reference_id IS NOT NULL)
        ),

    CONSTRAINT moderation_evidence_metadata_check
        CHECK (jsonb_typeof(metadata) = 'object'),

    CONSTRAINT moderation_evidence_sha256_check
        CHECK (content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$'),

    -- 证据类型与存储方式一一对应，杜绝脏数据
    CONSTRAINT moderation_evidence_payload_check
        CHECK (
            (evidence_type = 'text_snapshot'
                AND content_text IS NOT NULL AND storage_key IS NULL
                AND reference_id IS NULL AND content_sha256 IS NOT NULL)
            OR (evidence_type = 'media_snapshot'
                AND content_text IS NULL AND storage_key IS NOT NULL
                AND reference_id IS NULL AND content_sha256 IS NOT NULL)
            OR (evidence_type = 'object_reference'
                AND content_text IS NULL AND storage_key IS NULL
                AND reference_type IS NOT NULL AND reference_id IS NOT NULL)
            OR (evidence_type = 'metadata_snapshot'
                AND content_text IS NULL AND storage_key IS NULL
                AND reference_id IS NULL AND metadata <> '{}'::jsonb)
        )
);

-- appeal_id FK 在 appeals 建表后补（域内）
ALTER TABLE trust.moderation_evidence
    ADD CONSTRAINT moderation_evidence_appeal_fk
    FOREIGN KEY (appeal_id) REFERENCES trust.appeals(id) ON DELETE RESTRICT;

CREATE INDEX idx_moderation_evidence_case
    ON trust.moderation_evidence (case_id, captured_at);

CREATE INDEX idx_moderation_evidence_appeal
    ON trust.moderation_evidence (appeal_id, captured_at)
    WHERE appeal_id IS NOT NULL;

CREATE INDEX idx_moderation_evidence_reference
    ON trust.moderation_evidence (reference_type, reference_id)
    WHERE reference_id IS NOT NULL;
```

> 审计修正（相对首版）：移除 `user_submission` 证据类型（它是来源维度，非证据类型）；`source_type` 新增 `appellant`；`content_sha256` 由 `char(64)` 改为 `varchar(64) + CHECK`；`created_by_user_id` → `added_by_user_id`；新增 `appeal_id` 与 `actor_check` / `reference_type_check` / `sha256_check` / 严格 `payload_check`。

---

## 4. `trust.moderation_decisions` — 审核最终判定（不可变）

一 Case 最多一个最终 Decision；一旦形成不得修改或删除（申诉不 `UPDATE` 原 Decision，而新建 `appeal`）。`reason_code` 是举报者观点，`violation_code` 才是违规事实。

```sql
CREATE TABLE trust.moderation_decisions (
    id uuid PRIMARY KEY,

    case_id uuid NOT NULL,

    outcome varchar(32) NOT NULL,
    violation_code varchar(40),
    severity varchar(16) NOT NULL DEFAULT 'none',

    policy_code varchar(64),
    policy_version varchar(32),

    decision_method varchar(16) NOT NULL,
    decided_by_user_id uuid,                  -- 逻辑引用；automated 时为 NULL

    rationale text,
    decided_at timestamptz NOT NULL,

    CONSTRAINT moderation_decisions_case_fk
        FOREIGN KEY (case_id) REFERENCES trust.moderation_cases(id) ON DELETE RESTRICT,

    CONSTRAINT moderation_decisions_case_unique UNIQUE (case_id),

    CONSTRAINT moderation_decisions_outcome_check
        CHECK (outcome IN ('no_violation', 'violation', 'insufficient_evidence')),

    CONSTRAINT moderation_decisions_violation_code_check
        CHECK (violation_code IS NULL OR violation_code IN (
            'spam', 'harassment', 'hate', 'sexual_content', 'violence',
            'fraud', 'impersonation', 'illegal_content', 'privacy',
            'underage_safety', 'other_policy_violation'
        )),

    CONSTRAINT moderation_decisions_severity_check
        CHECK (severity IN ('none', 'low', 'medium', 'high', 'critical')),

    -- 违规必须记录 policy 与版本；非违规则不得有
    CONSTRAINT moderation_decisions_result_check
        CHECK (
            (outcome = 'violation' AND violation_code IS NOT NULL AND severity <> 'none'
                AND policy_code IS NOT NULL AND policy_version IS NOT NULL)
            OR (outcome IN ('no_violation', 'insufficient_evidence')
                AND violation_code IS NULL AND severity = 'none')
        ),

    CONSTRAINT moderation_decisions_policy_pair_check
        CHECK (
            (policy_code IS NULL AND policy_version IS NULL)
            OR (policy_code IS NOT NULL AND policy_version IS NOT NULL)
        ),

    CONSTRAINT moderation_decisions_method_check
        CHECK (decision_method IN ('human', 'automated', 'hybrid')),

    CONSTRAINT moderation_decisions_actor_check
        CHECK (
            (decision_method = 'automated' AND decided_by_user_id IS NULL)
            OR (decision_method IN ('human', 'hybrid') AND decided_by_user_id IS NOT NULL)
        )
);

CREATE INDEX idx_moderation_decisions_violation
    ON trust.moderation_decisions (violation_code, decided_at DESC)
    WHERE outcome = 'violation';
```

> 审计修正（相对首版）：删除 `created_at`（与 `decided_at` 重复）；新增 `result_check`（强制违规带 policy_code/policy_version）。`UNIQUE(case_id)` 已自动建索引，删除 `idx_decisions_method`。

---

## 5. `trust.enforcement_actions` — 安全处置指令（本会话改动最大）

Trust 只产生治理处置事实，不直接改他域状态。一个 Decision 可产生 0..N 条 Enforcement（如 `content_remove + warning`）。申诉修改处罚时禁止覆盖原参数，应「原 Action → revoked + 新 Action（带 `appeal_id`）」。

```sql
CREATE TABLE trust.enforcement_actions (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,
    appeal_id   uuid,                         -- 申诉→处罚调整审计链；域内 FK

    action_type varchar(32) NOT NULL,

    target_user_id uuid,                      -- 用户级处罚；逻辑引用，不建 FK
    subject_type varchar(32),                 -- 内容级处罚；逻辑引用，不建 FK
    subject_id   uuid,

    status varchar(24) NOT NULL DEFAULT 'pending',

    effective_at timestamptz NOT NULL,
    expires_at   timestamptz,

    applied_at timestamptz,
    ended_at   timestamptz,                   -- 替代旧 revoked_at
    status_reason_code varchar(64),           -- 替代旧 failure_code / revocation_reason

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT enforcement_actions_decision_fk
        FOREIGN KEY (decision_id) REFERENCES trust.moderation_decisions(id) ON DELETE RESTRICT,

    CONSTRAINT enforcement_actions_appeal_fk
        FOREIGN KEY (appeal_id) REFERENCES trust.appeals(id) ON DELETE RESTRICT,

    CONSTRAINT enforcement_actions_type_check
        CHECK (action_type IN (
            'warning', 'content_remove', 'content_restrict',
            'social_post_restrict', 'chat_send_restrict',
            'account_suspend', 'account_ban'
        )),

    CONSTRAINT enforcement_actions_status_check
        CHECK (status IN (
            'pending', 'applied', 'expired', 'revoked', 'cancelled', 'failed'
        )),

    -- 用户级 vs 内容级互斥
    CONSTRAINT enforcement_actions_target_check
        CHECK (
            (action_type IN ('warning', 'social_post_restrict', 'chat_send_restrict',
                'account_suspend', 'account_ban')
                AND target_user_id IS NOT NULL AND subject_type IS NULL AND subject_id IS NULL)
            OR (action_type IN ('content_remove', 'content_restrict')
                AND target_user_id IS NULL AND subject_type IS NOT NULL AND subject_id IS NOT NULL)
        ),

    CONSTRAINT enforcement_actions_subject_type_check
        CHECK (subject_type IS NULL OR subject_type IN (
            'social_profile', 'social_post', 'social_post_image',
            'chat_message', 'conversation'
        )),

    CONSTRAINT enforcement_actions_expiry_check
        CHECK (expires_at IS NULL OR expires_at > effective_at),

    CONSTRAINT enforcement_actions_suspend_check
        CHECK (action_type <> 'account_suspend' OR expires_at IS NOT NULL),

    CONSTRAINT enforcement_actions_ban_check
        CHECK (action_type <> 'account_ban' OR expires_at IS NULL),

    -- 警告 / 永久内容移除不需要有效期
    CONSTRAINT enforcement_actions_permanent_action_expiry_check
        CHECK (action_type NOT IN ('warning', 'content_remove') OR expires_at IS NULL),

    CONSTRAINT enforcement_actions_lifecycle_check
        CHECK (
            (status = 'pending'  AND applied_at IS NULL AND ended_at IS NULL AND status_reason_code IS NULL)
            OR (status = 'applied' AND applied_at IS NOT NULL AND ended_at IS NULL AND status_reason_code IS NULL)
            OR (status = 'expired'  AND applied_at IS NOT NULL AND ended_at IS NOT NULL AND expires_at IS NOT NULL)
            OR (status = 'revoked'  AND applied_at IS NOT NULL AND ended_at IS NOT NULL AND status_reason_code IS NOT NULL)
            OR (status = 'cancelled' AND applied_at IS NULL AND ended_at IS NOT NULL AND status_reason_code IS NOT NULL)
            OR (status = 'failed'   AND applied_at IS NULL AND ended_at IS NOT NULL AND status_reason_code IS NOT NULL)
        ),

    CONSTRAINT enforcement_actions_time_order_check
        CHECK (
            (applied_at IS NULL OR applied_at >= effective_at)
            AND (applied_at IS NULL OR ended_at IS NULL OR ended_at >= applied_at)
            AND (status <> 'expired' OR ended_at >= expires_at)
        )
);

CREATE INDEX idx_enforcement_actions_decision
    ON trust.enforcement_actions (decision_id, created_at);

CREATE INDEX idx_enforcement_actions_appeal
    ON trust.enforcement_actions (appeal_id, created_at)
    WHERE appeal_id IS NOT NULL;

CREATE INDEX idx_enforcement_actions_user_current
    ON trust.enforcement_actions (target_user_id, action_type, status)
    WHERE target_user_id IS NOT NULL AND status IN ('pending', 'applied');

CREATE INDEX idx_enforcement_actions_subject
    ON trust.enforcement_actions (subject_type, subject_id, status)
    WHERE subject_id IS NOT NULL;

CREATE INDEX idx_enforcement_actions_expiry
    ON trust.enforcement_actions (expires_at)
    WHERE status = 'applied' AND expires_at IS NOT NULL;

CREATE INDEX idx_enforcement_actions_pending
    ON trust.enforcement_actions (effective_at)
    WHERE status = 'pending';
```

> 审计修正（相对首版）：状态 `active` → `applied`，新增 `cancelled`；`social_restrict/chat_restrict` → `social_post_restrict/chat_send_restrict`；`revoked_at` → `ended_at`，`failure_code/revocation_reason` → `status_reason_code`；新增 `appeal_id`、`permanent_action_expiry_check` 与基于 `ended_at` 的 lifecycle / time_order 约束；队列索引 `effective_at` 替代 `created_at`。

---

## 6. `trust.appeals` — 被处罚用户的申诉

申诉针对 Decision，不直接改 Decision（保留完整历史）。同一用户对同一 Decision V1 仅一次正式申诉。

```sql
CREATE TABLE trust.appeals (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,
    appellant_user_id uuid NOT NULL,          -- 逻辑引用，不建 FK

    reason text NOT NULL,

    status varchar(24) NOT NULL DEFAULT 'submitted',
    resolution varchar(24),

    reviewer_user_id uuid,
    resolution_note text,

    submitted_at timestamptz NOT NULL DEFAULT now(),
    review_started_at timestamptz,
    closed_at timestamptz,                     -- 替代旧 resolved_at，统一终态命名

    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT appeals_decision_fk
        FOREIGN KEY (decision_id) REFERENCES trust.moderation_decisions(id) ON DELETE RESTRICT,

    CONSTRAINT appeals_status_check
        CHECK (status IN ('submitted', 'under_review', 'resolved', 'withdrawn')),

    CONSTRAINT appeals_resolution_check
        CHECK (resolution IS NULL OR resolution IN (
            'denied', 'partially_granted', 'granted'
        )),

    CONSTRAINT appeals_decision_appellant_unique UNIQUE (decision_id, appellant_user_id),

    CONSTRAINT appeals_lifecycle_check
        CHECK (
            (status = 'submitted'   AND reviewer_user_id IS NULL AND review_started_at IS NULL
                AND closed_at IS NULL AND resolution IS NULL)
            OR (status = 'under_review' AND reviewer_user_id IS NOT NULL AND review_started_at IS NOT NULL
                AND closed_at IS NULL AND resolution IS NULL)
            OR (status = 'resolved'  AND reviewer_user_id IS NOT NULL AND review_started_at IS NOT NULL
                AND closed_at IS NOT NULL AND resolution IS NOT NULL AND resolution_note IS NOT NULL)
            OR (status = 'withdrawn' AND closed_at IS NOT NULL AND resolution IS NULL)
        ),

    CONSTRAINT appeals_time_order_check
        CHECK (
            (review_started_at IS NULL OR review_started_at >= submitted_at)
            AND (closed_at IS NULL OR closed_at >= submitted_at)
            AND (review_started_at IS NULL OR closed_at IS NULL OR closed_at >= review_started_at)
        )
);

CREATE INDEX idx_appeals_queue
    ON trust.appeals (submitted_at) WHERE status = 'submitted';

CREATE INDEX idx_appeals_reviewer
    ON trust.appeals (reviewer_user_id, submitted_at) WHERE status = 'under_review';

CREATE INDEX idx_appeals_appellant
    ON trust.appeals (appellant_user_id, submitted_at DESC);
```

> 审计修正（相对首版）：删除 `created_at`（与 `submitted_at` 重复）；`resolved_at` → `closed_at`；新增 `decision_appellant_unique` 与 lifecycle / time_order 约束。

---

## 域内固定 FK 关系（最终定稿）

全部 `ON DELETE RESTRICT`，无 `ON DELETE CASCADE`：

```text
moderation_cases.report_id      → reports.id
moderation_evidence.case_id     → moderation_cases.id
moderation_evidence.appeal_id   → appeals.id
moderation_decisions.case_id    → moderation_cases.id
enforcement_actions.decision_id → moderation_decisions.id
enforcement_actions.appeal_id   → appeals.id
appeals.decision_id             → moderation_decisions.id
```

## 跨域逻辑 ID 清单（只存 ID，不建 FK）

```text
reports.reporter_user_id
moderation_cases.assigned_reviewer_user_id
moderation_evidence.added_by_user_id / reference_id
moderation_decisions.decided_by_user_id
enforcement_actions.target_user_id / subject_id
appeals.appellant_user_id / reviewer_user_id
subject_type + subject_id
reference_type + reference_id
```

## `subject_type` / `reference_type` 统一字典

```text
user
social_profile
social_post
social_post_image
chat_message
conversation
```

> `subject_type` 是领域协议，不是数据库定位器；不允许出现表名或 `schema.table`。Enforcement 的内容级目标不含 `user`（用户级统一走 `target_user_id`）。

## 状态枚举总表

| 字段 | 枚举值 |
| --- | --- |
| `moderation_cases.source_type` | `user_report` `pre_publish` `manual_review` `automated_detection` `system_rule` |
| `moderation_cases.priority` | `low` `normal` `high` `critical` |
| `moderation_cases.status` | `queued` `in_review` `resolved` `cancelled` |
| `moderation_evidence.evidence_type` | `text_snapshot` `media_snapshot` `object_reference` `metadata_snapshot` |
| `moderation_evidence.source_type` | `system` `domain_snapshot` `reporter` `appellant` `moderator` |
| `moderation_decisions.outcome` | `no_violation` `violation` `insufficient_evidence` |
| `moderation_decisions.severity` | `none` `low` `medium` `high` `critical` |
| `moderation_decisions.decision_method` | `human` `automated` `hybrid` |
| `enforcement_actions.action_type` | `warning` `content_remove` `content_restrict` `social_post_restrict` `chat_send_restrict` `account_suspend` `account_ban` |
| `enforcement_actions.status` | `pending` `applied` `expired` `revoked` `cancelled` `failed` |
| `appeals.status` | `submitted` `under_review` `resolved` `withdrawn` |
| `appeals.resolution` | `denied` `partially_granted` `granted` |

## 不可违反 Invariants（T&S-01..20）

- **T&S-01** `reports` 是不可变举报事实，不保存审核结果或处理状态。
- **T&S-02** 所有正式审核必须经过 `moderation_cases`。
- **T&S-03** 用户举报 Case 必须 `source_type=user_report` 且 `report_id` 非空；非举报 Case `report_id` 为空。
- **T&S-04** 用户举报 Case 的 `subject_type+subject_id` 必须与 Report 完全一致。
- **T&S-05** 一个 Report V1 最多产生一个 Case。
- **T&S-06** 一个 Case 最多一个最终 `moderation_decision`。
- **T&S-07** `reason_code` 是举报者观点，不是违规事实；违规事实只来自 `moderation_decisions`。
- **T&S-08** 违规 Decision 必须保存 `violation_code` / `severity` / `policy_code` / `policy_version`。
- **T&S-09** Evidence 一旦建立不得修改或删除；补充证据只能新增。
- **T&S-10** Decision 一旦形成不得修改或删除；申诉不 `UPDATE moderation_decisions`。
- **T&S-11** 一个 Decision 可产生 0..N Enforcement Actions；绝不在 `enforcement_actions` 上 `UNIQUE(decision_id)`。
- **T&S-12** Trust 只产生治理处置，不直接 `UPDATE identity.* / social.* / chat.* / commerce.* / rewards.*`。
- **T&S-13** 用户级安全限制用 `target_user_id`；内容级用 `subject_type+subject_id`；两者不混用。
- **T&S-14** `account_suspend` 必须有限期（`expires_at NOT NULL`）。
- **T&S-15** `account_ban` 必须无 `expires_at`。
- **T&S-16** 未执行取消 `pending → cancelled`；已执行撤销 `applied → revoked`；两概念禁止混用。
- **T&S-17** 自然到期 `applied → expired`，不能用 `revoked` 表达。
- **T&S-18** 申诉修改处罚时禁止覆盖原处罚参数；应「原 Action → revoked + 新 Action（带 `appeal_id`）」。
- **T&S-19** 同一用户对同一 Decision，V1 只能正式申诉一次。
- **T&S-20** `granted / partially_granted` 不等于修改原 Decision；原审核事实永久保留。

## 与全局 PostgreSQL 规范的关系

本会话的 `uuid` 主键与「跨域只存 ID不建 FK」与 [数据库规范](../../architecture/database.md) 第 3/11/12 条（`bigint generated always as identity` + 保留并允许跨 Schema FK）冲突，与 Commerce V1 物理约定一致。该冲突由 [D-077/D-078](../../governance/design-register.md) 提出，并在本会话确认为项目级普遍现象；**裁决前本页 DDL 不得直接落 migration**。真人认证（Verification）子域本会话未重新设计，见 [Trust 域模型](../index.md)。
