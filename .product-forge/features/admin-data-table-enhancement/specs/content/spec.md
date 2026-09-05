# Delta Spec: Content — admin-data-table-enhancement

> Delta against `specs/content/spec.md`. API/DB/state details remain owned by D-167, ADR-028 and canonical Content documents. Fold with Product Forge spec-merge only after implementation verification.

## ADDED Requirements

- **FR-010** 老挝语字母管理列表必须支持 Content API 白名单内的服务端搜索、筛选、稳定排序和 offset 分页，默认 50、最大 500。— Priority: Must — Source: US-001
- **FR-011** 查询状态必须可由 URL 恢复，并在查询范围变化时重置无效页码和选择。— Priority: Must — Source: US-001, US-006
- **FR-012** 操作列固定且不可隐藏；启用选择时选择列不可隐藏；其他显示列可设置。— Priority: Must — Source: US-002
- **FR-013** 表头选择默认只作用于当前页，并以可访问三态复选框和准确数量反馈状态。— Priority: Must — Source: US-003
- **FR-014** 当前页选择可显式升级为当前查询全部，范围由服务端规范化 query、expected count 和 UUID 集合 hash 验证。— Priority: Must — Source: US-003
- **FR-015** 批量动作可见性来自 Content 权限能力，服务端仍逐项执行授权和状态守卫。— Priority: Must — Source: US-004
- **FR-016** 仅支持 `submit_review/approve/reject/publish/archive`；全部二次确认，`reject/archive` 原因必填，不提供批量上线/下线。— Priority: Must — Source: US-004
- **FR-017** Content 必须持久化无产品数量上限的异步批量任务，提交时冻结目标，Worker 分批逐项事务执行并允许部分成功。— Priority: Must — Source: US-004, US-005
- **FR-018** 任务与逐项结果长期保留、不可取消、仅创建者可查看/重试，且只重试失败项。— Priority: Must — Source: US-005
- **FR-019** UI 必须明确区分加载、空数据、无匹配、错误、进行中、完成和部分完成状态。— Priority: Must — Source: US-001, US-005, US-006
- **FR-020** 每个成功的逐项动作必须复用既有 Operations 成功审计并关联 batch task UUID。— Priority: Must — Source: US-004, US-005
- **FR-021** 新接口必须遵守 ADR-023，并使用已登记的陈旧选择与不可重试任务业务码。— Priority: Must — Source: US-003, US-005
