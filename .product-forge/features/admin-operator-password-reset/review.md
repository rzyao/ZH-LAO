# Review Log：后台操作员密码重置

> Feature：`admin-operator-password-reset`｜状态：OPEN｜开始：2026-09-05

## 当前状态：UNDER REVIEW

## 开放问题处理

| # | 问题 | 决定 | 理由 | 修订 |
| --- | --- | --- | --- | --- |
| 1 | 谁可重置哪些目标？ | 仅其他 active Operator；super_admin 目标仅 super_admin 可重置。 | 防止自己重置绕过既有流程及低权限影响特权账号。 | v1.0 |
| 2 | 临时密码如何失效？ | 目标首次登录必须改密。 | 临时秘密不得成为长期共享密码。 | v1.0 |
| 3 | 响应丢失如何处理？ | 不自动重试，禁止读取恢复明文秘密。 | 避免第二份不可控秘密或后门读取。 | v1.0 |
| 4 | 安全操作与审计失败如何处理？ | 凭证、会话撤销、审计同一事务成功或回滚。 | 避免部分成功和无审计的重置。 | v1.0 |

## 决策日志

| 日期 | 决策 | 理由 |
| --- | --- | --- |
| 2026-09-05 | 采用标准轨道和后台专用范围。 | 涉及凭证、会话、RBAC、审计与 Admin UI。 |

## 权威对照

- 一致：Identity 拥有密码/会话；Operations 拥有精确授权和成功审计；统一 API 信封与一次性秘密边界可复用；同库本地事务已有 ADR-025 先例。
- 待修订：现有 frozen `admin_credentials` 没有首次登录强制改密状态；现有 Operations 权限目录和 API 契约没有 `operations.operators.reset_password` 或对应审计动作；现有跨域审计一般规则不包含此命令所需的同事务例外。
- 结论：产品规格可获批准，但 Bridge/Plan 前必须把用户确认的规则提升为对应权威文档并为任何新持久化状态设计前向迁移；不得修改冻结迁移。

## 变更历史

<!-- 首次审核，尚无修订。 -->

## 修订历史

<!-- 尚无修订。 -->

## ✅ APPROVED — 2026-09-05

**Approved by user after 0 revision(s)**

| Document | Status |
| --- | --- |
| product-spec.md | Locked for authority promotion |
| journeys/journeys.yml + JRN-*.md | 3 journeys locked |
| wireframes/ | 2 screens reviewed |
| mockups/ | 2 screens and component map reviewed |

**Status: LOCKED — authority revisions required before SpecKit Bridge**
