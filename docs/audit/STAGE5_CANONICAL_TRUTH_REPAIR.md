# Stage 5 — Canonical Truth Repair

> **目标**：修复已有充分事实证据可确定的 canonical 文档漂移与事实缺口，使 `domains/` 成为 Spec Kit 可可靠读取的完整权威输入。
> **权威优先级链**（Constitution）：Frozen Migration = 已存在物理数据库事实（最高物理权威）；`domains/<domain>/*` = 产品/领域事实权威；`development/0X-*` = 实现轨（DERIVED）。
> **本 Stage 纪律**：只同步冻结迁移的物理事实；不创造新行为；不依据实现代码反向生成产品需求（Identity 修复全程仅引用迁移，未读后端代码）；遇无足够 authority 的事实不猜测，记 `AUTHORITY_GAP` / `REPOSITORY_DRIFT`；Operations RBAC 冲突按要求保留，不裁决。
> **执行日期**：2026-09-02 ｜ **仓库**：`C:\project\ZH-LAO`

| 项 | 值 |
| --- | --- |
| 修复 canonical 文档 | `domains/identity/database.md`、`domains/content/database.md` |
| 降级为 DERIVED 的实现轨文档 | 3 份（`02-identity/IDENTITY_*`） |
| 三方漂移修复表 | `admin_credentials`、`content_revisions`（均达成三方一致） |
| 补充 `-- Source:` 的迁移 | 6 份（1200/1210/1220/1230/1240/1250） |
| 记录 `REPOSITORY_DRIFT` 的迁移 | 2 份（0000、1260） |
| `PROMOTED` 事实 | 2 类（Content revision 实体类型/状态/生命周期；Audio `approval_revoked` 前置条件） |
| `AUTHORITY_GAP` 事实 | 9 项（Learning 4 + Audio 5） |
| `SPEC_CONFLICT` 仍保留 | 1 处（Operations RBAC） |
| 业务代码（`apps/`）改动 | 0 |
| 删除旧文档 / 执行 `/speckit.specify` | 均未执行 |

---

## 1. Identity C1–C6 修复结果（对齐冻结迁移 `0100` / `1220`）

修订文件：`docs/docs/domains/identity/database.md`（frontmatter `last_updated` 更新为 2026-09-02）。**仅同步迁移已冻结的物理类型/约束，未读实现代码、未新增产品行为。**

| # | 事实 | 修复前（canonical 过时） | 修复后（对齐迁移） | 证据 |
| --- | --- | --- | --- | --- |
| C1 | `users.public_id` | `varchar(32)`，生成格式待定 | `uuid` NOT NULL UNIQUE | `0100_identity.sql:7` |
| C2 | `basic_profiles.avatar_media_id` | `bigint`，FK 目标尚未冻结 | `uuid`（Media/Asset logical UUID，无跨域 FK，D-152） | `0100_identity.sql:37` |
| C3 | `otp_challenges.consumed_at` | 存在该列（成功消费时间） | **列移除**，改用 `status` + `verified_at`（时间约束强一致） | `1220:4-21`（无 consumed_at） |
| C4 | `otp_challenges.status` | 章节标「frozen table / designing types」 | `varchar(16)` DEFAULT `pending` CHECK `pending/verified/expired/cancelled/locked` | `1220:10-11` |
| C5 | `devices.installation_id` / `platform` | 类型、唯一范围 / CHECK 均 `designing` | `installation_id uuid NOT NULL UNIQUE`；`platform varchar(16)` CHECK `android/ios` | `1220:34-35` |
| C6 | `sessions.status` / `device_id` | `designing` / 可空性未定 | `status varchar(16)` DEFAULT `active` CHECK `active/revoked/expired`；`device_id bigint` FK→`devices(id)`（可空） | `1220:52-55` |

附带对齐（同属迁移已冻结、canonical 此前 `designing` 的字段）：`otp_challenges` 全表（`phone_number/purpose/code_hash/attempt_count/max_attempts/expires_at/verified_at/created_at`）、`sessions` 全表（含新增 `revocation_reason`）、`devices` 全表（含新增 `first_seen_at/revoked_at/updated_at`）、`auth_identities` 的 `idx_auth_identities_user_id` 索引（迁移已建）。`users.updated_at` 保留「维护机制由实现阶段决定」注释（列已冻结，不涉及事实冲突）。

**验证**：修复后 `grep -c "designing" domains/identity/database.md` = **0**（无残留 designing/TBD）。

---

## 2. `admin_credentials` 三方对账结果

