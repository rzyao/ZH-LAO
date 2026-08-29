---
status: frozen
last_updated: 2026-08-30
---

# Curriculum 规格

```text
Course → Unit → Lesson → LessonSection → LessonItem
```

Course 和 Lesson 管理发布状态；Unit、Section、Item 跟随上级生命周期，不各自维护 status。

| 表 | 冻结字段与约束 |
| --- | --- |
| `courses` | `id bigint identity PK`、`public_id varchar(32) not null unique`、`learning_language varchar(8) not null check zh/lo`、`title varchar(128) not null`、`subtitle varchar(256)`、`description text`、`cover_media_id bigint`、`status varchar(16) not null default draft check draft/published/archived`、`sort_order integer not null default 0`、审计时间。 |
| `units` | `id bigint identity PK`、`course_id bigint not null FK → courses`、`title varchar(128) not null`、`description text`、`sort_order integer not null`、审计时间；UNIQUE `(course_id,sort_order)`。 |
| `lessons` | `id bigint identity PK`、`public_id varchar(32) not null unique`、`unit_id bigint not null FK → units`、`title varchar(128) not null`、`description text`、`sort_order integer not null`、`estimated_minutes smallint check null or >0`、`status varchar(16) not null default draft check draft/published/archived`、`published_at timestamptz`、审计时间；UNIQUE `(unit_id,sort_order)`。 |
| `lesson_sections` | `id bigint identity PK`、`lesson_id bigint not null FK → lessons`、`section_type varchar(32) not null check introduction/knowledge/example/practice/summary/custom`、`title varchar(128)`、`description text`、`sort_order integer not null`、审计时间；UNIQUE `(lesson_id,sort_order)`。 |
| `lesson_items` | `id bigint identity PK`、`section_id bigint not null FK → lesson_sections`、`item_type varchar(32) not null check text/knowledge/image/audio/exercise/tip/dialogue`、`content_id bigint`、`exercise_id bigint`、`media_id bigint`、`title varchar(256)`、`body text`、`sort_order integer not null`、`metadata jsonb not null default '{}'::jsonb`、`is_required boolean not null default true`、审计时间；UNIQUE `(section_id,sort_order)`。 |

## LessonItem 规则

- `knowledge` 至少需要 `content_id`；`exercise` 至少需要 `exercise_id`；`image/audio` 至少需要 `media_id`；`text/tip/dialogue` 至少需要 `body`。
- 数据库 CHECK 只验证类型的必需字段存在，不强制其他字段为 NULL；Knowledge Item 可以同时拥有专属图片等辅助内容。
- `metadata` 只保存展示参数，如布局、拼音/翻译显示和音频重复次数；核心内容保持字段/FK 结构化。
- `content_id → learning.contents`；`exercise_id → learning.exercises`；Media FK 在 Platform Media 规格冻结后补齐。

## 发布与版本规则

课程发布由 Application Service 校验其 Unit、Lesson、Section、Item、Knowledge、Exercise、Media 和排序完整性，不使用 Trigger。

已产生用户学习记录的 Published Learning Content 不可做破坏性修改；重大修改创建新版本或新 Question。完整内容版本系统属于后续 Operations/Content Publishing 设计。

Lesson 完成条件由 Learning Service/Platform Config 决定，例如 required LessonItem 完成比例；数据库只保存最终状态。
