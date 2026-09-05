# 内容管理音频播放列

**状态：** 已确认  
**功能模式：** Lite  
**涉及系统：** Admin、Content、Audio、Asset delivery  
**权威输入：** `docs/docs/developer/reference/domains/content/audio-binding.md`（frozen）、`docs/docs/developer/reference/domains/audio/contracts.md`、`docs/docs/developer/reference/contracts/audio/AUDIO_PUBLIC_CONTRACTS.md`、`apps/admin/DESIGN.md`

## 问题与目标

内容管理员在多个内容列表中只能看到内容与版本状态，无法在当前行确认“当前正式音频”是否可用及其实际听感。目标是在符合 Audio–Content 边界的列表中提供单行试听，而不泄露音频生产或存储事实，也不让管理员误听已经陈旧的音频。

## 范围

### 包含页面

| 导航页面 | 路径 | 实体类型 | 音频角色 |
| --- | --- | --- | --- |
| 中文拼音管理 | `/content/zh/pinyin` | `zh_pinyin_element` | `tone_1` 至 `tone_4` |
| 中文音节管理 | `/content/zh/syllables` | `zh_syllable` | `tone_1` 至 `tone_4` |
| 老挝语字母管理 | `/content/lo/letters` | `lo_letter` | `pronunciation` |
| 老挝语音节管理 | `/content/lo/syllables` | `lo_syllable` | `pronunciation` |
| 老挝语词语管理 | `/content/lo/words` | `lo_word` | `pronunciation` |
| 老挝语句子管理 | `/content/lo/sentences` | `lo_sentence` | `pronunciation` |

同一个“音频”列组件可被以上页面复用。中文类型有多个声调槽位；列表仅在存在可用正式音频时提供播放入口，具体可用角色由后端的 Audio Role Policy 与官方解析结果决定，前端不自行推断或拼接 URL。

### 不包含

- `zh_hanzi`、`zh_word`、`zh_sentence`，以及词典、课程、审核页面和内容目录；它们不在 frozen 音频白名单内。
- 新建 Slot、生成/录制、审核、发布、替换或删除音频。
- 直接读取 `audio.*`、Asset storage metadata，或把 URL、Slot ID、Task ID、Asset Version ID 写入 Content。
- 播放草稿、待审、驳回、未审核、不可用或 stale 的音频。

## 用户故事与功能需求

### US-001：在允许的内容列表试听正式音频

作为具有相应内容读取权限的管理员，我要在每个允许的内容列表中看到音频状态，以便不离开工作流即可试听当前正式发音。

- **FR-001**：上述六个页面必须在表格中显示“音频”列；列位于内容标识/元数据之后、行操作之前，并遵循既有可隐藏列和固定行操作列规则。
- **FR-002**：每行的音频状态必须由后端依据 Content 的当前已发布 revision，经 Audio 的 official/fresh 解析和 Asset owner 的安全投影得出；客户端不得将管理列表中的草稿或工作 revision 作为解析输入。
- **FR-003**：当存在可播放的正式音频时，单元格展示带文字的“播放”按钮；点击后播放该条音频，并将按钮切换为“暂停”。
- **FR-004**：再次点击、播放结束或用户启动另一行播放时，当前播放必须暂停并重置；同一时间只允许一个表格行音频播放。
- **FR-005**：播放按钮必须具备可见文本或准确 `aria-label`（例如“播放 ກ”／“暂停 ກ”），键盘可聚焦和操作；播放状态变更通过礼貌的状态提示宣布。

### US-002：避免误播不可用或陈旧音频

作为管理员，我要能区分无音频与暂不可播的内容，从而不会把旧音频误认为当前内容的正式音频。

- **FR-006**：后端只在 Slot active、正式资产已审核通过且 fresh 时返回可播放描述符；否则返回无可播音频的状态，绝不返回可用于播放的历史 URL。
- **FR-007**：无可播音频时，音频列显示“暂无音频”并禁用播放；对于规则明确禁止音频的项目（如声调符号或其他标记）显示“无音频”。
- **FR-008**：音频请求、浏览器解码或播放失败时，停止该播放并显示可理解的错误提示及重试入口；失败不得影响列表数据、编辑、审核、发布或批量操作。
- **FR-009**：刷新、筛选、分页、排序或行数据被刷新后，若正在播放的行不再属于当前可见数据，必须停止播放并清除播放状态。

