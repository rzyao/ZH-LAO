# Change Log: 内容管理音频播放列

## CR-001: 补充 Asset 安全交付公开契约与实现 — 2026-09-05

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Priority** | Must Have |
| **Requested at phase** | Plan pre-flight |
| **Rationale** | 技术预检确认现有 Audio 只有生产与正式指针，无法安全向管理端交付可播放内容。用户明确授权补充公开契约与实现。 |
| **Impact** | 6 artifacts, +5 planned tasks, medium effort |
| **Phase rollback** | No; Product Spec is amended and Plan starts with the new public boundary. |

### Artifacts Modified

| Artifact | Change Type | Description |
|----------|:----------:|-------------|
| `contracts/asset/ASSET_DELIVERY_PUBLIC_CONTRACTS.md` | Added | Shared Asset secure delivery public contract |
| `contracts/audio/AUDIO_PUBLIC_CONTRACTS.md` | Modified | Links Audio consumers to the Asset delivery owner contract |
| `architecture/infrastructure/index.md` | Modified | Registers the shared delivery boundary without choosing a provider |
| `governance/design-register.md` | Modified | Adds D-175 baseline decision |
| `product-spec/product-spec.md` | Modified | Grounds FR-010 and FR-011 in the new contract |
| `.forge-status.yml` | Modified | Records this accepted scope change |

### Decision Notes

The contract exposes only a short-lived opaque descriptor. The eventual storage adapter remains provider-neutral and must fail closed when unavailable.

## CR-002: 冻结 Cloudflare R2 为对象存储 Provider — 2026-09-05

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Priority** | Must Have |
| **Requested at phase** | Implementation |
| **Rationale** | 用户明确选择 Cloudflare R2，使用其 S3-compatible API 交付已审核的正式音频。 |
| **Impact** | 5 artifacts, +3 planned tasks, low effort |
| **Phase rollback** | No; R2 remains behind the shared Object Storage Port. |

The R2 endpoint, bucket, credentials, and object key remain infrastructure-only. Client responses keep using the Asset public contract's short-lived opaque URL.