| 来源 | 修复前 | 修复后 |
| --- | --- | --- |
| 迁移 `1260_admin_credentials.sql` | 存在（frozen：`id/user_id/username/password_hash/created_at/updated_at`，scrypt hash） | 存在（不变，未回滚） |
| canonical `domains/identity/database.md` | **缺失**（全文 0 处） | **新增** `## admin_credentials — frozen` 段（字段级规格对齐 1260）+ 关系总览补 `users 1─1 admin_credentials` |
| `expected-schema.json`（identity 列表） | **缺失** | **新增** `"admin_credentials"` |

**结论**：三方现已一致（迁移 ⊇ canonical ⊇ expected-schema）。修复方向严格遵循「迁移为物理事实，不回滚迁移；补齐 canonical 文档 + 同步 schema 检查基准」。

---

## 3. `content_revisions` 三方对账结果

| 来源 | 修复前 | 修复后 |
| --- | --- | --- |
| 迁移 `1240_content_revision.sql` | 存在（frozen：`revision_public_id/entity_type/entity_id/revision_number/status/snapshot/...`） | 存在（不变） |
| `expected-schema.json`（content 列表） | 存在（含 `content_revisions`） | 存在（不变） |
| canonical `domains/content/database.md` | **缺失**：31 张表清单未收录（仅在 prose 提及） | **新增** `### Revision（1 张）` 段（字段级规格对齐 1240，含 `entity_type` CHECK 枚举、`status` draft/published/superseded、时间约束、索引）；总表数 31→**32** |

**结论**：三方现已一致。canonical 此前缺表、迁移与 schema 检查已收录——补齐 canonical 文档后达成三方一致。

---

## 4. Migration `-- Source:` 修复结果

对 Stage 1 确认的「8 个无 Source 注释的迁移」逐一判定（注：`0400/0500/0700` 已有 `-- Sources:`（复数）注释，视为已声明来源，未改动）：

| 迁移 | 处理 | 补充的 Source / 漂移原因 |
| --- | --- | --- |
| `1200_asset_infrastructure` | 补充 `-- Source:` | `docs/docs/domains/platform/database.md`（Platform Infrastructure 边界，doc 明列 Asset Infra） |
| `1210_trust_evidence` | 补充 `-- Source:` | `docs/docs/domains/trust/database.md`（doc 第 216 行起完整定义 `moderation_evidence`） |
| `1220_identity_auth_runtime` | 补充 `-- Source:` | `docs/docs/domains/identity/database.md`（已修复的 canonical） |
| `1230_system_outbox` | 补充 `-- Source:` | `docs/docs/domains/platform/database.md`（doc 第 705/733/755 行定义 `system_outbox_events`） |
| `1240_content_revision` | 补充 `-- Source:` | `docs/docs/domains/content/database.md`（已补齐 content_revisions） |
| `1250_platform_override_indexes` | 补充 `-- Source:` | `docs/docs/domains/platform/database.md`（迁移自身注释即声明「match frozen platform/database.md」） |
| `0000_infrastructure` | **REPOSITORY_DRIFT** | `CREATE EXTENSION pg_trgm`；`architecture/data/postgresql.md` 未提及 extension/pg_trgm，无明确 canonical authority，**不猜测** |
| `1260_admin_credentials` | **REPOSITORY_DRIFT** | `admin_credentials` 在被本 Stage 补齐前 `domains/` 全文缺失（即漂移本身），无既存 canonical authority 可溯，**不猜测** |

> 仅补充注释元数据（不改 DDL）；迁移物理契约未回滚。6 份已补 Source，2 份记 `REPOSITORY_DRIFT` 待人工确认来源。

---

## 5. Identity 3 份 development 文档最终状态

|C1–C6 冲突解除后，3 份文档由 `SPEC_CONFLICT` → `DERIVED`。|

| 文档 | 原裁决（Stage 4） | 现裁决 | `derived_from` | 解除依据 |
| --- | --- | --- | --- | --- |
| `development/02-identity/IDENTITY_API.md` | `SPEC_CONFLICT` | `DERIVED` | `domains/identity/database.md` | 文档已陈述 `public_id UUID`/`avatar_media_id UUID`/`installation_id UUID`/`sessions status active/revoked/expired`/`otp status verified/locked`，与修复后 canonical 一致 |
| `development/02-identity/IDENTITY_IMPLEMENTATION_PLAN.md` | `SPEC_CONFLICT` | `DERIVED` | `domains/identity/database.md` | 同上；且文档显式声明「旧 `consumed_at` 已被物理契约取代」（L102/109/326），与 C3 移除一致 |
| `development/02-identity/IDENTITY_USE_CASES.md` | `SPEC_CONFLICT` | `DERIVED` | `domains/identity/database.md` | 同上（`public_id UUID` L53、`installation_id UUID` L72、`status=revoked` L860 等） |