### US-003：保持领域与安全边界

作为系统维护者，我要该列表能力只消费稳定公开能力，确保管理端不会绕过音频审核、发布和陈旧判定。

- **FR-010**：管理端 API 响应仅包含 UI 所需的播放可用性及 Asset Delivery 的短时 client-safe 播放描述符；不得暴露 Slot、Task、Attempt、Asset Version、bucket、object key、provider、checksum 或内部数据库 ID。 <!-- CR-001: Asset Delivery public boundary -->
- **FR-011**：播放描述符必须由 `AssetDeliveryPublicQueries.resolveClientSafeRead` 在 Content read 授权和 Audio official/fresh 裁决之后产生；不能由 Content、Admin 或浏览器保存/构造持久音频 URL。 <!-- CR-001: Asset Delivery public boundary -->
- **FR-012**：非白名单实体和没有相应 Content read 权限的请求必须被拒绝或不返回音频描述符，且不能通过传入的实体类型绕过 Audio Role Policy。

## 验收场景

### FR-003-AS01：播放可用的老挝语发音

**Given** 管理员打开老挝语词语管理页，且某个可见词语拥有当前已发布、已审核且 fresh 的 `pronunciation` 正式音频  
**When** 管理员点击该行“播放”  
**Then** 该音频开始播放，按钮变为“暂停”，且无其他行处于播放状态。

### FR-004-AS01：切换行时停止先前播放

**Given** 管理员正在播放一行的音频，另一可见行也有可播放音频  
**When** 管理员点击另一行“播放”  
**Then** 第一行立即停止并回到“播放”，第二行开始播放。

### FR-006-AS01：陈旧音频不会被播放

**Given** 内容的发音输入已更新，导致旧正式音频被 Audio 判定为 stale  
**When** 管理员查看该列表行  
**Then** API 不提供可播放描述符，界面显示“暂无音频”，且不能播放旧文件。

### FR-007-AS01：规则禁止音频的字母

**Given** 管理员查看老挝语字母管理页中的 `tone_mark` 或 `other` 项  
**When** 列表完成加载  
**Then** 音频列显示“无音频”，不渲染可操作播放按钮。

### FR-008-AS01：播放失败可恢复

**Given** 一行存在可播放描述符  
**When** 音频加载或播放失败  
**Then** 播放状态复位、管理员收到错误提示，并可重试；其他表格能力仍可使用。

### FR-012-AS01：不支持的内容不会得到音频

**Given** 管理员请求中文词语、汉字、中文句子、课程或词典的数据  
**When** 列表加载  
**Then** 不显示音频列且服务端不为其生成播放描述符。

## 非功能要求

- **NFR-001 可访问性**：控制满足 WCAG 2.1 AA，键盘和屏幕阅读器可用，不能仅用颜色表达可播状态。
- **NFR-002 性能**：列表加载不能为每一行串行发起网络请求；音频可用性应随列表批量投影或以批量方式解析。
- **NFR-003 稳定性**：单一音频解析/播放失败不使整张列表进入错误态。
- **NFR-004 安全性**：播放地址仅为短时、安全的 client-safe descriptor，不记录在前端持久化存储。

## 关键实现约束与风险

1. 现有结构化内容列表和老挝字母列表均未携带正式音频投影；需要在既有 Content Admin API 上新增受约束的批量读取字段或端点。
2. 现有代码存在旧 `audioUrl` 字段但其数据库查询固定返回 `NULL`；该字段不能作为实现依据或回退路径。
3. `ASSET_DELIVERY_PUBLIC_CONTRACTS.md` 已在 CR-001 中定义安全交付边界。实现必须保持其 fail-closed 语义；当前 Object Storage Port 尚未提供 read/delivery 操作，技术计划须新增最小实现端口而不冻结生产 Provider。 <!-- CR-001: Asset Delivery public boundary -->
4. Frozen `audio-binding.md` 的六类白名单优先于历史迁移 `1360_content_audio_eligible_types.sql`；后者已在 `migration-supersessions.json` 标注为被替代，不能据此扩大范围。
