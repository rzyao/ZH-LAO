---
status: active
last_updated: 2026-08-31
---

# 移动端开发

Mobile 以**页面、Screen、用户流程和 Journey** 为主线。

```text
用户目标
→ Navigation / Screen Flow
→ 消费 Backend Contract
→ Client State / Server State
→ Loading / Empty / Error / Offline/Retry（适用时）
→ Interaction
→ Integration / E2E
```

移动端不能因为某页面需要多个 Domain，就复制这些 Domain 的 canonical 事实。

## 当前入口

- [Mobile Foundation](foundation/)
- [登录与认证](auth/)

后续学习、发现、聊天、个人资料等功能进入正式实施时，再按用户流程建立目录。

新任务路径：

```text
docs/docs/development/mobile/<flow-or-screen-group>/
```

实现角色仍可使用 Workflow 中的 `client_worker`，但 ZH-LAO 当前产品实施 track 名统一写 `mobile`。
