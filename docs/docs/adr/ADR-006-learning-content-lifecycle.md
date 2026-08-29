---
status: frozen
date: 2026-08-30
---

# ADR-006：Learning Content 不物理删除

核心 Learning Content 被课程、练习、词典和用户学习记录引用。下架使用 `contents.status=disabled/archived`，不使用物理删除或通用 ON DELETE CASCADE；组成关系和运营草稿可按编辑需要调整。
