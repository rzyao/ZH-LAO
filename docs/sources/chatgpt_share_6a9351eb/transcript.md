# 设计平台域

_消息数：33　总字符：66231_


---

### [01] SYSTEM　status=finished_successfully

_(empty)_


---

### [02] SYSTEM　status=finished_successfully

_(empty)_


---

### [03] USER　status=finished_successfully

[继续设计运营域](chatgpt-conversation://6a9331b7-cdb4-83ea-996b-dc771d59f5ab)[数据库域设计](chatgpt-conversation://6a92f0c0-90b4-83ea-a43d-cccb1ef2666d)[继续设计社交资料](chatgpt-conversation://6a931551-8a30-83e9-8caf-60e529abce68)[设计聊天领域](chatgpt-conversation://6a9319c2-2204-83ea-9341-7a57757a3082)[继续设计商业领域](chatgpt-conversation://6a932385-7404-83ea-951b-e0df2fabaccc)[设计奖励域](chatgpt-conversation://6a9329c0-aea8-83ea-8f36-c7779057fc07)[设计安全治理域](chatgpt-conversation://6a932d56-5fdc-83ea-a8a8-abee14667d25)继续设计 Platform  **Domain**  。请承接之前已经确定的整体架构和数据库设计原则。  不能越过域边界


---

### [04] SYSTEM　status=finished_successfully

_(empty)_


---

### [05] SYSTEM　status=finished_successfully

_(empty)_


---

### [06] SYSTEM　status=finished_successfully

_(empty)_


---

### [07] ASSISTANT　status=finished_successfully

_(empty)_


---

### [08] ASSISTANT　status=finished_successfully

我会严格承接前面已经定下来的领域边界与数据库原则，先把 **Platform Domain 的职责边界和表清单定死**，再逐张表做字段、约束、索引和状态枚举，避免和 Operations / Trust & Safety / Commerce / Rewards / Social / Chat 重叠。


---

### [09] ASSISTANT　status=finished_successfully

The output of this plugin was redacted.


---

### [10] ASSISTANT　status=finished_successfully

_(empty)_


---

### [11] ASSISTANT　status=finished_successfully

_(empty)_


---

### [12] ASSISTANT　status=finished_successfully

可以。我们现在正式进入 **Platform Domain**。

承接前面已经定下来的架构：当前是**模块化单体 + 单 PostgreSQL + 按领域 schema 隔离**，Platform 使用 `platform` schema；跨域可以保留 FK，但**Platform 不能因为“平台”二字变成所有业务配置的垃圾桶**。此前对它的初始定位是：**Feature Flags、平台级产品/运行配置、App Version、系统公告、地区配置**。memcite

## 1. Platform Domain 的定位

我建议把 Platform 定义成：

> **负责整个产品运行过程中，与具体业务领域无关的横向产品控制能力。**

它解决的不是“用户做了什么业务”，而是：

- 某个功能当前是否开放；
- 某个客户端版本是否还能使用；
- 产品当前支持哪些国家/地区；
- 是否向用户展示全局公告；
- 某些真正跨业务域的运行参数是什么。

因此它本质上更接近：

**Product Runtime Control Plane**

而不是后台运营域，也不是“公共表集合”。

---

# 2. Platform Domain 明确不能做什么

这是本域最重要的一步。

### Identity Domain

Platform 不负责：

- 用户账号
- 登录
- 用户状态
- 用户角色
- 用户权限
- 用户封禁

即使 Feature Flag 将来针对某个用户，也只能：

```text
platform -> identity.users.id
```

引用用户身份，不能拥有用户。

---

### Social Domain

不放：

- 社交资料开关
- Match 状态
- Follow 状态
- 发现偏好
- 社交可见性状态

例如：

> 用户是否暂停被推荐

这是 **Social Domain**。

但：

> 整个产品是否开放“发现”功能

可以是 **Platform Feature Flag**。

---

### Chat / Messaging Domain

不放：

- 聊天开关状态
- 会话状态
- 消息限制
- 禁言状态
- 消息保留策略业务状态

但是：

> 新版本聊天 UI 是否灰度开放

属于 Platform Feature Flag。

---

### Commerce Domain

绝对不能把这些放进所谓“平台配置”：

```text
gift_price
exchange_rate
product_price
payment_limit
refund_rule
wallet_rule
```

它们全部仍然属于 Commerce。

**不能通过 `platform.configs` 绕过 Commerce 的领域边界。**

---

### Rewards Domain

同理：

```text
reward_amount
reward_rule
reward_limit
campaign_reward
```

都属于 Rewards。

不能因为这些规则“可以配置”就塞进 Platform。

---

### Trust & Safety Domain

不负责：

- 举报规则
- 封禁策略
- 审核结果
- moderation
- risk decision
- block / restriction
- 处罚记录

例如：

> 色情图片判定阈值

即使它是数字配置，也属于 Trust & Safety，而不是 Platform。

---

### Operations Domain

这一点尤其容易混淆。

**Operations 管“谁在后台进行了什么运营操作”。**

**Platform 管“产品当前运行成什么状态”。**

例如：

```text
运营人员发布公告
```

可以表现为：

```text
Operations
    ↓ command
Platform
    ↓
platform.announcements
```

公告本身属于 Platform；

操作者、后台权限、操作审计属于 Operations。

同样：

```text
运营人员关闭 feature flag
```

最终状态：

```text
platform.feature_flags
```

操作审计：

```text
operations.*
```

两边不能合并。

---

# 3. 我建议 Platform Domain 最终只承担 5 类能力

经过领域边界收紧后，我建议当前版本 Platform 不要做得太大。

初步定为 **5 个子模块**：

| 子模块 | 职责 |
|---|---|
| Feature Flags | 产品功能开启、关闭、灰度 |
| Runtime Config | 真正跨领域的运行时产品参数 |
| App Versions | 客户端版本生命周期与升级要求 |
| Announcements | 全局系统公告 |
| Regions | 产品支持地区及基础区域配置 |

但是这里有一个关键区别：

**5 个能力 ≠ 5 张表。**

Feature Flag 很可能需要拆定义和覆盖规则。

所以当前我建议 Platform 最终候选为 **6 张表**。

---

# 4. Platform Domain 候选表

## ① `platform.feature_flags`

Feature Flag 的**定义表**。

例如：

```text
social_discovery
chat_image_message
gift_sending
new_homepage
```

它回答：

> “这个开关是什么？”

而不是保存复杂业务规则。

核心概念：

```text
feature_flags

id
key
name
description

status
default_enabled

created_at
updated_at
```

其中：

```text
key
```

是代码使用的稳定标识。

比如：

```text
social.discovery.enabled
chat.image_message.enabled
```

或者更建议保持简单：

```text
social_discovery
chat_image_message
```

具体命名等逐表定稿时确定。

---

# 5. 为什么 Feature Flag 需要第二张表

如果只有：

```text
default_enabled
```

以后你马上会遇到：

> 老挝开放，中国暂不开。

或者：

> Android 开，iOS 暂不开。

或者：

> 新版本开放，旧版本关闭。

所以我建议第二张：

## ② `platform.feature_flag_overrides`

表示某个 Feature Flag 在特定范围内覆盖默认值。

例如：

```text
social_discovery

default = false

LA -> true
CN -> false
```

或者：

```text
new_chat_ui

default = false

android -> true
ios -> false
```

但这里必须非常克制。

V1 不建议直接做：

```text
复杂用户标签
百分比实验
AB Test
动态表达式
JSON 条件 DSL
```

否则 Platform 会瞬间变成 LaunchDarkly 的半成品。

第一阶段只支持有限 scope。

后面逐表设计时再决定：

```text
global
region
client_platform
```

是否足够。

---

# 6. `platform.runtime_configs`

## ③ `platform.runtime_configs`

这是整个 Platform 最危险的一张表。

因为它非常容易最终变成：

> 不知道东西放哪就放 config。

所以我要先给它立一条硬规则：

> **只有无法自然归属任何业务 Domain，并且属于整个产品运行环境的动态参数，才允许进入 `runtime_configs`。**

可以放：

```text
maintenance_mode
support_contact
default_locale
upload_public_max_size
```

但最后一个例子也需要看 Media Domain 是否存在；如果 Media 自己拥有配置，就不能放 Platform。

不能放：

```text
match_daily_limit
gift_price
reward_coin_amount
report_threshold
message_rate_limit
```

因为这些都能明确找到领域 owner。

因此我甚至建议：

> **宁愿少用 `runtime_configs`，也不要为了“可配置”而把业务规则迁到 Platform。**

表结构也不会设计成几十个字段，而是一个受控配置注册表。

大致：

```text
id
key
value_type
value
description
status
created_at
updated_at
```

是否使用 `jsonb`，我们后面单独审。

我倾向于允许 JSONB，因为这里属于前面原则中明确适合 JSONB 的**动态结构数据**，但必须配 `value_type` 和应用层校验。memcite

---

# 7. `platform.app_versions`

## ④ `platform.app_versions`

负责 App 客户端版本。

例如：

```text
Android 2.3.0
iOS 2.3.1
```

保存：

```text
client_platform
version
build_number

release_status

is_supported
is_update_required

released_at
created_at
updated_at
```

但这里我倾向后面进一步优化，不直接使用：

```text
is_supported
is_update_required
```

两个容易产生矛盾的布尔值。

更可能设计成：

```text
status
update_policy
```

例如：

```text
status:
draft
active
deprecated
blocked

update_policy:
none
optional
required
```

然后建立 CHECK。

这张表将负责这样的判断：

> 当前 Android 1.8.0 是否必须升级？

它**不负责发布 APK / IPA 文件本身**。

客户端包、对象存储等属于部署/基础设施，不应该数据库业务化。

---

# 8. `platform.announcements`

## ⑤ `platform.announcements`

保存产品级公告。

例如：

> 系统维护通知

> 新版本发布通知

> 服务条款更新提醒

> 某地区服务暂时不可用

核心字段大概会有：

```text
id
public_id

title
content

status
starts_at
ends_at

created_at
updated_at
```

还要考虑：

```text
audience
region
client_platform
```

但这里不能一下设计成营销 Campaign 系统。

Platform Announcement 第一阶段应该只是：

> **平台向用户广播的平台级信息。**

不是：

- 营销推送系统
- 私信系统
- Chat 系统消息
- Notification Center
- 广告系统

这些必须继续隔离。

---

# 9. `platform.regions`

## ⑥ `platform.regions`

这张表定义：

> 产品层面支持哪些国家/地区。

例如：

```text
CN
LA
```

而不是保存地址。

大致：

```text
id
code
name
status

default_locale
timezone

created_at
updated_at
```

但 `name` 是否数据库存多语言文本，还需要结合我们后面 Localization 的设计。

这张表可以成为一些跨域地区 FK 的稳定来源：

```text
platform.regions.id
```

但要特别注意：

> `platform.regions` 表示“产品支持地区”，不是地理数据库。

所以第一阶段不要扩展成：

```text
countries
provinces
cities
districts
streets
```

否则完全跑偏。

---

# 10. 当前 Platform Domain 结构

因此我建议先把本域框定为：

```text
platform
│
├── feature_flags
├── feature_flag_overrides
│
├── runtime_configs
│
├── app_versions
│
├── announcements
│
└── regions
```

**共 6 张表。**

---

# 11. 有几个东西我明确建议现在不建

不要因为 Platform 是最后几个基础域之一，就试图一次覆盖全部基础设施。

暂时不建：

```text
platform.settings
platform.system_settings
platform.metadata
platform.parameters
platform.dictionaries
platform.enums
platform.audit_logs
platform.jobs
platform.tasks
platform.cron_jobs
platform.events
platform.notifications
platform.logs
platform.files
```

特别是：

```text
system_settings
```

这种万能表，我建议禁止。

我们宁愿后来发现一个稳定的新能力，再单独建表，也不要提前制造一个无边界的配置中心。

---

# 12. Platform 的核心领域规则

这一组可以直接作为后面所有表设计的约束。

**P1**

Platform 只拥有**跨业务领域的产品运行控制数据**。

---

**P2**

任何可以明确归属某个业务域的配置，都必须回到对应 Domain。

```text
Business Rule ≠ Platform Config
```

这是整个 Platform 最重要的原则。

---

**P3**

Operations 可以管理 Platform，但不能拥有 Platform 数据。

```text
Operations = actor / workflow / audit

Platform = resulting product runtime state
```

---

**P4**

Platform 可以引用其他 Domain 的 ID，但不能修改其他 Domain 的状态。

---

**P5**

Feature Flag 不得代替正常领域状态机。

错误：

```text
feature_flag:
user_123_is_banned = true
```

正确：

```text
trust.xxx.status = banned
```

---

**P6**

Runtime Config 不得成为跨域业务规则仓库。

---

**P7**

App Version 只描述客户端兼容与升级策略，不承担部署系统职责。

---

**P8**

Announcement 是平台广播信息，不演化成 Messaging / Notification / Marketing Campaign。

---

**P9**

Region 是产品支持范围，不建设完整 GIS / 行政区划系统。

---

# 13. 和我们之前的数据库原则保持一致

后续这 6 张表继续按照已经定下来的规则逐张审：

```text
schema             platform
table              plural + snake_case
primary key        BIGINT identity
public entity      按需 public_id
timestamp          timestamptz
default timestamps created_at / updated_at
status             varchar + CHECK
JSONB              仅真正动态结构
cross-schema FK    保留
soft delete        只有确有业务意义才增加
```

不会为了“统一”机械增加：

```text
deleted_at
created_by
updated_by
metadata
extra
remark
```

这些字段。memcite

---

## Platform Domain V1 暂定

最终先锁住这 **6 张候选表**：

```text
platform.feature_flags
platform.feature_flag_overrides
platform.runtime_configs
platform.app_versions
platform.announcements
platform.regions
```

其中我认为需要重点审查的是 **`runtime_configs`**：它可以存在，但必须被严格限制，否则最容易破坏领域架构。

下一步建议就像前几个 Domain 一样，**逐张定稿**。从第一张 **`platform.feature_flags`** 开始，把字段、FK、UNIQUE、CHECK、INDEX、状态枚举，以及与 `feature_flag_overrides` 的职责边界一次定死。 memcite


---

### [13] USER　status=finished_successfully

**逐张定稿**。从第一张 **`platform.feature_flags`** 开始，把字段、FK、UNIQUE、CHECK、INDEX、状态枚举，以及与 `feature_flag_overrides` 的职责边界一次定死。


---

### [14] ASSISTANT　status=finished_successfully

_(empty)_


---

### [15] ASSISTANT　status=finished_successfully

这一张我会按“**定义表只描述 Flag 本身，覆盖规则全部下沉到 overrides**”来收紧。这样 `feature_flags` 不会混入地区、客户端、用户、灰度条件，也不会演化成规则引擎。


---

### [16] ASSISTANT　status=finished_successfully

_(empty)_


---

### [17] ASSISTANT　status=finished_successfully

_(empty)_


---

### [18] ASSISTANT　status=finished_successfully

# `platform.feature_flags` 最终定稿

这张表只负责一件事：

> **定义一个 Feature Flag 是什么，以及没有命中任何覆盖规则时的默认行为。**

它不负责地区、客户端、用户、时间、百分比灰度或其他条件。

## 1. 最终字段

| 字段 | 类型 | NULL | 默认值 | 说明 |
|---|---|---:|---|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — | 内部主键 |
| `key` | `VARCHAR(100)` | NO | — | 程序使用的稳定唯一标识 |
| `name` | `VARCHAR(120)` | NO | — | 后台可读名称 |
| `description` | `TEXT` | YES | — | Flag 用途说明 |
| `default_enabled` | `BOOLEAN` | NO | `FALSE` | 未命中 override 时的默认值 |
| `status` | `VARCHAR(16)` | NO | `'active'` | Flag 生命周期 / 总开关状态 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 最后更新时间 |

**总计：8 个字段。**

不增加：

```text
public_id
deleted_at
created_by
updated_by
metadata
config
conditions
region_id
client_platform
starts_at
ends_at
rollout_percentage
```

理由后面统一说明。

---

# 2. `key` 定义

`key` 是这张表最重要的业务标识。

例如：

```text
social_discovery
chat_image_message
commerce_gift_sending
rewards_daily_checkin
```

建议采用：

```text
lower_snake_case
```

规则：

```text
^[a-z][a-z0-9_]{0,99}$
```

也就是说：

- 必须小写字母开头；
- 只能包含 `a-z / 0-9 / _`；
- 不允许空格；
- 不允许 `-`；
- 不允许大小写混用；
- 不允许中文；
- 最长 100 字符。

### 最重要的领域规则

**Flag 一旦进入代码使用，`key` 不允许修改。**

例如已经发布：

```text
social_discovery
```

以后不能改成：

```text
social_discover
```

应该把它视为类似 API identifier。

`name` 和 `description` 可以修改。

---

# 3. 为什么 `name` 不 UNIQUE

例如可以存在：

```text
key: social_discovery
name: 社交发现

key: social_discovery_v2
name: 社交发现
```

后台显示名称重复并不会造成程序歧义。

真正的唯一身份是：

```text
key
```

所以：

```sql
UNIQUE (key)
```

但：

```sql
UNIQUE (name)
```

不要建立。

---

# 4. `default_enabled`

定义：

> 当 Flag 处于 `active` 状态，并且没有命中任何 `feature_flag_overrides` 时采用的结果。

例如：

```text
key             social_discovery
default_enabled false
status          active
```

如果没有任何 override：

```text
social_discovery = false
```

如果以后：

```text
LA -> true
```

那么：

```text
Laos用户    true
其他范围    false
```

所以 `default_enabled` 是：

> **fallback value**

而不是整个 Feature Flag 的“总开关”。

这是后面设计里非常重要的区别。

---

# 5. `status` 最终枚举

定为三个：

```text
active
inactive
retired
```

不增加：

```text
draft
enabled
disabled
deleted
archived
expired
```

## `active`

Flag 正常参与求值：

```text
override
   ↓
default_enabled
```

---

## `inactive`

临时停用。

语义：

> **无论 default_enabled 和 override 是什么，求值结果强制为 `false`。**

例如：

```text
social_discovery

status          inactive
default_enabled true

LA override     true
Android         true
```

最终全部：

```text
false
```

这是 Platform 的 **master kill switch**。

很重要。

否则遇到紧急事故时，你可能必须：

1. 修改 `default_enabled`;
2. 删除地区 overrides；
3. 删除客户端 overrides；
4. 检查是不是还有其他 override。

这显然不合理。

现在只需要：

```text
status = inactive
```

整个功能立即关闭。

---

## `retired`

表示这个 Flag 已永久退出产品。

求值：

```text
false
```

并且：

> 不允许重新启用。

区别：

```text
inactive
```

可以：

```text
inactive → active
```

而：

```text
retired
```

是终态：

```text
active → retired
inactive → retired
```

之后不允许：

```text
retired → active
retired → inactive
```

数据库 CHECK 无法可靠约束状态转移历史，所以这是 **Platform Domain Service 强约束**。

---

# 6. 为什么不是 `is_enabled`

不能设计成：

```text
is_enabled
default_enabled
```

因为两个 boolean 很容易让开发者不知道区别。

例如：

```text
is_enabled = false
default_enabled = true
```

到底是什么状态？

现在通过：

```text
status
default_enabled
```

语义很明确：

| status | default_enabled | 结果 |
|---|---:|---|
| `active` | `true` | 默认 true，可被 override |
| `active` | `false` | 默认 false，可被 override |
| `inactive` | 任意 | 强制 false |
| `retired` | 任意 | 强制 false |

这两个字段不是重复数据。

---

# 7. Flag 最终求值规则

这一条现在正式定下来。

Feature Flag evaluation：

```text
                 ┌─ inactive → false
feature flag ────┼─ retired  → false
                 │
                 └─ active
                       │
                       ▼
              查找 matching override
                       │
              ┌────────┴────────┐
              │                 │
            命中              未命中
              │                 │
              ▼                 ▼
       override.enabled   default_enabled
```

所以：

### 第一优先级

```text
feature_flags.status
```

### 第二优先级

```text
feature_flag_overrides
```

### 第三优先级

```text
feature_flags.default_enabled
```

这套模型后面不再改变。

---

# 8. `retired` 后为什么不删除

Feature Flag 不做：

```text
DELETE FROM platform.feature_flags
```

尤其已经投入生产使用的 Flag。

原因包括：

- Operations 审计历史仍然引用它；
- override 历史可能引用它；
- 日志里可能记录它；
- 后台操作记录可能记录它；
- 避免旧 key 被错误复用。

所以：

```text
retired
```

就是 Feature Flag 的逻辑终态。

因此这张表：

**不需要 `deleted_at`。**

---

# 9. `key` 永远不能复用

例如：

```text
social_discovery
```

已经：

```text
status = retired
```

以后重新开发一个完全不同的新功能，也不能：

```text
INSERT key='social_discovery'
```

因为 UNIQUE 本身就会阻止。

正确做法：

```text
social_discovery_v2
```

或者使用真正的新功能 key。

所以我们**绝对不允许因为 retired 就删除记录以释放 key**。

---

# 10. FK 最终定稿

这张表：

> **0 个 FK。**

因为它是 Feature Flag 聚合的 root。

不会出现：

```text
region_id
user_id
operator_id
app_version_id
```

这些字段。

关系方向是：

```text
platform.feature_flags
        ↑
        │ FK
platform.feature_flag_overrides
```

即：

```text
feature_flag_overrides.feature_flag_id
    REFERENCES platform.feature_flags(id)
```

而不是反过来。

---

# 11. UNIQUE 最终定稿

只有一个业务 UNIQUE：

```sql
UNIQUE (key)
```

最终：

```text
PK
id

UNIQUE
key
```

没有：

```text
UNIQUE(name)
UNIQUE(description)
UNIQUE(status, key)
```

---

# 12. CHECK 最终定稿

### `key`

```sql
CHECK (
    key ~ '^[a-z][a-z0-9_]{0,99}$'
)
```

---

### `name`

禁止：

```text
''
'    '
```

所以：

```sql
CHECK (btrim(name) <> '')
```

---

### `status`

```sql
CHECK (
    status IN (
        'active',
        'inactive',
        'retired'
    )
)
```

---

不对 `description` 做：

```text
CHECK(length(description) > 0)
```

没有必要。

也不人为限制描述文本长度。

---

# 13. INDEX 最终定稿

这里只需要：

### PRIMARY KEY

自动获得：

```text
feature_flags_pkey (id)
```

### UNIQUE INDEX

由：

```sql
UNIQUE (key)
```

自动产生。

因此：

**不额外建立普通索引。**

特别是不建：

```sql
INDEX(status)
INDEX(default_enabled)
INDEX(created_at)
INDEX(updated_at)
INDEX(name)
```

原因很简单：

Feature Flag 表预计数量很小，可能几十甚至几百条。

给：

```text
status
default_enabled
```

这样的低基数字段建索引纯属过度设计。

---

# 14. 最终 PostgreSQL DDL

可以正式定为：

```sql
CREATE TABLE platform.feature_flags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    key VARCHAR(100) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,

    default_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_feature_flags_key
        UNIQUE (key),

    CONSTRAINT ck_feature_flags_key_format
        CHECK (
            key ~ '^[a-z][a-z0-9_]{0,99}$'
        ),

    CONSTRAINT ck_feature_flags_name_not_blank
        CHECK (
            btrim(name) <> ''
        ),

    CONSTRAINT ck_feature_flags_status
        CHECK (
            status IN (
                'active',
                'inactive',
                'retired'
            )
        )
);
```

`updated_at` 如何自动刷新继续使用整个项目统一机制，不为 Platform 单独发明一套 trigger。

---

# 15. 与 `feature_flag_overrides` 的边界正式定死

这是这一轮最重要的部分。

## `feature_flags`

回答：

> **这个功能开关是什么？默认是什么？这个 Flag 当前是否还参与求值？**

保存：

```text
identity
key
name
description

default_enabled

lifecycle / master status
```

---

## `feature_flag_overrides`

回答：

> **针对特定范围，这个 Flag 是否覆盖默认结果？**

例如：

```text
social_discovery
    Laos   -> true
    China  -> false
```

或者：

```text
new_chat_ui
    Android -> true
    iOS     -> false
```

---

因此以下字段 **永远不允许进入 `feature_flags`**：

```text
region_id
country_code

client_platform
app_version

user_id

starts_at
ends_at

rollout_percentage

conditions
rules
segments

override_enabled
```

只要出现：

> “在某种条件下……”

就已经不是 Feature Flag definition，而是：

```text
feature_flag_overrides
```

---

# 16. `default_enabled` 不是一种 override

这一点也正式定死。

不能创建：

```text
scope_type = global
```

然后把全局默认值放到 overrides。

全局 fallback 永远放：

```text
feature_flags.default_enabled
```

否则会出现两个全局真相：

```text
feature_flags.default_enabled
```

和：

```text
feature_flag_overrides(scope=global)
```

系统就会开始产生优先级歧义。

所以：

> **V1 禁止 Global Override。**

需要修改默认行为直接更新：

```text
default_enabled
```

需要无条件紧急关闭：

```text
status = inactive
```

两个场景已经完全覆盖。

---

# 17. `feature_flags` 不允许 JSONB

比如绝对不要：

```text
conditions JSONB
config JSONB
rules JSONB
targets JSONB
```

否则很快就会出现：

```json
{
  "region": ["LA"],
  "platform": ["android"],
  "version": ">2.1.0",
  "percentage": 30
}
```

然后 Platform 就变成了一个没有类型、没有 FK、没有约束的规则引擎。

Feature Flag definition 必须保持完全关系化。

---

# 18. Operations 的边界

也再次固定：

假设管理员关闭：

```text
social_discovery
```

最终状态变化发生在：

```text
platform.feature_flags
```

例如：

```text
status:
active → inactive
```

但：

> 谁操作的、从什么改成什么、什么时候操作、操作原因。

属于：

```text
Operations Domain
```

因此 `feature_flags` 不增加：

```text
created_by_operator_id
updated_by_operator_id
disabled_by
retired_by
```

这些信息不能污染 Platform 聚合。

---

# 19. 不能把业务状态变成 Feature Flag

例如以下全部属于错误设计：

```text
user_123_chat_enabled
user_456_social_enabled

payment_1001_refund_enabled

report_888_valid

user_123_banned
```

Feature Flag 控制的是：

> **产品能力是否开放。**

而不是：

> 某一业务实体当前是什么状态。

这条应该作为 Platform Domain 的不可违反规则。

---

# 20. 本表最终审计结论

### 保留

```text
id
key
name
description
default_enabled
status
created_at
updated_at
```

### 删除 / 不增加

```text
public_id
deleted_at

created_by
updated_by

region_id
client_platform
user_id

starts_at
ends_at

percentage
conditions
rules
metadata
```

### FK

```text
无
```

### UNIQUE

```text
key
```

### CHECK

```text
key format
name nonblank
status enum
```

### INDEX

```text
PRIMARY KEY(id)
UNIQUE(key)
```

没有额外索引。

### Status

```text
active
inactive
retired
```

### 求值优先级

```text
inactive / retired
        ↓
      false

active
  ↓
override
  ↓
default_enabled
```

## `platform.feature_flags` 可以正式定稿。

下一张就是：

```text
platform.feature_flag_overrides
```

这张会比 `feature_flags` 更关键，因为我们需要一次决定清楚 **V1 到底允许哪些 scope、多个 scope 冲突时如何排序、Region 和 Client Platform 是否允许组合、是否允许用户级灰度，以及怎样用 UNIQUE/CHECK 阻止非法组合**。


---

### [19] USER　status=finished_successfully

继续完成所有表


---

### [20] ASSISTANT　status=finished_successfully

我会把剩余 **5 张表一次全部定稿**，并保持和刚才同样的审计标准：字段最小化、边界清晰、FK/UNIQUE/CHECK/INDEX 可直接落 PostgreSQL，最后再给出整个 Platform Domain 的最终总表和不可违反规则。


---

### [21] ASSISTANT　status=finished_successfully

_(empty)_


---

### [22] ASSISTANT　status=finished_successfully

_(empty)_


---

### [23] ASSISTANT　status=finished_successfully

先给出一个关键收敛结论：`feature_flag_overrides` 的 V1 我会只允许 **地区、客户端、地区+客户端** 三种范围，不做用户级灰度、百分比、版本表达式或 JSON 条件。这样既够当前产品使用，又不会把 Platform 做成规则引擎。


---

### [24] ASSISTANT　status=finished_successfully

_(empty)_


---

### [25] ASSISTANT　status=finished_successfully

下面把 Platform Domain 剩余 **5 张表全部定稿**。完成后，Platform V1 就可以锁定为 6 张表，不再继续扩张。

---

# 2. `platform.feature_flag_overrides`

## 职责

只回答：

> 某个 Feature Flag 在特定地区 / 客户端范围内，是否覆盖默认值？

V1 只允许三种 scope：

```text
region
client_platform
region + client_platform
```

明确不支持：

```text
user_id
percentage
segment
app_version expression
starts_at / ends_at
JSON rules
```

## 最终字段

| 字段 | 类型 | NULL | 默认 | 说明 |
|---|---|---:|---|---|
| `id` | `BIGINT IDENTITY` | NO | — | PK |
| `feature_flag_id` | `BIGINT` | NO | — | Feature Flag |
| `region_id` | `BIGINT` | YES | — | 地区范围 |
| `client_platform` | `VARCHAR(16)` | YES | — | 客户端范围 |
| `enabled` | `BOOLEAN` | NO | — | 覆盖后的结果 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新时间 |

只有 **7 个字段**。

### 为什么没有 `status`

Override 本身不是业务实体。

存在：

```text
override row
```

代表覆盖规则有效。

不需要了就：

```text
DELETE override
```

Operations Domain 保留操作审计即可。

因此不需要：

```text
active
inactive
retired
deleted_at
```

---

## FK

```text
feature_flag_id
    → platform.feature_flags.id

region_id
    → platform.regions.id
```

都使用：

```text
ON DELETE RESTRICT
```

因为 Feature Flag 和 Region 本身也不进行物理删除。

---

## Client Platform 枚举

V1：

```text
android
ios
```

暂时不为了未来可能出现的平台提前加入：

```text
web
desktop
mini_program
```

以后真的存在客户端，再通过 migration 扩展 CHECK。

---

# Scope CHECK

不能出现：

```text
region_id = NULL
client_platform = NULL
```

因为这实际上就是 Global Override。

而我们已经确定：

> Global fallback 永远属于 `feature_flags.default_enabled`。

因此：

```sql
CHECK (
    region_id IS NOT NULL
    OR client_platform IS NOT NULL
)
```

---

# UNIQUE：这里不能简单写一个 UNIQUE

错误：

```sql
UNIQUE (
    feature_flag_id,
    region_id,
    client_platform
)
```

因为 PostgreSQL 默认允许多个 `NULL`。

因此采用 **3 个 partial unique indexes**。

### Region Only

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_region
ON platform.feature_flag_overrides (
    feature_flag_id,
    region_id
)
WHERE region_id IS NOT NULL
  AND client_platform IS NULL;
```

### Client Only

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_client
ON platform.feature_flag_overrides (
    feature_flag_id,
    client_platform
)
WHERE region_id IS NULL
  AND client_platform IS NOT NULL;
```

### Region + Client

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_region_client
ON platform.feature_flag_overrides (
    feature_flag_id,
    region_id,
    client_platform
)
WHERE region_id IS NOT NULL
  AND client_platform IS NOT NULL;
```

这样完全杜绝重复规则。

---

# Override 冲突优先级

例如一个老挝 Android 用户同时命中：

```text
region LA          → false
android            → true
LA + android       → true
```

最终优先级正式定为：

```text
1. region + client_platform
2. region
3. client_platform
4. feature_flags.default_enabled
```

原因：

- 组合条件最具体；
- 地区通常承担产品开放范围，比通用客户端开关优先；
- 客户端规则作为更通用的兼容性覆盖。

最终完整求值：

```text
feature_flag.status != active
        ↓
      false

feature_flag.status = active
        ↓
region + platform override
        ↓ no
region override
        ↓ no
platform override
        ↓ no
default_enabled
```

---

## DDL

```sql
CREATE TABLE platform.feature_flag_overrides (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    feature_flag_id BIGINT NOT NULL,
    region_id BIGINT,
    client_platform VARCHAR(16),

    enabled BOOLEAN NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_feature_flag_overrides_flag
        FOREIGN KEY (feature_flag_id)
        REFERENCES platform.feature_flags(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_feature_flag_overrides_region
        FOREIGN KEY (region_id)
        REFERENCES platform.regions(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_feature_flag_overrides_scope
        CHECK (
            region_id IS NOT NULL
            OR client_platform IS NOT NULL
        ),

    CONSTRAINT ck_feature_flag_overrides_client_platform
        CHECK (
            client_platform IS NULL
            OR client_platform IN ('android', 'ios')
        )
);
```

再建立前面的三个 Partial Unique Index。

## 定稿结论

**不需要普通额外索引。**

那三个 UNIQUE INDEX 已经覆盖主要查询路径。

---

# 3. `platform.runtime_configs`

这是 Platform 最需要防止滥用的一张表。

## 职责正式定义

> 保存真正属于整个产品运行层，而不能明确归属某个业务 Domain 的动态参数。

可以：

```text
default_locale
support_email
maintenance_notice_url
```

不能：

```text
gift_price
reward_amount
daily_match_limit
report_threshold
message_limit
refund_days
```

后面这些全部应该返回所属 Domain。

---

# 最终字段

| 字段 | 类型 | NULL | 默认 | 说明 |
|---|---|---:|---|---|
| `id` | `BIGINT IDENTITY` | NO | — | PK |
| `key` | `VARCHAR(100)` | NO | — | 稳定配置 key |
| `value_type` | `VARCHAR(16)` | NO | — | 数据类型 |
| `value` | `JSONB` | NO | — | 配置值 |
| `description` | `TEXT` | YES | — | 用途说明 |
| `status` | `VARCHAR(16)` | NO | `'active'` | 生命周期 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

8 个字段。

---

# 为什么允许 JSONB

这里是少数真正适合 JSONB 的地方。

但：

```text
JSONB ≠ 任意 metadata
```

必须由：

```text
value_type
```

限制其实际类型。

最终允许：

```text
string
integer
number
boolean
json
```

其中：

```text
json
```

只允许：

```text
object
array
```

不允许拿 `json` 类型包装任意 scalar。

---

# Status

只需要：

```text
active
retired
```

不设计：

```text
inactive
```

原因是 Runtime Config 没有 Feature Flag 那样明确的“关闭后返回 false”语义。

如果一个 Config 暂时“不生效”，这往往说明：

- 应该修改配置值；
- 应该通过 Feature Flag 控制功能；
- 或者它本来就属于其他 Domain。

所以不要创造模糊的 `inactive`。

### `retired`

表示：

> 该配置 key 已永久停止使用。

同 Feature Flag：

```text
retired key 不允许重新复用
```

不物理删除。

---

# 敏感数据明确禁止

`runtime_configs` 永远不能存：

```text
password
API secret
private key
database credential
payment secret
JWT signing secret
```

Platform Config 不是 Secret Manager。

---

# CHECK

Key：

```sql
CHECK (
    key ~ '^[a-z][a-z0-9_]{0,99}$'
)
```

Status：

```sql
CHECK (
    status IN ('active', 'retired')
)
```

Value Type：

```sql
CHECK (
    value_type IN (
        'string',
        'integer',
        'number',
        'boolean',
        'json'
    )
)
```

类型一致性也由数据库检查：

```sql
CHECK (
       (value_type = 'string'
        AND jsonb_typeof(value) = 'string')

    OR (value_type = 'integer'
        AND jsonb_typeof(value) = 'number'
        AND (value #>> '{}') ~ '^-?[0-9]+$')

    OR (value_type = 'number'
        AND jsonb_typeof(value) = 'number')

    OR (value_type = 'boolean'
        AND jsonb_typeof(value) = 'boolean')

    OR (value_type = 'json'
        AND jsonb_typeof(value) IN ('object', 'array'))
)
```

---

# UNIQUE / INDEX

```text
UNIQUE(key)
```

足够。

不建：

```text
INDEX(status)
INDEX(value_type)
INDEX(updated_at)
GIN(value)
```

因为 Runtime Config 不应该支持：

> 在 JSON 里面搜索业务数据。

如果需要 GIN 搜索，基本说明这张表被滥用了。

---

## DDL

```sql
CREATE TABLE platform.runtime_configs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    key VARCHAR(100) NOT NULL,
    value_type VARCHAR(16) NOT NULL,
    value JSONB NOT NULL,

    description TEXT,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_runtime_configs_key
        UNIQUE (key),

    CONSTRAINT ck_runtime_configs_key_format
        CHECK (
            key ~ '^[a-z][a-z0-9_]{0,99}$'
        ),

    CONSTRAINT ck_runtime_configs_value_type
        CHECK (
            value_type IN (
                'string',
                'integer',
                'number',
                'boolean',
                'json'
            )
        ),

    CONSTRAINT ck_runtime_configs_status
        CHECK (
            status IN ('active', 'retired')
        ),

    CONSTRAINT ck_runtime_configs_value_matches_type
        CHECK (
               (
                   value_type = 'string'
                   AND jsonb_typeof(value) = 'string'
               )
            OR (
                   value_type = 'integer'
                   AND jsonb_typeof(value) = 'number'
                   AND (value #>> '{}') ~ '^-?[0-9]+$'
               )
            OR (
                   value_type = 'number'
                   AND jsonb_typeof(value) = 'number'
               )
            OR (
                   value_type = 'boolean'
                   AND jsonb_typeof(value) = 'boolean'
               )
            OR (
                   value_type = 'json'
                   AND jsonb_typeof(value) IN ('object', 'array')
               )
        )
);
```

---

# 4. `platform.app_versions`

## 职责

回答：

> 当前客户端 build 是什么生命周期状态，以及用户是否需要升级？

它不负责：

```text
APK
IPA
CDN
发布流水线
应用商店部署
```

---

# 最终字段

| 字段 | 类型 | NULL | 默认 | 说明 |
|---|---|---:|---|---|
| `id` | `BIGINT IDENTITY` | NO | — | PK |
| `client_platform` | `VARCHAR(16)` | NO | — | Android / iOS |
| `version` | `VARCHAR(32)` | NO | — | 用户看到的版本 |
| `build_number` | `BIGINT` | NO | — | 客户端内部 build |
| `status` | `VARCHAR(16)` | NO | `'draft'` | 生命周期 |
| `update_policy` | `VARCHAR(16)` | NO | `'none'` | 升级策略 |
| `release_notes` | `TEXT` | YES | — | 版本说明 |
| `released_at` | `TIMESTAMPTZ` | YES | — | 正式发布时间 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

10 个字段。

---

# Status

最终：

```text
draft
active
deprecated
blocked
```

### `draft`

还未正式发布。

### `active`

正常受支持。

### `deprecated`

仍可使用，但已经进入淘汰阶段。

### `blocked`

不允许继续使用。

---

# `update_policy`

最终：

```text
none
optional
required
```

并不是任意组合。

## 合法组合

| status | update_policy |
|---|---|
| draft | none |
| active | none / optional |
| deprecated | optional |
| blocked | required |

这样不会出现：

```text
blocked + none
draft + required
deprecated + none
```

这种矛盾数据。

---

# 实际客户端语义

### active + none

```text
正常运行
无需提示升级
```

### active + optional

```text
正常运行
可提示已有新版
```

### deprecated + optional

```text
仍允许进入
强烈建议升级
```

### blocked + required

```text
禁止继续
必须升级
```

---

# UNIQUE

最重要的是：

```text
(client_platform, build_number)
```

不能用：

```text
(client_platform, version)
```

因为现实中完全可能：

```text
version = 2.3.0
build 23001

version = 2.3.0
build 23002
```

属于同一个营销版本的不同构建。

---

# CHECK

```text
client_platform:
android
ios
```

```sql
CHECK (build_number > 0)
```

Version：

```sql
CHECK (btrim(version) <> '')
```

不强制 SemVer regex。

因为：

```text
1.2
1.2.3
1.2.3-beta
2026.08
```

不同发布策略都可能合理。

不要在数据库里过度绑定 SemVer。

---

# released_at

规则：

```text
draft → released_at IS NULL
其他状态 → released_at IS NOT NULL
```

---

## INDEX

唯一索引：

```text
(client_platform, build_number)
```

已经覆盖客户端最关键查询：

```text
Android + build 123
```

版本表本身非常小，不再建：

```text
INDEX(status)
INDEX(released_at)
```

---

## DDL

```sql
CREATE TABLE platform.app_versions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    client_platform VARCHAR(16) NOT NULL,

    version VARCHAR(32) NOT NULL,
    build_number BIGINT NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    update_policy VARCHAR(16) NOT NULL DEFAULT 'none',

    release_notes TEXT,
    released_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_app_versions_platform_build
        UNIQUE (client_platform, build_number),

    CONSTRAINT ck_app_versions_client_platform
        CHECK (
            client_platform IN ('android', 'ios')
        ),

    CONSTRAINT ck_app_versions_version_not_blank
        CHECK (
            btrim(version) <> ''
        ),

    CONSTRAINT ck_app_versions_build_number
        CHECK (
            build_number > 0
        ),

    CONSTRAINT ck_app_versions_status
        CHECK (
            status IN (
                'draft',
                'active',
                'deprecated',
                'blocked'
            )
        ),

    CONSTRAINT ck_app_versions_update_policy
        CHECK (
            update_policy IN (
                'none',
                'optional',
                'required'
            )
        ),

    CONSTRAINT ck_app_versions_status_policy
        CHECK (
               (status = 'draft'
                AND update_policy = 'none')
            OR (status = 'active'
                AND update_policy IN ('none', 'optional'))
            OR (status = 'deprecated'
                AND update_policy = 'optional')
            OR (status = 'blocked'
                AND update_policy = 'required')
        ),

    CONSTRAINT ck_app_versions_released_at
        CHECK (
               (status = 'draft' AND released_at IS NULL)
            OR (status <> 'draft' AND released_at IS NOT NULL)
        )
);
```

状态转移由应用层保证：

```text
draft
 ↓
active
 ↓
deprecated
 ↓
blocked
```

允许根据实际情况：

```text
active → blocked
```

紧急封锁。

但不能：

```text
blocked → active
```

除非显式设计“解除封锁”的业务动作；V1 视 `blocked` 为终态。

---

# 5. `platform.announcements`

## 职责

平台向用户展示的**全局或范围型公告**。

例如：

```text
系统维护
功能上线
服务异常通知
平台政策更新
地区服务通知
```

不是：

```text
Chat system message
marketing campaign
push notification
user inbox
运营私信
```

---

# 最终字段

| 字段 | 类型 | NULL | 默认 | 说明 |
|---|---|---:|---|---|
| `id` | `BIGINT IDENTITY` | NO | — | 内部 PK |
| `public_id` | `UUID` | NO | `gen_random_uuid()` | 对外 ID |
| `title` | `VARCHAR(200)` | NO | — | 标题 |
| `content` | `TEXT` | NO | — | 正文 |
| `region_id` | `BIGINT` | YES | — | 地区范围 |
| `client_platform` | `VARCHAR(16)` | YES | — | 客户端范围 |
| `status` | `VARCHAR(16)` | NO | `'draft'` | 生命周期 |
| `starts_at` | `TIMESTAMPTZ` | YES | — | 开始展示 |
| `ends_at` | `TIMESTAMPTZ` | YES | — | 结束展示 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

11 个字段。

---

# 公告 Scope

这里和 Feature Flag 不一样。

两个字段都 NULL：

```text
region_id       NULL
client_platform NULL
```

是合法的。

含义：

> 全平台公告。

因此支持：

```text
Global

Region

Client Platform

Region + Client Platform
```

---

# Status

最终：

```text
draft
published
retired
```

### `draft`

未发布。

### `published`

已经进入发布状态。

是否当前真正可见，还要看时间：

```text
starts_at <= now()
AND
(
    ends_at IS NULL
    OR ends_at > now()
)
```

### `retired`

人工终止或历史归档，不再展示。

---

# 为什么不需要 `scheduled`

因为：

```text
published
+
starts_at > now()
```

天然就等于 Scheduled。

不需要制造重复状态。

---

# 为什么不需要 `expired`

因为：

```text
ends_at <= now()
```

天然已经表达 Expired。

状态机不应该重复存储可以计算出来的事实。

所以：

```text
expired
```

不进入数据库枚举。

---

# FK

```text
region_id
    → platform.regions.id
```

`ON DELETE RESTRICT`

---

# CHECK

标题：

```sql
CHECK (btrim(title) <> '')
```

正文：

```sql
CHECK (btrim(content) <> '')
```

Client：

```text
android
ios
```

时间：

```sql
CHECK (
    ends_at IS NULL
    OR (
        starts_at IS NOT NULL
        AND ends_at > starts_at
    )
)
```

已经进入 `published`：

```text
starts_at 必须存在
```

即：

```sql
CHECK (
    status <> 'published'
    OR starts_at IS NOT NULL
)
```

---

# UNIQUE

```text
public_id
```

不限制：

```text
title
```

因为同名公告完全合理。

---

# INDEX

公告是 Platform 中唯一值得单独建立读取索引的表。

客户端会频繁查询：

```text
status = published
starts_at <= now()
```

因此：

```sql
CREATE INDEX idx_announcements_published_starts_at
ON platform.announcements (starts_at DESC)
WHERE status = 'published';
```

暂时不再为：

```text
region_id
client_platform
ends_at
```

分别建立索引。

公告规模在第一阶段不会大，没必要堆索引。

---

## DDL

```sql
CREATE TABLE platform.announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    public_id UUID NOT NULL DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    region_id BIGINT,
    client_platform VARCHAR(16),

    status VARCHAR(16) NOT NULL DEFAULT 'draft',

    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_announcements_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_announcements_region
        FOREIGN KEY (region_id)
        REFERENCES platform.regions(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_announcements_title_not_blank
        CHECK (
            btrim(title) <> ''
        ),

    CONSTRAINT ck_announcements_content_not_blank
        CHECK (
            btrim(content) <> ''
        ),

    CONSTRAINT ck_announcements_client_platform
        CHECK (
            client_platform IS NULL
            OR client_platform IN ('android', 'ios')
        ),

    CONSTRAINT ck_announcements_status
        CHECK (
            status IN (
                'draft',
                'published',
                'retired'
            )
        ),

    CONSTRAINT ck_announcements_time_window
        CHECK (
            ends_at IS NULL
            OR (
                starts_at IS NOT NULL
                AND ends_at > starts_at
            )
        ),

    CONSTRAINT ck_announcements_published_start
        CHECK (
            status <> 'published'
            OR starts_at IS NOT NULL
        )
);

CREATE INDEX idx_announcements_published_starts_at
ON platform.announcements (starts_at DESC)
WHERE status = 'published';
```

---

# 6. `platform.regions`

最后一张。

## 职责

定义：

> 产品层面支持或识别的市场 / 地区。

第一阶段：

```text
CN
LA
```

它不是：

```text
世界国家数据库
省市区数据库
GIS
用户地址表
IP 地理定位库
```

---

# 最终字段

| 字段 | 类型 | NULL | 默认 | 说明 |
|---|---|---:|---|---|
| `id` | `BIGINT IDENTITY` | NO | — | PK |
| `code` | `VARCHAR(8)` | NO | — | 稳定地区代码 |
| `name` | `VARCHAR(100)` | NO | — | 内部可读名称 |
| `default_locale` | `VARCHAR(16)` | NO | — | 默认语言环境 |
| `timezone` | `VARCHAR(64)` | NO | — | 默认 IANA timezone |
| `status` | `VARCHAR(16)` | NO | `'active'` | 生命周期 |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | 创建 |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | 更新 |

8 个字段。

---

# Code

例如：

```text
CN
LA
```

要求：

```text
大写
稳定
不复用
```

允许未来出现产品自定义地区代码，因此不强制：

```text
CHAR(2)
```

而是：

```text
VARCHAR(8)
```

格式：

```sql
^[A-Z][A-Z0-9_]{1,7}$
```

这样：

```text
CN
LA
HK
SEA
```

都可以表达。

但不要滥用为行政区域。

---

# `default_locale`

示例：

```text
CN → zh-CN
LA → lo-LA
```

这里只是：

> 没有更明确用户语言设置时的平台默认值。

不是用户语言偏好。

用户自己的 locale 应属于用户 / Identity/Profile 相关领域。

---

# `timezone`

保存 IANA timezone，例如：

```text
Asia/Shanghai
Asia/Vientiane
```

数据库只做：

```text
非空
非空字符串
```

不自己维护一份 IANA 枚举。

合法性由应用层验证。

---

# Status

最终：

```text
active
inactive
retired
```

### active

平台正常支持。

### inactive

暂时停止新功能或服务，但仍保留历史引用。

### retired

永久退出。

`retired` 为终态。

---

# UNIQUE

```text
UNIQUE(code)
```

`name` 不 UNIQUE。

例如不同业务市场理论上可能出现相同显示名称，真正 identity 是 `code`。

---

# INDEX

只有：

```text
PK(id)
UNIQUE(code)
```

不需要：

```text
INDEX(status)
INDEX(default_locale)
INDEX(timezone)
```

Regions 表永远很小。

---

## DDL

```sql
CREATE TABLE platform.regions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    code VARCHAR(8) NOT NULL,
    name VARCHAR(100) NOT NULL,

    default_locale VARCHAR(16) NOT NULL,
    timezone VARCHAR(64) NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_regions_code
        UNIQUE (code),

    CONSTRAINT ck_regions_code_format
        CHECK (
            code ~ '^[A-Z][A-Z0-9_]{1,7}$'
        ),

    CONSTRAINT ck_regions_name_not_blank
        CHECK (
            btrim(name) <> ''
        ),

    CONSTRAINT ck_regions_default_locale_not_blank
        CHECK (
            btrim(default_locale) <> ''
        ),

    CONSTRAINT ck_regions_timezone_not_blank
        CHECK (
            btrim(timezone) <> ''
        ),

    CONSTRAINT ck_regions_status
        CHECK (
            status IN (
                'active',
                'inactive',
                'retired'
            )
        )
);
```

---

# Platform Domain 最终定稿

现在整个 V1 Platform Domain 正式收敛到 **6 张表**：

| 表 | 职责 |
|---|---|
| `platform.feature_flags` | Feature Flag 定义与默认行为 |
| `platform.feature_flag_overrides` | 地区 / 客户端范围覆盖 |
| `platform.runtime_configs` | 真正跨域的动态运行参数 |
| `platform.app_versions` | 客户端版本和升级策略 |
| `platform.announcements` | 平台公告 |
| `platform.regions` | 产品支持地区 |

---

# FK 总图

```text
platform.regions
      ↑
      │
      ├──────── feature_flag_overrides
      │
      └──────── announcements


platform.feature_flags
      ↑
      │
feature_flag_overrides
```

也就是：

```text
feature_flag_overrides.feature_flag_id
    → feature_flags.id

feature_flag_overrides.region_id
    → regions.id

announcements.region_id
    → regions.id
```

其他三张：

```text
runtime_configs
app_versions
regions
```

都不依赖其他 Domain。

---

# 所有状态枚举最终汇总

### `feature_flags.status`

```text
active
inactive
retired
```

### `runtime_configs.status`

```text
active
retired
```

### `app_versions.status`

```text
draft
active
deprecated
blocked
```

### `app_versions.update_policy`

```text
none
optional
required
```

### `announcements.status`

```text
draft
published
retired
```

### `regions.status`

```text
active
inactive
retired
```

`feature_flag_overrides`：

```text
无 status
```

---

# Client Platform V1

所有相关表统一：

```text
android
ios
```

涉及：

```text
feature_flag_overrides.client_platform
app_versions.client_platform
announcements.client_platform
```

后续如果真的增加 Web 客户端：

> 统一 migration 三处 CHECK。

不要现在提前猜。

---

# Platform Domain 最终不可违反规则

### PL-01

Platform 只能拥有**跨业务 Domain 的产品运行控制数据**。

### PL-02

能明确找到业务 Owner 的配置，不得进入：

```text
runtime_configs
```

### PL-03

Feature Flag 不能代替领域状态。

错误：

```text
user_123_banned
```

正确：

```text
Trust & Safety Domain
```

### PL-04

`feature_flags.key` 和 `runtime_configs.key` 发布后不可修改、不可复用。

### PL-05

`retired` 记录不物理删除以释放 key。

### PL-06

Feature Flag V1 只支持：

```text
Region
Client Platform
Region + Client Platform
```

不支持：

```text
user
segment
percentage
expression
JSON rules
```

### PL-07

Feature Flag Global fallback：

```text
feature_flags.default_enabled
```

绝不建立 Global Override。

### PL-08

Feature Flag 的总关闭由：

```text
feature_flags.status = inactive
```

完成。

### PL-09

Runtime Config 不存密码、Token、Secret、Private Key。

### PL-10

App Version 只描述客户端版本兼容和升级策略，不负责发布包和部署系统。

### PL-11

Announcement 只是平台广播内容，不拥有用户消息、Push、营销 Campaign、已读状态。

### PL-12

Region 是产品市场维度，不建设国家省市区 GIS 系统。

### PL-13

后台 Operator 信息不写进 Platform：

```text
created_by
updated_by
published_by
disabled_by
```

都不加。

“谁进行了操作”继续由 **Operations Domain** 负责。

---

## Platform Domain 最终规模

```text
platform
├── feature_flags                  8 fields
├── feature_flag_overrides         7 fields
├── runtime_configs                8 fields
├── app_versions                  10 fields
├── announcements                 11 fields
└── regions                        8 fields
```

**6 张表，52 个字段。**

这个规模对当前阶段是比较合适的：足以支撑平台运行控制，但没有把 Platform 做成“万能基础域”。

至此 **Platform Domain 可以进入最终定稿状态**。下一步更适合做的是把目前已经完成的 **Social / Chat / Commerce / Rewards / Trust & Safety / Operations / Platform** 放在一起做一次**跨域最终审计**，重点查重复职责、跨域 FK、枚举命名和是否还有遗漏的基础 Domain。memcite


---

### [26] USER　status=finished_successfully

请基于本会话最终定稿的 Platform Domain 做一次**全域审计后的最终修正版**。

注意：本会话的权威 Platform 最终 6 张表固定为：

- platform.feature_flags
- platform.feature_flag_overrides
- platform.runtime_configs
- platform.app_versions
- platform.announcements
- platform.regions

不要混入其他会话中后来出现的另一套 Platform 六表方案。

请完成以下修正：

1. `feature_flags`
   - key UNIQUE。
   - 保留 key/name CHECK。
   - 状态继续使用 active / inactive / retired。
   - retired / inactive 与 enabled 状态必须一致。
   - 不物理删除已经使用过的 flag。

2. `feature_flag_overrides`
   - Domain 内 flag FK / region FK 继续建立真实 FK。
   - ON DELETE RESTRICT。
   - 不同 scope 继续使用 partial UNIQUE。
   - Override 是当前状态数据，业务取消 override 时允许 DELETE。

3. `runtime_configs`
   现在必须明确裁决一个问题：

   如果当前表只有类似：
   - key UNIQUE
   - current value
   - active / retired

   那么它实际上只能表达“当前配置”。

   请不要让文档同时宣称已经支持：
   - 配置完整版本历史
   - 发布版本
   - rollback

   除非数据库真的有版本模型。

   本次请优先采用最小改动方案：
   **V1 明确 `runtime_configs` 只负责 current-state runtime config；配置版本化/rollback 延后，不在当前表伪实现。**

   如果本会话此前已经明确建立了可真实支持版本历史的字段和模型，则按已有定稿为准，但必须保证文档与数据库能力一致。

4. `app_versions`
   - 补齐明确删除策略。
   - 已发布/已生效版本不得物理删除。
   - 应保留发布历史。

5. `announcements`
   - 补齐明确删除策略。
   - 已发布公告原则上不物理删除。
   - 使用状态或下线时间控制展示。

6. `regions`
   - 继续作为 Platform 自己的产品运营区域配置。
   - 其他 Domain 不因为 country/region 字段建立跨域 FK 到 `platform.regions`。
   - 跨域如需引用 region，只使用约定 logical code / UUID。

7. Infrastructure 边界：
   - `system_outbox_events` 属于 Platform Infrastructure / 技术基础设施。
   - 不计入 Platform Domain 的 6 张业务表。
   - 各 Domain 共用统一 outbox，不建立每域一套。

8. Media / Asset：
   - 全域审计发现 Social / Chat / Commerce 都在使用 `asset_id`，但当前没有最终 authoritative owner。
   - 请在本会话补充并冻结：
     `Media / Asset Infrastructure` 属于技术基础设施能力，而不是新增 Platform 业务 Domain 表。
   - 它负责：
     - asset UUID
     - storage provider
     - bucket/object key
     - mime/content metadata
     - 生命周期
   - 业务 Domain 只保存 `asset_id UUID`。
   - 不在 Social / Chat / Commerce 重复保存底层 storage 信息。

9. 删除策略统一：
   - feature flag / runtime config / region：状态化退役。
   - override：当前关系，可 DELETE。
   - app version / published announcement：保留历史。
   - infrastructure event / audit 类数据按 retention / append-only 规则管理。

最后输出：

- Platform Domain 最终 6 表
- 每张表最终 FK / UNIQUE / CHECK / INDEX
- 删除策略
- runtime_configs 最终能力边界
- Platform Domain 与 Platform Infrastructure 的职责边界
- `system_outbox_events`
- Media / Asset Infrastructure

不要改变本会话最终 6 张 Platform 业务表的数量。


---

### [27] SYSTEM　status=finished_successfully

_(empty)_


---

### [28] ASSISTANT　status=finished_successfully

_(empty)_


---

### [29] ASSISTANT　status=finished_successfully

我会把这次审计当作 **Platform Domain 的最高优先级最终修正版**：保留固定 6 张业务表，只修正约束、删除策略和基础设施边界，不引入第 7 张 Platform 业务表。


---

### [30] ASSISTANT　status=finished_successfully

_(empty)_


---

### [31] ASSISTANT　status=finished_successfully

_(empty)_


---

### [32] ASSISTANT　status=finished_successfully

_(empty)_


---

### [33] ASSISTANT　status=finished_successfully

下面这版作为**本会话 Platform Domain 全域审计后的最终权威修正版**。固定仍然是 **6 张 Platform 业务表**，不增加、不替换。

:::writing{variant="document" id="58341"}
# Platform Domain — 全域审计最终修正版

## 一、最终范围

Platform Domain 的业务表最终固定为：

1. `platform.feature_flags`
2. `platform.feature_flag_overrides`
3. `platform.runtime_configs`
4. `platform.app_versions`
5. `platform.announcements`
6. `platform.regions`

以下能力虽然与平台运行有关，但**不计入这 6 张 Platform Domain 业务表**：

- `system_outbox_events`
- Media / Asset Infrastructure
- 技术审计日志
- 消息投递基础设施
- 存储基础设施

---

# 二、`platform.feature_flags`

## 职责

定义 Feature Flag 本身、默认启用状态以及生命周期。

不保存地区、客户端、用户、灰度百分比或其他匹配条件。

## 最终字段

| 字段 | 类型 | NULL | 默认 |
|---|---|---:|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — |
| `key` | `VARCHAR(100)` | NO | — |
| `name` | `VARCHAR(120)` | NO | — |
| `description` | `TEXT` | YES | — |
| `default_enabled` | `BOOLEAN` | NO | `FALSE` |
| `status` | `VARCHAR(16)` | NO | `'active'` |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` |

## Status

固定：

- `active`
- `inactive`
- `retired`

语义：

- `active`：正常参与 Feature Flag 求值。
- `inactive`：临时总关闭，最终有效结果强制为 `false`。
- `retired`：永久退役，最终有效结果强制为 `false`，不得重新启用。

## 状态与 enabled 一致性

本表不存在额外的 `enabled` 字段，所谓 enabled 状态即：

- `default_enabled`
- 加上最终 Feature Flag effective result

因此数据库增加约束：

```sql
CHECK (
    status = 'active'
    OR default_enabled = FALSE
)
```

也就是说：

```text
active   + default_enabled true/false   合法
inactive + default_enabled false        合法
retired  + default_enabled false        合法

inactive + default_enabled true         非法
retired  + default_enabled true         非法
```

同时求值规则固定为：

```text
status = inactive / retired
        ↓
      false

status = active
        ↓
matching override
        ↓
default_enabled
```

即使某个历史 override 中仍存在：

```text
enabled = true
```

只要 Flag 为 `inactive` / `retired`，最终结果仍必须为 `false`。

## FK

无。

这是 Feature Flag 聚合根。

## UNIQUE

```sql
UNIQUE (key)
```

`key` 永久唯一，不因 retired 而释放或复用。

## CHECK

### key

```sql
CHECK (
    key ~ '^[a-z][a-z0-9_]{0,99}$'
)
```

### name

```sql
CHECK (
    btrim(name) <> ''
)
```

### status

```sql
CHECK (
    status IN ('active', 'inactive', 'retired')
)
```

### 状态一致性

```sql
CHECK (
    status = 'active'
    OR default_enabled = FALSE
)
```

## INDEX

只保留：

- PK：`id`
- UNIQUE INDEX：`key`

不额外索引：

- `status`
- `default_enabled`
- `name`
- 时间字段

## 删除策略

Feature Flag 属于**状态化退役实体**。

正式进入使用后的 Flag：

```text
不得物理 DELETE
```

需要永久下线：

```text
status = retired
default_enabled = false
```

`key` 永久保留，不得被未来的新 Flag 复用。

正常业务流程不通过 DELETE 删除 Feature Flag。

---

# 三、`platform.feature_flag_overrides`

## 职责

表达 Feature Flag 当前有效的范围覆盖关系。

V1 只支持：

1. Region
2. Client Platform
3. Region + Client Platform

明确不支持：

- Global Override
- User Override
- User Segment
- Percentage rollout
- App Version expression
- JSON conditions
- 时间规则 DSL

全局默认行为始终来自：

```text
feature_flags.default_enabled
```

## 最终字段

| 字段 | 类型 | NULL |
|---|---|---:|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO |
| `feature_flag_id` | `BIGINT` | NO |
| `region_id` | `BIGINT` | YES |
| `client_platform` | `VARCHAR(16)` | YES |
| `enabled` | `BOOLEAN` | NO |
| `created_at` | `TIMESTAMPTZ` | NO |
| `updated_at` | `TIMESTAMPTZ` | NO |

## FK

Domain 内继续使用真实 FK：

```sql
feature_flag_id
REFERENCES platform.feature_flags(id)
ON DELETE RESTRICT
```

```sql
region_id
REFERENCES platform.regions(id)
ON DELETE RESTRICT
```

这是 Platform Domain 内部关系，因此保持数据库 FK。

## Scope CHECK

禁止 Global Override：

```sql
CHECK (
    region_id IS NOT NULL
    OR client_platform IS NOT NULL
)
```

## Client Platform CHECK

V1：

```sql
CHECK (
    client_platform IS NULL
    OR client_platform IN ('android', 'ios')
)
```

## Partial UNIQUE

不能依赖普通：

```sql
UNIQUE(feature_flag_id, region_id, client_platform)
```

因为 PostgreSQL 对 NULL 的处理不能满足这里的唯一性语义。

最终固定使用三个 Partial UNIQUE Index。

### Region Only

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_region
ON platform.feature_flag_overrides (
    feature_flag_id,
    region_id
)
WHERE region_id IS NOT NULL
  AND client_platform IS NULL;
```

### Client Platform Only

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_client
ON platform.feature_flag_overrides (
    feature_flag_id,
    client_platform
)
WHERE region_id IS NULL
  AND client_platform IS NOT NULL;
```

### Region + Client Platform

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_region_client
ON platform.feature_flag_overrides (
    feature_flag_id,
    region_id,
    client_platform
)
WHERE region_id IS NOT NULL
  AND client_platform IS NOT NULL;
```

## Override 优先级

最终固定：

```text
1. region + client_platform
2. region
3. client_platform
4. feature_flags.default_enabled
```

前提始终是：

```text
feature_flags.status = active
```

否则直接返回 `false`。

## INDEX

除三个 Partial UNIQUE Index 外，增加 FK 辅助索引：

```sql
CREATE INDEX idx_feature_flag_overrides_region_id
ON platform.feature_flag_overrides (region_id)
WHERE region_id IS NOT NULL;
```

`feature_flag_id` 已经是三个 Partial UNIQUE Index 的首列，不需要重复增加普通索引。

## 删除策略

Override 与 Feature Flag 不同。

它表达的是：

> 当前生效的覆盖关系。

因此取消某项 Override 时：

```sql
DELETE
```

是正确行为。

不增加：

- `status`
- `deleted_at`
- `retired_at`

Operations / audit 可以记录谁删除了 Override，但 `feature_flag_overrides` 本身不保存历史版本。

额外规则：

- `inactive` Flag 可以保留 Override，方便未来重新启用。
- `retired` Flag 不会重新启用，其 Override 可以清理。
- 不允许为 `retired` Flag 新建 Override。

---

# 四、`platform.runtime_configs`

## 最终裁决：V1 只负责 Current State

这一点现在正式冻结。

`platform.runtime_configs` 的 V1 能力只有：

> 保存某个 Runtime Config key 当前有效的配置值。

当前数据库没有：

- configuration version
- revision number
- immutable version record
- publication record
- release pointer
- rollback target
- version parent
- config snapshot

因此 Platform 文档不得再宣称当前表已经支持：

- 完整配置版本历史
- 配置发布版本
- 任意历史版本查询
- rollback
- version restore

这些能力当前**不存在**。

## Operations Audit 不等于配置版本模型

即使 Operations / Audit 能记录：

```text
某配置从 A 改成 B
```

这仍然只是操作审计。

它不能被描述为：

```text
runtime config versioning
```

也不能保证具备可靠 rollback 能力。

如果未来真的需要版本化，应单独设计正式版本模型，而不是利用 Audit 假装实现。

## 最终字段

| 字段 | 类型 | NULL | 默认 |
|---|---|---:|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — |
| `key` | `VARCHAR(100)` | NO | — |
| `value_type` | `VARCHAR(16)` | NO | — |
| `value` | `JSONB` | NO | — |
| `description` | `TEXT` | YES | — |
| `status` | `VARCHAR(16)` | NO | `'active'` |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` |

## Status

固定：

- `active`
- `retired`

不使用 `inactive`。

## FK

无。

## UNIQUE

```sql
UNIQUE (key)
```

配置 Key 进入正式使用后不可修改、不可复用。

## CHECK

### key

```sql
CHECK (
    key ~ '^[a-z][a-z0-9_]{0,99}$'
)
```

### value_type

```sql
CHECK (
    value_type IN (
        'string',
        'integer',
        'number',
        'boolean',
        'json'
    )
)
```

### status

```sql
CHECK (
    status IN ('active', 'retired')
)
```

### JSONB 类型一致性

```sql
CHECK (
       (
           value_type = 'string'
           AND jsonb_typeof(value) = 'string'
       )
    OR (
           value_type = 'integer'
           AND jsonb_typeof(value) = 'number'
           AND (value #>> '{}') ~ '^-?[0-9]+$'
       )
    OR (
           value_type = 'number'
           AND jsonb_typeof(value) = 'number'
       )
    OR (
           value_type = 'boolean'
           AND jsonb_typeof(value) = 'boolean'
       )
    OR (
           value_type = 'json'
           AND jsonb_typeof(value) IN ('object', 'array')
       )
)
```

## INDEX

只保留：

- PK：`id`
- UNIQUE INDEX：`key`

不建立：

- `status`
- `value_type`
- GIN(`value`)

如果业务开始需要对 JSON 内容进行大量查询，优先审查是否已经错误地把业务数据塞进 Runtime Config。

## 删除策略

Runtime Config 采用：

> 状态化退役。

已正式使用的 Config 不通过 DELETE 释放 key。

永久取消：

```text
status = retired
```

最后一个配置值可以继续保留，用于理解该配置最终状态。

## 明确禁止

`runtime_configs` 不保存：

- password
- access token
- API secret
- private key
- JWT signing secret
- database credential
- payment credential

它不是 Secret Manager。

## 最终能力边界

V1 支持：

```text
key
        ↓
current value
        ↓
active / retired
```

V1 不支持：

```text
Version 1
Version 2
Version 3
Published Version
Rollback → Version 1
```

未来如需要后一套能力，必须增加真正的版本模型后才能修改文档声明。

---

# 五、`platform.app_versions`

## 职责

描述 Android / iOS 客户端 Build：

- 是否已发布
- 是否仍受支持
- 是否建议升级
- 是否强制升级

不负责 APK / IPA 文件存储和部署。

## 最终字段

| 字段 | 类型 | NULL | 默认 |
|---|---|---:|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — |
| `client_platform` | `VARCHAR(16)` | NO | — |
| `version` | `VARCHAR(32)` | NO | — |
| `build_number` | `BIGINT` | NO | — |
| `status` | `VARCHAR(16)` | NO | `'draft'` |
| `update_policy` | `VARCHAR(16)` | NO | `'none'` |
| `release_notes` | `TEXT` | YES | — |
| `released_at` | `TIMESTAMPTZ` | YES | — |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` |

## Status

- `draft`
- `active`
- `deprecated`
- `blocked`

## Update Policy

- `none`
- `optional`
- `required`

## 合法组合

```text
draft       + none
active      + none
active      + optional
deprecated  + optional
blocked     + required
```

## FK

无。

## UNIQUE

```sql
UNIQUE (
    client_platform,
    build_number
)
```

同一个展示版本允许拥有多个 Build。

因此不要求：

```text
(client_platform, version)
```

唯一。

## CHECK

### Client Platform

```sql
CHECK (
    client_platform IN ('android', 'ios')
)
```

### Version

```sql
CHECK (
    btrim(version) <> ''
)
```

### Build

```sql
CHECK (
    build_number > 0
)
```

### Status

```sql
CHECK (
    status IN (
        'draft',
        'active',
        'deprecated',
        'blocked'
    )
)
```

### Update Policy

```sql
CHECK (
    update_policy IN (
        'none',
        'optional',
        'required'
    )
)
```

### Status / Policy 一致性

```sql
CHECK (
       (status = 'draft' AND update_policy = 'none')
    OR (status = 'active'
        AND update_policy IN ('none', 'optional'))
    OR (status = 'deprecated'
        AND update_policy = 'optional')
    OR (status = 'blocked'
        AND update_policy = 'required')
)
```

### Released Time

```sql
CHECK (
       (status = 'draft' AND released_at IS NULL)
    OR (status <> 'draft' AND released_at IS NOT NULL)
)
```

## INDEX

保留：

- PK：`id`
- UNIQUE：`(client_platform, build_number)`

版本数据规模很小，当前不额外添加 status / time 索引。

## 删除策略

### Draft

从未发布、从未进入客户端判断逻辑的误建 Draft：

```text
允许 DELETE
```

### 已发布版本

只要曾经进入：

- `active`
- `deprecated`
- `blocked`

就属于发布历史。

必须：

> 保留记录，不物理删除。

即使版本已经完全停止使用，也应保留：

- build
- version
- 发布时间
- 最终生命周期状态

`blocked` 作为最终历史状态保留。

因此：

```text
Released App Version = historical record
```

不是临时配置数据。

---

# 六、`platform.announcements`

## 职责

保存平台级公告及其当前展示生命周期。

支持：

- 全局
- Region
- Client Platform
- Region + Client Platform

不承担：

- Push Delivery
- Chat System Message
- Marketing Campaign
- User Inbox
- 用户已读状态

## 最终字段

| 字段 | 类型 | NULL | 默认 |
|---|---|---:|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — |
| `public_id` | `UUID` | NO | `gen_random_uuid()` |
| `title` | `VARCHAR(200)` | NO | — |
| `content` | `TEXT` | NO | — |
| `region_id` | `BIGINT` | YES | — |
| `client_platform` | `VARCHAR(16)` | YES | — |
| `status` | `VARCHAR(16)` | NO | `'draft'` |
| `starts_at` | `TIMESTAMPTZ` | YES | — |
| `ends_at` | `TIMESTAMPTZ` | YES | — |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` |

## Status

- `draft`
- `published`
- `retired`

不增加：

- `scheduled`
- `expired`

因为二者都能通过时间计算。

## FK

Domain 内建立真实 Region FK：

```sql
region_id
REFERENCES platform.regions(id)
ON DELETE RESTRICT
```

## UNIQUE

```sql
UNIQUE (public_id)
```

标题不唯一。

## CHECK

### Title

```sql
CHECK (
    btrim(title) <> ''
)
```

### Content

```sql
CHECK (
    btrim(content) <> ''
)
```

### Client Platform

```sql
CHECK (
    client_platform IS NULL
    OR client_platform IN ('android', 'ios')
)
```

### Status

```sql
CHECK (
    status IN (
        'draft',
        'published',
        'retired'
    )
)
```

### Time Window

```sql
CHECK (
    ends_at IS NULL
    OR (
        starts_at IS NOT NULL
        AND ends_at > starts_at
    )
)
```

### Published 必须有开始时间

```sql
CHECK (
    status <> 'published'
    OR starts_at IS NOT NULL
)
```

## 当前展示规则

公告只有满足：

```text
status = published
AND starts_at <= now()
AND (
    ends_at IS NULL
    OR ends_at > now()
)
```

才属于当前可展示公告。

需要提前下线时，可以：

```text
status = retired
```

或者使用：

```text
ends_at
```

结束展示。

## INDEX

当前展示主索引：

```sql
CREATE INDEX idx_announcements_published_starts_at
ON platform.announcements (starts_at DESC)
WHERE status = 'published';
```

Region FK 辅助索引：

```sql
CREATE INDEX idx_announcements_region_id
ON platform.announcements (region_id)
WHERE region_id IS NOT NULL;
```

## 删除策略

### Draft

从未发布的草稿：

```text
允许 DELETE
```

### Published

只要曾经发布：

> 原则上不得物理删除。

需要停止展示：

```text
ends_at = 下线时间
```

或：

```text
status = retired
```

保留其发布历史。

这意味着：

```text
Published Announcement
```

属于历史记录，而不是一次性临时数据。

---

# 七、`platform.regions`

## 职责

`platform.regions` 继续定义：

> Platform 自己的产品运营区域 / 市场配置。

例如：

```text
CN
LA
```

它不是：

- 世界国家数据库
- 行政区划库
- 用户地址库
- 通用跨域 Geography Domain

## 最终字段

| 字段 | 类型 | NULL | 默认 |
|---|---|---:|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | — |
| `code` | `VARCHAR(8)` | NO | — |
| `name` | `VARCHAR(100)` | NO | — |
| `default_locale` | `VARCHAR(16)` | NO | — |
| `timezone` | `VARCHAR(64)` | NO | — |
| `status` | `VARCHAR(16)` | NO | `'active'` |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` |

## Status

- `active`
- `inactive`
- `retired`

## FK

本表自身没有 FK。

Platform Domain 内部：

- `feature_flag_overrides.region_id`
- `announcements.region_id`

可以建立真实 FK 到它。

但是：

> 其他业务 Domain 不因为自己存在 `country` / `region` 字段，就建立数据库 FK 到 `platform.regions`。

这是本轮全域审计后的明确边界。

## 跨 Domain Region 引用

其他 Domain 如确实需要保存 Platform Region 语义，只使用逻辑标识：

```text
region_code
```

V1 最直接的权威逻辑标识就是：

```text
platform.regions.code
```

例如业务 Domain 可以保存：

```text
region_code = 'LA'
```

但不建立：

```sql
FOREIGN KEY (...)
REFERENCES platform.regions(...)
```

如果未来引入稳定 Region UUID，跨域也可以保存 UUID 逻辑引用，但仍不因此强制形成数据库 FK。

## UNIQUE

```sql
UNIQUE (code)
```

## CHECK

### Code

```sql
CHECK (
    code ~ '^[A-Z][A-Z0-9_]{1,7}$'
)
```

### Name

```sql
CHECK (
    btrim(name) <> ''
)
```

### Locale

```sql
CHECK (
    btrim(default_locale) <> ''
)
```

### Timezone

```sql
CHECK (
    btrim(timezone) <> ''
)
```

IANA timezone 的真实性由应用层验证，不在数据库维护完整 IANA 枚举。

### Status

```sql
CHECK (
    status IN (
        'active',
        'inactive',
        'retired'
    )
)
```

## INDEX

只需要：

- PK：`id`
- UNIQUE INDEX：`code`

不额外索引 status / locale / timezone。

## 删除策略

Region 采用状态化退役。

已经被正式使用的 Region：

```text
不物理 DELETE
```

临时停止：

```text
status = inactive
```

永久退出：

```text
status = retired
```

`code` 不复用。

---

# 八、Platform Domain 六表最终约束总表

| 表 | FK | UNIQUE | 主要 CHECK | 额外 INDEX |
|---|---|---|---|---|
| `feature_flags` | 无 | `key` | key/name/status/status-enabled | 无 |
| `feature_flag_overrides` | flag、region | Partial UNIQUE ×3 | scope、platform | `region_id` |
| `runtime_configs` | 无 | `key` | key/type/value/status | 无 |
| `app_versions` | 无 | platform + build | platform/status/policy/build/time | 无 |
| `announcements` | region | `public_id` | title/content/status/platform/time | published time、region |
| `regions` | 无 | `code` | code/name/locale/timezone/status | 无 |

---

# 九、统一删除策略

## 状态化退役

以下对象一旦正式使用，不通过正常业务 DELETE：

```text
feature_flags
runtime_configs
regions
```

分别使用自身 `status` 退役。

---

## 当前关系数据

```text
feature_flag_overrides
```

属于 Current State Relation。

取消 Override：

```text
DELETE
```

是正确模型。

无需软删除和历史状态。

---

## 保留发布历史

```text
app_versions
announcements
```

其中：

- 未发布 Draft 可以删除；
- 一旦发布 / 生效，原则上不物理删除；
- 通过生命周期状态和下线时间控制当前使用状态。

---

## Infrastructure / Audit

基础设施 Event 和 Audit 类型数据不采用上述业务删除模型。

它们根据：

- append-only
- retention policy
- archive policy
- compliance policy

进行治理。

---

# 十、Platform Domain 与 Platform Infrastructure 边界

必须明确区分：

## Platform Domain

负责：

> 产品当前应该如何运行。

也就是当前固定的六张业务表：

```text
feature_flags
feature_flag_overrides
runtime_configs
app_versions
announcements
regions
```

这些表表达的是业务 / 产品运行状态。

---

## Platform Infrastructure

负责：

> 软件系统如何可靠地执行、存储、发布和传递这些业务状态。

包括但不限于：

- Transactional Outbox
- Media / Asset storage abstraction
- event publishing
- technical retry
- infrastructure lifecycle
- storage metadata
- technical retention

Infrastructure 不因为服务于整个产品，就自动成为 Platform Domain 的业务表。

因此：

```text
Platform Domain ≠ Platform Infrastructure
```

---

# 十一、`system_outbox_events`

## 最终归属

`system_outbox_events` 属于：

> Platform Infrastructure / Shared Technical Infrastructure

明确：

> **不计入 Platform Domain 的六张业务表。**

因此 Platform Domain 仍然是严格的：

```text
6 tables
```

而不是 7 张。

## 统一 Outbox 原则

整个 PostgreSQL 系统共用统一 Transactional Outbox。

不得设计：

```text
social_outbox_events
chat_outbox_events
commerce_outbox_events
rewards_outbox_events
...
```

即：

```text
One shared outbox
```

各 Domain 在自己的业务事务中：

```text
业务状态变更
+
写入 system_outbox_events
```

保持同一数据库事务。

然后由统一 Outbox Publisher：

```text
读取
→ 发布
→ 标记已处理
→ retry / retention
```

## Domain 区分

Outbox Event 自身应携带能够识别来源的信息，例如：

```text
event_id
source_domain
event_type
aggregate_type
aggregate_id
payload
occurred_at
published_at
```

以及基础设施实际需要的 retry / delivery metadata。

这里的 `source_domain` 用于区分：

```text
social
chat
commerce
rewards
trust_safety
operations
platform
...
```

但不因此拆表。

## 数据治理

Outbox 属于技术事件数据。

原则：

```text
写入后 append-oriented
```

不得把历史事件当普通业务配置随意 UPDATE / DELETE。

已发布数据按照统一：

```text
retention policy
```

定期归档或清理。

它不使用 Feature Flag / Runtime Config 那套 `retired` 生命周期。

---

# 十二、Media / Asset Infrastructure

## 最终归属

全域统一冻结：

> `Media / Asset Infrastructure` 是共享技术基础设施能力，不是新的 Platform Domain 业务子域，也不增加 Platform 第七张业务表。

这是 Social / Chat / Commerce 等 Domain 所使用 `asset_id` 的最终 authoritative owner。

## 它负责什么

Media / Asset Infrastructure 负责维护 Asset 的技术事实：

### Asset Identity

```text
asset_id UUID
```

这是业务 Domain 使用的稳定逻辑标识。

### Storage Provider

例如：

```text
S3
Cloudflare R2
OSS
本地兼容对象存储
```

具体 provider 属于基础设施实现。

### Storage Location

由 Media Infrastructure 保存：

```text
bucket
object_key
```

必要时还包括 storage region 等技术字段。

### Content Metadata

例如：

```text
mime_type
size_bytes
checksum
width
height
duration
content metadata
```

按实际媒体类型保存。

### Lifecycle

负责 Asset 自身生命周期，例如：

```text
uploading
available
deleted / purged
```

具体状态枚举应在 Media Infrastructure 落地时单独定稿。

---

# 十三、业务 Domain 如何引用 Asset

Social / Chat / Commerce 等业务表只保存：

```text
asset_id UUID
```

例如：

```text
social profile photo
    ↓
asset_id

chat image message
    ↓
asset_id

commerce gift image
    ↓
asset_id
```

业务 Domain 不重复保存：

```text
storage_provider
bucket
object_key
storage_url
internal storage path
checksum
object metadata
```

否则一旦更换：

```text
S3 → R2
bucket A → bucket B
object migration
CDN architecture
```

就会迫使 Social / Chat / Commerce 同时修改业务数据。

正确模型始终是：

```text
Business Domain
    ↓ asset_id UUID
Media / Asset Infrastructure
    ↓
actual storage
```

---

# 十四、Media Infrastructure 不拥有的东西

Media / Asset Infrastructure 只负责媒体技术生命周期。

它不拥有：

- Social Photo 的业务排序
- Profile Photo 是否主图
- Chat Message 的发送状态
- Gift 的商品语义
- Moderation Decision
- 举报状态
- 用户社交资料

例如：

```text
asset 是否存在
```

属于 Media Infrastructure。

而：

```text
这张图片是否通过安全审核
```

属于 Trust & Safety 的业务判断。

```text
这张图片是不是用户头像
```

属于 Social。

```text
这张图片属于哪条 Chat Message
```

属于 Chat。

不能因为所有业务都用了文件，就把业务关系迁入 Media Infrastructure。

---

# 十五、最终架构冻结

最终形成两层：

```text
Platform Domain
│
├── platform.feature_flags
├── platform.feature_flag_overrides
├── platform.runtime_configs
├── platform.app_versions
├── platform.announcements
└── platform.regions
```

严格：

```text
6 张业务表
```

之外是共享基础设施：

```text
Platform / Shared Infrastructure
│
├── system_outbox_events
│
└── Media / Asset Infrastructure
        └── asset_id UUID
```

它们：

- 不计入 Platform Domain 六表；
- 不改变 Platform Domain 的业务边界；
- 可以被多个 Domain 共享；
- 不在每个业务 Domain 重复实现。

---

# 十六、最终不可违反规则

### PLATFORM-01

Platform Domain 永远保持当前六张业务表，除非未来有新的正式领域设计决策。

### PLATFORM-02

`feature_flags.key` 唯一、稳定、不复用。

### PLATFORM-03

`inactive` / `retired` Feature Flag 的 `default_enabled` 必须为 `false`，最终 effective result 必须为 `false`。

### PLATFORM-04

Feature Flag 已使用后不物理删除。

### PLATFORM-05

Feature Flag Override 是 Current State，可以 DELETE。

### PLATFORM-06

Override 的 Flag / Region 属于 Platform Domain 内部引用，继续使用真实 FK + `ON DELETE RESTRICT`。

### PLATFORM-07

`runtime_configs` V1 只有 Current State Config。

不得宣称支持：

```text
versioning
publish versions
rollback
```

直到数据库存在真正的版本模型。

### PLATFORM-08

Runtime Config 进入正式使用后通过 `retired` 退役，key 不复用。

### PLATFORM-09

App Version 一旦正式发布，保留发布历史，不物理删除。

### PLATFORM-10

Announcement 一旦正式发布，原则上保留历史，通过 `retired` / `ends_at` 控制展示。

### PLATFORM-11

`platform.regions` 是 Platform 自己的产品运营区域定义，不是全系统 Geography Domain。

### PLATFORM-12

其他 Domain 不因 country / region 属性建立数据库 FK 到 `platform.regions`。

跨域只使用稳定 logical code / UUID。

V1 可直接使用：

```text
region_code
```

### PLATFORM-13

`system_outbox_events` 是统一共享技术基础设施。

只有一套，不按 Domain 分表。

### PLATFORM-14

`system_outbox_events` 不计入 Platform Domain 六张业务表。

### PLATFORM-15

Media / Asset 是共享技术基础设施，是所有 `asset_id` 的 authoritative technical owner。

### PLATFORM-16

Social / Chat / Commerce 等 Domain 只保存：

```text
asset_id UUID
```

不得重复保存底层 storage provider / bucket / object key。

### PLATFORM-17

Feature Flag / Runtime Config / Region：

```text
状态化退役
```

Override：

```text
当前关系，可 DELETE
```

App Version / Published Announcement：

```text
保留历史
```

Infrastructure Event / Audit：

```text
append-oriented + retention policy
```

---

# 最终结论

经过全域审计后，Platform Domain 的权威设计仍然严格保持：

```text
platform.feature_flags
platform.feature_flag_overrides
platform.runtime_configs
platform.app_versions
platform.announcements
platform.regions
```

**共 6 张业务表，不增加第 7 张。**

本轮真正修正的是四个边界问题：

1. Feature Flag 的生命周期状态与 `default_enabled` 正式建立一致性约束；
2. `runtime_configs` 明确降回真正具备的 **current-state config** 能力，不再伪称支持版本历史和 rollback；
3. App Version / Published Announcement 明确保留历史，不再留下删除策略空白；
4. Outbox 与 Media / Asset 正式归入共享技术基础设施，不污染 Platform Domain 的六表模型。

至此，可以把本版本作为 **Platform Domain 最终审计定稿 / authoritative schema specification**。
:::

这版可以直接替换此前 Platform 文档中的最终定稿部分；后续如果审查生成的数据库文档，应以这一版为权威基线。