**验证**：3 份均写入 `derived_from:` + 「派生文档（DERIVED）」横幅；frontmatter 格式与 Stage 4 的 31 份 DERIVED 一致。Identity 域 `SPEC_CONFLICT` 由 3 降为 **0**。

---

## 6. Content / Learning / Audio Promote 候选逐项裁决

原则（要求 III）：**A.** 有 accepted/frozen authority（冻结迁移或 canonical 文档）支持 → `PROMOTED`；**B.** 仅存在于实现轨、无更高 authority → `AUTHORITY_GAP`，**不提升**（禁止因「实现轨写了」即升级为产品事实）。

### Content
| 候选 | 裁决 | authority 依据 |
| --- | --- | --- |
| revision 实体类型（`content/course/lesson/exercise/question/translation`） | **PROMOTED** | 冻结迁移 `1240:9` CHECK 枚举；已写入 canonical `content_revisions` 段 |
| revision 生命周期（`status draft/published/superseded` + `supersedes_revision_id` + 时间约束） | **PROMOTED** | 冻结迁移 `1240` 物理契约；已写入 canonical |

### Learning
| 候选 | 裁决 | authority 依据 |
| --- | --- | --- |
| 掌握度阈值 `0/40/80` | **AUTHORITY_GAP** | 仅实现轨；canonical `progress.md:22` 明示「状态阈值由配置决定，不写死在表中」；迁移 `0500` 仅冻结 `mastery_score 0..100` 与状态枚举，未固定 0/40/80 |
| 复习增量 `-20/+5/+15/+25` | **AUTHORITY_GAP** | 仅实现轨，无 frozen/canonical authority |
| 留存窗口 `180d/500` | **AUTHORITY_GAP** | 仅实现轨 |
| 限流 `10/min·200/day` | **AUTHORITY_GAP** | 仅实现轨 |

### Audio
| 候选 | 裁决 | authority 依据 |
| --- | --- | --- |
| hash 算法 `audio-input-v1` + SHA-256 | **AUTHORITY_GAP** | canonical `domains/audio/*` 全文未提及；仅实现轨 |
| `content_entity_type` 允许枚举值 | **AUTHORITY_GAP** | 列存在于 canonical/migration（`varchar NOT NULL`），但**枚举值**未被任何 CHECK/frozen authority 约束，仅实现轨描述 |
| `language_code` 允许枚举值 | **AUTHORITY_GAP** | 同上（列存在，枚举值无 frozen authority） |
| V1 无四眼复核 | **AUTHORITY_GAP** | canonical 未声明该流程范围；仅实现轨 |
| 发布时新鲜度重校验 | **AUTHORITY_GAP** | canonical 未声明；仅实现轨 |
| `approval_revoked` 精确前置条件 | **PROMOTED** | canonical 已覆盖：`database.md:199`（`decision=approval_revoked → remark NOT NULL`）、`:202`（主要用于正式发布前）；`lifecycle.md:18`；`production.md:192` |

> `AUTHORITY_GAP` 共 9 项（Learning 4 + Audio 5）保持实现轨，待人工以 accepted/frozen authority 确认后提升；本 Stage 未自行升级为产品事实。

---

## 7. Operations RBAC 保留冲突状态

**未修改**，保持 `SPEC_CONFLICT`（Stage 4 §5.2）：

- canonical `domains/operations/database.md`：`role_permissions.grant` / `role_permissions.revoke`（L283/311/359）。
- 实现轨 `OPERATIONS_RBAC_CONTRACTS.md` + 代码 `permissions.ts:5`：`role_permissions.read` / `role_permissions.set`。
- 裁决：**代码使用 `set`/`read` 仅作为 Engineering Reality，不能作为 Product Authority**。动作键命名属产品/契约事实，依要求保留 `SPEC_CONFLICT`，交人工二选一（建议对齐代码改 canonical 为 `set`/`read`）。本 Stage 未触碰 Operations RBAC。

---

## 8. 最终 Schema 一致性

| 域 | 表数（三方） | 迁移 | canonical `domains/*` | `expected-schema.json` | 一致性 |
| --- | --- | --- | --- | --- | --- |
| identity | 8 | ✓（0100/1220/1260） | ✓（修复后含 `admin_credentials`） | ✓（修复后含 `admin_credentials`） | **一致** |
| content | 32 | ✓（含 `content_revisions`） | ✓（修复后含 `content_revisions`） | ✓（本就含） | **一致** |

- **Identity 残留 designing/TBD**：修复后 `grep -c "designing" = 0`。
- **新事实重复**：无。canonical 拥有事实，DERIVED 文档仅引用（`derived_from`），未重复改写（`content_revisions` 字段规格仅 canonical 一份；`admin_credentials` 实现轨 3 份 IDENTITY 文档未覆盖该表，无重复）。
- 其他域（`learning/audio/...`）的 `designing` 字段为合法未冻结项，非「迁移已冻结但文档仍 designing」情形（Stage 1 仅标记 `admin_credentials`/`content_revisions` 两张表级漂移，均已修复）。

