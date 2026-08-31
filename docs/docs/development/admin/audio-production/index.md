---
status: planned
last_updated: 2026-08-31
---

# 音频生产工作台

这是 [音频生产 Feature](/features/audio-production/) 的 Admin 实施入口。

组织方式以运营流程为主：

```text
任务队列
→ 生产（TTS / 人工）
→ 候选版本
→ 审核
→ 发布
→ 批量操作 / Preset（按冻结范围）
```

相关 authority：

- [音频生产领域](/domains/audio/)
- [Audio Backend](/development/backend/audio/)
- [运营 RBAC](/domains/operations/rbac)

当前尚未建立正式 Admin Execution Brief / Blueprint / Report。建立任务时应直接写入本目录，不在 Audio Domain Backend 目录里创建 `*_ADMIN_*` 文件。
