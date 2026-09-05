# Feature Specification: 旧老挝语内容迁移

**Feature Branch**: `007-legacy-lao-content-migration`  
**Created**: 2026-09-05  
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - 可重复导入规范内容 (Priority: P1)

作为内容管理员，我要从只读旧库导入有效的老挝语音节、词语和句子，使它们成为新系统中待审核的规范内容。

**Why this priority**: 这是后续审核、发布和学习内容消费的前提。

**Independent Test**: 在空目标库运行导入预览与正式导入，验证所有创建的 Content 和唯一初始 revision 均为新 UUID 与 `draft`。

**Acceptance Scenarios**:

1. **Given** 一个源实体未删除、在线且有 published revision，**When** 导入运行，**Then** 系统创建对应新 Content、专用结构行和一个 draft revision，不复制源 ID、审核、发布或历史版本。
2. **Given** 导入已成功运行，**When** 以相同输入再次运行，**Then** 系统不重复创建 Content、资产、Slot 或组成关系。

---

### User Story 2 - 可审计地处理重复内容 (Priority: P1)

作为内容管理员，我要对同文本的旧内容确定性去重，同时能够复核未选中版本的所有差异。

**Why this priority**: 目标文本唯一约束不允许多个同文本父实体，且源重复项存在不同关系和音频。

**Independent Test**: 对含重复文本、不同组成与不同音频的源数据执行预览，验证最小源 ID 被选为 canonical，其他记录只出现在隔离报告中。

**Acceptance Scenarios**:

1. **Given** 多个源实体的 NFC + trim 文本相同，**When** 导入运行，**Then** 仅最小稳定源 ID 创建目标实体，并保留该记录的关系和 processed 音频。
2. **Given** 未选中记录与 canonical 有字段、组成或音频差异，**When** 导入完成，**Then** 每个差异均在隔离报告中可追溯，且不会静默丢弃。

---

### User Story 3 - 保留可用组成关系和音频资产 (Priority: P1)

作为内容管理员，我要让迁入内容保持可用的字母、音节、词语组成关系和正式发音资产。

**Why this priority**: 结构和发音是 Lao 内容的核心教学信息。

**Independent Test**: 用已发布源 revision 创建目标 draft，验证结构顺序、文本拼接、R2 Asset、Audio Slot 与正式资产指针。

**Acceptance Scenarios**:

1. **Given** canonical 源记录的子关系均存在，**When** 导入运行，**Then** 目标关系按 `sort_no` 连续排序，并通过对应的文本拼接校验。
2. **Given** processed 音频 URL 匹配已配置 R2 公共域名，**When** 导入运行，**Then** 系统创建 R2 Asset、`pronunciation` Slot 和新的 Audio Asset Version，而不把 URL 写进 Content 表。
3. **Given** 一个句子关系引用缺失词语，**When** 导入运行，**Then** 系统导入句子和其他有效关系，跳过该关系并在隔离报告中记录原因。

## Edge Cases

- URL 不匹配 R2 公共域名、R2 对象无法读取或其元数据不完整时，迁移在写事务前失败。
- 音节或词语的 canonical 组成无法重建其文本时，迁移失败并报告源记录。
- 句子仅因缺失子词语关系而不失败；其余关系位置必须保持源 `sort_no`，不重编号。
- 任何目标中已存在、但与确定性目标 UUID 的类型、文本或内容快照不一致的记录都必须视为冲突并停止，而不得覆写。

## Requirements

### Functional Requirements

- **FR-001**: 系统必须对旧 MySQL 仅执行只读查询，且只选择未删除、在线并有 published revision 的 Lao 音节、词语和句子。
- **FR-002**: 系统必须以 Lao 展示文本的 Unicode NFC + trim 结果为去重键，并以稳定的源 ID 升序选择 canonical 记录。
- **FR-003**: 系统必须为 canonical 音节、词语和句子创建新的 Content UUID、专用结构行和唯一初始 `draft` revision；不得复制源版本、审核、发布、事件或用户学习事实。
- **FR-004**: 系统必须从 canonical 源的 published revision 重建音节→字母、词语→音节和句子→词语关系，保留 `sort_no` 顺序和重复项，并验证 Rule 4404 文本拼接。
- **FR-005**: 系统必须跳过引用缺失词语的句子关系，同时导入句子父实体和其他有效关系，并将跳过项写入隔离报告。
- **FR-006**: 系统必须将所有非-canonical 重复源记录及其字段、组成和音频差异写入隔离报告。
- **FR-007**: 系统必须将已确认 R2 公共域名下的 processed 音频路径映射为 `provider=r2`、已配置 bucket 和去掉前导 `/` 的 object key；系统必须创建新的 Asset、Audio Slot、Audio Task 与 Audio Asset Version 关系。
- **FR-008**: 系统必须在所有目标写入前验证 R2 对象可读取、迁移操作员存在且活跃、以及目标库当前状态；缺失或不一致时必须失败安全。
- **FR-009**: 系统必须以确定性 UUID 和冲突检测支持幂等重跑；同一输入重跑不得重复创建，改变的输入不得覆写既有目标事实。
- **FR-010**: 系统必须生成机器可读和人类可读的迁移报告，至少含创建、跳过、隔离、失败、关系与音频统计。

### Key Entities

- **Canonical source record**: 某个规范 Lao 文本的最小稳定源 ID；它是唯一会生成目标内容、组成与音频的来源。
- **Migration isolation record**: 不进入目标 Content 的非 canonical 版本或缺失关系，包含可审计的原因与差异。
- **Target draft content**: 新 Content UUID 与一个 draft revision；它不继承旧系统生命周期事实。
- **Migrated audio asset**: 由确认的 R2 object key 表示的基础设施 Asset，经 Audio Slot、Task 和 Asset Version 与目标 Content 关联。

## Success Criteria

### Measurable Outcomes

- **SC-001**: 对当前盘点数据，预览报告能解释 261 音节、239 词语和 166 句子的每一条源记录归属。
- **SC-002**: 每个成功迁入的目标内容均为 draft，且不包含继承的源版本、审核或发布状态。
- **SC-003**: 每个成功的 canonical 内容均通过组成文本校验；跳过的 2 条句子关系在报告中可定位。
- **SC-004**: 每条 canonical processed 音频均完成 R2 key 解析和对象读取验证，或迁移以零目标写入失败。
- **SC-005**: 相同输入至少连续运行两次后，目标内容、关系、Asset 与 Audio 记录数量保持不变。

## Assumptions

- 当前目标 PostgreSQL 的 Lao Content 表为空；执行前必须重新验证。
- R2 bucket、endpoint、凭据和公共域名配置在后端私有 `.env`，且不进入版本控制或报告正文。
- 活跃 `super_admin` 仅作为迁移创建审计主体，不代表自动审核或发布。
- 旧库的 68 个 Lao 字母已经或将先于本 Feature 可供映射；若任一 canonical 音节引用的字母不能解析，导入必须失败。
