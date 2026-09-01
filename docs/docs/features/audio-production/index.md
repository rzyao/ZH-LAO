---
feature_id: audio-production
title: 音频生产
portfolio_status: active
domain:
- audio
dependencies:
- content
- operations
- asset
mobile_pages: []
admin_pages:
- admin-audio-production
delivery_evidence:
- /domains/audio/production
- /domains/audio/contracts
- AUDIO_DESIGN_RECOVERY_BRIEF.md
- AUDIO_DESIGN_AUDIT.md
delivery_notes:
- 等待 CONTENT_GATE 完成
- 等待后端实现证据
- 处于管理后台设计与工作台规格制定阶段
---

# 音频生产

## 1. 功能概览

音频生产负责将内容系统提出的规范音频需求转换为可追溯的生产流程：

```
音频需求
 ↓
音频生产任务
 ↓
TTS生成 / 人工录音
 ↓
音频版本
 ↓
审核
 ↓
正式发布
```

负责：

- 音频生产控制
- 音频任务生命周期
- 音频版本管理
- 审核与发布

不负责：

- 内容规范文本事实
- 发音规范事实
- TTS供应商内部模型事实
- 存储基础设施事实
- 学习端音频消费能力

---

## 2. 生命周期状态

|阶段|状态|说明|
|-|-|-|
|产品定义|完成|Feature 已定义|
|领域设计|完成|AUDIO_DESIGN_GATE 已通过|
|数据库契约|完成|0600_audio.sql 已冻结|
|后端实现|阻塞|等待 CONTENT_GATE|
|管理后台设计|进行中|设计阶段|
|移动端|不适用|不属于生产能力|
|系统集成|阻塞|等待实现证据|
|验收|待开始|等待集成完成|

---

## 3. 核心能力

- 音频需求管理
- 音频生产任务管理
- TTS生成任务管理
- 人工录音流程管理
- 音频版本管理
- 音频审核
- 音频发布

---

## 4. 参与角色

|角色|职责|
|-|-|
|内容人员|提出音频需求|
|音频生产人员|执行生产、提交版本|
|审核人员|审核音频质量|
|发布人员|发布正式音频|
|音频管理员|配置、权限、异常处理|
|系统任务服务|执行自动任务|

---

## 5. 责任边界

音频生产拥有：

```
生产任务
生成记录
人工录音提交
音频版本
审核结果
发布结果
```

不拥有：

```
内容规范文本
发音规范
TTS模型配置
对象存储物理信息
学习播放能力
```

---

## 6. 架构关系

```
内容系统
    |
    v
音频生产
    |
    +---- TTS生成
    |
    +---- 人工录音
    |
    v
音频版本
    |
    v
审核
    |
    v
正式音频引用
```

---

# 7. 生命周期状态机（带权限约束）

音频生产不存在单一状态机。

系统由三个实体状态机和一个权限决策层组成：

1. 生产任务生命周期
2. 音频版本生命周期
3. 正式音频引用生命周期
4. 权限转换规则

状态转换必须满足：

```
角色
 +
权限动作
 +
当前状态
 +
目标状态
```

---

## 7.1 生产任务状态机

实体：

```
audio_production_task
```

状态：

```
草稿
 |
 | 创建音频任务
 |
 v
待生产
 |
 | 分配任务
 |
 v
已分配
 |
 | 开始生产
 |
 v
生产中
 |
 +--------------+
 |              |
成功           失败
 |              |
 v              v
已完成         失败
                 |
                 | 重试
                 v
               生产中
```

权限：

|转换|权限|
|-|-|
|草稿→待生产|音频创建权限|
|待生产→已分配|任务分配权限|
|已分配→生产中|生产执行权限|
|失败→生产中|重试权限|

---

## 7.2 音频版本状态机

实体：

```
audio_version
```

状态：

```
创建
 |
 v
候选版本
 |
 | 提交审核
 v
审核中
 |
 +-------------+
 |             |
通过          拒绝
 |             |
 v             v
已批准       已拒绝
 |
 | 发布
 v
已发布
 |
 | 新版本替换
 v
已替代
```

权限：

|操作|角色|
|-|-|
|创建候选版本|音频生产人员|
|审核|审核人员|
|批准|审核人员|
|发布|发布人员|
|替换/回滚|发布人员或管理员|

---

## 7.3 正式音频引用状态机

实体：

```
official_audio_binding
```

状态：

```
无正式音频
 |
 | 发布
 v
正式可用
 |
 | 新版本替换
 v
已替换
 |
 | 撤销
 v
无正式音频
```

说明：

音频版本发布后，不直接成为业务事实；业务使用的是正式音频引用。

---

## 7.4 权限模型

核心权限：

```
audio.create
 audio.assign
 audio.generate
 audio.review
 audio.approve
 audio.publish
 audio.rollback
```

禁止跨权限边界：

- 生产人员不能直接发布；
- 审核人员不能修改生产内容；
- 发布人员不能绕过审核生成正式音频。

---

## 8. 证据

设计：

- /domains/audio/production
- /domains/audio/contracts
- AUDIO_DESIGN_RECOVERY_BRIEF.md
- AUDIO_DESIGN_AUDIT.md

后端：

- AUDIO_IMPLEMENTATION_PLAN.md
- AUDIO_PRODUCTION_CONTRACTS.md

后台：

- AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md

---

## 9. Gate 状态

|Gate|状态|
|-|-|
|音频设计 Gate|通过|
|音频实现 Gate|阻塞|
|后台设计 Gate|进行中|
|音频集成 Gate|阻塞|
|音频验收 Gate|待开始|
