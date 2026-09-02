# USER_JOURNEY_RESEARCH：ZH-LAO 用户旅程研究

> **性质**：用户旅程研究 —— 基于 ZH-LAO 既有 frozen 设计文档与代码事实，建立 4 类角色的用户旅程（目标/痛点/工作流/关键任务/失败点）。
> **日期**：2026-09-02
> **方法**：深度读取 Content / Learning / Audio / Operations 域 frozen 文档 + 代码实际实现（content 模块 use-cases、mobile 屏幕）+ 交叉核对 feature 页。
> **角色链路**：内容创作者 → 配音人员 → 音频制作人员 → 普通用户，构成"内容生产 → 发音生产 → 审核发布 → 用户消费"的完整闭环。
> **证据标注**：【设计】= frozen 设计意图；【代码】= 代码实际实现；【缺口】= 设计存在但实现未覆盖；【风险】= 设计/实现中的已知问题。

---

## 零、旅程全景（4 角色闭环）

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                        内容生产（Admin 侧）                                │
│                                                                          │
│  内容创作者                                                               │
│  (Content 域)                                                             │
│  创建/编辑 词条 → 提交审核 → 发布 → 生成 audio_input_hash                   │
│        │                                                                  │
│        ▼  内容变更触发音频需求 (fresh/stale)                               │
│  音频制作人员                                                              │
│  (Audio 域)                                                               │
│  建 Slot → 建 Task → 分配 → [TTS 或人工] → Asset Version → 审核 → 发布      │
│        │                    ▲                                              │
│        ▼              人工录音时                    │                      │
│  配音人员                        │                    │                      │
│  (human_recording)   ───────────┘                    │                      │
│                                                        ▼                    │
│  普通用户                                                   │
│  (Learning 域 + Mobile)                               │                      │
│  学习内容 → 播放发音 → 练习 → 掌握度/复习                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**核心洞察**：这 4 个角色构成一条**端到端内容生产消费链**，其中：
- 内容创作者生产**教学事实**（词条文本/发音要求）
- 音频制作人员与配音人员生产**发音资产**（Audio 域）
- 普通用户消费两者（Learning 域）

**关键纽带**：`audio_input_hash`（内容发音字段哈希）——内容变更 → 触发音频 stale → 重产，把内容创作者与音频制作人员强耦合。

---

## 一、内容创作者（Content Creator）

> 域：Content（+ Operations RBAC）
> 系统：Admin 后台内容管理
> 目标：为学习者生产和维护标准、合规的教学内容（字母/音节/词汇/句子/课程）

### 1.1 用户目标

| 目标 | 优先级 | 说明 |
| --- | --- | --- |
| 创建/编辑语言知识词条（字母/音节/词/句） | 高 | 核心生产物 |
| 维护课程体系（Course→Unit→Lesson→Section→Item） | 高 | 结构组织 |
| 发布内容使学习者可见 | 高 | 上线生效 |
| 保证发音要求正确（规范发音/拼音/声调） | 高 | 直接决定下游音频质量 |
| 内容变更时确保发音音频同步更新 | 中 | 通过 audio_input_hash 联动 |

### 1.2 工作流程（基于代码 use-cases 确认）

```text
创建草稿 (create-character-draft)
  → 更新草稿 (update-character-draft)
  → 提交审核 (submit-character-review)
  → 审核 (review-character)
  → 发布 (publish-character)
  → 派生工作版本 (derive-working-revision)  [后续修改时]
```

- 内容 Revision 状态机：【设计】Draft → Pending Review → Approved → Published → Superseded（B 线草稿）；frozen 版简化为 `draft/published/superseded`。
- Online Status（online/offline/deleted）与审核状态**正交**【设计】：下线不撤销审核，重新上线不重走全量审核。
- 内容发布动作在单事务内原子完成：标记 Published → 更新 `published_revision_id` → 旧版 Superseded → 追加事件【设计】。

### 1.3 关键任务

| 任务 | 触发 | 关键交互 | 成功标准 |
| --- | --- | --- | --- |
| 创建词条草稿 | 新词条 | 填文本/拼音/发音要求/释义 | 草稿生成 |
| 提交审核 | 草稿完成 | 提交 → Pending Review | 进入审核队列 |
| 审核处理 | 待审条目 | 通过/驳回 + remark | 状态流转 |
| 发布内容 | 审核通过 | 原子发布 | C 端可见 |
| 内容修订 | 内容需改 | derive-working-revision → 改 → 再审 | 新版本生效 |
| 校验发音输入 | 每次编辑 | 计算 audio_input_hash | 下游音频 stale 判定 |

