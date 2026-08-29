---
status: frozen
last_updated: 2026-08-30
---

# Progress、Mastery 与 Review 规格

历史 Activity 不替代当前状态；首页和课程页不能扫描 Activity 计算进度。

| 表 | 冻结字段与约束 |
| --- | --- |
| `learning_activities` | `id bigint identity PK`、`user_id bigint not null FK → identity.users`、`activity_type varchar(32) not null check course_started/lesson_started/lesson_completed/content_viewed/content_practiced/exercise_started/exercise_completed/review_completed`、可空 `course_id/lesson_id/content_id/exercise_id`、`occurred_at timestamptz not null default now()`、`metadata jsonb not null default '{}'::jsonb`。记录历史、分析和状态重算。 |
| `course_progress` | `user_id bigint not null FK → users`、`course_id bigint not null FK → courses`、`status varchar(16) not null default not_started check not_started/in_progress/completed`、`started_at`、`completed_at`、`last_lesson_id bigint FK → lessons`、`progress_percent numeric(5,2) not null default 0 check 0..100`、`updated_at timestamptz not null default now()`；PK `(user_id,course_id)`。 |
| `lesson_progress` | `user_id bigint not null FK → users`、`lesson_id bigint not null FK → lessons`、`status varchar(16) not null default not_started check not_started/in_progress/completed`、`started_at`、`completed_at`、`last_section_id bigint FK → lesson_sections`、`progress_percent numeric(5,2) not null default 0 check 0..100`、`updated_at timestamptz not null default now()`；PK `(user_id,lesson_id)`。 |
| `content_mastery` | `user_id bigint not null FK → users`、`content_id bigint not null FK → contents`、`mastery_status varchar(16) not null default new check new/learning/familiar/mastered`、`mastery_score numeric(5,2) check null or 0..100`、`correct_count integer not null default 0`、`incorrect_count integer not null default 0`、`first_learned_at`、`last_practiced_at`、`mastered_at`、`updated_at timestamptz not null default now()`；PK `(user_id,content_id)`；计数 CHECK 非负。 |
| `content_reviews` | `user_id bigint not null FK → users`、`content_id bigint not null FK → contents`、`next_review_at timestamptz not null`、`priority smallint not null default 0`、`review_count integer not null default 0 check >=0`、`last_reviewed_at timestamptz`、`updated_at timestamptz not null default now()`；PK `(user_id,content_id)`。 |
| `content_bookmarks` | `user_id bigint not null FK → users`、`content_id bigint not null FK → contents`、`created_at timestamptz not null default now()`；PK `(user_id,content_id)`。 |

## 规则

- `mastery_score` 服务排序与复习建议；`mastery_status` 服务产品展示。状态阈值由配置决定，不写死在表中。
- 第一阶段采用简单复习：答错降低掌握度、提前 `next_review_at`；连续答对提高掌握度、延后复习。复杂 SRS 暂不做。
- Unit Progress 由 Lesson Progress 计算，不建 `unit_progress`。
- 不建永久 `lesson_item_progress`；Lesson 内浏览可短期保存在客户端或 Activity 中，只对关键练习/完成行为保存状态。
- 典型事务：ExerciseAttempt 完成 → 评分 → Activity → Mastery → Review → 满足课程规则时更新 Lesson/Course Progress。
