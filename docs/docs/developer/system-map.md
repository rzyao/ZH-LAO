---
status: baseline
last_updated: 2026-09-02
---

# 系统地图

```text
移动端（用户体验） ─┐
                    ├→ Backend 模块化单体 → PostgreSQL
运营后台（运营体验） ─┘             ├→ 共享资产基础设施
                                     └→ system outbox / 集成基础设施
```

## 业务 Domain

当前正式 Domain 为 Identity、Content、Learning、Audio Production、Social、Chat、Commerce、Rewards、Trust & Safety、Operations、Platform。Domain 拥有业务事实；跨域协作遵循[领域依赖](/developer/reference/architecture/domains/dependencies)和对应 ADR。

## 三条实现轨

- Backend 按 Domain / capability 组织。
- Admin 按页面、工作台和运营流程组织。
- Mobile 按页面、用户流程和旅程组织。

同一 Product Feature 可以跨多条轨；Feature Page 只表达端到端交付关系，不改变 Domain 所有权。

当前功能覆盖为 103 个 Feature detail 页面，跨 11 个正式 Domain/主领域分组。只有登录与老挝语字母两个试点有本轮代码/测试核验；其余功能的参与系统只能按产品记录和 Domain authority 追踪，不能视为已集成。详细分层计数见 `docs/docs/developer/feature-catalog.json`。

## 事实入口

- [总体架构](/developer/reference/architecture/overview)
- [领域总览](/developer/reference/domains/)
- [应用架构](/developer/reference/architecture/applications/clients)
- [数据库规范](/developer/reference/architecture/data/postgresql)
- [当前开发方式](development-workflow)