### 1.4 用户痛点

| 痛点 | 来源 | 严重度 |
| --- | --- | --- |
| **并发编辑冲突**：同一内容同一时刻只允许一个活动工作版本（Active Work Guard）【设计】——多人协作教研受限 | versioning-review.md 未决项 | 高 |
| **批量发布缺失**：当前单实体独立发布粒度，无"按单元/课程整体发版"（Release Bundle）【设计未决项】 | versioning-review.md UNKNOWN | 高 |
| **审核分级未定**：初审/复审/终审 RBAC 权限矩阵待完善【设计未决项】 | versioning-review.md UNKNOWN | 中 |
| **审核与上线状态双维复杂度**：Review Status 与 Online Status 正交，操作者需理解两套状态 | 设计复杂度 | 中 |
| **Content 域双轨冲突**：B 线草稿（LaoCharacter + VIP）与 A 线 frozen（contents + public_id）并存，字段语义未收敛【风险】 | 前轮考古研究 | 高 |
| **无批量导入/编辑工具**：未见内容批量生产能力的实现证据【缺口】 | 代码核查 | 中 |

### 1.5 失败点

| 失败点 | 后果 | 缓解/设计保障 |
| --- | --- | --- |
| 提交审核时内容有非法挂载（引用了不存在的实体） | 保存失败 | 全量引用有效性校验 + 精准报错【设计】 |
| 并发编辑导致版本分叉 | 内容冲突 | Active Work Guard + lock_version 乐观锁【设计】 |
| 发布后才发现错误 | 已发布版本冻结，需走新版本 | 不可变版本 + 后继修订机制【设计】 |
| 发音字段变更但未重产音频 | 学习者听到陈旧发音 | audio_input_hash stale → 触发重产【设计】 |
| 草稿/待审内容泄露到 C 端 | 学习者看到未发布内容 | C 端可见性守卫（online + published + 依赖已发布）【设计】 |

### 1.6 与下游的衔接

- 内容发布后，通过 `ContentPublicQueries` 提供规范生产输入给 Audio 域【设计】。
- `validateAudioSource` 校验实体/版本归属、发布状态、语言、支持的 audioRole、文本/发音快照【设计】。
- **内容创作者的"发音要求"直接决定音频制作人员的 TTS 输入质量**——这是旅程中最关键的上下游依赖。

---

## 二、配音人员（Voice Actor / 录音人员）

> 域：Audio（human_recording 生产方式）
> 系统：Admin 音频生产工作台
> 目标：为教学词条录制标准发音（老挝语为主），作为 TTS 的兜底或补充

### 2.1 用户目标

| 目标 | 优先级 | 说明 |
| --- | --- | --- |
| 录制符合规范的发音 | 高 | 老挝语/中文词条标准发音 |
| 高效完成分配到的录音任务 | 高 | 批量录制 |
| 录出可一次通过审核的质量 | 中 | 减少返工 |

### 2.2 工作流程（基于 audio 域 human_recording 设计）

```text
被分配录音任务 (Task assigned)
  → 试听/试录（不进入正式历史）
  → 正式录制
  → 提交 → 形成 Asset Version (producer_operator_id, generation_attempt_id = NULL)
  → 进入审核 (pending_review)
```

- **关键设计**：人工录音由管理员主动触发，不是普通用户 UGC 录音流程【设计】。
- 试听和重录阶段**不进入正式生产历史**；只有最终提交才形成 Asset Version【设计】。
- 人工录音产物标记 `producer_operator_id`（录音管理员的 Operations logical UUID），`generation_attempt_id = NULL`（不伪造 TTS Attempt）【设计】。

### 2.3 关键任务

| 任务 | 触发 | 关键交互 | 成功标准 |
| --- | --- | --- | --- |
| 接收录音任务 | Task 分配给我 | 查看待录音列表 | 明确要录什么 |
| 试听文本/规范要求 | 开始录音前 | 查看 text_snapshot + pronunciation_snapshot | 理解发音要点 |
| 录制 | 试听后 | 录制 → 试听 → 重录 | 满意 |
| 提交 | 录制完成 | 最终提交 | 形成 Asset Version |

