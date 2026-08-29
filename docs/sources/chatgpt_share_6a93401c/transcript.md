# 设计安全治理域

_消息数：28　总字符：71979_


---

### [01] SYSTEM　status=finished_successfully

_(empty)_


---

### [02] SYSTEM　status=finished_successfully

_(empty)_


---

### [03] USER　status=finished_successfully

[数据库域设计](chatgpt-conversation://6a92f0c0-90b4-83ea-a43d-cccb1ef2666d)[继续设计社交资料](chatgpt-conversation://6a931551-8a30-83e9-8caf-60e529abce68)[设计聊天领域](chatgpt-conversation://6a9319c2-2204-83ea-9341-7a57757a3082)[继续设计商业领域](chatgpt-conversation://6a932385-7404-83ea-951b-e0df2fabaccc)[设计奖励域](chatgpt-conversation://6a9329c0-aea8-83ea-8f36-c7779057fc07)继续设计 Trust & Safety  **Domain**  。请承接之前已经确定的整体架构和数据库设计原则。  不能越过域边界


---

### [04] SYSTEM　status=finished_successfully

_(empty)_


---

### [05] SYSTEM　status=finished_successfully

_(empty)_


---

### [06] SYSTEM　status=finished_successfully

_(empty)_


---

### [07] ASSISTANT　status=finished_successfully

_(empty)_


---

### [08] ASSISTANT　status=finished_successfully

我会继续沿用此前已经定下来的分域、PostgreSQL 约束风格、状态机和“跨域只引用、不侵入”的原则来设计 Trust & Safety Domain；这次重点是先把域边界和表清单定准，再逐表展开。


---

### [09] ASSISTANT　status=finished_successfully

The output of this plugin was redacted.


---

### [10] ASSISTANT　status=finished_successfully

_(empty)_


---

### [11] ASSISTANT　status=finished_successfully

我已经把前面几次定稿中的边界重新对齐了：Trust & Safety 不拥有用户资料、动态、关注/匹配、会话/消息、订单/礼物/钱包或奖励；它只拥有“举报 → 审核 → 证据 → 处置 → 申诉”这条安全治理链路。跨域对象只保存稳定逻辑 ID，不反向把业务数据搬进 trust schema。


---

### [12] ASSISTANT　status=finished_successfully

_(empty)_


---

### [13] ASSISTANT　status=finished_successfully

_(empty)_


---

### [14] ASSISTANT　status=finished_successfully

继续按前面已经冻结的架构原则来做。这里把 **Trust & Safety Domain** 定义成一个独立的治理域，schema 使用：

```text
trust
```

并继续采用当前已经统一的规则：**UUID 主键、域内物理 FK、跨域只保存逻辑 ID、不建跨域物理 FK、`varchar + CHECK` 状态枚举、`timestamptz`、核心审核事实尽量不可变、不使用数据库 Trigger 承载业务规则**。memcite

# 一、Trust & Safety Domain 的职责边界

这个域只负责：

```text
举报
  ↓
审核案件
  ↓
证据
  ↓
审核决定
  ↓
处罚 / 限制
  ↓
申诉
```

也就是：

> **Report → Moderation Case → Evidence → Decision → Enforcement → Appeal**

它不拥有被审核的业务对象本身。

例如：

| 对象 | 真正所属域 | Trust & Safety 做什么 |
|---|---|---|
| 用户账号 | Identity | 引用 `user_id`、实施安全处罚 |
| 社交资料 | Social | 审核/举报资料 |
| 动态 | Social | 审核动态，但不存动态正文 |
| 图片 | Social | 保存审核证据快照/引用 |
| 关注/匹配 | Social | 不管理 |
| 会话 | Chat | 可作为举报目标 |
| 消息 | Chat | 可作为举报目标 |
| 用户拉黑 | Social | **不属于 Trust** |
| 礼物 | Commerce | 可处理违规行为，但不处理交易 |
| 支付/退款 | Commerce | 不处理 |
| Rewards | Rewards | 不处理奖励规则 |

尤其要坚持一个原则：

> **Trust 可以决定“这个动态违规，应当删除”，但不能直接拥有或修改 Social 的动态生命周期。**

正确流程是：

```text
Trust
  moderation_decision = remove_content
          ↓
Social 消费这个决定
          ↓
Social 自己更新 post 状态
```

Chat 同理。

这样 Trust 不会越过领域边界。

---

# 二、V1 建议最终只有 6 张核心表

我建议不要一开始做十几张复杂的风控表。

Trust & Safety V1 保持：

```text
trust.reports
trust.moderation_cases
trust.moderation_evidence
trust.moderation_decisions
trust.enforcement_actions
trust.appeals
```

完整关系：

```text
reports
   │
   ▼
moderation_cases
   │
   ├──── moderation_evidence
   │
   └──── moderation_decisions
                   │
                   ▼
           enforcement_actions
                   │
                   ▼
                appeals
```

这 6 张已经可以覆盖：

- 用户举报
- 人工审核
- 发布前人工审核
- 后期 AI 自动审核
- 用户资料审核
- 动态审核
- 图片审核
- 聊天消息举报
- 用户行为举报
- 内容删除
- 警告
- 禁言
- 功能限制
- 暂时封禁
- 永久封禁
- 申诉
- 审核日志
- 安全审计

而且未来自动审核不需要推翻现有数据库。

---

# 三、特别重要：统一“审核目标”模型

Trust 不应该分别搞：

```text
post_reports
message_reports
profile_reports
user_reports
image_reports
```

否则 Trust 会越来越知道其他域的内部结构。

统一使用：

```text
subject_type
subject_id
```

例如：

```text
USER
SOCIAL_PROFILE
SOCIAL_POST
SOCIAL_POST_IMAGE
CHAT_MESSAGE
CONVERSATION
```

数据库里：

```text
subject_type varchar(...)
subject_id uuid
```

但是：

```text
subject_id
```

**不建跨域 FK。**

例如举报一条 Social 动态：

```text
subject_type = 'social_post'
subject_id   = '<social.posts.id>'
```

Trust 只知道：

> 有一个 `social_post`，ID 是 X。

它不应该 JOIN `social.posts` 后开始管理动态。

---

# 四、发布前审核也走 Moderation Case

我们之前已经确定动态第一阶段是：

> 图片 + 文字，前期人工审核，后期逐渐自动化。

这里不要单独设计：

```text
post_reviews
image_reviews
```

而是 Social 在需要审核时创建：

```text
moderation_case

source_type = 'pre_publish'
subject_type = 'social_post'
subject_id = xxx
```

以后 AI 审核：

```text
source_type = 'automated_detection'
```

用户举报：

```text
source_type = 'user_report'
```

管理员主动巡检：

```text
source_type = 'manual_review'
```

全部归入一个审核系统。

这是 Trust Domain 最关键的抽象。

---

# 五、第一张表：`trust.reports`

现在正式逐表设计。

## `trust.reports`

职责：

> 保存用户主动提交的举报事实。

它不是审核结果，也不是处罚记录。

建议字段：

```sql
CREATE TABLE trust.reports (
    id uuid PRIMARY KEY,

    reporter_user_id uuid NOT NULL,

    subject_type varchar(32) NOT NULL,
    subject_id uuid NOT NULL,

    reason_code varchar(32) NOT NULL,
    description text,

    status varchar(24) NOT NULL DEFAULT 'submitted',

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT reports_subject_type_check
        CHECK (
            subject_type IN (
                'user',
                'social_profile',
                'social_post',
                'social_post_image',
                'chat_message',
                'conversation'
            )
        ),

    CONSTRAINT reports_reason_code_check
        CHECK (
            reason_code IN (
                'spam',
                'harassment',
                'hate',
                'sexual_content',
                'violence',
                'fraud',
                'impersonation',
                'illegal_content',
                'privacy',
                'underage',
                'other'
            )
        ),

    CONSTRAINT reports_status_check
        CHECK (
            status IN (
                'submitted',
                'under_review',
                'resolved',
                'dismissed'
            )
        )
);
```

---

# 六、`reporter_user_id`

```text
reporter_user_id uuid NOT NULL
```

逻辑引用：

```text
identity.users.id
```

但是按照现在已经定下来的跨域规则：

> **不建立物理 FK。**

即不要：

```sql
FOREIGN KEY (reporter_user_id)
REFERENCES identity.users(id)
```

Trust 只保存举报者 ID。

匿名系统自动检测不是 `reports`。

AI 检测未来直接产生：

```text
moderation_case
```

因此不需要：

```text
reporter_type = user/system/ai
```

这样 `reports` 的含义非常纯：

> **用户提交的举报。**

---

# 七、为什么同时保存 `subject_type + subject_id`

例如：

```text
subject_type = chat_message
subject_id   = 8ff...
```

或者：

```text
subject_type = social_post
subject_id   = a17...
```

这样新增新的可举报对象时，只需要扩展 `subject_type`。

但有一个非常重要的规则：

> `subject_type` 必须是 Trust 定义的稳定公共类型，不允许直接使用数据库表名。

例如可以：

```text
social_post
chat_message
social_profile
```

不要：

```text
social.posts
messaging.messages
```

更不要：

```text
table_name
schema_name
```

否则 Trust 就和其他域的数据库实现绑定了。

---

# 八、`reason_code`

建议 V1：

```text
spam
harassment
hate
sexual_content
violence
fraud
impersonation
illegal_content
privacy
underage
other
```

注意：

```text
reason_code
```

是：

> **举报者声称的问题**

不是最终违规结论。

例如用户举报：

```text
reason_code = harassment
```

审核员最终可能决定：

```text
violation_code = spam
```

甚至：

```text
no_violation
```

因此绝对不要把举报原因当审核结论。

---

# 九、`description`

```text
description text NULL
```

用于用户补充：

> “这个人一直私信辱骂我。”

这个字段属于举报事实，因此合理。

但是这里不应该存：

```text
post_text
message_text
profile_bio
image_url
```

这些属于被举报对象。

需要保存审核时证据的，由后面的：

```text
trust.moderation_evidence
```

负责。

这能避免 `reports` 变成业务数据副本。

---

# 十、Report 状态

我建议只保留 4 个：

```text
submitted
under_review
resolved
dismissed
```

含义：

### `submitted`

举报已提交。

```text
submitted
```

---

### `under_review`

已经进入审核流程。

```text
submitted
    ↓
under_review
```

---

### `resolved`

审核完成并认定已经处理。

可能：

```text
违规 → 处罚
```

也可能最终只是：

```text
违规但仅警告
```

具体结论不放 `reports`。

---

### `dismissed`

举报经审核不成立。

例如：

```text
误报
恶意举报
内容不违规
无法证实
```

具体原因属于 Moderation Decision。

---

# 十一、不应该放进 `reports` 的字段

不要设计：

```text
reviewer_id
reviewed_at
decision
punishment
ban_days
deleted_post
moderator_note
appeal_status
```

这些全部越过 Report 自己的职责。

正确归属：

```text
reports
    举报事实

moderation_cases
    审核工作流

moderation_decisions
    审核结论

enforcement_actions
    实际处罚

appeals
    用户申诉
```

---

# 十二、关于重复举报

这里**不要**：

```sql
UNIQUE (reporter_user_id, subject_type, subject_id)
```

因为同一个用户未来可能：

```text
第一次举报某用户：骚扰
一个月后再次举报：诈骗
```

这是两个独立事实。

但是为了防止狂点举报按钮，可以在应用层做：

```text
短时间重复提交限制
rate limit
```

而不是把业务历史永久锁死在 UNIQUE 上。

---

# 十三、索引

V1 推荐：

```sql
CREATE INDEX idx_reports_reporter_created
ON trust.reports (
    reporter_user_id,
    created_at DESC
);

CREATE INDEX idx_reports_subject
ON trust.reports (
    subject_type,
    subject_id,
    created_at DESC
);

CREATE INDEX idx_reports_status_created
ON trust.reports (
    status,
    created_at
);
```

用途分别是：

```text
某用户提交过什么举报
某对象收到过多少举报
审核后台查询待处理举报
```

---

# 十四、关于举报数量

不要在这里增加：

```text
report_count
```

举报对象被举报多少次：

```sql
COUNT(*)
WHERE subject_type = ?
AND subject_id = ?
```

或者以后做 projection / aggregation。

不要制造两个事实源。

---

# 十五、举报与 Case 的关系

这里有一个重要设计决定：

**我不建议在 `reports` 里放 `moderation_case_id`。**

因为：

```text
Report → Case
```

属于审核工作流，而 Report 本身应该保持举报原始事实。

下一张：

```text
trust.moderation_cases
```

会负责：

```text
source_type
source_id
```

例如：

```text
source_type = 'user_report'
source_id   = reports.id
```

这样 Case 不仅能来自举报，还能来自：

```text
user_report
pre_publish
automated_detection
manual_review
system_rule
```

于是不会为了 AI 审核再改数据库结构。

---

## 当前 Trust & Safety Domain 结构定为

```text
trust
├── reports
│
├── moderation_cases
│
├── moderation_evidence
│
├── moderation_decisions
│
├── enforcement_actions
│
└── appeals
```

其中第一张 **`trust.reports` 可以先按上面方案冻结**。

下一步最关键的是设计 **`trust.moderation_cases`**。这张表会成为整个 Trust & Safety Domain 的核心，把“用户举报、动态发布前审核、人工巡检、未来 AI 自动检测”统一进同一个审核工作流。memcite


---

### [15] USER　status=finished_successfully

依次完成所有表的设计


---

### [16] ASSISTANT　status=finished_successfully

我会按刚才确定的 6 张表顺序一次性做完：先定 `moderation_cases`，再到证据、决定、处置、申诉；最后给出整域的约束、索引、状态枚举和不可违反规则，确保没有跨域 FK 或职责侵入。


---

### [17] ASSISTANT　status=finished_successfully

_(empty)_


---

### [18] ASSISTANT　status=finished_successfully

_(empty)_


---

### [19] ASSISTANT　status=finished_successfully

先确定一个关键取舍：V1 不再增加“举报-案件关联表”。一个用户举报最多生成一个审核案件；非举报型案件（发布前审核、人工巡检、自动检测、系统规则）直接创建 `moderation_case`。复审不新建 Case，而走 `appeals`，这样 6 张表仍然完整闭环。


---

### [20] ASSISTANT　status=finished_successfully

_(empty)_


---

### [21] ASSISTANT　status=finished_successfully

可以。下面把 **Trust & Safety Domain 6 张表全部依次定稿**。

整体结构保持：

```text
trust
├── reports
├── moderation_cases
├── moderation_evidence
├── moderation_decisions
├── enforcement_actions
└── appeals
```

核心原则不变：

```text
举报事实
    ↓
审核案件
    ↓
审核证据
    ↓
审核决定
    ↓
安全处置
    ↓
申诉
```

其中 Trust & Safety **只拥有治理事实和治理状态**，不会直接接管 Identity / Social / Chat / Commerce 等域的业务对象。

---

# 1. `trust.reports`

## 1.1 职责

保存：

> 用户主动提交的一次举报事实。

不负责审核，不负责处罚，也不保存被举报业务对象的正文副本。

## 1.2 最终字段

```sql
CREATE TABLE trust.reports (
    id uuid PRIMARY KEY,

    reporter_user_id uuid NOT NULL,

    subject_type varchar(32) NOT NULL,
    subject_id uuid NOT NULL,

    reason_code varchar(32) NOT NULL,
    description text,

    status varchar(24) NOT NULL DEFAULT 'submitted',

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT reports_subject_type_check
        CHECK (
            subject_type IN (
                'user',
                'social_profile',
                'social_post',
                'social_post_image',
                'chat_message',
                'conversation'
            )
        ),

    CONSTRAINT reports_reason_code_check
        CHECK (
            reason_code IN (
                'spam',
                'harassment',
                'hate',
                'sexual_content',
                'violence',
                'fraud',
                'impersonation',
                'illegal_content',
                'privacy',
                'underage',
                'other'
            )
        ),

    CONSTRAINT reports_status_check
        CHECK (
            status IN (
                'submitted',
                'under_review',
                'resolved',
                'dismissed'
            )
        )
);
```

## 1.3 跨域引用

```text
reporter_user_id
```

逻辑引用 Identity 用户 ID。

```text
subject_type + subject_id
```

逻辑引用对应业务域对象。

全部：

> **不建跨域 FK。**

## 1.4 索引

```sql
CREATE INDEX idx_reports_reporter_created
ON trust.reports (
    reporter_user_id,
    created_at DESC
);

CREATE INDEX idx_reports_subject_created
ON trust.reports (
    subject_type,
    subject_id,
    created_at DESC
);

CREATE INDEX idx_reports_status_created
ON trust.reports (
    status,
    created_at
);
```

不设置：

```text
UNIQUE(reporter_user_id, subject_type, subject_id)
```

因为未来同一个用户可以针对不同时间发生的不同行为再次举报。

---

# 2. `trust.moderation_cases`

这是整个 Trust & Safety Domain 的**核心表**。

## 2.1 职责

统一承载：

```text
用户举报审核
发布前审核
人工巡检
自动检测
系统规则触发
```

也就是说，不管案件怎么产生，最后都进入：

```text
moderation_case
```

## 2.2 最终字段

```sql
CREATE TABLE trust.moderation_cases (
    id uuid PRIMARY KEY,

    source_type varchar(32) NOT NULL,

    report_id uuid,

    subject_type varchar(32) NOT NULL,
    subject_id uuid NOT NULL,

    priority varchar(16) NOT NULL DEFAULT 'normal',

    status varchar(24) NOT NULL DEFAULT 'queued',

    assigned_reviewer_user_id uuid,

    review_started_at timestamptz,
    closed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT moderation_cases_report_fk
        FOREIGN KEY (report_id)
        REFERENCES trust.reports(id)
        ON DELETE RESTRICT,

    CONSTRAINT moderation_cases_source_type_check
        CHECK (
            source_type IN (
                'user_report',
                'pre_publish',
                'manual_review',
                'automated_detection',
                'system_rule'
            )
        ),

    CONSTRAINT moderation_cases_subject_type_check
        CHECK (
            subject_type IN (
                'user',
                'social_profile',
                'social_post',
                'social_post_image',
                'chat_message',
                'conversation'
            )
        ),

    CONSTRAINT moderation_cases_priority_check
        CHECK (
            priority IN (
                'low',
                'normal',
                'high',
                'critical'
            )
        ),

    CONSTRAINT moderation_cases_status_check
        CHECK (
            status IN (
                'queued',
                'in_review',
                'resolved',
                'cancelled'
            )
        ),

    CONSTRAINT moderation_cases_report_source_check
        CHECK (
            (
                source_type = 'user_report'
                AND report_id IS NOT NULL
            )
            OR
            (
                source_type <> 'user_report'
                AND report_id IS NULL
            )
        ),

    CONSTRAINT moderation_cases_lifecycle_check
        CHECK (
            (
                status = 'queued'
                AND review_started_at IS NULL
                AND closed_at IS NULL
            )
            OR
            (
                status = 'in_review'
                AND review_started_at IS NOT NULL
                AND closed_at IS NULL
            )
            OR
            (
                status IN ('resolved', 'cancelled')
                AND closed_at IS NOT NULL
            )
        )
);
```

---

## 2.3 为什么 `report_id` 可以 FK

因为：

```text
reports
moderation_cases
```

都属于：

```text
trust
```

所以这是**域内 FK**，应该建立。

而：

```text
assigned_reviewer_user_id
subject_id
```

属于跨域引用，因此不建立 FK。

---

## 2.4 一个举报只能建立一个案件

V1 定：

```sql
CREATE UNIQUE INDEX uq_moderation_cases_report
ON trust.moderation_cases (report_id)
WHERE report_id IS NOT NULL;
```

意味着：

```text
一个 Report
      ↓
最多一个 Moderation Case
```

复审不创建第二个 Case。

复审由：

```text
appeals
```

负责。

---

## 2.5 索引

```sql
CREATE INDEX idx_moderation_cases_queue
ON trust.moderation_cases (
    priority DESC,
    created_at ASC
)
WHERE status = 'queued';

CREATE INDEX idx_moderation_cases_reviewer
ON trust.moderation_cases (
    assigned_reviewer_user_id,
    status,
    created_at
)
WHERE assigned_reviewer_user_id IS NOT NULL;

CREATE INDEX idx_moderation_cases_subject
ON trust.moderation_cases (
    subject_type,
    subject_id,
    created_at DESC
);

CREATE INDEX idx_moderation_cases_source
ON trust.moderation_cases (
    source_type,
    created_at DESC
);
```

---

# 3. `trust.moderation_evidence`

这一张非常重要，因为它解决：

> 被举报内容后来被用户自己修改/删除怎么办？

Trust 不能依赖业务域永远保存原始内容。

所以审核时需要留下安全证据。

---

# 3.1 职责

保存：

> 某个审核案件在审核过程中依法、合理取得的证据快照或引用。

例如：

```text
举报时的消息文字快照
举报时的动态正文
图片审核快照
用户资料快照
系统检测结果
原始业务对象引用
```

注意：

> 这是“审核证据”，不是 Social / Chat 数据副本。

---

# 3.2 最终字段

```sql
CREATE TABLE trust.moderation_evidence (
    id uuid PRIMARY KEY,

    case_id uuid NOT NULL,

    evidence_type varchar(32) NOT NULL,
    source_type varchar(24) NOT NULL,

    content_text text,
    storage_key varchar(512),

    reference_type varchar(32),
    reference_id uuid,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    content_sha256 char(64),

    captured_at timestamptz NOT NULL,

    created_by_user_id uuid,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT moderation_evidence_case_fk
        FOREIGN KEY (case_id)
        REFERENCES trust.moderation_cases(id)
        ON DELETE RESTRICT,

    CONSTRAINT moderation_evidence_type_check
        CHECK (
            evidence_type IN (
                'text_snapshot',
                'media_snapshot',
                'object_reference',
                'metadata_snapshot',
                'user_submission'
            )
        ),

    CONSTRAINT moderation_evidence_source_type_check
        CHECK (
            source_type IN (
                'system',
                'domain_snapshot',
                'reporter',
                'subject_user',
                'moderator'
            )
        ),

    CONSTRAINT moderation_evidence_reference_pair_check
        CHECK (
            (
                reference_type IS NULL
                AND reference_id IS NULL
            )
            OR
            (
                reference_type IS NOT NULL
                AND reference_id IS NOT NULL
            )
        ),

    CONSTRAINT moderation_evidence_metadata_check
        CHECK (
            jsonb_typeof(metadata) = 'object'
        ),

    CONSTRAINT moderation_evidence_payload_check
        CHECK (
            content_text IS NOT NULL
            OR storage_key IS NOT NULL
            OR reference_id IS NOT NULL
            OR metadata <> '{}'::jsonb
        )
);
```

---

# 3.3 `storage_key`

这里不要保存：

```text
https://social.xxx/image/123
```

作为唯一证据。

更合理的是保存 Trust 自己控制的：

```text
storage_key
```

例如：

```text
trust-evidence/2026/08/xxx.jpg
```

这样 Social 图片删除以后，审核证据仍然存在。

---

# 3.4 `content_sha256`

用于证明：

> 当前审核的证据文件与当时获取的证据一致。

比如：

```text
content_sha256
```

保存证据文件或文本快照 hash。

这对后期申诉、人工复核非常重要。

---

# 3.5 Evidence 应当不可修改

这张表：

**没有 `updated_at`。**

因为证据一旦形成：

> 不允许编辑原证据。

如果需要补充：

```text
INSERT 新 evidence
```

不能：

```text
UPDATE 原 evidence
```

同样原则：

> 正常业务流程禁止 DELETE Evidence。

---

# 3.6 索引

```sql
CREATE INDEX idx_moderation_evidence_case
ON trust.moderation_evidence (
    case_id,
    created_at
);

CREATE INDEX idx_moderation_evidence_reference
ON trust.moderation_evidence (
    reference_type,
    reference_id
)
WHERE reference_id IS NOT NULL;
```

---

# 4. `trust.moderation_decisions`

这是：

> 审核最终判定。

一定要和举报原因分开。

比如：

```text
举报者：

harassment

最终审核：

spam
```

完全合法。

---

# 4.1 一 Case 一个最终 Decision

V1：

```text
moderation_case
      ↓
最多一个 moderation_decision
```

因为后面的复审不修改原 Decision。

而是：

```text
appeals
```

留下第二层治理记录。

这样审计链不会被覆盖。

---

# 4.2 最终字段

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

    decided_by_user_id uuid,

    rationale text,

    decided_at timestamptz NOT NULL,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT moderation_decisions_case_fk
        FOREIGN KEY (case_id)
        REFERENCES trust.moderation_cases(id)
        ON DELETE RESTRICT,

    CONSTRAINT moderation_decisions_case_unique
        UNIQUE (case_id),

    CONSTRAINT moderation_decisions_outcome_check
        CHECK (
            outcome IN (
                'no_violation',
                'violation',
                'insufficient_evidence'
            )
        ),

    CONSTRAINT moderation_decisions_violation_code_check
        CHECK (
            violation_code IS NULL
            OR violation_code IN (
                'spam',
                'harassment',
                'hate',
                'sexual_content',
                'violence',
                'fraud',
                'impersonation',
                'illegal_content',
                'privacy',
                'underage_safety',
                'other_policy_violation'
            )
        ),

    CONSTRAINT moderation_decisions_severity_check
        CHECK (
            severity IN (
                'none',
                'low',
                'medium',
                'high',
                'critical'
            )
        ),

    CONSTRAINT moderation_decisions_result_check
        CHECK (
            (
                outcome = 'violation'
                AND violation_code IS NOT NULL
                AND severity <> 'none'
            )
            OR
            (
                outcome IN (
                    'no_violation',
                    'insufficient_evidence'
                )
                AND violation_code IS NULL
                AND severity = 'none'
            )
        ),

    CONSTRAINT moderation_decisions_policy_pair_check
        CHECK (
            (
                policy_code IS NULL
                AND policy_version IS NULL
            )
            OR
            (
                policy_code IS NOT NULL
                AND policy_version IS NOT NULL
            )
        ),

    CONSTRAINT moderation_decisions_method_check
        CHECK (
            decision_method IN (
                'human',
                'automated',
                'hybrid'
            )
        ),

    CONSTRAINT moderation_decisions_actor_check
        CHECK (
            (
                decision_method = 'automated'
                AND decided_by_user_id IS NULL
            )
            OR
            (
                decision_method IN ('human', 'hybrid')
                AND decided_by_user_id IS NOT NULL
            )
        )
);
```

---

# 4.3 为什么保存 `policy_code + policy_version`

这是为了将来可以回答：

> “2026 年 8 月 30 日为什么判这个内容违规？”

例如：

```text
policy_code    = SOCIAL_HARASSMENT_01
policy_version = 2026-08
```

以后规则改成：

```text
2027-03
```

历史审核仍然知道当时使用的是什么规则。

这是审核系统非常重要的审计能力。

---

# 4.4 Decision 同样不可修改

建议：

```text
moderation_decisions
```

属于事实记录。

正常业务禁止：

```text
UPDATE
DELETE
```

如果判断后来因申诉发生变化：

不要修改：

```text
outcome
violation_code
```

而是创建：

```text
appeal
```

并撤销相应 enforcement。

---

# 4.5 索引

```sql
CREATE INDEX idx_moderation_decisions_decided_at
ON trust.moderation_decisions (
    decided_at DESC
);

