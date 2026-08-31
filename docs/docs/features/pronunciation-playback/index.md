---
feature_id: pronunciation-playback
title: 标准发音与音频播放
portfolio_status: active
domain:
  - learning
  - content
  - audio
  - identity
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /development/05-content/CONTENT_API.md
    - /development/05-content/CONTENT_PUBLIC_CONTRACTS.md
    - /development/07-audio/AUDIO_PUBLIC_CONTRACTS.md
    - /development/07-audio/AUDIO_DESIGN_AUDIT.md
---

# 标准发音与音频播放

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 learner/runtime **读取并播放标准发音 / 官方音频**。它是音频消费能力，不是 Audio Production：不创建生产 Task，不选择 TTS provider / model / voice，不执行录音、审核、发布，也不拥有官方指针或 freshness 状态。

## 设计

状态：done

范围：Content 继续拥有 canonical 文本、发音信息与 revision；Audio Production 拥有 Slot / Task / Attempt / AssetVersion / Review、official pointer 与 freshness。Learning / Runtime 需要标准音频时，只能通过 `AudioPublicQueries.resolveOfficialAudio()` 读取 current/pinned published source 对应的 `OfficialAudioDescriptor`；只有 `status=available` 且 `fresh=true` 的官方音频可作为可播放描述，随后用返回的 logical `assetId` 进入 Asset delivery 获取客户端可播放资源。Content knowledge response 可以携带 pronunciation 信息，但不暴露 Audio Slot/Task/storage internals。

Stage / Artifact：[Content HTTP/API Contract](/development/05-content/CONTENT_API.md) 与 [Content Public Contracts](/development/05-content/CONTENT_PUBLIC_CONTRACTS.md) 冻结 Content pronunciation / audio source boundary；[Audio Public Contracts](/development/07-audio/AUDIO_PUBLIC_CONTRACTS.md) 冻结 official-audio resolver 与 Learning/Runtime consumer rule；[Audio Design Audit](/development/07-audio/AUDIO_DESIGN_AUDIT.md) 完成 recovery audit。

Gate / Evidence：[Content Design Audit](/development/05-content/CONTENT_DESIGN_AUDIT.md) 已记录 `CONTENT_DESIGN_GATE = PASS`；[Audio Design Audit](/development/07-audio/AUDIO_DESIGN_AUDIT.md) 记录 `AUDIO_DESIGN_GATE = PASS`、`AUDIO_IMPLEMENTATION = NOT_STARTED`。因此“标准音频消费设计已冻结”不等于“Audio Production 或本 Feature Backend 已实现”。

下一步：先由 Content / Audio Backend execution 实现 public resolver、official asset resolution 与 Asset delivery integration，再由 Mobile 接入该 client-safe audio source。当前 Mobile 已有 Foundation 级 `useAudioPlayback` 通用播放 hook，但尚无 Learning Tools Feature 接入；该基础设施不能作为本 Feature Mobile done 证据。

## Backend

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Admin

状态：na

不适用：标准发音 / 官方音频的生产与审核后台属于独立 `audio-production` Feature；本 Feature 不复制 Audio Production Admin 责任。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