---

## 9. Git Diff

`git diff --stat`（Stage 5 直接改动，12 文件，+115 / −58）：

```
 database/checks/expected-schema.json               |   2 +-
 database/migrations/1200_asset_infrastructure.sql  |   1 +
 database/migrations/1210_trust_evidence.sql        |   1 +
 database/migrations/1220_identity_auth_runtime.sql |   1 +
 database/migrations/1230_system_outbox.sql         |   1 +
 database/migrations/1240_content_revision.sql      |   1 +
 database/migrations/1250_platform_override_indexes.sql | 1 +
 docs/docs/development/02-identity/IDENTITY_API.md  |   4 +-
 docs/docs/development/02-identity/IDENTITY_IMPLEMENTATION_PLAN.md | 4 +-
 docs/docs/development/02-identity/IDENTITY_USE_CASES.md | 4 +-
 docs/docs/domains/content/database.md              |  22 +++-
 docs/docs/domains/identity/database.md             | 131 ++++++++++++---------
 12 files changed, 115 insertions(+), 58 deletions(-)
```

> 迁移改动均为新增 `-- Source:` 注释行（DDL 不变）；`expected-schema.json` 为 identity 列表新增 `admin_credentials`；其余为 canonical 文档字段对齐与 DERIVED 横幅。

---

## 10. Git Status

`git status --short`（Stage 5 范围）：

```
 M database/checks/expected-schema.json
 M database/migrations/1200_asset_infrastructure.sql
 M database/migrations/1210_trust_evidence.sql
 M database/migrations/1220_identity_auth_runtime.sql
 M database/migrations/1230_system_outbox.sql
 M database/migrations/1240_content_revision.sql
 M database/migrations/1250_platform_override_indexes.sql
 M docs/docs/development/02-identity/IDENTITY_API.md
 M docs/docs/development/02-identity/IDENTITY_IMPLEMENTATION_PLAN.md
 M docs/docs/development/02-identity/IDENTITY_USE_CASES.md
 M docs/docs/domains/content/database.md
 M docs/docs/domains/identity/database.md
```

`git status --short | grep -c "^.M apps/"` = **0**（业务代码零改动）。

---

## 11. 约束遵守与未处理项（对应要求 V）

| 要求 | 处理 |
| --- | --- |
| 业务代码 | 未修改（`apps/` 0 改动） |
| 产品需求语义 | 未改写；仅同步冻结迁移物理事实、补 canonical 缺口 |
| `/speckit.specify` | 未执行 |
| CNT-* 55 IDs | 未处理（留给后续 Stage） |
| 旧 Executable Spec 删除 | 未删除（`development/specs/` 原样保留） |
| `check_executable_specs.py` 删除 | 未删除（脚本原样保留） |
| 批量删除旧文档 | 未执行 |
| Operations RBAC 裁决 | 未裁决，保留 `SPEC_CONFLICT` |
| 无 authority 事实 | 未猜测；9 项 `AUTHORITY_GAP` + 2 项 `REPOSITORY_DRIFT` 记录待人工确认 |

---

## 12. 结论与待人工裁决项

- **已完成**：Identity canonical 对齐冻结迁移（C1–C6 + 全表 designing 清零）；Identity 3 份 `SPEC_CONFLICT` 解除并降为 `DERIVED`；`admin_credentials` 与 `content_revisions` 三方漂移修复一致；6 份迁移补 Source、2 份记 `REPOSITORY_DRIFT`；Content revision + Audio `approval_revoked` 提升为 canonical（PROMOTED）。
- **待人工裁决（未猜测）**：
  1. Operations `role_permissions` 动作键 `grant`/`revoke`（canonical）vs `set`/`read`（代码+实现轨）——建议对齐代码改 canonical。
  2. `REPOSITORY_DRIFT`：`0000_infrastructure`（pg_trgm 来源）、`1260_admin_credentials`（后台登录凭据来源）——确认 canonical authority 后补 Source 或保留。
  3. `AUTHORITY_GAP`（9 项）：Learning 阈值/增量/留存/限流 + Audio hash/枚举值/四眼/新鲜度——需 accepted/frozen authority 背书后方可 promote。
- **STOP**：按用户要求，Stage 5 到此结束，未迁移、未删文档、未执行 `/speckit.specify`、未改业务代码。

---

*本文件为 Stage 5 产物。记录修复与裁决，不构成对产品需求、架构决策或业务代码的未授权修改。*
