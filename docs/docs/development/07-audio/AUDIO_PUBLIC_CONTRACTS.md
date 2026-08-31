---
status: frozen
phase: 7
phase_name: Audio Production Domain
document: AUDIO_PUBLIC_CONTRACTS
design_only: true
implementation_started: false
last_updated: 2026-08-31
---

# ZH-LAO V2 — Audio Public / Cross-Domain Contracts

> Target boundary: `apps/backend/src/modules/audio/public/`. It exposes stable business capability, never repositories/SQL/DB rows.

## 1. Public Types

```ts
type AudioSlotId = string;         // UUID
type AudioTaskId = string;         // UUID
type AudioAssetVersionId = string; // UUID
type AssetId = string;             // Asset Infrastructure logical UUID
type ContentRevisionId = string;   // Content logical UUID

type AudioSourceRef = {
  entityType: 'content' | 'course' | 'lesson' | 'exercise' | 'question';
  entityId: string;
  languageCode: 'zh' | 'lo';
  audioRole: string;
};
```

`sourceDomain` is fixed to `content` in V1 public contract and is not caller-controlled.

## 2. Official Audio Read

```ts
type ResolveOfficialAudioRequest = AudioSourceRef & {
  revisionId?: ContentRevisionId;
};

type OfficialAudioDescriptor = {
  slotId: AudioSlotId;
  assetVersionId: AudioAssetVersionId;
  assetId: AssetId;
  contentRevisionId: ContentRevisionId;
  audioInputHash: string;
  durationMs: number;
  sampleRateHz: number | null;
  channels: number | null;
  fresh: true;
};

type OfficialAudioResolution =
  | { status: 'available'; audio: OfficialAudioDescriptor }
  | { status: 'unavailable'; reason: 'source_unavailable'|'slot_missing'|'slot_offline'|'no_official_asset'|'stale' };

interface AudioPublicQueries {
  resolveOfficialAudio(request: ResolveOfficialAudioRequest): Promise<OfficialAudioResolution>;
}
```

The method must consult Content public capability for current/pinned published revision and never returns `fresh:false` as a playable descriptor.

## 3. Requirement Sync

Content publish/integration may proactively tell Audio to observe the newly published production input, without touching Audio persistence directly:

```ts
type SyncAudioRequirementRequest = AudioSourceRef & {
  revisionId: ContentRevisionId;
};

interface AudioRequirementSync {
  syncRequirement(request: SyncAudioRequirementRequest): Promise<{
    slotId: AudioSlotId;
    requiredContentRevisionId: ContentRevisionId;
    requiredAudioInputHash: string;
    changed: boolean;
  }>;
}
```

Implementation re-resolves the revision through `ContentPublicQueries.validateAudioSource`; caller-provided text/hash is never trusted. This keeps Content as canonical source while Audio owns Slot requirement state.

Requirement sync is safe to call repeatedly for the same revision/hash. It does not auto-create a production Task.

## 4. Consumer Rules

### Content

- may call requirement sync after a published revision changes;
- may call official read for presentation composition if needed;
- may not write Slot/Task/Review/Asset tables or choose official pointer.

### Learning / Runtime

- reads current official audio through `AudioPublicQueries`;
- never queries `audio.*` directly;
- does not own Audio freshness or publish state.

### Operations

Operations authorization/audit is consumed by Audio Admin; Audio public boundary does not export RBAC internals.

### Asset Infrastructure

Audio stores Asset logical UUID only. Public consumers that need a playable signed URL must use the Asset delivery capability with the returned `assetId`; Audio does not expose storage facts.

## 5. Content Dependency Contract

Audio implementation depends on the frozen conceptual capability already defined by Content:

```ts
ContentPublicQueries.validateAudioSource(request)
ContentPublicQueries.resolveRevision(id)
ContentPublicQueries.resolveCurrentPublishedRevision(ref)
```

`validateAudioSource` is authority for entity/revision ownership, published status, language, supported audioRole, text/pronunciation snapshot and deterministic hash material.

No fallback direct SQL is allowed if this implementation capability is missing. Entry audit must stop Audio implementation until Content backend provides it.

## 6. Forbidden Exports

`audio/public` must not export:

```text
Audio repositories
DatabaseExecutor / TransactionManager
SQL / table names
DB row types
worker lease primitives
TTS provider credentials/config
Asset bucket/key/checksum
Operations repositories
mutable internal aggregate objects
```

## 7. No Public Event Requirement V1

No true asynchronous consumer is currently frozen for Audio publication, therefore there is no public Audio event contract in V1 Design. Future reliable events require a versioned owner event contract and shared outbox; `audio_task_events` are not exposed as an event bus.
