# V2 frozen physical contracts

This file records the implementation decisions used to close the physical
specification gaps identified by the 2026-08-30 baseline. It is scoped to the
database baseline and does not alter Domain ownership or start application
migration.

## Asset / Media Infrastructure

- Schema: `infrastructure`; table: `assets`.
- `assets.id` is the UUID logical/public ID and the only canonical owner of
  storage provider, bucket, object key, MIME, byte size, checksum, lifecycle,
  and generic media metadata.
- Lifecycle is `pending`, `ready`, `deleted`, or `failed`. Logical deletion is
  represented by `deleted_at`; no business relationship cascades to this table.
- Business schemas store only `asset_id UUID` logical references and create no
  physical FK to `infrastructure.assets`.

## Trust evidence

- `trust.moderation_evidence` remains Trust-owned.
- File evidence stores nullable `asset_id UUID`; `storage_key` is absent.
- Text, media, object-reference, and metadata evidence payloads are guarded by
  CHECK constraints. The Trust table retains case, appeal, capture, actor, and
  evidence semantics; Asset owns the file facts.

## Identity runtime

- OTP stores `phone_number`, purpose, `code_hash`, lifecycle status, attempt
  counters, expiry, and verification time. Raw OTP values are never stored.
- Sessions store a unique `refresh_token_hash`, optional device FK, lifecycle
  status, expiry, last activity, and revocation reason. Raw tokens are never
  stored.
- Devices use an app `installation_id UUID`, user FK, platform, app/device
  metadata, optional push token, first/last seen timestamps, and revocation.
- Sessions and devices are Identity-owned and use real same-schema FKs.

## Transactional outbox

- The single table is `infrastructure.system_outbox_events`.
- `event_id` and `aggregate_id` are UUID logical IDs; there are no Domain FKs.
- `payload` and `headers` are JSONB objects. Publishers scan the partial index
  over `available_at, created_at` where `published_at IS NULL`.
- Published rows are retained for bounded operational retention; this baseline
  does not implement an archive worker.

## Content revisions

- `content.content_revisions` is a unified revision table for the frozen
  Content entity types (`content`, `course`, `lesson`, `exercise`, `question`,
  `translation`).
- `entity_id UUID` is a Content logical ID; polymorphism is intentional and no
  physical FK is used. `revision_number` is positive and unique per entity.
- Status is `draft`, `published`, or `superseded`; a partial unique index
  permits one current published revision per entity.
- Revision content is an immutable JSONB snapshot. The canonical current data
  remains in the structured Content tables. Operator attribution is a UUID
  logical reference without a cross-domain FK.
