---
status: frozen
date: 2026-08-30
---

# ADR-018：全局数据库设计原则最终版（Global Database Design Principles, Final）

## 背景

各 Domain（Identity / Learning / Social / Chat / Commerce / Rewards / Trust & Safety / Operations / Platform）已陆续设计完成并定稿。在后续全域最终审计中，发现若干**全局规范冲突**：

- Commerce V1 与 Trust 6 表采用 `uuid` 主键 + 跨域只存 logical ID 不建物理 FK，而早期全局规范第 3 条要求 `bigint generated always as identity`、第 11/12 条要求保留并允许跨 Schema FK。
- Chat 经 ADR-015 裁决「主键回归 identity」，与 Commerce/Trust 的 UUID 写法表面冲突。

用户要求：**这不是重新设计数据库，也不是推翻已定稿的各 Domain，而是把全域审计中发现的全局规范冲突修正掉，作为此后所有 Domain 的最高数据库规则**。

来源：「数据库域设计」会话全局修订（分享 `https://chatgpt.com/share/6a9314bc-4ed0-83ea-8127-baf221a1a4ad`，消息 [89] 指令 + [95] 产出）。

## 决策

本规范为 **Final / Global Standard**，优先级：全局最终版 → 各 Domain 定稿 → 具体表 DDL → 应用实现细节。若某早期 Domain 的局部设计与本规范冲突，以本规范为准；除此之外不重新打开已定稿的业务设计。

### 一、最终 Domain Map（9 个业务域）

```text
1. Identity    2. Learning   3. Social    4. Chat
5. Commerce    6. Rewards    7. Trust & Safety
8. Operations   9. Platform
```

- **Community 不再作为独立 Domain**：动态、点赞、评论、Feed 等归入 Social Domain。
- **Notification 不作为独立业务 Domain**：可作为平台级能力存在，但不因存在 `notifications` 表而扩张成新业务域；仅在业务复杂度真实需要时才重新评估。
- **`system_outbox_events` 属 Platform Infrastructure**，不计入任何业务 Domain 的业务表数量，不参与 Domain 表数量审计。

### 二、最终 ID 策略（混合主键，不强制统一）

1. 不要求所有表统一 BIGINT PK，也不要求统一 UUID PK。已定稿为 BIGINT 内部 PK 的早期 Domain 继续保留；已定稿为 UUID PK 的后续 Domain 继续保留 UUID。不因形式统一重新修改已定稿数据模型。
2. **Internal ID ≠ Logical ID**。
   - Internal ID：服务于 Domain 内部 PK/Join/Index/引用，类型由 Domain 自定（BIGINT 或 UUID）。
   - Logical ID：服务于跨 Domain 引用、API、Event、Outbox、外部资源标识、长期业务身份，统一采用 **UUID**。
3. 任何满足以下任一条件的聚合根或业务实体，**必须具有稳定 UUID logical/public ID**：可能被另一 Domain 引用；会出现在跨域事件中；会暴露给客户端/API；生命周期需跨系统长期追踪；可能被运营/审计/安全识别；未来存在跨服务拆分可能。

### 三、最终 FK 策略

- **同一 Domain 内**：应使用真正 PostgreSQL FK（如 `social.social_profiles → social.xxx`），由数据库守护内部完整性。
- **跨 Domain**：**禁止数据库级 FK**。只保存对方的 logical UUID，不建立 `REFERENCES other_domain.some_table(...)`。即使 PostgreSQL 技术允许、当前同库、查询方便，也不建立——Domain boundary 优先于数据库便利性。
- **跨 Schema ≈ 跨 Domain**：当前 `Schema ≈ Domain namespace`，正常情况下跨 schema 即跨 Domain，不建立 FK。纯基础设施 schema 是否能建立技术性引用按 Infrastructure 规则判断，不得因此破坏业务 Domain ownership。

### 四、Canonical Facts Ownership（最高级不变量）

> **一个业务事实只能有一个 authoritative owner。**

- 不得出现 Domain A 与 Domain B 同时保存同一业务事实并都自认真相。
- 允许保存引用，不允许复制事实：Social 可保存 `user_id uuid`，但不应复制 Identity 的 `account_status`/`phone`/`auth_provider`；Commerce 拥有正式商业权益事实时，其他 Domain 不应再维护 `is_vip`/`is_paid`/`membership_level` 作为第二套真相。
- 允许 Read Model / Snapshot / projection / cache，但必须：明确标注非 canonical source；能由 authoritative fact 重建；不能由消费者 Domain 独立修改后反向成为事实源；不建立隐含双向 ownership。

### 五、跨 Domain 协作机制

- 同步协作：Domain A Application Service → Domain B exposed service/API（如查询"用户是否拥有某项 entitlement"由 Commerce 回答）。
- 异步协作：Domain A 事务 → Outbox Event → Domain B consumer（如 `MatchCreated`/`PaymentSucceeded`/`RewardGranted`/`RestrictionCreated`）。
- **禁止跨域直接写库**：任何 Domain Service 不应直接 INSERT/UPDATE/DELETE 另一 Domain 的表，即使运行在 Modular Monolith 中。

### 六、删除策略总原则（不采用"一律软删除"或"一律物理删除"）

判断顺序：① 是否不可变历史事实？→ 是则不物理删除；② 是否当前关系？→ 是则允许按关系语义删除；③ 是否定义/配置/字典？→ 是则优先 `disabled`/`inactive`/`retired`；④ 是否临时、高容量、可重建？→ 是则允许 retention 清理；⑤ 都不是？→ 按该 Domain 业务生命周期明确决定。

