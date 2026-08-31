---
dependencies:
- content
- operations
- asset
domain:
  primary: audio
feature_id: audio-production
portfolio_status: active
status:
  acceptance: todo
  admin: active
  backend: blocked
  design: done
  integration: blocked
  mobile: na
title: 音频生产
---

# 音频生产

## 1. 功能概览

Audio Production 负责将 Content 的规范音频需求转换为可追溯的生产链：

    音频生产需求
        ↓
    Audio Slot
        ↓
    Production Task
        ↓
    TTS / 人工录音
        ↓
    Audio Version
        ↓
    Review
        ↓
    Published Audio

本 Feature 负责： - 音频生产控制面 - 音频任务生命周期 - 音频版本管理 -
审核与发布

不负责： - Content canonical text - pronunciation fact - TTS Provider
内部模型事实 - Asset Infrastructure 物理存储事实 - Learning / Mobile
音频消费能力

------------------------------------------------------------------------

## 2. Lifecycle Status

  生命周期                 状态      说明
  ------------------------ --------- ------------------------
  产品定义                 ✅        Feature 已定义
  Canonical Design         ✅        AUDIO_DESIGN_GATE PASS
  Database Contract        ✅        0600_audio.sql 冻结
  Backend Implementation   BLOCKED   等待 CONTENT_GATE
  Admin Design             ACTIVE    Admin Design Stage
  Mobile                   N/A       不属于生产 Feature
  Integration              BLOCKED   等待实现
  Acceptance               TODO      等待验收证据

------------------------------------------------------------------------

## 3. Capability

-   音频需求管理
-   Audio Slot 管理
-   Production Task
-   TTS Generation Attempt
-   Human Recording Task
-   Audio Version 管理
-   Review
-   Publish
-   批量生产与运营管理

------------------------------------------------------------------------

## 4. Actors

  Actor                  责任
  ---------------------- ------------------
  Content                提供规范内容需求
  Audio Operator         执行生产和审核
  Operations             权限和审计
  TTS Provider           提供生成能力
  Asset Infrastructure   提供资产能力
  Worker                 执行异步任务

------------------------------------------------------------------------

## 5. Scope Boundary

Audio Production Owns:

    Audio Slot
    Audio Task
    TTS Generation Attempt
    Human Recording Submission
    Audio Version
    Review
    Publish Result

不拥有：

    Content canonical text
    pronunciation

    TTS provider/model/voice/preset

    Asset bucket/object key

    Learning playback

------------------------------------------------------------------------

## 6. Architecture

    Content
     |
     v
    Audio Production
     |
     +---- TTS Provider
     |
     +---- Human Recording
     |
     v
    Asset Infrastructure
     |
     v
    Audio Version
     |
     v
    Review
     |
     v
    Publish
     |
     v
    Learning Consumption

------------------------------------------------------------------------

## 7. Lifecycle State Machine

    Draft
     ↓
    Created
     ↓
    Assigned
     ↓
    Generating
     ↓
    Generated
     ↓
    Reviewing
     ↓
    Approved
     ↓
    Published

失败流程：

    Generating
     ↓
    Failed
     ↓
    Retry

------------------------------------------------------------------------

## 8. Implementation Status

### Backend

状态：

    BLOCKED

目标模块：

    apps/backend/src/modules/audio/

当前：

-   Design Complete
-   Implementation Not Started
-   等待 CONTENT_GATE

------------------------------------------------------------------------

### Admin

状态：

    ACTIVE

负责：

-   任务队列
-   TTS入口
-   人工录音入口
-   审核
-   发布

当前阶段：

    AUDIO-PRODUCTION-ADMIN-DESIGN

尚未进入 Implementation。

------------------------------------------------------------------------

### Mobile

状态：

    N/A

原因：

Audio Production 不面向普通用户。

------------------------------------------------------------------------

### Integration

状态：

    BLOCKED

链路：

    Content Requirement
     ↓
    Audio Task
     ↓
    TTS/Human Recording
     ↓
    Asset
     ↓
    Audio Version
     ↓
    Review
     ↓
    Publish
     ↓
    Admin

------------------------------------------------------------------------

## 9. Evidence

Design:

-   /domains/audio/production
-   /domains/audio/contracts
-   AUDIO_DESIGN_RECOVERY_BRIEF.md
-   AUDIO_DESIGN_AUDIT.md

Backend:

-   AUDIO_IMPLEMENTATION_PLAN.md
-   AUDIO_PRODUCTION_CONTRACTS.md

Admin:

-   AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md

------------------------------------------------------------------------

## 10. Gate Summary

  Gate                        Status
  --------------------------- ---------
  AUDIO_DESIGN_GATE           PASS
  AUDIO_IMPLEMENTATION_GATE   BLOCKED
  AUDIO_ADMIN_DESIGN_GATE     ACTIVE
  AUDIO_INTEGRATION_GATE      BLOCKED
  AUDIO_ACCEPTANCE_GATE       TODO

------------------------------------------------------------------------

## 11. Next Action

1.  等待 CONTENT_GATE 完成；
2.  执行 Audio Implementation Entry Audit；
3.  实现 Backend；
4.  完成 Admin Design Gate；
5.  建立 Integration Evidence；
6.  进入 Acceptance。

禁止：

-   用 Design PASS 推导 Implementation 完成；
-   用 Migration 存在推导 Backend 完成；
-   用 Admin Design 推导 Admin Implementation 完成。
