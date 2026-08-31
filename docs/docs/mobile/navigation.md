# Mobile 导航结构

当前代码中的导航主链为：

```text
启动 / Session 恢复
  → MainTabs
      → 概览（home）
      → 能力实验室（lab）
      → 设置（settings）
          → 主题
          → 语言设置
              → 语言选择
  → 资源详情（resource/:resourceId）
  → NotFound
```

认证的 [登录页](login.md) → [OTP 验证页](otp.md) 文档已作为 Identity Feature 的页面契约登记；当前 Native Foundation 导航尚未把认证页接入主路由，接入时必须同步更新本页与 Feature 关联。

新增页面必须先在[页面清单](pages.md)登记，并关联一个或多个 Feature；页面与 Feature 是多对多关系。
