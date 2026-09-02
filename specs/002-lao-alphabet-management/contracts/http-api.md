# Interface Contract: 老挝语字母内容管理 HTTP API

**Feature Branch**: `002-lao-alphabet-management` | **Date**: 2026-09-02 | **Authority**: `specs/002-lao-alphabet-management/spec.md`

所有管理后台端点均挂载在 `/api/v1/admin/content/letters` 下（需 Operator RBAC 认证），C 端公开查询端点挂载在 `/api/v1/content/letters` 下。请求与响应统一采用 `application/json`，键命名采用 `snake_case`，时间字段采用 ISO 8601 UTC 格式。

---

## 1. 管理端：创建字母草稿 (`POST /api/v1/admin/content/letters`)

- **Auth**: 需要后台登录令牌及内容编辑权限（`content:write`）。
- **Headers**:
  - `Content-Type: application/json`
  - `Idempotency-Key`: (推荐) 幂等唯一键
- **Request Body**:
  ```json
  {
    "unicode_char": "ກ",
    "classification": "consonant",
    "subtype": "cons_middle",
    "ipa_phonetic": "/k/",
    "description": "中辅音 ກ (Ko)",
    "sort_order": 1
  }
  ```
- **Validation**:
  - `unicode_char`: 必须为非空老挝文单字符/符号，全局唯一。
  - `classification`: 枚举值 `["consonant", "vowel", "symbol"]`。
  - `subtype`: 必须符合大类对应的子类型枚举（如 `cons_middle` 等）。
  - `ipa_phonetic`: 当 `classification == "symbol"` 时固定为 `"-"`。
  - `sort_order`: 必须为大于等于 0 的整数。
- **Success Response (201 Created)**:
  ```json
  {
    "id": "7a2b9f3e-8c4d-4e5f-9a1b-2c3d4e5f6a7b",
    "unicode_char": "ກ",
    "classification": "consonant",
    "subtype": "cons_middle",
    "sort_order": 1,
    "no_audio": false,
    "online_status": "online",
    "working_revision": {
      "revision_id": "9b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
      "revision_no": 1,
      "status": "draft",
      "ipa_phonetic": "/k/",
      "description": "中辅音 ກ (Ko)",
      "audio_input_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "created_at": "2026-09-02T10:00:00Z"
    },
    "published_revision_id": null
  }
  ```
- **Errors**:
  - `400 VALIDATION_ERROR`: 分类不匹配或字段缺失。
  - `409 UNICODE_CONFLICT`: 该 Unicode 字符已在系统建档。

---

## 2. 管理端：提交审核 (`POST /api/v1/admin/content/letters/:id/revisions/:revId/submit`)

- **Auth**: 需要内容编辑权限（`content:write`）。
- **Success Response (200 OK)**:
  ```json
  {
    "revision_id": "9b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
    "status": "pending_review",
    "submitted_at": "2026-09-02T10:05:00Z"
  }
  ```
- **Errors**:
  - `400 ILLEGAL_STATE_TRANSITION`: 非 Draft 状态无法提交。
  - `409 ACTIVE_WORK_CONFLICT`: 已有处于审核中的版本。

---

## 3. 管理端：审核裁决与正式发布 (`POST /api/v1/admin/content/letters/:id/revisions/:revId/publish`)

- **Auth**: 需要内容审核与发布权限（`content:publish`）。
- **Headers**:
  - `Idempotency-Key`: 幂等键
- **Request Body**:
  ```json
  {
    "action": "publish",
    "remark": "审核通过，准予上线"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "id": "7a2b9f3e-8c4d-4e5f-9a1b-2c3d4e5f6a7b",
    "published_revision_id": "9b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
    "published_at": "2026-09-02T10:10:00Z",
    "status": "published"
  }
  ```
- **Errors**:
  - `400 ILLEGAL_STATE_TRANSITION`: 状态不允许直接发布。
  - `409 OPTIMISTIC_LOCK_CONFLICT`: 版本号冲突。

---

## 4. C 端：获取公开老挝语字母表 (`GET /api/v1/content/letters`)

- **Auth**: 公开访问（Public，可附带可选学习者 Token）。
- **Query Params**:
  - `classification`: (可选) 过滤大类 `consonant` / `vowel` / `symbol`
- **Success Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "7a2b9f3e-8c4d-4e5f-9a1b-2c3d4e5f6a7b",
        "unicode_char": "ກ",
        "classification": "consonant",
        "subtype": "cons_middle",
        "ipa_phonetic": "/k/",
        "name": "中辅音 ກ (Ko)",
        "sort_order": 1,
        "no_audio": false,
        "audio_url": "https://assets.zh-lao.com/audio/lo/pronunciation/7a2b9f3e.mp3"
      },
      {
        "id": "8b3c0a4f-9d5e-5f6a-0b2c-3d4e5f6a7b8c",
        "unicode_char": "່",
        "classification": "symbol",
        "subtype": "symbol_tone",
        "ipa_phonetic": "-",
        "name": "Mai Ek",
        "sort_order": 1,
        "no_audio": true,
        "audio_url": null
      }
    ],
    "total": 68
  }
  ```
- **Security & Guard Rules**:
  - 仅返回 `online_status == 'online'` 且具有合法已发布版本的条目。
  - 严格按 `classification` 分组及 `sort_order ASC` 排序。
  - 若关联音频资产未上线或已 `stale`，`audio_url` 严格返回 `null`。
