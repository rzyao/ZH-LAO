# 技术计划：内容管理音频播放列

**状态：** 已确认；实现中以 Cloudflare R2 的短时 S3 签名读取描述符落实 Asset delivery。  
**模式：** Lite  
**变更请求：** CR-001（已接受）  
**数据库变更：** 无

## 1. 方案概览

```text
Admin 内容列表
  → Content Admin list projection（当前已发布 revision + 当前行状态）
  → Audio public query（白名单 + active + approved + fresh）
  → Asset delivery public query（短时、安全、opaque descriptor）
  → AudioPlaybackCell（列表内唯一播放实例）
```

Admin 只收到 `available/unavailable/no_audio` 和在内存中短暂使用的播放描述符。Content 负责查询与权限入口；Audio 负责 official/fresh；Asset Infrastructure 负责文件技术可用性和交付；没有跨域 repository 或直接 SQL。

## 2. Backend 设计

### 2.1 Asset delivery（CR-001）

新增 Asset Infrastructure 的应用服务与 public port，实现 [ASSET_DELIVERY_PUBLIC_CONTRACTS](../../../docs/docs/developer/reference/contracts/asset/ASSET_DELIVERY_PUBLIC_CONTRACTS.md)：

- `AssetDeliveryPublicQueries.resolveClientSafeRead({ assetId, purpose: 'audio_playback' })`。
- `AssetRepository` 验证 Asset 存在且技术状态为 `ready`；不把 Asset 行或存储字段返回给调用者。
- 将 Object Storage Port 扩展为受限只读能力；Memory adapter 支持测试/开发读取，Unavailable adapter 始终受控失败。生产 Provider 继续由独立 adapter 实现，绝不把 Memory 用于生产。
- 交付机制采用 Cloudflare R2 生成的短时 S3 签名读取描述符；只有 Asset Infrastructure 可以从 canonical storage metadata 生成它。签名失效、资产不可用或 Provider 故障一律拒绝。URL 不写数据库、不进 Content snapshot、不存浏览器本地存储。

### 2.2 Audio public read

在 `apps/backend/src/modules/audio/public/` 增加 `AudioPublicQueries.resolveOfficialAudio` 的稳定实现：

- 输入为 Content source tuple（具体白名单实体、当前已发布 revision、合法角色）；调用现有 Content public validation，禁止客户端自报文本、哈希或角色。
- 在 Audio 内部查询 `audio_slots`、`audio_asset_versions` 与审核事实，接受条件为 Slot active、official asset version 已审核 approved，且 `required_content_revision_id` 与 `required_audio_input_hash` 同 official version 的快照一致。
- 满足时将 `asset_id` 交给 Asset delivery public query；不能满足或 Asset 不可交付时返回不可播放状态，不返回旧版本地址。
- 只暴露管理端所需的状态和 descriptor；不暴露 slot/task/attempt/version/storage ID。

### 2.3 Content Admin list projection

- 结构化内容列表和老挝字母分页列表在既有 `content.<resource>.read` 鉴权成功后，批量投影音频状态；不能针对每一行发起串行 HTTP 请求。
- 只为六类白名单实体发起投影：`lo_letter`、`lo_syllable`、`lo_word`、`lo_sentence`、`zh_pinyin_element`、`zh_syllable`。
- 投影固定依据当前 published Content revision，不因草稿/工作 revision 改变；`tone_mark` 与 `other` 显式为 `no_audio`。
- API DTO 为每行的 `audio` 可选字段：`{ status: 'available', playback: { url, expires_at, content_type } }`、`{ status: 'unavailable' }` 或 `{ status: 'no_audio' }`。不支持的类别根本不出现音频字段。
- 复用已有列表读取权限；不增加写、审核、发布或音频生产权限，也不为这次只读投影增加 Operations 成功审计。

## 3. Admin 设计

- 新建可复用 `AudioPlaybackCell` 与 page-scoped `useTableAudioPlayback` controller，确保每张表同一时刻仅一个 HTMLAudioElement 正在播放。
- 在结构化内容类别页中以 config 驱动将列注入六类白名单页面；中文汉字/词语/句子继续没有该列。
- 在老挝字母页的可隐藏列模型中添加“音频”列，保持右侧操作列固定。
- `available` 显示播放/暂停文字按钮；`unavailable` 显示“暂无音频”；`no_audio` 显示“无音频”。播放失败显示 toast 和重试；加载、筛选、排序、分页或行消失时停止并清理。
- 按 `apps/admin/DESIGN.md` 使用既有 Button、Badge、Toast 和表格组件；按钮含可见状态文本、准确 aria label 与 `aria-live` 状态通知。

## 4. 测试与验证

| 层级 | 覆盖 |
| --- | --- |
| Asset | short-lived token 的签发/过期/篡改、ready/非 ready、Memory 与 Unavailable adapter、range delivery |
| Audio | 白名单拒绝、official/approved/fresh 成功、stale/未审核/无 Slot/Asset 不可交付返回不可播放 |
| Content HTTP | 六类 DTO 投影、非白名单不投影、只读权限、当前 published revision 而非草稿、无串行逐项调用 |
| Admin unit | cell 状态、单实例播放、暂停/结束/切行、失败重试、数据刷新时清理、无障碍名称 |
| E2E | 六个页面均呈现正确列和状态；有可用 fixture 时可播放，无音频和 stale 项不能播放 |

## 5. 实施顺序

1. 先写 Asset delivery 与 Audio public read 的失败测试，确认它们目前不存在或不满足需求。
2. 实现 Asset Delivery port、短时 URL/token、streaming read、Object Storage adapter 扩展及测试。
3. 实现 Audio official/fresh read 和 Content Admin 批量投影；补齐 HTTP 契约及集成测试。
4. 实现 Admin 播放 controller/cell，并接入结构化内容列表与老挝字母列表。
5. 运行受影响 Backend、Admin、E2E、文档审计及生产构建；没有真实生产存储 Provider 时，发布结论必须保留为条件性，不得声称生产环境可播放。

## 6. 约束、风险与回滚

- 不增加数据库 migration，不修改任何冻结 migration。
- 生产 Object Storage Provider 已冻结为 Cloudflare R2；生产环境必须配置完整 R2 读取凭证，否则安全失败关闭。
- 由于这是只读投影，回滚只需停止暴露 audio DTO/列或关闭调用路径；不会改变 Content、Audio 或 Asset 的历史事实、审核状态或正式指针。
- 实施不得将短时 URL 记录到日志、审计详情、错误详情、数据库、前端持久化存储或任何 Content snapshot。
