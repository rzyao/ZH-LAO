-- Generated mechanically from the frozen documentation named below.
-- Source: docs/docs/domains/trust/database.md
-- Do not edit an applied migration; add a new migration instead.
CREATE TABLE trust.reports (
    id uuid PRIMARY KEY,

    reporter_user_id uuid NOT NULL,            -- 逻辑引用 identity.users，不建 FK

    subject_domain varchar(32) NOT NULL,       -- 被举报对象所属域（领域协议代码）
    subject_type   varchar(32) NOT NULL,       -- 该域内稳定业务对象类型
    subject_id     uuid NOT NULL,              -- 业务域稳定 logical UUID，不建 FK

    reason_code varchar(32) NOT NULL,          -- 举报者观点，非违规事实（T&S-07）
    description text,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT reports_subject_domain_check
        CHECK (subject_domain IN ('identity', 'social', 'chat', 'commerce')),

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
    ON trust.reports (subject_domain, subject_type, subject_id, created_at DESC);

CREATE TABLE trust.moderation_cases (
    id uuid PRIMARY KEY,

    source_type varchar(32) NOT NULL,
    report_id   uuid,                          -- 仅 user_report 来源非空；域内 FK

    subject_domain varchar(32) NOT NULL,       -- 与 reports 同三元组
    subject_type   varchar(32) NOT NULL,
    subject_id     uuid NOT NULL,

    priority varchar(16) NOT NULL DEFAULT 'normal',
    status   varchar(24) NOT NULL DEFAULT 'queued',

    assigned_operator_id uuid,                 -- 逻辑引用 operations.operators，不建 FK
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

    CONSTRAINT moderation_cases_subject_domain_check
        CHECK (subject_domain IN ('identity', 'social', 'chat', 'commerce')),

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

CREATE INDEX idx_moderation_cases_operator
    ON trust.moderation_cases (assigned_operator_id, status, created_at)
    WHERE assigned_operator_id IS NOT NULL;

CREATE INDEX idx_moderation_cases_subject
    ON trust.moderation_cases (subject_domain, subject_type, subject_id, created_at DESC);

CREATE TABLE trust.moderation_decisions (
    id uuid PRIMARY KEY,

    case_id uuid NOT NULL,

    outcome varchar(32) NOT NULL,
    violation_code varchar(40),
    severity varchar(16) NOT NULL DEFAULT 'none',

    policy_code varchar(64),
    policy_version varchar(32),

    decision_method varchar(16) NOT NULL,
    decided_by_operator_id uuid,               -- 逻辑引用 operations.operators；automated 时为 NULL

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
            (decision_method = 'automated' AND decided_by_operator_id IS NULL)
            OR (decision_method IN ('human', 'hybrid') AND decided_by_operator_id IS NOT NULL)
        )
);

CREATE INDEX idx_moderation_decisions_violation
    ON trust.moderation_decisions (violation_code, decided_at DESC)
    WHERE outcome = 'violation';

CREATE TABLE trust.appeals (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,
    appellant_user_id uuid NOT NULL,          -- 逻辑引用 identity.users，不建 FK

    reason text NOT NULL,

    status varchar(24) NOT NULL DEFAULT 'submitted',
    resolution varchar(24),

    reviewer_operator_id uuid,                -- 逻辑引用 operations.operators，不建 FK
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
            (status = 'submitted'   AND reviewer_operator_id IS NULL AND review_started_at IS NULL
                AND closed_at IS NULL AND resolution IS NULL)
            OR (status = 'under_review' AND reviewer_operator_id IS NOT NULL AND review_started_at IS NOT NULL
                AND closed_at IS NULL AND resolution IS NULL)
            OR (status = 'resolved'  AND reviewer_operator_id IS NOT NULL AND review_started_at IS NOT NULL
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
    ON trust.appeals (reviewer_operator_id, submitted_at) WHERE status = 'under_review';

CREATE INDEX idx_appeals_appellant
    ON trust.appeals (appellant_user_id, submitted_at DESC);

CREATE TABLE trust.enforcement_actions (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,
    appeal_id   uuid,                         -- 申诉→处罚调整审计链；域内 FK

    action_type varchar(32) NOT NULL,

    target_user_id uuid,                      -- 用户级处罚；Identity logical ID，不建 FK
    subject_domain varchar(32),               -- 内容级处罚：对象所属域
    subject_type   varchar(32),               -- 内容级处罚：对象类型
    subject_id     uuid,                      -- 内容级处罚：对象 logical ID，不建 FK

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
                AND target_user_id IS NOT NULL AND subject_domain IS NULL
                AND subject_type IS NULL AND subject_id IS NULL)
            OR (action_type IN ('content_remove', 'content_restrict')
                AND target_user_id IS NULL AND subject_domain IS NOT NULL
                AND subject_type IS NOT NULL AND subject_id IS NOT NULL)
        ),

    CONSTRAINT enforcement_actions_subject_domain_check
        CHECK (subject_domain IS NULL OR subject_domain IN ('social', 'chat', 'commerce')),

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
    ON trust.enforcement_actions (subject_domain, subject_type, subject_id, status)
    WHERE subject_id IS NOT NULL;

CREATE INDEX idx_enforcement_actions_expiry
    ON trust.enforcement_actions (expires_at)
    WHERE status = 'applied' AND expires_at IS NOT NULL;

CREATE INDEX idx_enforcement_actions_pending
    ON trust.enforcement_actions (effective_at)
    WHERE status = 'pending';