CREATE INDEX idx_moderation_decisions_violation
ON trust.moderation_decisions (
    violation_code,
    severity,
    decided_at DESC
)
WHERE outcome = 'violation';

CREATE INDEX idx_moderation_decisions_method
ON trust.moderation_decisions (
    decision_method,
    decided_at DESC
);
```

---

# 5. `trust.enforcement_actions`

这里要非常小心领域边界。

Trust 可以拥有：

> **处罚决定。**

但不能直接拥有：

```text
social_post.status
chat_message.status
identity_user.status
```

所以这张表实际上表达：

> Trust 发出的安全治理处置。

其他域根据处置执行自己的状态变更。

---

# 5.1 示例

审核结果：

```text
用户发布违规动态
```

Trust：

```text
enforcement_action
action_type = content_remove
```

然后：

```text
Trust
   │
   │ domain event
   ▼
Social
   │
   └── 自己把 post 设为 removed
```

不是：

```text
Trust SQL
UPDATE social.posts ...
```

这一条必须成为不可违反规则。

---

# 5.2 最终字段

```sql
CREATE TABLE trust.enforcement_actions (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,

    action_type varchar(32) NOT NULL,

    target_user_id uuid,

    subject_type varchar(32),
    subject_id uuid,

    status varchar(24) NOT NULL DEFAULT 'pending',

    effective_at timestamptz NOT NULL,
    expires_at timestamptz,

    applied_at timestamptz,
    revoked_at timestamptz,

    failure_code varchar(64),
    revocation_reason text,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT enforcement_actions_decision_fk
        FOREIGN KEY (decision_id)
        REFERENCES trust.moderation_decisions(id)
        ON DELETE RESTRICT,

    CONSTRAINT enforcement_actions_type_check
        CHECK (
            action_type IN (
                'warning',
                'content_remove',
                'content_restrict',
                'social_restrict',
                'chat_restrict',
                'account_suspend',
                'account_ban'
            )
        ),

    CONSTRAINT enforcement_actions_status_check
        CHECK (
            status IN (
                'pending',
                'active',
                'expired',
                'revoked',
                'failed'
            )
        ),

    CONSTRAINT enforcement_actions_subject_pair_check
        CHECK (
            (
                subject_type IS NULL
                AND subject_id IS NULL
            )
            OR
            (
                subject_type IS NOT NULL
                AND subject_id IS NOT NULL
            )
        ),

    CONSTRAINT enforcement_actions_target_check
        CHECK (
            (
                action_type IN (
                    'warning',
                    'social_restrict',
                    'chat_restrict',
                    'account_suspend',
                    'account_ban'
                )
                AND target_user_id IS NOT NULL
                AND subject_type IS NULL
                AND subject_id IS NULL
            )
            OR
            (
                action_type IN (
                    'content_remove',
                    'content_restrict'
                )
                AND target_user_id IS NULL
                AND subject_type IS NOT NULL
                AND subject_id IS NOT NULL
            )
        ),

    CONSTRAINT enforcement_actions_expiry_check
        CHECK (
            expires_at IS NULL
            OR expires_at > effective_at
        ),

    CONSTRAINT enforcement_actions_suspend_check
        CHECK (
            action_type <> 'account_suspend'
            OR expires_at IS NOT NULL
        ),

    CONSTRAINT enforcement_actions_ban_check
        CHECK (
            action_type <> 'account_ban'
            OR expires_at IS NULL
        ),

    CONSTRAINT enforcement_actions_status_time_check
        CHECK (
            (
                status = 'pending'
                AND applied_at IS NULL
                AND revoked_at IS NULL
            )
            OR
            (
                status = 'active'
                AND applied_at IS NOT NULL
                AND revoked_at IS NULL
            )
            OR
            (
                status = 'expired'
                AND applied_at IS NOT NULL
                AND expires_at IS NOT NULL
                AND revoked_at IS NULL
            )
            OR
            (
                status = 'revoked'
                AND applied_at IS NOT NULL
                AND revoked_at IS NOT NULL
            )
            OR
            (
                status = 'failed'
                AND applied_at IS NULL
            )
        ),

    CONSTRAINT enforcement_actions_failure_check
        CHECK (
            (
                status = 'failed'
                AND failure_code IS NOT NULL
            )
            OR
            (
                status <> 'failed'
                AND failure_code IS NULL
            )
        )
);
```

---

# 5.3 `warning`

```text
warning
```

目标：

```text
target_user_id
```

表示安全警告。

Trust 负责记录警告事实。

---

# 5.4 `content_remove`

例如：

```text
subject_type = social_post
subject_id   = ...
```

Trust 表达：

> 此对象应因安全原因被移除。

实际删除/隐藏：

```text
Social Domain
```

执行。

Chat Message 同理。

---

# 5.5 `content_restrict`

与删除不同。

例如：

```text
降权
停止公开展示
禁止推荐
```

目前可以先保留能力，即使 V1 暂时不用。

---

# 5.6 `social_restrict`

用户级限制：

```text
禁止发布动态
禁止修改公开资料
禁止主动建立社交关系
...
```

但：

> Trust 只拥有“限制命令”。

具体 Social 能不能发动态：

由 Social 自己判断/投影执行。

---

# 5.7 `chat_restrict`

例如：

```text
禁止主动发送消息 7 天
```

具体 Chat 消息发送逻辑仍属于：

```text
Chat Domain
```

---

# 5.8 `account_suspend`

必须：

```text
expires_at IS NOT NULL
```

例如：

```text
封禁 24h
封禁 7 天
封禁 30 天
```

---

# 5.9 `account_ban`

永久安全封禁。

所以：

```text
expires_at IS NULL
```

但是：

> Trust 不修改 Identity 用户表为 `banned`。

Trust 提供安全限制事实。

Identity 可以消费：

```text
AccountBanned
```

最终拒绝认证或访问。

---

# 5.10 Enforcement 索引

```sql
CREATE INDEX idx_enforcement_actions_decision
ON trust.enforcement_actions (
    decision_id,
    created_at
);

