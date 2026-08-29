---
status: frozen
last_updated: 2026-08-30
---

# Practice 规格

原则：题目结构标准化、题目内容可配置、作答记录独立保存。题型按交互方式而非语言知识分类。

## 定义表

| 表 | 冻结字段与约束 |
| --- | --- |
| `exercises` | `id bigint identity PK`、`public_id varchar(32) not null unique`、`title varchar(128)`、`description text`、`exercise_type varchar(32) not null default practice check practice/review/test`、`passing_score smallint check null or 0..100`、`max_attempts smallint check null or >0`、审计时间。Lesson 通过 LessonItem 引用 Exercise，不在 Exercise 上存 lesson_id。 |
| `questions` | `id bigint identity PK`、`public_id varchar(32) not null unique`、`exercise_id bigint not null FK → exercises`、`question_type varchar(32) not null check single_choice/multiple_choice/true_false/fill_blank/ordering/matching/listen_choice/content_choice`、`prompt text`、`sort_order integer not null`、`score numeric(8,2) not null default 1 check >=0`、`explanation text`、审计时间；UNIQUE `(exercise_id,sort_order)`。 |
| `question_contents` | `id bigint identity PK`、`question_id bigint not null FK → questions`、`role varchar(32) not null check prompt/audio/image/reference/hint`、`content_id bigint FK → contents`、`media_id bigint`、`text_value text`、`sort_order integer not null default 1`、`created_at timestamptz not null default now()`。至少一种展示内容由应用服务校验。 |
| `question_options` | `id bigint identity PK`、`question_id bigint not null FK → questions`、`content_id bigint FK → contents`、`text_value text`、`media_id bigint`、`sort_order integer not null`、`is_correct boolean not null default false`、`created_at timestamptz not null default now()`；UNIQUE `(question_id,sort_order)`。 |
| `answer_rules` | `id bigint identity PK`、`question_id bigint not null FK → questions`、`rule_type varchar(32) not null check exact_text/normalized_text/content/sequence/matching`、`expected_text text`、`content_id bigint FK → contents`、`sort_order integer not null default 1`、`metadata jsonb not null default '{}'::jsonb`、`created_at timestamptz not null default now()`。 |

单选/多选正确选项数量、文本规范化、部分得分和复杂答案验证由 Practice Service 处理，不使用 Trigger。JSONB 仅用于 `answer_rules.metadata` 等随题型变化的规则参数。

## 作答历史

| 表 | 冻结字段与约束 |
| --- | --- |
| `exercise_attempts` | `id bigint identity PK`、`user_id bigint not null FK → identity.users`、`exercise_id bigint not null FK → exercises`、`status varchar(16) not null default in_progress check in_progress/completed/abandoned`、`total_score numeric(10,2)`、`earned_score numeric(10,2)`、`score_percent numeric(5,2) check null or 0..100`、`started_at timestamptz not null default now()`、`completed_at timestamptz`、`created_at timestamptz not null default now()`。同一用户可多次尝试，禁止 UNIQUE `(user_id,exercise_id)`。 |
| `question_attempts` | `id bigint identity PK`、`exercise_attempt_id bigint not null FK → exercise_attempts`、`question_id bigint not null FK → questions`、`answer_data jsonb not null`、`is_correct boolean`、`earned_score numeric(10,2)`、`answered_at timestamptz not null default now()`；UNIQUE `(exercise_attempt_id,question_id)`。 |

`answer_data` 是允许的 JSONB：它可分别表达单选、多选、填空、排序和配对答案；题目定义本身不使用万能 JSONB。

## 可选表

`question_reviews` 仅在高频错题本产品需求出现时建立，字段为 User、Question、正确/错误计数、最近作答/错误时间、`resolved` 和更新时间。第一阶段可直接从 `question_attempts` 查询错误历史。
