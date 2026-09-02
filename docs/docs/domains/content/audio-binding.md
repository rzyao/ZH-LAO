# Audio Binding Domain（音频槽位与内容绑定）

> 状态：Domain Framework Draft  
> 领域：Content Domain & Audio Domain Boundary  
> 职责：定义允许拥有音频的实体白名单、音频槽位（Audio Slot）与不可变资产版本模型、内容哈希联动失效机制及 C 端音频投影播放契约。

---

## 1. 实体音频白名单与角色策略 [PA, ADR-008]

### 1.1 严格白名单限制
音频生产与绑定能力在平台中被严格限制为 6 类基础语言知识词条，其余一切实体（课程、课时、场景、页面、汉字、HSK 词汇、中文句子等）**严禁直接创建音频槽位**：

| 语言方向 | 允许拥有音频的内容实体 | 音频角色（Audio Role） | 槽位数量 |
| :--- | :--- | :--- | :--- |
| **老挝语（Lao）** | 字母（`LaoCharacter`） | `pronunciation`（标准发音） | 1 槽/实体 |
| **老挝语（Lao）** | 音节（`LaoSyllable`） | `pronunciation`（标准发音） | 1 槽/实体 |
| **老挝语（Lao）** | 单词（`VocabularyEntry`） | `pronunciation`（标准发音） | 1 槽/实体 |
| **老挝语（Lao）** | 句子（`SentenceExample`） | `pronunciation`（标准发音） | 1 槽/实体 |
| **中文（Chinese）** | 拼音（`ZhPinyin`） | `tone_1` ~ `tone_4`（四声调） | 4 槽/实体 |
| **中文（Chinese）** | 音节（`ZhSyllable`） | `tone_1` ~ `tone_4`（四声调） | 4 槽/实体 |

### 1.2 策略门禁
所有音频生产任务入口必须经由音频角色策略（`AudioRolePolicy`）集中校验，非白名单实体直接拒绝建槽。

---

## 2. 音频槽位与不可变版本模型 [PA, ADR-006]

### 2.1 槽位与实体解耦模型
- **实体侧**：词条仅维护自身的内容发布状态与版本指针，**不直接持久化具体音频文件 ID 或音频 URL**。
- **槽位侧（Audio Slot）**：通过 `(content_entity_type, content_entity_id, language, audio_role)` 唯一确定物理槽位。
- **不可变资产版本（Audio Asset Version）**：
  - 音频生产（真人录制或 AI 生成）产生单调递增的资产版本；
  - 资产版本记录源类型、原始/降噪处理后文件、时长、音量（LUFS）、校验和及审核状态；
  - 正式音频指针（`official_asset_version_id`）由显式发布动作在事务内原子变更。

---

## 3. 内容版本联动与陈旧判定机制（Hash-based Stale Invalidation）[PA]

### 3.1 输入内容哈希（`audio_input_hash`）
- 每一个内容修订版本在创建时，均对其发音输入要素（如老挝文本、拼读音标、发音要求）计算 SHA-256 哈希值。

### 3.2 版本升级时的绑定继承规则
当词条产生后继新修订版本时：
- 若新修订版本的 `audio_input_hash` 与前序版本**完全相同**（仅修改了非发音字段，如中文释义、描述）：
  $$\to \text{音频绑定继承，有效性状态标记为 } \mathbf{valid}$$
- 若新修订版本的 `audio_input_hash` 发生**变更**（修改了老挝文拼写或发音音标）：
  $$\to \text{旧音频自动标记为 } \mathbf{stale}\text{（陈旧失效），触发重新录制/生成需求}$$

---

## 4. C 端音频播放投影契约 [PA]

### 4.1 播放 URL 返回的前提条件
客户端在请求内容词条详情时，仅在同时满足以下全部条件时才向前端投影真实音频播放地址：
1. 音频槽位处于激活状态（`publication_status == 'active'`）；
2. 关联的正式音频资产已审核通过（`review_status == 'approved'`）；
3. 该音频资产针对当前发布内容版本的有效性为有效（`validity == 'valid'`）；
4. 音频资产关联的内容修订版本号与词条当前正式发布的修订版本号一致。

### 4.2 优雅失效
若上述任一条件不满足（如内容已更新但新音频尚未录制完成），API 返回 `audio_url = null`，客户端展示静音/暂无发音状态，严禁播放与文本不一致的历史陈旧音频。

---

## 5. Engineering Reality 历史映射 [ER]

> 仅记录旧系统事实备查，不作为新系统架构依赖：
- 旧系统落点于 `audio_slot`、`audio_task`、`audio_asset_version` 及六张 `lao_*_revision_audio` 绑定表。
- 早期 `_archive_app_unit` 中硬编码的 `audio_url` 字段已在数据库改造中完全废弃和清空。

---

## 6. 未决事项 [UNKNOWN]

1. **[UNKNOWN] 多发音人音色（Voice Profile）支持范围**：老挝语方向当前默认单槽位单标准发音，未来是否支持男女声双音色或不同方言（万象方言/琅勃拉邦方言）槽位待决策。
2. **[UNKNOWN] 移动端音频本地预缓存与离线管理机制**：移动端大批量音频文件的本地缓存容量上限、LRU 淘汰与网络按需流式加载策略待定义。