CREATE INDEX idx_enforcement_actions_user_active
ON trust.enforcement_actions (
    target_user_id,
    action_type,
    status
)
WHERE target_user_id IS NOT NULL
  AND status IN ('pending', 'active');

CREATE INDEX idx_enforcement_actions_subject
ON trust.enforcement_actions (
    subject_type,
    subject_id,
    status
)
WHERE subject_id IS NOT NULL;

CREATE INDEX idx_enforcement_actions_expiry
ON trust.enforcement_actions (
    expires_at
)
WHERE status = 'active'
  AND expires_at IS NOT NULL;

CREATE INDEX idx_enforcement_actions_pending
ON trust.enforcement_actions (
    created_at
)
WHERE status = 'pending';
```

---

# 6. `trust.appeals`

最后一张。

它负责：

> 被处罚用户对审核决定提出申诉。

注意：

**申诉针对 Decision，而不是直接针对业务对象。**

正确：

```text
moderation_decision
        ↓
      appeal
```

---

# 6.1 为什么不是修改 Decision

假设：

```text
初审：
violation
    ↓
封禁 7 天
```

用户申诉成功。

不能：

```text
UPDATE moderation_decisions
SET outcome = 'no_violation'
```

否则历史就变成：

> “从来没有判过违规。”

这显然不正确。

真正发生的是：

```text
初审：违规
↓
处罚
↓
用户申诉
↓
申诉成功
↓
处罚撤销
```

整个过程必须完整保留。

---

# 6.2 最终字段

```sql
CREATE TABLE trust.appeals (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,

    appellant_user_id uuid NOT NULL,

    reason text NOT NULL,

    status varchar(24) NOT NULL DEFAULT 'submitted',

    resolution varchar(24),

    reviewer_user_id uuid,
    resolution_note text,

    submitted_at timestamptz NOT NULL DEFAULT now(),
    review_started_at timestamptz,
    resolved_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT appeals_decision_fk
        FOREIGN KEY (decision_id)
        REFERENCES trust.moderation_decisions(id)
        ON DELETE RESTRICT,

    CONSTRAINT appeals_status_check
        CHECK (
            status IN (
                'submitted',
                'under_review',
                'resolved',
                'withdrawn'
            )
        ),

    CONSTRAINT appeals_resolution_check
        CHECK (
            resolution IS NULL
            OR resolution IN (
                'denied',
                'partially_granted',
                'granted'
            )
        ),

    CONSTRAINT appeals_lifecycle_check
        CHECK (
            (
                status = 'submitted'
                AND review_started_at IS NULL
                AND resolved_at IS NULL
                AND resolution IS NULL
            )
            OR
            (
                status = 'under_review'
                AND review_started_at IS NOT NULL
                AND resolved_at IS NULL
                AND resolution IS NULL
            )
            OR
            (
                status = 'resolved'
                AND review_started_at IS NOT NULL
                AND resolved_at IS NOT NULL
                AND resolution IS NOT NULL
                AND reviewer_user_id IS NOT NULL
            )
            OR
            (
                status = 'withdrawn'
                AND resolved_at IS NULL
                AND resolution IS NULL
            )
        )
);
```

---

# 6.3 一个用户对一个 Decision 只允许一次正式申诉

V1 建议直接冻结：

```sql
ALTER TABLE trust.appeals
ADD CONSTRAINT appeals_decision_appellant_unique
UNIQUE (
    decision_id,
    appellant_user_id
);
```

也就是：

```text
一次审核决定
      ↓