### 2.4 用户痛点

| 痛点 | 来源 | 严重度 |
| --- | --- | --- |
| **缺乏专门的配音人员界面设计**：Admin 工作台文档只描述"录音管理员的 Operations logical UUID"，无配音人员的专用工作流 UI 设计【缺口】 | admin/audio-production.md | 高 |
| **老挝语发音专业性要求高**：老挝语声调/拼读规则需要专业发音人，招聘与质量控制成本高【风险】 | 市场研究（老挝语 TTS 缺位） | 高 |
| **无录音质量即时反馈**：设计是"提交后审核"，配音人员提交前无法预知能否通过 | 设计 | 中 |
| **批量录音的效率工具缺失**：无批量录音/断句辅助的明确设计【缺口】 | 代码核查 | 中 |

### 2.5 失败点

| 失败点 | 后果 | 缓解/设计保障 |
| --- | --- | --- |
| 录音发音错误 | 审核 rejected | 质量失败 → 旧 Task 结束 + successor Task【设计】 |
| 录音噪音/剪辑问题 | 审核 rejected（reject_reason: noise/clipping） | 8 类 reject reason 精确反馈【设计】 |
| 试听重录未提交 | 不产生历史 | 试听/重录不进正式历史【设计】 |
| 提交后才发现问题 | 需等审核结果 | Review 是唯一质量门【设计】 |

### 2.6 与上下游的衔接

- **上游**：接收内容创作者的 `text_snapshot` + `pronunciation_snapshot`（发音规范）。
- **下游**：提交的 Asset Version 进入音频制作人员的审核流程。
- **角色关系**：配音人员是"TTS 的兜底"——在老挝语 TTS 缺位的市场现实下（前轮市场研究结论），**人工录音是核心生产方式而非补充**。

---

## 三、音频制作人员（Audio Producer / 音频运营）

> 域：Audio（Audio Production）
> 系统：Admin 音频生产工作台
> 目标：编排从"内容发音需求"到"正式发布音频"的完整生产流程

### 3.1 用户目标

| 目标 | 优先级 | 说明 |
| --- | --- | --- |
| 建立/维护音频槽位（Slot） | 高 | 每个业务对象+语言+角色的发音位置 |
| 创建并分配生产任务（Task） | 高 | 驱动生产 |
| 选择生产方式（TTS / 人工录音） | 高 | 质量/成本权衡 |
| 审核候选音频（Review） | 高 | 质量门 |
| 发布正式音频（Publish） | 高 | 使学习者可听 |
| 管理批量生产（Batch） | 中 | 规模化 |
| 处理内容变更导致的 stale 重产 | 中 | fresh/stale 判定 |

### 3.2 工作流程（基于 audio 域完整状态机）

```text
内容变更 / 无正式音频 / stale
  → 建/识别 Slot
  → 创建 Task（检查同 Slot 只有一个 active Task）
  → 分配 (pending_assignment → assigned)
  → 生产方式：
       ├─ TTS：Generation Attempt（queued→submitting→processing→succeeded/failed）
       │     └─ 技术失败：同 Task 重试新 Attempt
       └─ 人工录音：配音人员录制 → 提交
  → Asset Version 形成 (pending_review)
  → 审核 (Review: approved/rejected/approval_revoked)
       ├─ 通过 → 具备发布资格 (approved ≠ published)
       └─ 驳回 → Task rejected → successor Task 重产
  → 发布 (原子事务: 验证 approved → first_published_at → official_asset_version_id → Task published → 事件)
```

### 3.3 关键任务

| 任务 | 触发 | 关键交互 | 成功标准 |
| --- | --- | --- | --- |
| 识别/创建 Slot | 内容有发音需求 | 按 (entity_type, entity_id, language, role) 找/建 | 唯一 Slot |
| 创建生产 Task | Slot 无正式音频或 stale | 选生产方式、preset、分配 | Task 创建（幂等） |
| 触发 TTS 生产 | Task 已建 | 提交 TTS → 等待异步 | Asset Version |
| 审核音频 | Asset pending_review | 通过/驳回 + reject_reason | 审核记录追加 |
| 发布正式音频 | 审核通过 | 原子发布 | official pointer 更新 |
| 批量创建任务 | 大量词条需音频 | Batch 创建 Task | Batch completed |
| 处理 stale 重产 | 内容发音字段变更 | 判定 stale → 新 Task | 新官方音频 fresh |

