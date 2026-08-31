---
status: frozen
last_updated: 2026-08-31
---

# 客户端与产品范围治理

本页定义 Platform 中与客户端生命周期、平台公告和产品支持地区有关的稳定业务能力。

## App Version

App Version 负责客户端兼容与升级策略。

它回答：

```text
某客户端版本是否仍受支持？
是否需要提示升级？
是否必须升级后才能继续使用？
当前最低兼容版本是什么？
```

它不负责：

```text
构建安装包
上传应用商店
部署服务器
发布 CI/CD
管理二进制文件
```

这些属于发布与部署基础设施。

## 客户端消费

客户端启动或关键入口可以消费 Platform Version Contract：

```text
Client Version
↓
Platform Version Policy
↓
Supported / Upgrade Recommended / Upgrade Required
```

客户端不能自行把本地版本比较逻辑升级成第二份 canonical policy。

## Announcement

Announcement 是平台级广播信息。

适用于：

```text
全局公告
特定地区公告
特定客户端/范围公告
维护提示
产品级通知信息
```

它不自动等于：

```text
Chat Message
Push Delivery Record
Marketing Campaign
Notification Inbox
```

是否通过 Push/WebSocket 等渠道主动触达属于传输/通知集成，Announcement 自己只拥有平台公告内容与生效范围/生命周期。

## Announcement 生命周期

公告应有明确：

```text
是否启用
生效时间
失效时间（适用时）
展示范围
排序/优先级（若冻结契约包含）
```

历史和当前状态的具体物理表达以数据库设计为准。

## Region

Region 表达**产品支持范围**，不是完整 GIS 或行政区划系统。

它可用于：

- 某地区是否被产品支持；
- Feature Flag Override 的地区 Scope；
- App/Announcement 等需要的平台级范围控制；
- 其他明确跨领域、稳定的地区代码引用。

业务领域需要地区时优先引用稳定 `region_code` / 已冻结 logical identifier，而不是建立跨域物理 FK 到 Platform。

## Region 不负责

Platform Region 不承担：

```text
完整国家/省/市/县层级 GIS
地图坐标
POI
地理搜索
地址标准化
配送区域
业务专属地域规则
```

如果未来出现这些需求，应由新的明确能力或业务领域设计，而不是不断向 `platform.regions` 塞字段。

## 客户端与 Feature Flag

App Version、Region 和 Feature Flag 可以组合用于产品开放策略，但各事实仍然分离：

```text
App Version = 客户端兼容事实
Region      = 产品支持范围事实
Feature Flag = 已实现能力是否开放
```

不要创建一个万能“规则 JSON”把三者混成无法审计的条件引擎。

## 管理链路

后台发布 Announcement、修改 Region 支持状态或维护 App Version Policy 时：

```text
Operations 授权 Operator
↓
Platform Application Service 修改 canonical state
↓
Operations 记录成功后台操作 Audit
```

Platform 保存结果状态，Operations 保存谁执行了管理动作。