一个受影响用户
      ↓
最多一次正式 Appeal
```

不允许：

```text
申诉失败
↓
重复提交
↓
重复提交
↓
重复提交
```

未来真有二审机制，再单独设计：

```text
appeal_reviews
```

而不是放开无限 Appeal。

---

# 6.4 申诉结果

三个：

```text
denied
partially_granted
granted
```

### `denied`

原审核与处罚维持。

### `partially_granted`

部分处罚撤销或缩短。

例如：

```text
原：

account_suspend 30d

申诉后：

改为 7d
```

### `granted`

申诉完全成功。

相关：

```text
enforcement_actions
```

应进入：

```text
revoked
```

但原：

```text
moderation_decision
```

仍然保留。

---

# 6.5 Appeal 索引

```sql
CREATE INDEX idx_appeals_queue
ON trust.appeals (
    submitted_at
)
WHERE status = 'submitted';

CREATE INDEX idx_appeals_reviewer
ON trust.appeals (
    reviewer_user_id,
    status,
    submitted_at
)
WHERE reviewer_user_id IS NOT NULL;

CREATE INDEX idx_appeals_appellant
ON trust.appeals (
    appellant_user_id,
    submitted_at DESC
);
```

---

# 七、现在整个 Trust & Safety 工作流已经闭环

## 用户举报

```text
User
 ↓
reports
 ↓
moderation_cases
 ↓
moderation_evidence
 ↓
moderation_decisions
 ↓
enforcement_actions
```

---

## 发布前审核

没有 Report：

```text
Social
 ↓
moderation_cases
source_type = pre_publish
 ↓
moderation_evidence
 ↓
moderation_decisions
```

如果：

```text
no_violation
```

Trust 发审核结果：

```text
Social
 ↓
自己决定进入 published
```

如果：

```text
violation
```

Social 自己保持：

```text
rejected / unavailable
```

具体状态名仍属于 Social。

---

# 八、未来自动审核也不需要改表

以后加入 AI：

```text
AI moderation
      ↓
moderation_cases

source_type = automated_detection
```

Decision：

```text
decision_method = automated
decided_by_user_id = NULL
```

高风险情况：

```text
AI
↓
Case
↓
assigned human moderator
↓
decision_method = hybrid
```

因此当前设计天然支持：

```text
V1 人工审核
        ↓
V2 AI 辅助
        ↓
V3 自动审核 + 人工复核
```

不用重新设计核心数据库。

---

# 九、Trust & Safety Domain 状态枚举总表

## `reports.status`

```text
submitted
under_review
resolved
dismissed
```

## `moderation_cases.source_type`

```text
user_report
pre_publish
manual_review
automated_detection
system_rule
```

## `moderation_cases.priority`

```text
low
normal
high
critical
```

## `moderation_cases.status`

```text
queued
in_review
resolved
cancelled
```

## `moderation_evidence.evidence_type`

```text
text_snapshot
media_snapshot
object_reference
metadata_snapshot
user_submission
```

## `moderation_evidence.source_type`

```text
system
domain_snapshot
reporter
subject_user
moderator
```

## `moderation_decisions.outcome`

```text
no_violation
violation
insufficient_evidence
```

## `moderation_decisions.severity`

```text
none
low
medium
high
critical
```

## `moderation_decisions.decision_method`

```text
human
automated
hybrid
```

## `enforcement_actions.action_type`

```text
warning
content_remove
content_restrict
social_restrict
chat_restrict
account_suspend
account_ban
```

## `enforcement_actions.status`

```text
pending
active
expired
revoked
failed
```

## `appeals.status`

```text
submitted
under_review
resolved
withdrawn
```

## `appeals.resolution`

```text
denied
partially_granted
granted
```

---

# 十、6 张表的 FK 关系最终定稿

只有 Trust 域内部建立物理 FK：

```text
moderation_cases.report_id
        ↓
reports.id
```

```text
moderation_evidence.case_id
        ↓
moderation_cases.id
```

```text
moderation_decisions.case_id
        ↓
moderation_cases.id
```

```text
enforcement_actions.decision_id
        ↓
moderation_decisions.id
```

```text
appeals.decision_id
        ↓
moderation_decisions.id
```

全部：

```text
ON DELETE RESTRICT
```

我不建议任何一条：

```text
ON DELETE CASCADE
```

因为这是安全审计数据。

删除 Case 不应该导致：

```text
证据
决定
处罚
申诉
```

跟着消失。

---

# 十一、跨域字段统一没有物理 FK

以下都是逻辑引用：

```text
reporter_user_id
assigned_reviewer_user_id
created_by_user_id
decided_by_user_id
target_user_id
appellant_user_id
reviewer_user_id
subject_id
reference_id
```

Trust 不应该通过 FK 强耦合：

```text
identity
social
chat
commerce
rewards
```

---

# 十二、`subject_type` 最终建议统一

凡 Trust 引用治理对象，目前统一：

```text
user
social_profile
social_post
social_post_image
chat_message
conversation
```

不要出现：

```text
posts
messages
profiles

social.posts
chat.messages

table_name
schema_name
```

因为：

> `subject_type` 是领域协议，不是数据库定位器。

---

# 十三、一个非常重要的“处罚归属”原则

最终架构应该理解为：

```text
                    Trust
                      │
              enforcement_action
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
    Identity        Social          Chat
