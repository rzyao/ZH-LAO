---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Asset Delivery Contract

## Ownership

Physical object metadata is canonically owned by Asset Infrastructure. Audio owns the business association, production provenance, review state, immutable logical version and current-public selection. Audio must not clone storage-provider/bucket/object metadata as a second canonical store.

## Object keys

Temporary private production objects:

`temp/audio/{yyyy}/{mm}/{uuid}/...`

Immutable public objects:

`audio/{locale}/{entry_id}/v{n}/{content_hash}.{ext}`

A published object is never overwritten in place. Text/revision changes produce a new immutable object/version and only then advance the current DB pointer.

## Cache

- index/current-pointer responses: `max-age=60` target;
- versioned immutable files: `public,max-age=31536000,immutable`;
- purge is exceptional and reserved for legal/security/incorrect-publication cases.

## TLS/origin fallback

Custom origin -> Supabase/object-storage connectivity requires TLS 1.2+. If a custom origin cannot satisfy the required deep-path/TLS behavior, delivery falls back to the documented public origin rather than weakening TLS or inventing an unsafe proxy.

## Failure behavior

Missing object, checksum mismatch, failed HEAD/read validation or CDN/origin failure must not silently publish a broken pointer. Runtime should fail closed for publish and surface an observable retry/remediation state.