### 3.4 用户痛点

| 痛点 | 来源 | 严重度 |
| --- | --- | --- |
| **Audio 域实现未完成**：9 张表已建但 `implementation_started: false`，无后端业务代码【缺口】 | AUDIO_PUBLIC_CONTRACTS / 代码核查 | **最高** |
| **依赖 Content 后端能力**：Audio 实现依赖 `ContentPublicQueries.validateAudioSource`，缺失则 Audio 实现必须停止【设计】 | contracts.md | 高 |
| **TTS Provider 未选定**：D-142 说 TTS 归外部服务，但具体 Provider 选型未定；老挝语 TTS 国内缺位【风险】 | 设计 + 市场研究 | 高 |
| **无音频制作工作台的实现证据**：admin-audio-production 是设计文档，无实现【缺口】 | 代码核查 | 高 |
| **批量重产的编排复杂度**：内容批量变更时，如何编排大量 stale Slot 的重产缺少明确产品流程 | 设计 | 中 |
| **TTS 质量不可控**：老挝语 TTS 质量低（全球现状），需要人工录音兜底，成本上升 | 市场研究 | 中 |

### 3.5 失败点

| 失败点 | 后果 | 缓解/设计保障 |
| --- | --- | --- |
| TTS 技术失败（timeout/网络/provider） | 生产中断 | 同 Task 新增 Attempt 重试【设计】 |
| TTS 质量失败（发音错/噪音/截断） | 审核 rejected | 质量失败 ≠ 技术重试，走 successor Task【设计】 |
| 并发创建 Task | 同 Slot 多个活动 Task | partial UNIQUE 约束【设计】 |
| 审核通过但未发布 | 学习者不可听 | approved ≠ published，显式发布【设计】 |
| 发布事务不一致 | Task published 但 pointer 未更新 | 原子事务【设计】 |
| 内容更新但音频未重产 | 播放陈旧发音 | stale 判定 → 禁止播放 stale + 重产【设计】 |
| 回调/重试重放 | 重复生产 | request_id 幂等【设计】 |

### 3.6 与上下游的衔接

- **上游**：Content Public Queries（validateAudioSource / resolveRevision / resolveCurrentPublishedRevision）。
- **下游**：通过 `AudioPublicQueries.resolveOfficialAudio` 向 Learning/Runtime 提供官方音频（含 fresh 判定）。
- **TTS 服务**：外部，Audio 只存 `tts_preset_key` + `audio_default_presets`。
- **Asset Infrastructure**：物理文件 owner，Audio 只存 `asset_id` logical UUID。

---

## 四、普通用户（Learner / 普通用户）

> 域：Learning + Content 消费 + Audio 消费
> 系统：Mobile App
> 目标：学习老挝语/中文，获取标准发音输入，通过练习掌握并保持

### 4.1 用户目标

| 目标 | 优先级 | 说明 |
| --- | --- | --- |
| 浏览/学习教学内容 | 高 | 字母/课程/词汇/句子 |
| 听到标准发音 | 高 | 核心学习输入 |
| 练习并掌握 | 高 | 练习、掌握度、复习 |
| 追踪学习进度 | 中 | Lesson/Course progress |
| 保持长期学习（复习） | 中 | content_reviews 复习计划 |

### 4.2 工作流程（基于 Learning 域设计 + Mobile 现状）

```text
打开 App → 登录/游客浏览
  → 进入学习内容（字母表/课程/词汇）
  → 查看词条 → 播放标准发音 (audioUrl 投影)
  → 练习 (ExerciseAttempt)
  → 完成 → Activity → Mastery 更新 → Review 计划调整
  → Lesson/Course 进度更新
  → 复习 (content_reviews: 答错提前复习/答对延后)
```

- **发音播放**：通过 `AudioPublicQueries.resolveOfficialAudio` 获取官方音频，`audioUrl` 仅在 Slot active + Asset approved + validity valid + revision 一致时返回【设计】；否则 `audio_url = null`，展示静音/暂无发音，**严禁播放陈旧音频**【设计】。