```

Trust 拥有：

```text
为什么处罚
处罚什么
处罚多久
处罚是否撤销
```

Identity 拥有：

```text
用户账号
认证
登录
```

Social 拥有：

```text
资料
动态
社交关系
```

Chat 拥有：

```text
会话
消息
发送能力
```

所以例如：

```text
chat_restrict
```

Trust 不去：

```sql
UPDATE chat.xxx
```

而应该：

```text
Trust
↓
ChatRestricted event
↓
Chat 自己执行
```

这就是当前架构下最重要的域边界之一。

---

# 十四、不可违反的 Trust & Safety 领域规则

这部分建议直接作为后面的领域文档规则。

### TS-01

`reports` 只代表：

> 用户举报事实。

系统检测不得伪造成 Report。

---

### TS-02

所有正式审核都必须存在：

```text
moderation_case
```

禁止在：

```text
Social
Chat
Identity
```

私自建立另一套审核结果系统。

---

### TS-03

所有被审核跨域对象统一通过：

```text
subject_type + subject_id
```

引用。

不得建立跨域 FK。

---

### TS-04

举报原因：

```text
reason_code
```

不得视为违规事实。

最终违规事实只能来自：

```text
moderation_decisions
```

---

### TS-05

一个 Case 最多存在一个：

```text
moderation_decision
```

---

### TS-06

Decision 一旦形成：

> 不允许因申诉直接修改。

申诉必须形成独立：

```text
appeal
```

---

### TS-07

Evidence 一旦形成：

> 不允许覆盖、编辑原始证据。

补充证据只能 INSERT。

---

### TS-08

安全审计表原则上禁止物理删除。

至少：

```text
moderation_evidence
moderation_decisions
enforcement_actions
appeals
```

必须长期保留治理历史。

---

### TS-09

一条 Decision 可以产生：

```text
0..N enforcement_actions
```

例如：

```text
违规动态
↓
content_remove
+
warning
```

甚至：

```text
content_remove
+
social_restrict
+
account_suspend
```

所以绝不能：

```text
UNIQUE(decision_id)
```

放在 `enforcement_actions`。

---

### TS-10

`enforcement_action` 是：

> 安全治理命令 / 安全处罚事实。

不是业务域对象状态。

---

### TS-11

Trust 不允许直接修改：

```text
identity.*
social.*
chat.*
commerce.*
rewards.*
```

---

### TS-12

`account_suspend` 必须具有：

```text
expires_at
```

而：

```text
account_ban
```

默认代表永久限制，因此：

```text
expires_at IS NULL
```

---

### TS-13

申诉成功不得删除处罚记录。

应该：

```text
enforcement_action.status = revoked
```

并保存：

```text
revoked_at
revocation_reason
```

---

### TS-14

一个用户针对一个 Decision V1 最多：

```text
1 appeal
```

---

### TS-15

管理员、审核员本身不是 Trust 自己拥有的 User。

因此：

```text
reviewer_user_id
decided_by_user_id
```

仍然只是逻辑用户 ID。

Trust 不建立自己的：

```text
moderator_users
```

用户身份与后台权限应该继续由对应身份/权限体系负责。

---

# 十五、最终 Domain 模型

最终关系就是：

```text
┌────────────────────┐
│      reports       │
└─────────┬──────────┘
          │ 0..1
          ▼
┌────────────────────┐
│ moderation_cases   │
└──────┬───────┬─────┘
       │       │
       │       │ 1
       │       ▼
       │   ┌──────────────────────┐
       │   │ moderation_decisions │
       │   └──────────┬───────────┘
       │              │
       │              │ 0..N
       │              ▼
       │      ┌─────────────────────┐
       │      │ enforcement_actions │
       │      └─────────────────────┘
       │
       │ 0..N
       ▼
┌─────────────────────┐
│ moderation_evidence │
└─────────────────────┘

moderation_decisions
        │
        │ 0..N
        ▼
┌────────────────────┐
│      appeals       │
└────────────────────┘
```

这里有一个需要特别说明的基数：

```text
Decision → Appeals
```

数据库允许理论上的多个用户分别申诉，但：

```text
UNIQUE(decision_id, appellant_user_id)
```

保证**同一个用户只能申诉一次**。

---

# 十六、Trust & Safety Domain 最终定稿清单

| 表 | 职责 |
|---|---|
| `trust.reports` | 用户举报原始事实 |
| `trust.moderation_cases` | 统一审核工作流 |
| `trust.moderation_evidence` | 审核证据及不可变快照 |
| `trust.moderation_decisions` | 审核最终判断 |
| `trust.enforcement_actions` | 安全处罚和处置指令 |
| `trust.appeals` | 被处罚用户的申诉及复核结果 |

到这里，**Trust & Safety Domain 的数据库主体可以视为完成第一版定稿**。

从整个项目的领域架构来看，这个域也已经能够同时承接你现在的**人工审核**和未来的**AI 自动审核**，而且没有侵入 Social、Chat、Identity、Commerce 或 Rewards 的内部状态。下一步最合适的是像前面几个 Domain 一样，再做一次 **Trust & Safety Domain 最终审计定稿**：逐项检查这 6 张表有没有字段可以删、命名需要统一，以及 FK / UNIQUE / CHECK / INDEX 有没有遗漏或过度设计。memcite


---

### [22] USER　status=finished_successfully

做一次 **Trust & Safety Domain 最终审计定稿**：逐项检查这 6 张表有没有字段可以删、命名需要统一，以及 FK / UNIQUE / CHECK / INDEX 有没有遗漏或过度设计。


---

### [23] ASSISTANT　status=finished_successfully

_(empty)_


---

### [24] ASSISTANT　status=finished_successfully

我会把这次当成“上线前数据库审计”来做，而不是重复上一版。重点会检查三类问题：字段是否重复、CHECK 是否会卡住合法状态迁移、以及跨域引用/审计历史是否真正闭环。


---

### [25] ASSISTANT　status=finished_successfully

_(empty)_


---

### [26] ASSISTANT　status=finished_successfully

已经发现上一版里有两个需要真正修正的问题：第一，`reports.status` 与 `moderation_cases.status / decision.outcome` 存在重复事实源，应该删掉，让举报记录保持不可变；第二，`enforcement_actions.status='active'` 对“警告、内容移除”并不准确，统一改成 `applied` 更合理，并补上“未执行前取消”的 `cancelled` 状态。


---

### [27] ASSISTANT　status=finished_successfully

_(empty)_


---

### [28] ASSISTANT　status=finished_successfully

这次审计后，**不建议把上一版原样冻结**。有几处值得在真正落库前修正，尤其是重复状态源、Evidence 维度混杂、Enforcement 状态语义，以及申诉后的处罚审计链。

## 一、最终审计结论

6 张表继续保留，不增加新表：

```text
trust.reports
trust.moderation_cases
trust.moderation_evidence
trust.moderation_decisions
trust.enforcement_actions
trust.appeals
```

但做以下关键修正：

| 修正 | 结论 |
|---|---|
| `reports.status` | **删除**，和 Case 状态重复 |
| `reports.updated_at` | **删除**，Report 改为不可变事实 |
| `moderation_cases.cancelled` | 保留，但补 `cancellation_code` |
| `moderation_evidence.user_submission` | **删除**，它是来源，不是证据类型 |
| Evidence 来源 | 改为 `reporter/appellant/moderator/system/domain_snapshot` |
| `content_sha256 char(64)` | 改为 `varchar(64) + CHECK` |
| `moderation_decisions.created_at` | **删除**，和 `decided_at` 重复 |
| Enforcement `active` | 改名为 **`applied`** |
| Enforcement | 新增 **`cancelled`**，解决未执行前取消问题 |
| `social_restrict/chat_restrict` | 改成更明确的 `social_post_restrict/chat_send_restrict` |
| Enforcement | 增加可选 `appeal_id`，建立申诉→处罚调整审计链 |
| Appeals `created_at` | **删除**，和 `submitted_at` 重复 |
| Appeals `resolved_at` | 改为统一的 `closed_at` |
| Case queue priority index | 修正：不能直接按字符串 `DESC` 排优先级 |

这版可以作为最终定稿。

---

# 二、1. `trust.reports` 最终定稿

## 职责

只保存：

> 用户提交举报这一不可变事实。

所以我建议彻底删除：

```text
status
updated_at
```

举报的处理状态应当从 `moderation_cases` 得到。

例如：

```text
不存在 case
→ submitted

case.status = queued / in_review
→ under_review

case.status = resolved
→ resolved
```

这样不会出现：

```text
report.status = resolved
case.status   = in_review
```

这种双状态源冲突。

## 最终字段

```sql
CREATE TABLE trust.reports (
    id uuid PRIMARY KEY,

    reporter_user_id uuid NOT NULL,

    subject_type varchar(32) NOT NULL,
    subject_id uuid NOT NULL,

    reason_code varchar(32) NOT NULL,
    description text,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT reports_subject_type_check
        CHECK (
            subject_type IN (
                'user',
                'social_profile',
                'social_post',
                'social_post_image',
                'chat_message',
                'conversation'
            )
        ),

    CONSTRAINT reports_reason_code_check
        CHECK (
            reason_code IN (
                'spam',
                'harassment',
                'hate',
                'sexual_content',
                'violence',
                'fraud',
                'impersonation',
                'illegal_content',
                'privacy',
                'underage',
                'other'
            )
        )
);
```

## INDEX

```sql
CREATE INDEX idx_reports_reporter_created
ON trust.reports (
    reporter_user_id,
    created_at DESC
);

