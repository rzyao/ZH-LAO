---
status: baseline
last_updated: 2026-09-05
document: ASSET_DELIVERY_PUBLIC_CONTRACTS
owner: Shared Asset Infrastructure
---

# Asset Delivery Public Contracts

Asset Infrastructure is the sole owner of physical file metadata and delivery mechanics. Business domains hold only `asset_id`; they never construct, persist, or expose provider, bucket, object key, checksum, or a permanent storage URL.

## Client-safe read descriptor

An already-authorized consumer may request a delivery descriptor for one logical asset:

```ts
type AssetId = string; // UUID
type ResolveAssetReadRequest = { assetId: AssetId; purpose: 'audio_playback' };
type ClientSafeAssetRead = { url: string; expiresAt: string; contentType: `audio/${string}` };
type AssetReadResolution = { status: 'available'; asset: ClientSafeAssetRead } | { status: 'unavailable' };
interface AssetDeliveryPublicQueries {
  resolveClientSafeRead(request: ResolveAssetReadRequest): Promise<AssetReadResolution>;
}
```

## Rules

- The caller owns business authorization. For Content Admin audio, the list route first verifies `content.<resource>.read`, then Audio verifies official/fresh status.
- Asset Delivery verifies technical availability only. It returns `unavailable` for a missing, deleted, failed, non-ready, unsupported, or undeliverable asset.
- `url` is short-lived and opaque. Signing, streaming/proxy, range handling, provider selection, and object lookup remain Asset Infrastructure details.
- `expiresAt` is mandatory. Client code retains the descriptor only in memory for the current playback attempt and requests a replacement after expiry.
- The contract fails closed: unavailable storage yields `unavailable` or a controlled provider error, never a fabricated URL or fallback to stale content.
- The descriptor excludes asset ID, storage provider, bucket, object key, file size, checksum, codec, and all Audio internal identifiers.

## Content–Audio composition

```text
Content Admin permission check
  → AudioPublicQueries.resolveOfficialAudio (official + approved + fresh)
  → AssetDeliveryPublicQueries.resolveClientSafeRead(assetId)
  → client-safe playback descriptor or unavailable
```

Audio owns official/fresh state. Asset owns secure file delivery. Content and Admin only compose these public capabilities; they may not query `audio.*` or Asset repositories directly.

## Production adapter

Production delivery uses Cloudflare R2 through its S3-compatible API. The adapter creates an expiring signed read URL from Asset Infrastructure's canonical storage metadata. R2 account endpoint, access key, secret, bucket and object key remain infrastructure configuration or internal metadata and never appear in this contract's response beyond the opaque `url`.
