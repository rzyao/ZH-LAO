---
status: active
last_updated: 2026-08-31
---

# 后端开发

Backend 以 **Domain / Domain capability** 为主线。

```text
产品与业务事实
→ Domain Contract
→ Application Service
→ Public/API Contract
→ Repository / Infrastructure Adapter
→ Tests / Gate
```

后端不得按页面组织，也不得按数据库表生成 CRUD 边界。

## 当前领域入口

- [应用基础](foundation/)
- [身份](identity/)
- [平台](platform/)
- [运营](operations/)
- [内容](content/)
- [学习](learning/)
- [音频生产](audio/)

Social / Chat / Commerce / Rewards / Trust 等后续 Backend Task 建立时，直接在本目录按 Domain 新建，不再建立新的数字 Phase 目录。

## 新任务路径

```text
docs/docs/development/backend/<domain-or-capability>/
```

推荐工件：

```text
<TASK>_EXECUTION_BRIEF.md
<TASK>_IMPLEMENTATION_BLUEPRINT.md
<TASK>_IMPLEMENTATION_REPORT.md
<TASK>_RECOVERY_BRIEF.md   # 需要时
```

历史 Phase 目录只保存旧证据，不再新增文件。