CREATE INDEX idx_reports_subject_created
ON trust.reports (
    subject_type,
    subject_id,
    created_at DESC
);
```

不加：

```text
reason_code index
created_at index
```

V1 没有足够高频查询需求，属于过度索引。

### 最终判断

`reports` 应当基本视为：

> append-only。

举报内容不允许后续编辑覆盖。

---

# 三、2. `trust.moderation_cases` 最终定稿

上一版主体正确，但 `cancelled` 没有说明为什么取消，这是审计缺口。

增加：

```text
cancellation_code
```

## 最终字段

```sql
CREATE TABLE trust.moderation_cases (
    id uuid PRIMARY KEY,

    source_type varchar(32) NOT NULL,

    report_id uuid,

    subject_type varchar(32) NOT NULL,
    subject_id uuid NOT NULL,

    priority varchar(16) NOT NULL DEFAULT 'normal',
    status varchar(24) NOT NULL DEFAULT 'queued',

    assigned_reviewer_user_id uuid,

    cancellation_code varchar(32),

    review_started_at timestamptz,
    closed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT moderation_cases_report_fk
        FOREIGN KEY (report_id)
        REFERENCES trust.reports(id)
        ON DELETE RESTRICT,

    CONSTRAINT moderation_cases_source_type_check
        CHECK (
            source_type IN (
                'user_report',
                'pre_publish',
                'manual_review',
                'automated_detection',
                'system_rule'
            )
        ),

    CONSTRAINT moderation_cases_subject_type_check
        CHECK (
            subject_type IN (
                'user',
                'social_profile',
                'social_post',
                'social_post_image',
                'chat_message',
                'conversation'
            )
        ),

    CONSTRAINT moderation_cases_priority_check
        CHECK (
            priority IN (
                'low',
                'normal',
                'high',
                'critical'
            )
        ),

    CONSTRAINT moderation_cases_status_check
        CHECK (
            status IN (
                'queued',
                'in_review',
                'resolved',
                'cancelled'
            )
        ),

    CONSTRAINT moderation_cases_cancellation_code_check
        CHECK (
            cancellation_code IS NULL
            OR cancellation_code IN (
                'subject_unavailable',
                'superseded',
                'invalid_source',
                'duplicate',
                'other'
            )
        ),

    CONSTRAINT moderation_cases_report_source_check
        CHECK (
            (
                source_type = 'user_report'
                AND report_id IS NOT NULL
            )
            OR
            (
                source_type <> 'user_report'
                AND report_id IS NULL
            )
        ),

    CONSTRAINT moderation_cases_user_report_not_cancelled_check
        CHECK (
            source_type <> 'user_report'
            OR status <> 'cancelled'
        ),

    CONSTRAINT moderation_cases_cancellation_check
        CHECK (
            (
                status = 'cancelled'
                AND cancellation_code IS NOT NULL
            )
            OR
            (
                status <> 'cancelled'
                AND cancellation_code IS NULL
            )
        ),

    CONSTRAINT moderation_cases_lifecycle_check
        CHECK (
            (
                status = 'queued'
                AND review_started_at IS NULL
                AND closed_at IS NULL
            )
            OR
            (
                status = 'in_review'
                AND review_started_at IS NOT NULL
                AND closed_at IS NULL
            )
            OR
            (
                status = 'resolved'
                AND review_started_at IS NOT NULL
                AND closed_at IS NOT NULL
            )
            OR
            (
                status = 'cancelled'
                AND closed_at IS NOT NULL
            )
        ),

    CONSTRAINT moderation_cases_time_order_check
        CHECK (
            (review_started_at IS NULL OR review_started_at >= created_at)
            AND
            (closed_at IS NULL OR closed_at >= created_at)
            AND
            (
                review_started_at IS NULL
                OR closed_at IS NULL
                OR closed_at >= review_started_at
            )
        )
);
```

## UNIQUE

继续保留：

```sql
CREATE UNIQUE INDEX uq_moderation_cases_report
ON trust.moderation_cases (report_id)
WHERE report_id IS NOT NULL;
```

V1：

```text
Report → 最多一个 Case
```

是合理的。

以后如果真的出现：

> 100 个用户举报同一条动态，需要聚合成一个案件

那时再引入：

```text
case_reports
```

关联表。

现在不要提前增加第 7 张表。

---

# 四、Case 的 Priority 索引必须修正

上一版：

```sql
ORDER BY priority DESC
```

实际上是有问题的。

因为 PostgreSQL 对 `varchar` 排序是字典序：

```text
normal
low
high
critical
```

并不是：

```text
critical
high
normal
low
```

所以不能依赖：

```sql
priority DESC
```

表达业务优先级。

推荐建立表达式索引：

```sql
CREATE INDEX idx_moderation_cases_queue
ON trust.moderation_cases (
    (
        CASE priority
            WHEN 'critical' THEN 4
            WHEN 'high'     THEN 3
            WHEN 'normal'   THEN 2
            WHEN 'low'      THEN 1
        END
    ) DESC,
    created_at ASC
)
WHERE status = 'queued';
```

后台取审核任务也使用同样 CASE。

其他索引：

```sql
CREATE INDEX idx_moderation_cases_reviewer
ON trust.moderation_cases (
    assigned_reviewer_user_id,
    status,
    created_at
)
WHERE assigned_reviewer_user_id IS NOT NULL;

CREATE INDEX idx_moderation_cases_subject
ON trust.moderation_cases (
    subject_type,
    subject_id,
    created_at DESC
);
```

上一版：

```text
idx_moderation_cases_source
```

建议删除。

通常不是核心在线查询。

---

# 五、Report 与 Case 的一个重要应用层不变量

当：

```text
source_type = user_report
```

必须：

```text
case.subject_type = report.subject_type
case.subject_id   = report.subject_id
```

理论上可以通过冗余 Composite UNIQUE + Composite FK 强制。

但为了这个约束单独给 `reports` 多建立一个：

```text
UNIQUE(id, subject_type, subject_id)
```

索引，收益不大。

所以这里最终建议：

> 保持普通 `report_id FK`，目标一致性由 Trust Application Service 在同一事务中校验。

不值得为了它制造额外索引。

---

# 六、3. `trust.moderation_evidence` 最终定稿

上一版这里存在一个建模问题：

```text
text_snapshot
media_snapshot
object_reference
metadata_snapshot
user_submission
```

`user_submission` 和前四个不是一个维度。

前四个描述：

> 证据是什么。

`user_submission` 描述：

> 证据从哪来。

所以删除：

```text
evidence_type = user_submission
```

来源单独由：

```text
source_type
```

表达。

---

## Evidence Type 最终为

```text
text_snapshot
media_snapshot
object_reference
metadata_snapshot
```

## Evidence Source 最终为

```text
system
domain_snapshot
reporter
appellant
moderator
```

其中新增：

```text
appellant
```

用来支持申诉期间用户追加证据。

---

# 七、Evidence 最终字段

建议增加：

```text
appeal_id
```

允许明确表达：

> 这条证据是在某次 Appeal 中提交的。

否则申诉附件只能通过时间猜测属于哪个 Appeal。

```sql
CREATE TABLE trust.moderation_evidence (
    id uuid PRIMARY KEY,

    case_id uuid NOT NULL,
    appeal_id uuid,

    evidence_type varchar(32) NOT NULL,
    source_type varchar(24) NOT NULL,

    content_text text,
    storage_key varchar(512),

    reference_type varchar(32),
    reference_id uuid,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    content_sha256 varchar(64),

    captured_at timestamptz NOT NULL,

    added_by_user_id uuid,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT moderation_evidence_case_fk
        FOREIGN KEY (case_id)
        REFERENCES trust.moderation_cases(id)
        ON DELETE RESTRICT,

    CONSTRAINT moderation_evidence_type_check
        CHECK (
            evidence_type IN (
                'text_snapshot',
                'media_snapshot',
                'object_reference',
                'metadata_snapshot'
            )
        ),

    CONSTRAINT moderation_evidence_source_check
        CHECK (
            source_type IN (
                'system',
                'domain_snapshot',
                'reporter',
                'appellant',
                'moderator'
            )
        ),

    CONSTRAINT moderation_evidence_actor_check
        CHECK (
            (
                source_type IN ('system', 'domain_snapshot')
                AND added_by_user_id IS NULL
            )
            OR
            (
                source_type IN (
                    'reporter',
                    'appellant',
                    'moderator'
                )
                AND added_by_user_id IS NOT NULL
            )
        ),

    CONSTRAINT moderation_evidence_reference_type_check
        CHECK (
            reference_type IS NULL
            OR reference_type IN (
                'user',
                'social_profile',
                'social_post',
                'social_post_image',
                'chat_message',
                'conversation'
            )
        ),

    CONSTRAINT moderation_evidence_reference_pair_check
        CHECK (
            (
                reference_type IS NULL
                AND reference_id IS NULL
            )
            OR
            (
                reference_type IS NOT NULL
                AND reference_id IS NOT NULL
            )
        ),

    CONSTRAINT moderation_evidence_metadata_check
        CHECK (
            jsonb_typeof(metadata) = 'object'
        ),

    CONSTRAINT moderation_evidence_sha256_check
        CHECK (
            content_sha256 IS NULL
            OR content_sha256 ~ '^[0-9a-f]{64}$'
        )
);
```

---

# 八、Evidence Payload 再加强约束

建议证据类型和存储方式一一对应：

```sql
ALTER TABLE trust.moderation_evidence
ADD CONSTRAINT moderation_evidence_payload_check
CHECK (
    (
        evidence_type = 'text_snapshot'
        AND content_text IS NOT NULL
        AND storage_key IS NULL
        AND reference_id IS NULL
        AND content_sha256 IS NOT NULL
    )
    OR
    (
        evidence_type = 'media_snapshot'
        AND content_text IS NULL
        AND storage_key IS NOT NULL
        AND reference_id IS NULL
        AND content_sha256 IS NOT NULL
    )
    OR
    (
        evidence_type = 'object_reference'
        AND content_text IS NULL
        AND storage_key IS NULL
        AND reference_type IS NOT NULL
        AND reference_id IS NOT NULL
    )
    OR
    (
        evidence_type = 'metadata_snapshot'
        AND content_text IS NULL
        AND storage_key IS NULL
        AND reference_id IS NULL
        AND metadata <> '{}'::jsonb
    )
);
```

这会避免出现：

```text
evidence_type = text_snapshot

但：
content_text = NULL
storage_key  = xxx.jpg
```

这种脏数据。

---

# 九、Evidence 的 Appeal FK

因为 `appeals` 建表顺序可能晚于 Evidence，可以最终 migration 再补：

```sql
ALTER TABLE trust.moderation_evidence
ADD CONSTRAINT moderation_evidence_appeal_fk
FOREIGN KEY (appeal_id)
REFERENCES trust.appeals(id)
ON DELETE RESTRICT;
```

这里还有一个应用层规则：

```text
evidence.appeal_id
```

如果存在，那么：

```text
Appeal → Decision → Case
```

最终必须等于：

```text
evidence.case_id
```

暂时不值得通过更多冗余 Composite FK 强制。

---

# 十、Evidence INDEX

```sql
CREATE INDEX idx_moderation_evidence_case
ON trust.moderation_evidence (
    case_id,
    captured_at
);

CREATE INDEX idx_moderation_evidence_appeal
ON trust.moderation_evidence (
    appeal_id,
    captured_at
)
WHERE appeal_id IS NOT NULL;