- **历史事实不得物理删除**：交易、支付、退款、账本、奖励发放、审核、处罚、安全治理决定、审计、消息、重要操作记录。撤销/取消/失效用 `status`/`reversal`/`revocation`/`cancelled_at`/`voided_at`/superseding record 表达，不能用 DELETE 抹掉历史。
- **消息属于历史事实**：Chat 已形成的 Message 原则上不物理删除；"撤回"表现为 Message exists + Recall fact，不是 `DELETE FROM messages`。用户前台不可见与后台保留是两件事。
- **当前关系类数据允许语义删除**：Follow / Bookmark / Like / Preference relation / temporary assignment 等，删除本身即表示"关系不存在"，可 DELETE；若关系具审计/安全/商业价值，另存事件/历史事实，不强行让当前关系表承担两职。
- **字典/配置类**：Definition / Rule / Config / Catalog / Feature / Product / Content definition 等长期被引用数据，优先 `disabled`/`inactive`/`retired`/`archived`，保持可追溯。
- **临时与高容量数据**：OTP、过期 Session、临时 Token、Exposure/Impression、临时推荐候选、临时任务中间数据、无长期审计价值的高容量 telemetry，允许定期 DELETE / partition drop / TTL-like 维护。
- 禁止机械地给所有表加 `deleted_at`。

### 七、Infrastructure 边界

- Infrastructure 提供技术能力；Domain 保存业务事实；两者必须分开。Infrastructure 不因存储技术记录而取得业务事实 ownership。
- **统一 Outbox**：`system_outbox_events` 是解决"业务事务成功 + 需可靠发布事件"一致性的跨 Domain 事务事件基础设施；业务事实与 Outbox Event 在同一数据库事务内写入。它不是 Domain Event History / Audit Log / Business Ledger，完成投递后可按 retention 清理，不能代替 payment transaction / reward grant / moderation action / audit log / message history 等永久保留事实。
- **统一 Media / Asset 基础设施**：文件/媒体由唯一 authoritative infrastructure owner 管理（asset_id、storage provider、bucket、object key、mime、size、checksum、processing status、metadata 只能有一个 owner）。业务 Domain 只保存 `asset_id`（UUID logical ID），不重复保存 bucket/path/object_key/provider/CDN origin/storage region；不通过业务 Domain → Infrastructure 的数据库 FK 制造强耦合，Asset 是否存在/可用/已处理由统一 Asset Service/Infrastructure API 保证。需区分"文件事实"（Asset Infrastructure 拥有）与"业务语义"（如 Social Photo 的第几张/是否主照片/审核状态/展示顺序，业务 Domain 拥有）。

### 八、Platform 与 Platform Infrastructure 边界

```text
Platform
├── Platform Domain（业务）：Feature Flags / Product Config / Region Policy / App Version Policy / 其他已定稿平台业务能力
└── Platform Infrastructure（技术）：system_outbox_events / Asset·Media Infrastructure / 其他纯技术基础设施
```

Platform Domain 参与业务 Domain Map；Platform Infrastructure 不作为额外业务 Domain。

## 最终跨域规则速查

```text
同 Domain 内引用  → Internal PK      → PostgreSQL FK → YES
跨 Domain 引用   → Logical UUID     → PostgreSQL FK → NO
跨 Domain 数据访问 → Domain Service / API
跨 Domain 状态传播 → Event + Outbox
跨 Domain 写入    → 禁止直接写对方表
同一业务事实      → 只能有一个 authoritative owner
缓存 / Projection → 可以有，但不能成为第二事实源
```

## 最终 ID 模型速查

```text
Domain A: id BIGINT PRIMARY KEY  + public_id UUID UNIQUE
Domain B: id UUID PRIMARY KEY
Domain C: id BIGINT PRIMARY KEY  + logical_id UUID UNIQUE
```

均合法，不要求重构成同一种格式；但跨域时只能使用 UUID logical ID，禁止 `Domain A.internal_bigint_id → Domain B`。

## 最高级不变量（此后所有 Domain 最终审计必须遵守）

1. Domain ownership：一个 canonical fact = 一个 authoritative owner。
2. Cross-domain identity：跨 Domain = stable logical UUID。
3. FK boundary：Domain 内 = real PostgreSQL FK；Domain 间 = no physical FK。
4. Domain communication：service / event / outbox，而非共享内部表。
5. Historical facts：不可通过物理删除抹掉历史。
6. Current relationships：可按业务语义删除。
7. Definitions / configuration：优先 disabled / inactive / retired。
8. Temporary high-volume data：允许 retention 清理。
9. Asset ownership：业务 Domain → asset_id；Asset Infrastructure → storage facts。
10. Infrastructure：`system_outbox_events` 与统一 Asset Infrastructure ≠ 额外业务 Domain。

## 对已有定稿 Domain 的机械性修订指引

后续全域审计只需找出"哪些已定稿表违反上述新最高级规范并做机械性修订"，而非重新讨论各 Domain 业务模型：

- 若某表使用**跨 Domain BIGINT FK**：修订为"保存对方 logical UUID + 删除 physical FK"，不重新设计整个 Domain。
- 若某早期 Domain 使用 BIGINT 内部主键：继续保留，不因其他 Domain 用 UUID 而做无业务价值的主键迁移。
- 若某表缺 logical UUID 却会被跨域引用/暴露客户端/出现在事件中：补 `public_id uuid unique` 或等价 logical ID。