### 4.3 关键任务

| 任务 | 触发 | 关键交互 | 成功标准 |
| --- | --- | --- | --- |
| 学习字母/词条 | 打开学习视图 | 查看分类、播放发音 | 理解发音 |
| 播放发音 | 点音频按钮 | audioService.play(audioUrl) | 听到标准发音 |
| 做练习 | 学习后 | ExerciseAttempt → 评分 | 掌握度更新 |
| 复习 | Review 计划到期 | 答对/答错 | 掌握度调整 |
| 查看进度 | 学习中 | Lesson/Course progress | 了解进度 |

### 4.4 用户痛点

| 痛点 | 来源 | 严重度 |
| --- | --- | --- |
| **发音播放可能缺失**：音频资产未发布时 `audioUrl = null`，学习者无法听到发音 | 设计（优雅失效） | 中 |
| **Mobile 学习视图未接入**：AlphabetScreen 是孤儿实现（未挂导航），普通用户当前实际无法使用【缺口】 | 代码核查 | **最高** |
| **无学习内容消费链**：HomeScreen 是 Foundation 级，无真正的学习内容入口【缺口】 | 代码核查 | 高 |
| **内容更新导致发音缺失**：内容变更后音频 stale → 播放被禁，直到重产完成 | 设计 | 中 |
| **无发音评测/跟读反馈**：设计是"听+练"，未见跟读评分能力（讯飞式发音评测未纳入）【缺口】 | 设计范围 | 中 |
| **Learning 实现缺失**：10 张表已建但无学习业务代码【缺口】 | 代码核查 | 高 |

### 4.5 失败点

| 失败点 | 后果 | 缓解/设计保障 |
| --- | --- | --- |
| 音频 stale 但尝试播放 | 听到与文本不一致的旧发音 | audio_url=null + 优雅失效【设计】 |
| 内容未发布 | 学习到草稿内容 | C 端可见性守卫【设计】 |
| 复习计划导致负担过重 | 用户流失 | 简单复习（SRS 延后）【设计】 |
| 无发音可听 | 学习体验受损 | 触发音频生产（上游链路）【设计意图】 |

### 4.6 与上游的衔接

- 普通用户是**整个生产链的最终消费者**。
- 学习者听到的每个标准发音，都依赖：内容创作者的正确发音要求 → 音频制作/配音的正确生产 → 审核发布 → fresh 判定。
- **音频缺失直接反馈为学习者体验受损**，这是驱动上游持续生产的最终动力。

---

## 五、跨角色旅程图（完整端到端）

```text
[内容创作者]                          [音频制作人员]                  [配音人员]              [普通用户]
     │                                    │                              │                      │
创建词条草稿                               │                              │                      │
     │                                    │                              │                      │
提交审核                                  │                              │                      │
     │                                    │                              │                      │
发布 → 生成 audio_input_hash ──► 建 Slot / 识别需求                         │                      │
                                       │ 建 Task ──┬── TTS ──► Attempt       │                      │
                                       │           │                         │                      │
                                       │           └── 人工录音 ─────────► 被分配 ── 试听 ── 录制      │
                                       │                                    │ 提交                  │
                                       │ ◄──────────────────────────────────┘                      │
                                       │ Asset Version (pending_review)                             │
                                       │ 审核 (Review)                                              │
                                       │  ├─ 通过 → Publish → official pointer                        │
                                       │  └─ 驳回 → successor Task 重产                               │
                                       │                                    │                      │
                                       │ ──────────────────────────────────────────────────► resolveOfficialAudio
                                       │                                                          │
                                       │                                                      学习内容 + 发音
                                       │                                                          │
                                       │                                                      练习 → 掌握 → 复习
```

---

## 六、关键发现与风险汇总

### 6.1 最重要的三个发现

1. **4 角色构成完整闭环，但实现只覆盖起点**：内容创作者（content 模块有真实实现）+ 普通用户（mobile 有部分屏幕）有代码；音频制作人员 + 配音人员的 Audio 域**只有数据库表，无业务代码、无工作台 UI**。这是最大的旅程断层。

2. **`audio_input_hash` 是旅程的"粘合剂"**：内容变更 → 音频 stale → 重产 → 重新发布 → 用户听到新发音。这个机制把内容创作者与音频制作人员强耦合，也是内容/音频一致性的核心保障——但它的实现依赖 Audio 域（未实现）+ Content 后端（部分实现）。