CREATE INDEX idx_moderation_evidence_reference
ON trust.moderation_evidence (
    reference_type,
    reference_id
)
WHERE reference_id IS NOT NULL;
```

并继续：

> 禁止正常业务 UPDATE / DELETE Evidence。

修正证据只能新增新的 Evidence。

---

# 十一、4. `trust.moderation_decisions` 最终定稿

上一版基本正确。

只删除：

```text
created_at
```

因为：

```text
decided_at
```

已经是这条不可变事实真正的发生时间。

没必要同时保存：

```text
created_at
decided_at
```

然后讨论两者有什么差别。

---

## 最终字段

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

    decided_by_user_id uuid,

    rationale text,

    decided_at timestamptz NOT NULL,

    CONSTRAINT moderation_decisions_case_fk
        FOREIGN KEY (case_id)
        REFERENCES trust.moderation_cases(id)
        ON DELETE RESTRICT,

    CONSTRAINT moderation_decisions_case_unique
        UNIQUE (case_id),

    CONSTRAINT moderation_decisions_outcome_check
        CHECK (
            outcome IN (
                'no_violation',
                'violation',
                'insufficient_evidence'
            )
        ),

    CONSTRAINT moderation_decisions_violation_code_check
        CHECK (
            violation_code IS NULL
            OR violation_code IN (
                'spam',
                'harassment',
                'hate',
                'sexual_content',
                'violence',
                'fraud',
                'impersonation',
                'illegal_content',
                'privacy',
                'underage_safety',
                'other_policy_violation'
            )
        ),

    CONSTRAINT moderation_decisions_severity_check
        CHECK (
            severity IN (
                'none',
                'low',
                'medium',
                'high',
                'critical'
            )
        ),

    CONSTRAINT moderation_decisions_method_check
        CHECK (
            decision_method IN (
                'human',
                'automated',
                'hybrid'
            )
        )
);
```

再增加三个重要 CHECK。

### Decision 结果一致性

```sql
ALTER TABLE trust.moderation_decisions
ADD CONSTRAINT moderation_decisions_result_check
CHECK (
    (
        outcome = 'violation'
        AND violation_code IS NOT NULL
        AND severity <> 'none'
        AND policy_code IS NOT NULL
        AND policy_version IS NOT NULL
    )
    OR
    (
        outcome IN (
            'no_violation',
            'insufficient_evidence'
        )
        AND violation_code IS NULL
        AND severity = 'none'
    )
);
```

这里相较上一版加强了：

> 真正判定违规时，必须记录对应 Policy 和 Policy Version。

否则几年后没法解释：

> 当初根据哪一版规则处罚的？

### Policy 成对

```sql
ALTER TABLE trust.moderation_decisions
ADD CONSTRAINT moderation_decisions_policy_pair_check
CHECK (
    (
        policy_code IS NULL
        AND policy_version IS NULL
    )
    OR
    (
        policy_code IS NOT NULL
        AND policy_version IS NOT NULL
    )
);
```

### Decision Actor

```sql
ALTER TABLE trust.moderation_decisions
ADD CONSTRAINT moderation_decisions_actor_check
CHECK (
    (
        decision_method = 'automated'
        AND decided_by_user_id IS NULL
    )
    OR
    (
        decision_method IN ('human', 'hybrid')
        AND decided_by_user_id IS NOT NULL
    )
);
```

---

# 十二、Decision INDEX 审计

`UNIQUE(case_id)` 已经自动创建索引。

所以不再重复：

```text
idx_decision_case
```

建议只有：

```sql
CREATE INDEX idx_moderation_decisions_violation
ON trust.moderation_decisions (
    violation_code,
    decided_at DESC
)
WHERE outcome = 'violation';
```

上一版：

```text
idx_decisions_method
```

建议删除。

`decision_method` 通常是低基数字段，单独索引价值低。

---

# 十三、5. `trust.enforcement_actions` 是这次改动最大的表

上一版：

```text
pending
active
expired
revoked
failed
```

这里 `active` 有语义问题。

例如：

```text
warning
```

“警告处于 active”很奇怪。

```text
content_remove
```

“删除动作一直 active”也很奇怪。

真正统一的语义是：

```text
这项处罚是否已经应用成功
```

因此：

```text
active
```

正式改为：

```text
applied
```

---

# 十四、Enforcement 状态最终定稿

```text
pending
applied
expired
revoked
cancelled
failed
```

### `pending`

等待执行。

### `applied`

已经成功应用。

对永久处罚：

```text
account_ban
```

可以一直保持 `applied`。

### `expired`

有期限的处罚自然结束。

### `revoked`

已经生效，但后来主动撤销。

常见于：

```text
Appeal granted
```

### `cancelled`

尚未执行就被取消。

这个状态上一版缺失。

否则：

```text
pending
↓
申诉成功
```

无法表达。

### `failed`

消费者执行失败。

---

# 十五、Action Type 也要更精确

上一版：

```text
social_restrict
chat_restrict
```

过于模糊。

消费者看到：

```text
social_restrict
```

不知道到底限制：

```text
发布动态？
编辑资料？
发现用户？
关注？
```

所以 V1 应该设计成可执行的明确命令：

```text
warning
content_remove
content_restrict
social_post_restrict
chat_send_restrict
account_suspend
account_ban
```

后续需要其他安全能力，再新增稳定 Action Type。

---

# 十六、Enforcement 最终字段

```sql
CREATE TABLE trust.enforcement_actions (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,

    appeal_id uuid,

    action_type varchar(32) NOT NULL,

    target_user_id uuid,

    subject_type varchar(32),
    subject_id uuid,

    status varchar(24) NOT NULL DEFAULT 'pending',

    effective_at timestamptz NOT NULL,
    expires_at timestamptz,

    applied_at timestamptz,
    ended_at timestamptz,

    status_reason_code varchar(64),

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT enforcement_actions_decision_fk
        FOREIGN KEY (decision_id)
        REFERENCES trust.moderation_decisions(id)
        ON DELETE RESTRICT,

    CONSTRAINT enforcement_actions_appeal_fk
        FOREIGN KEY (appeal_id)
        REFERENCES trust.appeals(id)
        ON DELETE RESTRICT,

    CONSTRAINT enforcement_actions_type_check
        CHECK (
            action_type IN (
                'warning',
                'content_remove',
                'content_restrict',
                'social_post_restrict',
                'chat_send_restrict',
                'account_suspend',
                'account_ban'
            )
        ),

    CONSTRAINT enforcement_actions_status_check
        CHECK (
            status IN (
                'pending',
                'applied',
                'expired',
                'revoked',
                'cancelled',
                'failed'
            )
        )
);
```

---

# 十七、Enforcement Target CHECK

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_target_check
CHECK (
    (
        action_type IN (
            'warning',
            'social_post_restrict',
            'chat_send_restrict',
            'account_suspend',
            'account_ban'
        )
        AND target_user_id IS NOT NULL
        AND subject_type IS NULL
        AND subject_id IS NULL
    )
    OR
    (
        action_type IN (
            'content_remove',
            'content_restrict'
        )
        AND target_user_id IS NULL
        AND subject_type IS NOT NULL
        AND subject_id IS NOT NULL
    )
);
```

并补：

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_subject_type_check
CHECK (
    subject_type IS NULL
    OR subject_type IN (
        'social_profile',
        'social_post',
        'social_post_image',
        'chat_message',
        'conversation'
    )
);
```

内容处罚没有必要：

```text
subject_type = user
```

用户级处罚应通过：

```text
target_user_id
```

表达。

---

# 十八、Enforcement 时间 CHECK

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_expiry_check
CHECK (
    expires_at IS NULL
    OR expires_at > effective_at
);
```

暂停必须有限期：

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_suspend_check
CHECK (
    action_type <> 'account_suspend'
    OR expires_at IS NOT NULL
);
```

永久 Ban：

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_ban_check
CHECK (
    action_type <> 'account_ban'
    OR expires_at IS NULL
);
```

警告和永久内容移除也不需要 expires：

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_permanent_action_expiry_check
CHECK (
    action_type NOT IN (
        'warning',
        'content_remove'
    )
    OR expires_at IS NULL
);
```

---

# 十九、Enforcement Lifecycle CHECK

最终：

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_lifecycle_check
CHECK (
    (
        status = 'pending'
        AND applied_at IS NULL
        AND ended_at IS NULL
        AND status_reason_code IS NULL
    )
    OR
    (
        status = 'applied'
        AND applied_at IS NOT NULL
        AND ended_at IS NULL
        AND status_reason_code IS NULL
    )
    OR
    (
        status = 'expired'
        AND applied_at IS NOT NULL
        AND ended_at IS NOT NULL
        AND expires_at IS NOT NULL
    )
    OR
    (
        status = 'revoked'
        AND applied_at IS NOT NULL
        AND ended_at IS NOT NULL
        AND status_reason_code IS NOT NULL
    )
    OR
    (
        status = 'cancelled'
        AND applied_at IS NULL
        AND ended_at IS NOT NULL
        AND status_reason_code IS NOT NULL
    )
    OR
    (
        status = 'failed'
        AND applied_at IS NULL
        AND ended_at IS NOT NULL
        AND status_reason_code IS NOT NULL
    )
);
```

时间顺序：

```sql
ALTER TABLE trust.enforcement_actions
ADD CONSTRAINT enforcement_actions_time_order_check
CHECK (
    (applied_at IS NULL OR applied_at >= effective_at)
    AND
    (
        applied_at IS NULL
        OR ended_at IS NULL
        OR ended_at >= applied_at
    )
    AND
    (
        status <> 'expired'
        OR ended_at >= expires_at
    )
);
```

---

# 二十、为什么增加 `appeal_id`

这是这次非常值得增加的字段。

例如原处罚：

```text
account_suspend
30 days
```

用户申诉。

申诉结果：

```text
partially_granted
```

最终只封 7 天。

不要：

```sql
UPDATE enforcement_actions
SET expires_at = 7 days
```

因为这会篡改历史处罚事实。

正确方式：

```text
原 Enforcement:
30 天
↓
status = revoked
appeal_id = Appeal X

新 Enforcement:
7 天
appeal_id = Appeal X
```

这样完整保留：

```text
原处罚
↓
申诉
↓
撤销原处罚
↓
产生替代处罚
```

这个 `appeal_id` 很有价值，不属于过度设计。

---

# 二十一、Enforcement INDEX 最终版

```sql
CREATE INDEX idx_enforcement_actions_decision
ON trust.enforcement_actions (
    decision_id,
    created_at
);

CREATE INDEX idx_enforcement_actions_appeal
ON trust.enforcement_actions (
    appeal_id,
    created_at
)
WHERE appeal_id IS NOT NULL;

