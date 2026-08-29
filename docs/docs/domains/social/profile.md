---
status: frozen
last_updated: 2026-08-30
---

# Social 资料与展示内容

## `social_profiles`

一行代表一个 User 的唯一公开社交身份；`user_id` 外键至 Identity，且 `UNIQUE(user_id)`。不复用 Basic Profile 昵称，也不把偏好、统计、关系或礼物塞入此表。

| 字段 | 类型/规则 | 说明 |
| --- | --- | --- |
| `id` | `BIGINT` identity PK | 内部标识 |
| `user_id` | `BIGINT NOT NULL UNIQUE` | 一个 User 最多一份 Social Profile |
| `display_name` | `VARCHAR(50) NOT NULL` | 社交显示名，与账户昵称不同 |
| `gender` | `VARCHAR(20)`，`male/female/other` 或 NULL | 自身性别，不是择偶条件 |
| `birth_date` | `DATE` | 存生日，不存会过期的 age |
| `country_code` / `region` / `city` | `CHAR(2)` / `VARCHAR(100)` / `VARCHAR(100)` | 首期粗粒度位置；不引入经纬度/PostGIS |
| `occupation` / `education_level` | `VARCHAR(100)` / `VARCHAR(30)` | 职业不建字典；教育采用应用枚举 |
| `bio` | `VARCHAR(1000)` | 资料级 UGC |
| `relationship_goal` | `VARCHAR(30)` | 单一主要目标：`friendship`、`language_exchange`、`dating`、`serious_relationship`、`open_to_anything` |
| `profile_status` | `VARCHAR(20) NOT NULL DEFAULT 'draft'` | `draft/active/paused/closed` |
| `moderation_status` | `VARCHAR(20) NOT NULL DEFAULT 'pending'` | `pending/approved/rejected/restricted` |
| `completeness_score` | `SMALLINT NOT NULL DEFAULT 0 CHECK 0..100` | 可重算缓存，不是真相 |
| `published_at` / `last_active_at` | `TIMESTAMPTZ` | 社交发布/社交场景活跃，不等于登录或学习活跃 |
| 审计 | `created_at`、`updated_at` 均 `TIMESTAMPTZ NOT NULL DEFAULT now()` | 统一审计 |

进入 Discovery 是服务层计算的资格：资料 `active + approved`、账户可用、年龄合法、审核通过的 position=1 主图和最低完整度等共同成立；不建 `is_visible`、`can_discover` 等重复真相字段。核心文字资料修改会重新审核；首期不建资料版本系统。

## 照片

`social_profile_photos` 是可审核 UGC。公开读取条件为 `deleted_at IS NULL AND moderation_status='approved'`；`position=1` 即主图，首期最多六张。

| 字段 | 类型/规则 |
| --- | --- |
| `id` | `BIGINT` identity PK |
| `profile_id` / `media_id` | `BIGINT NOT NULL`；前者 FK Profile，后者引用 Platform Media |
| `position` | `SMALLINT NOT NULL CHECK 1..6` |
| `moderation_status` | `VARCHAR(20) NOT NULL DEFAULT 'pending'`，`pending/approved/rejected` |
| `moderated_at` | `TIMESTAMPTZ` |
| 审计/删除 | `created_at`、`updated_at`、`deleted_at` |

`UNIQUE(profile_id, position) WHERE deleted_at IS NULL` 与 `UNIQUE(profile_id, media_id) WHERE deleted_at IS NULL` 防止有效照片位置或文件重复。删除为软删除，替换不覆盖旧行；位置重排由服务层事务完成。新主图待审期间可短暂影响展示，首期不为了无缝替换建立版本模型；主图未审核通过时资料不可进入发现池。

## 兴趣

`social_interests` 是平台维护的字典：`id` identity PK、`code VARCHAR(50) UNIQUE`、`name_zh VARCHAR(50) NOT NULL`、`name_lo/name_en VARCHAR(50)`、`category VARCHAR(50)`、`sort_order INTEGER DEFAULT 0`、`is_active BOOLEAN DEFAULT true` 与审计时间。`code` 是稳定业务语义；下线用 `is_active=false`，不物理删除。首期不设翻译/分类子表，也不允许用户自定义公开兴趣。

`social_profile_interests(profile_id, interest_id)` 使用复合主键，另有 `sort_order SMALLINT DEFAULT 0` 和 `created_at`。发布要求与编辑限制由服务层保证：至少 3、最多 10 个，用户可调整展示顺序。共同兴趣是推荐特征，权重/分数不入事实表。

## 社交语言

`social_profile_languages(profile_id, language_code)` 使用复合主键；它表示用户愿意公开的社交语言画像，不读取或绑定 Learning 进度。

| 字段 | 类型/规则 |
| --- | --- |
| `language_code` | `VARCHAR(10) NOT NULL`，使用稳定语言代码如 `zh/lo/en`；未来可接公共语言字典 |
| `proficiency_level` | `VARCHAR(20)` 可空；非母语仅可为 `beginner/elementary/intermediate/advanced/fluent` |
| `is_native` / `is_learning` | `BOOLEAN NOT NULL DEFAULT false` |
| `sort_order` | `SMALLINT NOT NULL DEFAULT 0` |
| 审计 | `created_at`、`updated_at` |

CHECK：母语时 `proficiency_level IS NULL`；非母语时 level 必填且在枚举中；不得同时 `is_native=true AND is_learning=true`。允许多母语。资料发布时至少一门语言由服务层保证；Learning 可预填但创建后 Social 自主拥有数据。

## Prompt

`social_prompt_templates` 是平台题库：`id` identity PK、`code VARCHAR(50) UNIQUE`、`question_zh VARCHAR(200) NOT NULL`、可空 `question_lo/question_en`、`category VARCHAR(50)`、`sort_order INTEGER DEFAULT 0`、`is_active BOOLEAN DEFAULT true` 与审计时间。问题语义变化必须新增 code/模板，旧模板下线；只允许非语义文案润色。首期没有用户自定义问题或类别表。

`social_profile_prompts` 是带独立 ID 的 UGC：`id` identity PK、`profile_id`、`prompt_template_id`、`answer VARCHAR(500) NOT NULL`（UI 限 300 字符）、`position SMALLINT CHECK 1..3`、`moderation_status pending/approved/rejected`、`moderated_at`、审计与 `deleted_at`。两个 partial unique index 保证有效记录中 `(profile_id,prompt_template_id)` 和 `(profile_id,position)` 都唯一。最多三个，公开条件与照片相同；删除软删，编辑直接 UPDATE 后重新审核。Prompt 非发布硬门槛，≥2 仅提升完整度和推荐信号。