3. **普通用户是最终受益者，也是最终"受害者"**：音频缺失时，用户听到 `audio_url = null`（优雅失效，不播陈旧音频）——设计上正确，但体验上意味着"内容更新了但发音还没好"期间用户听不到标准发音。

### 6.2 风险矩阵

| # | 风险 | 影响角色 | 严重度 | 现状 |
| --- | --- | --- | --- | --- |
| 1 | Audio 域未实现（无代码/无 UI） | 音频制作/配音/用户 | **最高** | 9 表已建，实现未开始 |
| 2 | Mobile 学习视图未接入（孤儿实现） | 普通用户 | **最高** | AlphabetScreen 存在未挂导航 |
| 3 | Content 域双轨冲突（LaoCharacter vs contents） | 内容创作者 | 高 | 功能页自认风险 |
| 4 | 老挝语 TTS 市场缺位 | 音频制作/配音 | 高 | 需人工录音兜底 |
| 5 | TTS Provider 未选定 | 音频制作 | 高 | D-142 开放 |
| 6 | 批量发布/审核分级未定 | 内容创作者 | 中 | versioning-review 未决项 |
| 7 | 配音人员专用 UI 缺失 | 配音人员 | 中 | 设计未覆盖 |
| 8 | Learning 学习链路未实现 | 普通用户 | 高 | 10 表已建无代码 |

### 6.3 旅程中的"温暖"与"缺口"清单

| 角色 | 已具备（温暖） | 缺口 |
| --- | --- | --- |
| 内容创作者 | 完整审核发布状态机 + 幂等 + 版本不可变 | 批量发布、并发协作、审核分级、双轨收敛 |
| 配音人员 | 人工录音→Asset 的清晰数据模型 | 专用工作台 UI、质量即时反馈、批量工具 |
| 音频制作人员 | 六套状态机 + fresh/stale + 幂等 + 批量 | **全部实现**、TTS 选型、工作台 UI |
| 普通用户 | 发音播放契约 + 掌握度/复习模型 + 优雅失效 | **学习链路实现**、发音评测、导航接入 |

---

## 七、对后续阶段的事实指引（不构成建议）

> 本报告只建立用户旅程事实。以下为设计/实现中已明确、可被后续阶段直接引用的基线：

1. **Audio 域是 4 角色旅程中唯一"设计完整但零实现"的域**——其 frozen 设计（6 状态机、fresh/stale、幂等、批量）是完整可实施的规格。
2. **`resolveOfficialAudio` 是普通用户发音体验的唯一入口**，其 fresh 判定 + 优雅失效是已冻结的消费契约。
3. **配音人员的角色定位**在设计中是"TTS 兜底 + 管理员触发"，但在老挝语 TTS 缺位的现实下，其实际重要性高于设计预设。
4. **Content 域双轨**（B 线草稿 vs A 线 frozen）是内容创作者旅程落地前必须收敛的前置问题。
5. **普通用户旅程的现状是"框架在、内容未接"**——Mobile 的 AlphabetScreen 与 HomeScreen 已存在但未形成完整学习消费链。

---

## 附录：关键来源文件

| 角色 | 来源 |
| --- | --- |
| 内容创作者 | `reference/domains/content/index.md`、`versioning-review.md`（B 线）、`curriculum.md`、`database/migrations/1240_content_revision.sql`（A 线）、`apps/backend/src/modules/content/application/use-cases/*.ts` |
| 配音人员 | `reference/domains/audio/production.md`（human_recording）、`database.md`（producer_operator_id） |
| 音频制作人员 | `reference/domains/audio/index.md`、`lifecycle.md`、`database.md`、`contracts.md`、`AUDIO_PUBLIC_CONTRACTS.md`、`admin/audio-production.md` |
| 普通用户 | `reference/domains/learning/index.md`、`progress.md`、`reference/mobile/navigation.md`、`apps/mobile/src/features/alphabet/screens/AlphabetScreen.tsx` |
| 跨角色 | `reference/domains/content/audio-binding.md`（audio_input_hash 联动）、`reference/contracts/audio/AUDIO_PUBLIC_CONTRACTS.md`（resolveOfficialAudio） |