CREATE INDEX idx_enforcement_actions_user_current
ON trust.enforcement_actions (
    target_user_id,
    action_type,
    status
)
WHERE target_user_id IS NOT NULL
  AND status IN ('pending', 'applied');

CREATE INDEX idx_enforcement_actions_subject
ON trust.enforcement_actions (
    subject_type,
    subject_id,
    status
)
WHERE subject_id IS NOT NULL;

CREATE INDEX idx_enforcement_actions_expiry
ON trust.enforcement_actions (
    expires_at
)
WHERE status = 'applied'
  AND expires_at IS NOT NULL;

CREATE INDEX idx_enforcement_actions_pending
ON trust.enforcement_actions (
    effective_at
)
WHERE status = 'pending';
```

注意最后一个上一版按：

```text
created_at
```

索引不够合理。

任务执行器真正需要的是：

> 哪些 Pending Action 到执行时间了？

所以应该索引：

```text
effective_at
```

---

# 二十二、6. `trust.appeals` 最终定稿

这里做两个清理：

删除：

```text
created_at
```

因为：

```text
submitted_at
```

已经表达 Appeal 创建。

另外：

```text
resolved_at
```

改为：

```text
closed_at
```

因为：

```text
withdrawn
```

同样是一个终态，却不能叫 `resolved_at`。

这也和：

```text
moderation_cases.closed_at
```

统一。

---

# 二十三、Appeals 最终字段

```sql
CREATE TABLE trust.appeals (
    id uuid PRIMARY KEY,

    decision_id uuid NOT NULL,

    appellant_user_id uuid NOT NULL,

    reason text NOT NULL,

    status varchar(24) NOT NULL DEFAULT 'submitted',

    resolution varchar(24),

    reviewer_user_id uuid,
    resolution_note text,

    submitted_at timestamptz NOT NULL DEFAULT now(),
    review_started_at timestamptz,
    closed_at timestamptz,

    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT appeals_decision_fk
        FOREIGN KEY (decision_id)
        REFERENCES trust.moderation_decisions(id)
        ON DELETE RESTRICT,

    CONSTRAINT appeals_status_check
        CHECK (
            status IN (
                'submitted',
                'under_review',
                'resolved',
                'withdrawn'
            )
        ),

    CONSTRAINT appeals_resolution_check
        CHECK (
            resolution IS NULL
            OR resolution IN (
                'denied',
                'partially_granted',
                'granted'
            )
        ),

    CONSTRAINT appeals_decision_appellant_unique
        UNIQUE (
            decision_id,
            appellant_user_id
        )
);
```

---

# 二十四、Appeal Lifecycle 最终 CHECK

```sql
ALTER TABLE trust.appeals
ADD CONSTRAINT appeals_lifecycle_check
CHECK (
    (
        status = 'submitted'
        AND reviewer_user_id IS NULL
        AND review_started_at IS NULL
        AND closed_at IS NULL
        AND resolution IS NULL
    )
    OR
    (
        status = 'under_review'
        AND reviewer_user_id IS NOT NULL
        AND review_started_at IS NOT NULL
        AND closed_at IS NULL
        AND resolution IS NULL
    )
    OR
    (
        status = 'resolved'
        AND reviewer_user_id IS NOT NULL
        AND review_started_at IS NOT NULL
        AND closed_at IS NOT NULL
        AND resolution IS NOT NULL
        AND resolution_note IS NOT NULL
    )
    OR
    (
        status = 'withdrawn'
        AND closed_at IS NOT NULL
        AND resolution IS NULL
    )
);
```

时间顺序：

```sql
ALTER TABLE trust.appeals
ADD CONSTRAINT appeals_time_order_check
CHECK (
    (review_started_at IS NULL OR review_started_at >= submitted_at)
    AND
    (closed_at IS NULL OR closed_at >= submitted_at)
    AND
    (
        review_started_at IS NULL
        OR closed_at IS NULL
        OR closed_at >= review_started_at
    )
);
```

---

# 二十五、Appeals INDEX

```sql
CREATE INDEX idx_appeals_queue
ON trust.appeals (
    submitted_at
)
WHERE status = 'submitted';

CREATE INDEX idx_appeals_reviewer
ON trust.appeals (
    reviewer_user_id,
    submitted_at
)
WHERE status = 'under_review';

CREATE INDEX idx_appeals_appellant
ON trust.appeals (
    appellant_user_id,
    submitted_at DESC
);
```

不需要额外：

```text
decision_id index
```

因为：

```text
UNIQUE(decision_id, appellant_user_id)
```

已经以 `decision_id` 开头，可以服务 decision 查询。

---

# 二十六、最终 FK 定稿

域内物理 FK：

```text
moderation_cases.report_id
    → reports.id

moderation_evidence.case_id
    → moderation_cases.id

moderation_evidence.appeal_id
    → appeals.id

moderation_decisions.case_id
    → moderation_cases.id

enforcement_actions.decision_id
    → moderation_decisions.id

enforcement_actions.appeal_id
    → appeals.id

appeals.decision_id
    → moderation_decisions.id
```

全部：

```text
ON DELETE RESTRICT
```

没有任何：

```text
ON DELETE CASCADE
```

这个结论继续保持。

---

# 二十七、跨域 ID 最终清单

这些全部：

> 只保存逻辑 ID，不建立 PostgreSQL FK。

```text
reports.reporter_user_id

moderation_cases.assigned_reviewer_user_id

moderation_evidence.added_by_user_id
moderation_evidence.reference_id

moderation_decisions.decided_by_user_id

enforcement_actions.target_user_id
enforcement_actions.subject_id

appeals.appellant_user_id
appeals.reviewer_user_id
```

以及：

```text
subject_type + subject_id
reference_type + reference_id
```

都属于跨域协议。

---

# 二十八、`subject_type` 最终统一字典

通用审核目标：

```text
user
social_profile
social_post
social_post_image
chat_message
conversation
```

但是 Enforcement 内容目标不能是：

```text
user
```

所以 Enforcement 的 CHECK 使用：

```text
social_profile
social_post
social_post_image
chat_message
conversation
```

用户处罚统一走：

```text
target_user_id
```

这是一个小但很重要的统一。

---

# 二十九、最终状态枚举

### Case Source

```text
user_report
pre_publish
manual_review
automated_detection
system_rule
```

### Case Priority

```text
low
normal
high
critical
```

### Case Status

```text
queued
in_review
resolved
cancelled
```

### Evidence Type

```text
text_snapshot
media_snapshot
object_reference
metadata_snapshot
```

### Evidence Source

```text
system
domain_snapshot
reporter
appellant
moderator
```

### Decision Outcome

```text
no_violation
violation
insufficient_evidence
```

### Severity

```text
none
low
medium
high
critical
```

### Decision Method

```text
human
automated
hybrid
```

### Enforcement Action

```text
warning
content_remove
content_restrict
social_post_restrict
chat_send_restrict
account_suspend
account_ban
```

### Enforcement Status

```text
pending
applied
expired
revoked
cancelled
failed
```

### Appeal Status

```text
submitted
under_review
resolved
withdrawn
```

### Appeal Resolution

```text
denied
partially_granted
granted
```

---

# 三十、最终不可违反规则

我建议把下面这些直接作为 Trust & Safety Domain 的正式 Invariants。

**T&S-01**  
`reports` 是不可变的用户举报事实，不保存审核结果或处理状态。

**T&S-02**  
所有正式审核必须经过：

```text
moderation_cases
```

**T&S-03**  
用户举报产生的 Case 必须：

```text
source_type = user_report
report_id != NULL
```

非举报 Case：

```text
report_id = NULL
```

**T&S-04**  
用户举报 Case 的：

```text
subject_type + subject_id
```

必须与 Report 完全一致。

**T&S-05**  
一个 Report V1 最多产生一个 Case。

**T&S-06**  
一个 Case 最多有一个最终：

```text
moderation_decision
```

**T&S-07**  
`reason_code` 是举报者观点，不是违规事实。

违规事实只能来源于：

```text
moderation_decisions
```

**T&S-08**  
违规 Decision 必须保存：

```text
violation_code
severity
policy_code
policy_version
```

**T&S-09**  
Evidence 一旦建立不得修改或删除；补充证据只能新增。

**T&S-10**  
Decision 一旦形成不得修改或删除。

申诉不能：

```sql
UPDATE moderation_decisions
```

**T&S-11**  
一次 Decision 可以产生：

```text
0..N Enforcement Actions
```

绝不能：

```text
UNIQUE(decision_id)
```

**T&S-12**  
Trust 只产生治理处置，不直接 UPDATE：

```text
identity.*
social.*
chat.*
commerce.*
rewards.*
```

**T&S-13**  
用户级安全限制使用：

```text
target_user_id
```

内容级安全处置使用：

```text
subject_type + subject_id
```

两种不能混用。

**T&S-14**  
`account_suspend` 必须有限期。

**T&S-15**  
`account_ban` 必须无 `expires_at`。

**T&S-16**  
未执行处罚被取消：

```text
pending → cancelled
```

已经执行后撤销：

```text
applied → revoked
```

两个概念禁止混用。

**T&S-17**  
自然到期：

```text
applied → expired
```

不能用 `revoked` 表达。

**T&S-18**  
申诉修改处罚时，禁止覆盖原处罚参数。

例如不能直接把：

```text
30 天
```

改成：

```text
7 天
```

应该：

```text
原 Action → revoked
+
新 Action → 7 天
```

并通过：

```text
appeal_id
```

关联。

**T&S-19**  
同一个用户针对同一个 Decision，V1 只能正式申诉一次。

**T&S-20**  
`granted / partially_granted` 不等于修改原 Decision；原审核事实永久保留。

---

# 三十一、最终 6 张表职责现在非常干净

```text
reports
│
│ 用户声称发生了什么
│
▼
moderation_cases
│
│ 平台正在审核什么
│
├──────────────► moderation_evidence
│                审核依据是什么
│
▼
moderation_decisions
│
│ 平台最终判定什么
│
├──────────────► enforcement_actions
│                平台采取什么安全处置
│
▼
appeals
                 用户如何申诉、复核结果是什么
```

这次审计之后，我认为 **Trust & Safety Domain 可以正式冻结**。

尤其是这几个修正值得保留：**删除 Report 自身状态、Evidence 类型/来源拆开、Decision 去掉重复时间、Enforcement `active → applied`、增加 `cancelled`、细化社交/聊天限制、以及用 `appeal_id` 保留处罚修改历史**。这样后面无论人工审核、AI 审核还是申诉复核，都不用重新推翻这套核心数据模型。
