# Data Model: 老挝语字母内容管理 (Lao Alphabet Management)

**Feature Branch**: `002-lao-alphabet-management` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

本数据模型规范直接映射自物理数据库迁移 `0400_content.sql`、`0600_audio.sql` 与 `1240_content_revision.sql`，严格遵守项目宪法（Constitution Principle I & VI），不增删物理表与字段。

---

## 实体关系图 (Entity Relationship Diagram)

```text
┌──────────────────────────────────────┐
│           content.contents           │
│──────────────────────────────────────│
│ id (PK, bigint)                      │
│ public_id (UUID, UK)                 │
│ language ('lo')                      │
│ content_type ('lo_letter')           │
│ status ('active' | 'disabled' | ...) │
└──────────────────┬───────────────────┘
                   │
         1:1       │        1:N (Polymorphic entity_id = contents.public_id)
   ┌───────────────┴───────────────────────────────────────────┐
   ▼                                                           ▼
┌──────────────────────────────────────┐    ┌──────────────────────────────────────┐
│          content.lo_letters          │    │      content.content_revisions       │
│──────────────────────────────────────│    │──────────────────────────────────────│
│ content_id (PK, FK -> contents.id)   │    │ id (PK, bigint)                      │
│ character (varchar(16), UK)          │    │ revision_public_id (UUID, UK)        │
│ letter_type ('consonant'|'vowel'|...)│    │ entity_type ('content')              │
│ letter_class ('cons_middle'|...)     │    │ entity_id (UUID -> contents.public_id│
│ name (varchar(64))                   │    │ revision_number (int)                │
│ romanization (IPA string)            │    │ status ('draft'|'published'|...)     │
│ sort_order (smallint)                │    │ snapshot (JSONB payload)             │
│ UNIQUE (character, letter_type)      │    │ created_by_operator_id (UUID)        │
└──────────────────────────────────────┘    │ published_at (timestamptz)           │
                                            │ supersedes_revision_id (FK)          │
                                            └──────────────────┬───────────────────┘
                                                               │
                                                               │ 1:1 Hash & Slot Policy
                                                               ▼
                                            ┌──────────────────────────────────────┐
                                            │          audio.audio_slots           │
                                            │──────────────────────────────────────│
                                            │ id (PK, UUID)                        │
                                            │ source_domain ('content')            │
                                            │ content_entity_type ('lo_letter')    │
                                            │ content_entity_id (UUID)             │
                                            │ language_code ('lo')                 │
                                            │ audio_role ('pronunciation')         │
                                            │ required_content_revision_id (UUID)  │
                                            │ required_audio_input_hash (varchar)  │
                                            │ status ('active' | 'offline')        │
                                            │ official_asset_version_id (UUID, opt)│
                                            └──────────────────────────────────────┘
```

---

## 实体详情与字段级契约

### 1. Content Registry (`content.contents`)
- **Authority**: `database/migrations/0400_content.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部自增主键，禁止向跨域或外部 API 暴露。
  - `public_id`: `uuid` NOT NULL UNIQUE — 全局唯一公开内容标识符，外部 API 通信与跨域关联的主体。
  - `language`: `varchar(8)` NOT NULL — 固定为 `'lo'`。
  - `content_type`: `varchar(32)` NOT NULL — 固定为 `'lo_letter'`。
  - `status`: `varchar(16)` NOT NULL DEFAULT `'active'` — 上线状态，受限为 `('active', 'disabled', 'archived')`。
  - `created_at` / `updated_at`: `timestamptz` NOT NULL DEFAULT `now()`。

---

### 2. Lao Letter Specifics (`content.lo_letters`)
- **Authority**: `database/migrations/0400_content.sql`
- **Fields**:
  - `content_id`: `bigint` PRIMARY KEY REFERENCES `content.contents(id)` ON DELETE RESTRICT。
  - `character`: `varchar(16)` NOT NULL — 原生老挝文字符，严格采用 Unicode 二进制精确比对。
  - `letter_type`: `varchar(16)` NOT NULL — 大分类，受限为 `CHECK (letter_type IN ('consonant', 'vowel', 'tone_mark', 'other'))`；这是 API 与后端共同采用的分类口径。
  - `letter_class`: `varchar(16)` NULL — 正字法子分类（`cons_middle`, `cons_high`, `cons_low`, `vowel_short`, `vowel_long`, `symbol_*`）。
  - `name`: `varchar(64)` NULL — 字母名称或教学说明。
  - `romanization`: `varchar(64)` NULL — IPA 国际音标定义。
  - `sort_order`: `smallint` NULL — 组内展示与推荐学习排序号。
- **Database Constraints**:
  - `UNIQUE (character, letter_type)`: 强保证同类型下字符唯一性。

---

### 3. Content Revision (`content.content_revisions`)
- **Authority**: `database/migrations/1240_content_revision.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部主键。
  - `revision_public_id`: `uuid` NOT NULL UNIQUE — 修订版本全局唯一标识符。
  - `entity_type`: `varchar(32)` NOT NULL — 固定为 `'content'`。
  - `entity_id`: `uuid` NOT NULL — 对应 `content.contents.public_id`。
  - `revision_number`: `integer` NOT NULL CHECK (`revision_number > 0`) — 单调递增版本号。
  - `status`: `varchar(16)` NOT NULL DEFAULT `'draft'` — 审核状态：`CHECK (status IN ('draft', 'published', 'superseded'))`。
  - `snapshot`: `jsonb` NOT NULL — 全量快照数据，Payload 结构包含：
    ```json
    {
      "unicode_char": "ກ",
      "classification": "consonant",
      "subtype": "cons_middle",
      "ipa_phonetic": "/k/",
      "description": "中辅音 ກ (Ko)",
      "sort_order": 1,
      "no_audio": false,
      "audio_input_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
    ```
  - `created_by_operator_id`: `uuid` NULL — 经办人 Operator ID。
  - `created_at`: `timestamptz` NOT NULL DEFAULT `now()`。
  - `published_at`: `timestamptz` NULL — 正式发布时间（仅 `published` 状态非空）。
  - `supersedes_revision_id`: `bigint` NULL REFERENCES `content.content_revisions(id)` — 所取代的前序版本。
- **Database Constraints**:
  - `UNIQUE (entity_type, entity_id, revision_number)`
  - `CREATE UNIQUE INDEX uq_content_revisions_current_published ON content.content_revisions(entity_type, entity_id) WHERE status = 'published'`

---

### 4. Audio Slot (`audio.audio_slots`)
- **Authority**: `database/migrations/0600_audio.sql`
- **Fields**:
  - `id`: `uuid` PRIMARY KEY — 槽位 UUID。
  - `source_domain`: `varchar` NOT NULL CHECK (`source_domain = 'content'`)。
  - `content_entity_type`: `varchar` NOT NULL — `'lo_letter'`。
  - `content_entity_id`: `uuid` NOT NULL — 对应 `content.contents.public_id`。
  - `language_code`: `varchar` NOT NULL — `'lo'`。
  - `audio_role`: `varchar` NOT NULL — `'pronunciation'`。
  - `required_content_revision_id`: `uuid` NOT NULL — 目标内容修订版本 UUID。
  - `required_audio_input_hash`: `varchar` NOT NULL — SHA-256 输入哈希。
  - `status`: `varchar(32)` NOT NULL DEFAULT `'active'` — 槽位状态。
  - `official_asset_version_id`: `uuid` NULL — 当前正式生效的音频资产版本 ID（唯一权威指针）。
- **Constraints**:
  - `UNIQUE (source_domain, content_entity_type, content_entity_id, language_code, audio_role)`
