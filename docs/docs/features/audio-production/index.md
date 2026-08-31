---
feature_id: audio-production
title: 音频生产
domain:
  - audio
  - content
  - operations
status:
  design: done
  backend: blocked
  admin: active
  mobile: na
  integration: blocked
  acceptance: todo
mobile_pages: []
admin_pages:
  - admin-audio-production
blocks:
  backend: CONTENT_BACKEND_GATE
  integration: AUDIO_BACKEND_GATE + CONTENT_BACKEND_GATE
---

# 音频生产

## 功能概览

运营人员将 Content 的音频生产需求转化为经生产、审核并发布的正式音频版本。

## 设计

状态：done

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Backend

状态：blocked

阻塞原因：CONTENT_BACKEND_GATE

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Admin

状态：active

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Mobile

状态：na

不适用：Mobile 消费正式音频属于学习/内容消费功能，不属于音频生产操作端。

## 集成

状态：blocked

阻塞原因：AUDIO_BACKEND_GATE + CONTENT_BACKEND_GATE

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
