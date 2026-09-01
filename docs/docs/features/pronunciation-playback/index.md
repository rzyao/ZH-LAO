---
feature_id: pronunciation-playback
title: 标准发音与音频播放
portfolio_status: active
domain:
- learning
- content
- audio
- identity
mobile_pages: []
admin_pages: []
delivery_evidence:
- /development/05-content/CONTENT_API.md
- /development/05-content/CONTENT_PUBLIC_CONTRACTS.md
- /development/07-audio/AUDIO_PUBLIC_CONTRACTS.md
- /development/07-audio/AUDIO_DESIGN_AUDIT.md
---

# 标准发音与音频播放

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 learner/runtime **读取并播放标准发音 / 官方音频**。它是音频消费能力，不是 Audio Production：不创建生产 Task，不选择 TTS provider / model / voice，不执行录音、审核、发布，也不拥有官方指针或 freshness 状态。
