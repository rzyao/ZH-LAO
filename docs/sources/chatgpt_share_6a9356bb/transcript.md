# 设计社交资料

_消息数：52　总字符：134938_


---

### [01] SYSTEM　status=finished_successfully

_(empty)_


---

### [02] SYSTEM　status=finished_successfully

_(empty)_


---

### [03] USER　status=finished_successfully

[数据库域设计](chatgpt-conversation://6a92f0c0-90b4-83ea-a43d-cccb1ef2666d)继续设计 Social Domain，从 Social Profile 开始。请承接之前已经确定的整体架构和数据库设计原则。


---

### [04] SYSTEM　status=finished_successfully

_(empty)_


---

### [05] SYSTEM　status=finished_successfully

_(empty)_


---

### [06] ASSISTANT　status=finished_successfully

_(empty)_


---

### [07] ASSISTANT　status=finished_successfully

我先把上一轮已经定下来的 Social Domain 边界、命名规则和数据库原则接回来，然后直接从 **Social Profile** 往下设计，避免重新讨论已经拍板的部分。


---

### [08] ASSISTANT　status=finished_successfully

_(empty)_


---

### [09] ASSISTANT　status=finished_successfully

_(empty)_


---

### [10] ASSISTANT　status=finished_successfully

可以。我们继续 **Social Domain**，先把 **Social Profile（交友资料）** 设计完整，再往照片、兴趣标签、择偶偏好、关注/匹配等方向推进。

我会继续遵守我们前面已经采用的核心思路：**按业务域拆表；User 只承担账号身份，Social 不往用户主表塞字段；PostgreSQL 原生设计；关系数据优先正规化；可计算的数据尽量不作为事实源；审核、状态、软删除和后续商业化从第一版就留出结构。**

结合我们已经确定的产品规则，Social Profile 有一个特别重要的定位：

> **Social Profile 不是 User Profile，而是用户主动进入“交友场景”后建立的公开社交身份。**

因此用户即使已经注册、学习了很久，也可以完全没有 Social Profile。

---

# 一、Social Profile 的整体模型

我建议 Social Profile 最终不要做成一张超级大表，而是拆成：

| 表 | 职责 |
|---|---|
| `social_profiles` | 社交资料主体 |
| `social_profile_photos` | 资料照片 |
| `social_profile_interests` | 兴趣标签关系 |
| `social_interests` | 兴趣标签字典 |
| `social_profile_languages` | 用户会什么语言、水平 |
| `social_profile_prompts` | 个性化问答/自我展示 |
| `social_preferences` | 想认识什么样的人 |
| 后续 | 学历、职业等若需要结构化再拆 |

其中：

**`social_profiles` 是聚合根。**

其它表围绕：

```text
social_profiles
      │
      ├── social_profile_photos
      ├── social_profile_interests
      ├── social_profile_languages
      ├── social_profile_prompts
      └── social_preferences
```

第一步我们先确定 `social_profiles`。

---

# 二、social_profiles

建议表名：

```sql
social_profiles
```

而不是：

```text
dating_profiles
user_social_profiles
profiles
```

因为它明确属于 Social Domain，并且未来“社交”不一定只有恋爱。

## 推荐字段

```sql
CREATE TABLE social_profiles (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id             BIGINT NOT NULL,

    display_name        VARCHAR(50) NOT NULL,

    gender              VARCHAR(20),
    birth_date          DATE,

    country_code        CHAR(2),
    region              VARCHAR(100),
    city                VARCHAR(100),

    occupation          VARCHAR(100),
    education_level     VARCHAR(30),

    bio                  VARCHAR(1000),

    relationship_goal   VARCHAR(30),

    profile_status      VARCHAR(20) NOT NULL DEFAULT 'draft',
    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',

    completeness_score  SMALLINT NOT NULL DEFAULT 0,

    published_at        TIMESTAMPTZ,
    last_active_at      TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_profiles_user UNIQUE (user_id),

    CONSTRAINT ck_social_profiles_completeness
        CHECK (completeness_score BETWEEN 0 AND 100)
);
```

不过这里面有几个字段值得逐个讨论，因为它们会影响后面的整个 Social Domain。

---

# 三、`user_id`：一个用户只能有一个 Social Profile

这里建议：

```text
User
  1
  │
  0..1
SocialProfile
```

也就是说：

```sql
UNIQUE(user_id)
```

必须存在。

一个用户不能创建：

> 中文学习资料一个  
> 老挝语学习资料一个  
> 交友资料两个

而应该始终只有：

> 一个用户身份  
> 一个社交身份

以后用户修改资料，就是修改这一份。

---

# 四、display_name 不直接使用 User.nickname

这个字段我建议 **Social Profile 自己保存**：

```sql
display_name VARCHAR(50)
```

即使 Account/Profile Domain 已经存在：

```text
nickname
```

也不要直接拿过来。

原因很简单。

用户学习时可能叫：

> 老王学老挝语

但是进入交友场景可能希望显示：

> 王哲

或者：

> Jack

所以：

```text
Account nickname
        ≠
Social display_name
```

这是两个业务概念。

---

# 五、gender

建议暂时：

```sql
gender VARCHAR(20)
```

业务值：

```text
male
female
other
```

数据库层可以 CHECK。

例如：

```sql
CHECK (
    gender IS NULL
    OR gender IN ('male', 'female', 'other')
)
```

但这里有一个重要区别：

### 用户自身 gender

属于：

```text
social_profiles.gender
```

### 用户希望认识的 gender

不能放这里。

应该进入后面的：

```text
social_preferences
```

否则以后查询会越来越乱。

---

# 六、birth_date，而不是 age

年龄绝对不要存：

```text
age = 26
```

而应该存：

```text
birth_date = 2000-03-18
```

年龄动态计算。

因为：

```text
age
```

每年都会失效。

例如推荐时：

```sql
EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))
```

即可。

而且以后年龄筛选：

```text
18-25
26-35
36-45
```

也可以直接从生日计算。

---

# 七、地理位置不要一开始设计得太重

交友发现肯定需要地域。

但是当前阶段我不建议立即引入：

```text
latitude
longitude
geohash
PostGIS
```

先使用：

```text
country_code
region
city
```

例如：

```text
country_code = CN
region       = Yunnan
city         = Kunming
```

或者：

```text
country_code = LA
region       = Vientiane Capital
city         = Vientiane
```

这已经足够支持：

```text
同城
同省
中国用户
老挝用户
```

未来真正需要：

> 附近的人 / 距离 5km

再引入专门的位置能力。

尤其你的核心匹配逻辑实际上首先是：

```text
中国用户 ↔ 老挝用户
```

不是 Tinder 那种：

```text
3 km 内的人
```

所以现在没必要提前增加地理复杂度。

---

# 八、occupation

建议第一版简单保存：

```sql
occupation VARCHAR(100)
```

例如：

```text
学生
程序员
教师
自由职业
餐饮
```

暂时不要建立：

```text
social_occupations
```

字典表。

因为职业分类非常容易变成过度设计。

只有未来真正需要：

> 按职业筛选  
> 职业推荐算法  
> 职业统计

再结构化。

---

# 九、education_level

这个可以结构化。

例如：

```text
high_school
college
bachelor
master
doctorate
other
```

但是我同样建议第一阶段使用：

```sql
VARCHAR(30)
```

配合应用层 Enum。

原因是 PostgreSQL `ENUM` 修改起来没有普通 VARCHAR 灵活。

这也延续我们数据库设计里比较重要的一条原则：

> **业务枚举优先 VARCHAR + 应用枚举/必要 CHECK，而不是大量 PostgreSQL ENUM 类型。**

---

# 十、bio

```sql
bio VARCHAR(1000)
```

这是最核心的自由文本资料。

例如：

> 我来自云南，现在在万象工作。正在学习老挝语，喜欢旅行、摄影和咖啡，希望认识一些有趣的人。

这个字段后面还会直接参与：

```text
资料完整度
审核
推荐画像
内容安全
搜索
AI 推荐
```

所以它应该属于 Social Profile 本身。

---

# 十一、relationship_goal

这个字段很重要。

因为你的 Social 并不一定只用于：

> 找对象

还可能包括：

```text
交朋友
语言交换
认真恋爱
随缘认识
```

建议：

```sql
relationship_goal VARCHAR(30)
```

第一版业务值可以：

```text
friendship
language_exchange
dating
serious_relationship
open_to_anything
```

不过我不建议一次允许用户选择很多个。

第一阶段先：

```text
一个主要目的
```

会简单很多。

以后如果产品验证发现用户确实需要多个：

```text
dating + language_exchange
```

再改成关系表。

---

# 十二、profile_status 和 moderation_status 必须分开

这是 Social Profile 非常重要的一处设计。

不要搞成一个：

```text
status
```

同时表示：

```text
草稿
已发布
被封禁
审核中
```

这是不同维度。

应该分为：

### profile_status

代表用户自己的资料生命周期。

```text
draft
active
paused
closed
```

例如：

```text
draft
```

资料还没有完成。

```text
active
```

参与社交发现。

```text
paused
```

用户暂时关闭交友。

```text
closed
```

退出社交。

---

### moderation_status

代表平台审核状态。

```text
pending
approved
rejected
restricted
```

因此可能出现：

```text
profile_status = active
moderation_status = approved
```

正常展示。

也可能：

```text
profile_status = active
moderation_status = restricted
```

平台不给展示。

这样状态机不会互相污染。

---

# 十三、真正能不能被发现，不要再存一个 `is_visible`

这里尤其容易设计坏。

不要再出现：

```text
is_visible
is_enabled
is_active
can_discover
is_public
```

五六个布尔字段。

是否能进入发现池应该由规则计算：

```text
profile_status = active
AND moderation_status = approved
AND 年龄合法
AND 至少有审核通过的主照片
AND 达到最低资料完整度
AND 用户账号状态正常
```

即：

```text
eligible_for_discovery
```

是**业务判断**，而不是 Social Profile 的事实字段。

以后可以做缓存，但不能作为唯一事实源。

---

# 十四、completeness_score：建议保存

这里看起来和上一条矛盾，但实际上不矛盾。

```sql
completeness_score SMALLINT
```

我建议保留。

例如：

```text
头像              +20
昵称              +5
生日              +5
地区              +5
职业              +5
Bio               +15
兴趣 >= 3         +15
语言资料           +10
照片 >= 3         +10
Prompt >= 2       +10
----------------------
                  100
```

为什么保存？

因为之后大量页面都会用：

```text
你的资料完整度 65%
```

推荐系统也可能用：

```text
资料完整度越高
→ 推荐权重稍高
```

如果每次查询都跨：

```text
profile
photos
interests
languages
prompts
```

实时计算，会非常麻烦。

因此它属于典型：

> **可重新计算的派生缓存字段。**

真正事实仍然在各子表。

---

# 十五、published_at

建议保留：

```sql
published_at TIMESTAMPTZ
```

因为：

```text
created_at
```

不代表什么时候开始参与社交。

例如：

```text
8月1日创建草稿
8月10日补完资料
8月13日审核通过
8月15日正式开启交友
```

那么：

```text
created_at   = 08-01
published_at = 08-15
```

这个以后做：

```text
新用户推荐
```

很好用。

---

# 十六、last_active_at 先放 Social Profile 还是行为表？

这里我倾向于：

```sql
social_profiles.last_active_at
```

保留。

因为“最近活跃”本质上是发现系统非常高频的数据：

```text
刚刚活跃
今天活跃
3天内活跃
7天内活跃
```

推荐查询会大量使用。

但是它表达的是：

> **Social 场景中的最后活跃时间**

而不是：

```text
用户最后一次背单词
```

所以不要直接使用账户级：

```text
users.last_login_at
```

否则一个每天学中文、但半年没打开交友模块的人也会显示：

> 刚刚活跃

这明显不对。

---

# 十七、暂时不要塞进 social_profiles 的东西

这是这张表设计里最重要的一点。

下面这些以后都会需要，但**不要塞进主表**：

| 数据 | 应去哪里 |
|---|---|
| 照片1~照片6 | `social_profile_photos` |
| 兴趣1~兴趣20 | `social_profile_interests` |
| 会中文/老挝语 | `social_profile_languages` |
| 理想对象性别 | `social_preferences` |
| 理想年龄范围 | `social_preferences` |
| 想认识哪个国家 | `social_preferences` |
| 个性问题回答 | `social_profile_prompts` |
| 粉丝数 | 统计/缓存体系 |
| 关注数 | 统计/缓存体系 |
| 获赞数 | 统计/缓存体系 |
| 是否关注某用户 | Follow 关系 |
| 是否匹配 | Match 关系 |
| 礼物数量 | Gift/Wallet 相关 |
| 动态数量 | Feed/Post 相关 |
| 是否 VIP | Billing/Entitlement Domain |
| 审核历史 | Moderation 相关记录 |

因此 `social_profiles` 不会随着产品发展变成一张 80 列的表。

---

# 十八、我建议最终版本

所以当前先定成：

```sql
social_profiles
-----------------------------
id
user_id

display_name
gender
birth_date

country_code
region
city

occupation
education_level
bio
relationship_goal

profile_status
moderation_status

completeness_score

published_at
last_active_at

created_at
updated_at
```

唯一约束：

```text
UNIQUE(user_id)
```

核心索引后面等 Discovery 设计的时候再统一建立。

现在**不要为了想象中的推荐算法提前加十几个索引**。

---

# 十九、Social Profile 的生命周期

我建议把流程正式定成：

```text
用户注册
   ↓
正常使用 Learning
   ↓
进入 Social
   ↓
创建 social_profiles
   ↓
draft
   ↓
填写资料
照片 / Bio / 兴趣 / 语言...
   ↓
达到最低发布要求
   ↓
提交审核
   ↓
moderation_status = pending
   ↓
人工审核
   ├── rejected
   │      ↓
   │   用户修改
   │      ↓
   │   重新审核
   │
   └── approved
          ↓
     profile_status = active
          ↓
       进入发现池
```

以后自动审核上线，只是把：

```text
人工 moderator
```

换成：

```text
automatic moderation
        +
risk based manual review
```

**数据模型不需要重构。**

---

## 当前我建议正式确定的 Social Domain 第一部分

Social Profile 的核心设计可以先锁定为：

```text
social_profiles            社交身份主体
social_profile_photos      照片
social_interests           兴趣字典
social_profile_interests   用户兴趣
social_profile_languages   语言能力
social_profile_prompts     个性问答
social_preferences         交友偏好
```

其中 `social_profiles` **只负责“我是谁”**。

而：

```text
social_preferences
```

负责：

> **“我想认识谁”。**

这两个概念必须从一开始分开。

### 下一步

接下来最适合继续设计 **`social_profile_photos`**。照片会涉及 **主图、排序、上传状态、人工审核、违规、替换/删除以及发现页展示规则**，而且它和我们已经确定的“第一阶段图片+文字、前期人工审核”直接相关。照片设计完，再接兴趣、语言、Prompt 和 Preferences。 memcite


---

### [11] USER　status=finished_successfully

继续


---

### [12] ASSISTANT　status=finished_successfully

_(empty)_


---

### [13] ASSISTANT　status=finished_successfully

继续。下一步我们把 **`social_profile_photos`** 定完整，因为它会直接影响资料展示、人工审核、发现页、举报和后续内容安全。

这里我建议把“照片记录”和“审核记录”分开：`social_profile_photos` 保存当前照片事实，审核历史不要反复覆盖在同一张表里。

# Social Profile Photos

建议表名：

```sql
social_profile_photos
```

它只属于 **Social Profile**，不要复用普通用户头像表，也不要直接挂 `user_id`。

关系应该是：

```text
social_profiles
      1
      │
      N
social_profile_photos
```

也就是照片永远通过：

```text
profile_id
```

关联。

---

## 一、推荐字段

第一版我建议：

```sql
CREATE TABLE social_profile_photos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    profile_id          BIGINT NOT NULL,

    media_id            BIGINT NOT NULL,

    position            SMALLINT NOT NULL,

    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,

    status              VARCHAR(20) NOT NULL DEFAULT 'active',
    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',

    moderation_reason   VARCHAR(100),

    approved_at         TIMESTAMPTZ,
    rejected_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_profile_photo_position
        UNIQUE (profile_id, position),

    CONSTRAINT ck_social_profile_photo_position
        CHECK (position BETWEEN 1 AND 9)
);
```

但这里几个字段要明确语义。

---

# 二、照片本身不要存 URL

不要这样：

```sql
image_url VARCHAR(500)
```

更不要：

```text
original_url
thumbnail_url
medium_url
cdn_url
```

全部塞进 Social Domain。

Social Domain 只应该保存：

```sql
media_id
```

真正的文件应该属于统一 Media / Asset 能力，例如：

```text
media_assets
```

里面管理：

```text
storage provider
bucket
object key
mime type
width
height
size
hash
processing status
```

Social Domain 只关心：

> 这张媒体是不是当前用户的社交照片。

这样以后从本地存储迁移到 S3、Cloudflare R2、OSS，都不会修改 Social 表。

---

# 三、position 比 photo_1 / photo_2 好很多

绝对不要：

```text
photo_1
photo_2
photo_3
photo_4
photo_5
photo_6
```

应该每张照片一行：

```text
profile_id | media_id | position
```

例如：

```text
101 | 8001 | 1
101 | 8008 | 2
101 | 8012 | 3
```

这样未来支持：

```text
拖拽排序
增加最大照片数量
删除照片
替换照片
```

都非常简单。

第一阶段我建议产品限制：

```text
最多 6 张
```

但数据库 CHECK 可以暂时允许：

```text
1 ~ 9
```

这里其实有两种方案。

如果我们希望数据库严格跟产品规则：

```sql
CHECK (position BETWEEN 1 AND 6)
```

我更推荐这一种。

以后真改成 9 张，再做 migration。

因为：

> 数据库应该保护当前合法业务状态，而不是提前猜未来。

所以最终建议：

```sql
CHECK (position BETWEEN 1 AND 6)
```

---

# 四、position = 1 和 is_primary 要不要同时存在？

这里其实存在数据重复：

```text
position = 1
```

理论上就可以表示主照片。

如果同时保存：

```text
is_primary = true
```

可能出现非法状态：

```text
position = 2
is_primary = true
```

甚至：

```text
两张照片都是 primary
```

所以我建议我们 **不要 `is_primary` 字段**。

直接定义：

> `position = 1` 就是主照片。

于是：

```text
1 = 主照片
2~6 = 其它照片
```

这会明显简单很多。

换主照片其实就是调整排序。

比如：

```text
原：
A → 1
B → 2
C → 3

用户把 C 设置为主图：

C → 1
A → 2
B → 3
```

非常干净。

因此最终删除：

```sql
is_primary
```

---

# 五、照片状态和审核状态仍然分开

这里延续我们刚才 Social Profile 的原则。

照片自己的生命周期：

```sql
status VARCHAR(20)
```

建议：

```text
active
deleted
```

第一阶段其实两个状态就够。

而平台审核：

```sql
moderation_status VARCHAR(20)
```

建议：

```text
pending
approved
rejected
```

以后自动审核以后可以扩展：

```text
review_required
```

所以某张图片：

```text
status = active
moderation_status = approved
```

才能展示。

---

# 六、不建议直接物理删除照片记录

例如用户上传：

```text
photo A
```

审核通过。

后来用户删除。

不要直接：

```sql
DELETE FROM social_profile_photos
```

而建议：

```text
status = deleted
```

为什么？

因为 Social 场景存在：

```text
举报
审核
封禁
纠纷
风控
```

以后你经常会遇到：

> 用户删除照片之后，有人举报他之前展示过违规图片。

如果数据库完全没有历史记录，很难追踪。

所以 Social 内容建议保持一定审计能力。

---

# 七、但 `deleted_at` 比 status 更适合吗？

这里我建议：

```sql
deleted_at TIMESTAMPTZ
```

比：

```text
status = deleted
```

更清晰。

于是可以直接：

```text
deleted_at IS NULL
```

表示当前有效照片。

这样照片状态甚至可以完全不要：

```text
status
```

因此我进一步收敛为：

```text
deleted_at
moderation_status
```

即可。

判断展示：

```text
deleted_at IS NULL
AND moderation_status = 'approved'
```

比维护一个 `active/deleted` Enum 更简单。

---

# 八、用户替换照片时，不要覆盖旧行

假设：

```text
position = 2
photo A
```

用户上传 photo B 替换。

不要：

```sql
UPDATE media_id = B
```

因为这样会失去：

```text
A 的审核历史
A 被举报的关联
A 曾经展示过的事实
```

正确做法：

```text
photo A
deleted_at = now()
```

然后：

```text
photo B
position = 2
moderation_status = pending
```

新增一行。

这也是为什么：

```text
UNIQUE(profile_id, position)
```

不能简单直接这么建。

因为软删除之后：

```text
旧照片 position = 2
新照片 position = 2
```

会发生唯一键冲突。

PostgreSQL 在这里正好可以用 **partial unique index**：

```sql
CREATE UNIQUE INDEX uq_social_profile_photos_active_position
ON social_profile_photos(profile_id, position)
WHERE deleted_at IS NULL;
```

这比普通 UNIQUE 更合适。

---

# 九、照片审核不能只有最终状态

`social_profile_photos` 保存：

```text
moderation_status
```

只是**当前审核结果**。

真正的审核历史应该以后进入 Moderation：

```text
moderation_cases
moderation_reviews
```

或者 Social 内的审核记录体系。

比如一张照片：

```text
第一次：
AI → suspicious

第二次：
人工 → approved

第三次：
收到举报 → reviewed

第四次：
人工 → rejected
```

不能一直覆盖：

```text
moderation_reason
```

否则你根本不知道发生过什么。

因此主表只保留：

```text
moderation_status
```

以及必要的：

```text
moderated_at
```

即可。

我甚至不建议这里保存：

```text
approved_at
rejected_at
moderation_reason
```

因为这些都属于审核历史。

因此继续收敛。

---

# 十、照片最小模型

这样最终其实可以非常简洁：

```sql
CREATE TABLE social_profile_photos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    profile_id          BIGINT NOT NULL,
    media_id            BIGINT NOT NULL,

    position            SMALLINT NOT NULL,

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT ck_social_profile_photos_position
        CHECK (position BETWEEN 1 AND 6),

    CONSTRAINT ck_social_profile_photos_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

然后：

```sql
CREATE UNIQUE INDEX uq_social_profile_photos_active_position
ON social_profile_photos(profile_id, position)
WHERE deleted_at IS NULL;
```

这已经非常干净。

---

# 十一、一张 media 能不能重复绑定？

建议不要。

也就是说同一张：

```text
media_id = 123
```

不能同时：

```text
position 1
position 3
```

也不能重复作为同一用户的多张资料图。

可以加：

```sql
CREATE UNIQUE INDEX uq_social_profile_photos_active_media
ON social_profile_photos(profile_id, media_id)
WHERE deleted_at IS NULL;
```

这样用户不会出现：

```text
照片 A
照片 A
照片 A
照片 B
```

这种资料。

---

# 十二、删除照片后的 position 怎么处理？

这里有两个方案。

例如原来：

```text
1 A
2 B
3 C
4 D
```

删除 B。

方案 A：

```text
1 A
3 C
4 D
```

允许 position 有空洞。

方案 B：

```text
1 A
2 C
3 D
```

自动重新排序。

我建议：

> **使用方案 B。**

保持：

```text
1,2,3,4...
```

连续。

因为前端渲染、排序、主图判断都会更简单。

删除：

```text
position = 2
```

后：

```sql
3 → 2
4 → 3
```

这属于 application/service 层事务处理。

---

# 十三、主照片审核失败怎么办？

这是一个很重要的业务场景。

例如：

```text
position 1 = rejected
position 2 = approved
position 3 = approved
```

不要自动把：

```text
position 2
```

提升为主照片。

因为用户可能并不希望它成为主页首图。

正确方式是：

> 主照片必须是用户明确选择的 position = 1。

如果：

```text
position = 1
moderation_status != approved
```

那么这个 Social Profile：

```text
不能进入发现池
```

直到用户上传新的主照片并审核通过。

---

# 十四、正在审核的新照片是否影响旧照片？

这里要特别设计好。

假设当前：

```text
position 1 = A
approved
```

用户换主照片 B。

如果我们立即：

```text
A.deleted_at = now()
B.position = 1
B.pending
```

那么用户会突然：

```text
没有可展示主图
```

直到人工审核完成。

体验不好。

更好的规则应该是：

```text
旧照片 A 保持展示
新照片 B pending
```

等：

```text
B approved
```

以后再原子替换：

```text
A.deleted_at = now()
B.position = 1
```

这意味着我们需要支持：

> **待审核图片暂时不占正式 position。**

因此前面的模型还可以进一步优化。

---

# 十五、position 应该允许 NULL

对于新上传、等待审核的替换图：

```text
position = NULL
moderation_status = pending
```

审核成功以后：

```text
position = 1
```

然后替换旧图。

但普通新增：

```text
第三张照片
```

其实也可以审核前先：

```text
position = NULL
```

审核成功才正式进入资料。

这种模式最大的优点是：

> **公开资料永远只由审核通过的稳定版本构成。**

于是资料编辑本身不会立刻影响别人看到的资料。

这个思想后面做：

```text
昵称修改
Bio 修改
照片修改
```

其实都很有价值。

不过如果全面做成“资料版本审核”，复杂度会明显增加。

对于第一阶段，我建议照片先采用比较简单的模型：

```text
新照片可以占 position
但只有 approved 才展示
```

接受短暂的：

```text
待审核状态
```

因为我们现在是单人开发，不值得为了无缝图片审核把整个 Profile Versioning 系统提前做出来。

---

# 十六、发现页实际读取规则

发现页绝对不要简单：

```sql
SELECT *
FROM social_profile_photos
WHERE profile_id = ?
ORDER BY position;
```

业务条件应该是：

```sql
WHERE profile_id = ?
  AND deleted_at IS NULL
  AND moderation_status = 'approved'
ORDER BY position;
```

而且 Profile 本身进入发现池必须满足：

```text
至少一张审核通过照片
AND
position = 1 的照片审核通过
```

之后我们在 Discovery Domain/模块设计时，会把这些条件统一收口。

---

# 十七、人工审核第一阶段

我们之前已经确定：

> 前期人工审核，后期自动化审核。

那么照片上传流程可以直接定成：

```text
用户上传图片
    ↓
Media 保存
    ↓
创建 social_profile_photos
    ↓
moderation_status = pending
    ↓
后台审核队列
    ↓
管理员查看
   ├─ 通过
   │    ↓
   │ approved
   │
   └─ 拒绝
        ↓
      rejected
        ↓
用户重新上传
```

未来接自动审核：

```text
上传
 ↓
机器审核
 ├─ 明显安全 → approved
 ├─ 明显违规 → rejected
 └─ 不确定 → 人工审核
```

照片的数据模型无需变化。

---

# 十八、Social Profile Photos 最终建议

这一轮我建议正式锁定为：

```text
social_profile_photos
────────────────────────
id
profile_id
media_id

position

moderation_status
moderated_at

created_at
updated_at
deleted_at
```

其中：

```text
position = 1
```

就是主照片，不再增加：

```text
is_primary
```

照片是否有效：

```text
deleted_at IS NULL
```

照片是否允许展示：

```text
deleted_at IS NULL
AND moderation_status = approved
```

最大照片数第一阶段：

```text
6 张
```

并使用 PostgreSQL partial unique index 保证：

```sql
UNIQUE(profile_id, position)
WHERE deleted_at IS NULL
```

以及：

```sql
UNIQUE(profile_id, media_id)
WHERE deleted_at IS NULL
```

---

下一步我建议直接设计 **`social_interests` + `social_profile_interests`**。这里会决定兴趣标签是固定字典、用户自定义，还是后台运营维护，以及以后推荐算法怎么利用这些兴趣数据。 memcite


---

### [14] USER　status=finished_successfully

继续


---

### [15] ASSISTANT　status=finished_successfully

继续，我们现在设计 **`social_interests` + `social_profile_interests`**。

这一块的目标不是单纯“给用户贴几个标签”，而是同时服务 4 件事：**资料展示、筛选、推荐、运营管理**。所以我建议不要把兴趣直接存成 JSON 或字符串数组，而是用“兴趣字典 + 用户关系表”。

## 一、整体结构

关系很简单：

```text
social_interests
      1
      │
      N
social_profile_interests
      N
      │
      1
social_profiles
```

也就是说：

```text
一个兴趣
可以被很多用户选择

一个用户
可以选择多个兴趣
```

第一阶段就做标准多对多。

---

## 二、social_interests：兴趣字典

建议表：

```sql
CREATE TABLE social_interests (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    code            VARCHAR(50) NOT NULL,
    name_zh         VARCHAR(50) NOT NULL,
    name_lo         VARCHAR(50),
    name_en         VARCHAR(50),

    category        VARCHAR(50),

    sort_order      INTEGER NOT NULL DEFAULT 0,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_interests_code UNIQUE (code)
);
```

这里最重要的是：

```text
code
```

才是稳定业务标识。

例如：

```text
code = travel
name_zh = 旅行
name_lo = ...
name_en = Travel
```

以后就算把中文名称：

```text
旅行
```

改成：

```text
旅游
```

业务引用也完全不受影响。

所以：

> ID 用于数据库关系，code 用于稳定业务语义，name_* 用于展示。

---

## 三、为什么兴趣不能直接写字符串

不要这样：

```text
social_profiles.interests = "旅行,电影,咖啡"
```

也不要：

```json
["旅行", "电影", "咖啡"]
```

因为以后你一定会需要：

```text
找喜欢旅行的人
统计最热门兴趣
按兴趣推荐
后台禁用某兴趣
修改多语言名称
做兴趣分类
合并重复兴趣
```

一旦是自由字符串，这些都会变麻烦。

关系表更适合当前项目。

---

## 四、兴趣第一阶段应该由平台维护，不允许用户自由创建

这里我建议明确：

> **第一阶段只允许用户从平台提供的兴趣库选择。**

不要允许：

```text
+ 自定义兴趣
```

原因不是技术实现困难，而是内容治理问题。

一旦开放自由创建，马上会出现：

```text
联系方式
微信号
色情内容
广告
辱骂
政治敏感内容
重复词
拼写错误
中老双语混乱
```

然后你还得给“兴趣标签”做审核系统。

没有必要。

所以第一版：

```text
后台创建兴趣
↓
用户选择
```

足够。

未来用户量大以后，再考虑：

```text
用户提交兴趣建议
→ 审核
→ 纳入官方兴趣库
```

而不是直接生成公开标签。

---

## 五、category 要保留

兴趣最好分组。

比如：

```text
lifestyle
sports
food
music
movies
travel
games
animals
creative
social
```

然后具体兴趣：

```text
旅行
摄影
咖啡
足球
羽毛球
健身
电影
音乐
唱歌
游戏
猫
狗
做饭
阅读
```

所以：

```sql
category VARCHAR(50)
```

建议保留。

但第一阶段不用再建立：

```text
social_interest_categories
```

表。

直接 category code 即可。

因为分类数量少，而且主要用于 UI 分组。

例如：

```text
category = sports
```

前端自己翻译：

```text
运动
ກິລາ
Sports
```

也可以。

---

## 六、name_zh / name_lo / name_en 是否应该进翻译体系？

从纯架构角度，当然可以做：

```text
social_interest_translations
```

例如：

```text
interest_id
locale
name
```

这会更国际化。

但是对于当前项目，我不建议。

因为现在核心语言就是：

```text
中文
老挝语
```

英文最多作为辅助。

如果现在为了理论上的国际化拆：

```text
social_interests
social_interest_translations
```

只会增加查询和维护成本。

所以第一阶段直接：

```text
name_zh
name_lo
name_en
```

更实际。

如果未来真的扩到：

```text
泰语
越南语
英语
缅甸语
```

再抽翻译表也不晚。

---

## 七、social_profile_interests

用户兴趣关系表建议：

```sql
CREATE TABLE social_profile_interests (
    profile_id      BIGINT NOT NULL,
    interest_id     BIGINT NOT NULL,

    sort_order      SMALLINT NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (profile_id, interest_id)
);
```

非常简单。

这里不需要单独：

```text
id BIGINT
```

因为这本质就是标准关系表。

它的自然唯一键已经是：

```text
(profile_id, interest_id)
```

所以直接复合主键就够。

---

## 八、为什么保留 sort_order

因为用户选择：

```text
旅行
摄影
咖啡
电影
音乐
```

以后资料页不一定希望随机展示。

我们可以允许用户排序：

```text
1 旅行
2 摄影
3 咖啡
4 电影
5 音乐
```

其中前几个甚至可以作为：

> 最能代表我的兴趣

所以：

```sql
sort_order
```

值得留。

但不要再搞：

```text
is_primary
favorite_level
importance_score
```

第一版完全没必要。

排序本身已经能表达优先级。

---

## 九、用户最多选择多少个兴趣？

建议第一阶段：

```text
最少 3 个
最多 10 个
```

比较合适。

太少：

```text
1 个兴趣
```

对推荐没什么价值。

太多：

```text
30 个兴趣
```

最后人人都差不多，标签失去区分度。

所以产品规则可以：

```text
3 ~ 10
```

数据库层不适合用简单 CHECK 保证这个跨行数量。

应该由 Service 层控制。

例如：

```text
addInterest(profileId, interestId)
```

先检查当前数量：

```text
< 10
```

再添加。

而：

```text
发布 Social Profile
```

时检查：

```text
>= 3
```

---

## 十、兴趣是否参与资料完整度？

要。

我们之前已经为：

```text
completeness_score
```

保留了空间。

例如：

```text
0 个兴趣    +0
1~2 个      +5
3 个以上    +15
```

这样可以鼓励用户填写。

但是完整度本身还是：

```text
social_profiles.completeness_score
```

缓存结果。

兴趣关系表不要存类似：

```text
contribution_score
```

这种字段。

---

## 十一、兴趣以后怎么参与推荐

兴趣推荐可以从最简单的方法开始。

例如用户 A：

```text
旅行
摄影
咖啡
电影
健身
```

用户 B：

```text
旅行
摄影
音乐
电影
```

共同兴趣：

```text
旅行
摄影
电影
```

那么：

```text
common_interest_count = 3
```

可以作为推荐特征。

第一阶段甚至可以：

```text
推荐分 =
国家匹配
+ 活跃度
+ 资料完整度
+ 共同兴趣数量
+ 其它条件
```

之后再逐渐优化。

所以现在关系表已经足够支持未来推荐算法，不需要提前加：

```text
interest_match_score
recommendation_weight
vector
embedding
```

这些都不是 Social Interest 的事实数据。

---

## 十二、兴趣自己要不要有 weight？

比如：

```text
旅行 weight = 2
摄影 weight = 3
```

我建议现在不要。

因为权重不是兴趣自身固定属性。

例如：

```text
喜欢“语言学习”
```

对于你的产品可能很重要。

但对另一个推荐场景未必重要。

权重属于：

> 推荐算法 / Ranking Strategy

不属于：

```text
social_interests
```

否则算法参数会污染业务主数据。

以后可以放：

```text
recommendation config
feature weights
```

之类的配置体系。

---

## 十三、兴趣删除不要真的 DELETE

假设：

```text
social_interests.id = 15
name_zh = 夜店
```

以后产品不想继续提供这个标签。

不要：

```sql
DELETE FROM social_interests
```

应该：

```text
is_active = false
```

这样：

```text
旧用户历史关系仍然存在
新用户不能再选择
后台统计仍然完整
```

用户编辑资料时，可以提示：

> 此兴趣已不可用，请重新选择。

之后再移除关系。

所以：

```sql
is_active BOOLEAN
```

很有价值。

---

## 十四、是否允许后台改 code？

原则上：

```text
code
```

创建以后就不要改。

比如：

```text
travel
```

可以改显示名：

```text
旅行 → 爱旅行
```

但是 code 保持：

```text
travel
```

因为未来：

```text
推荐规则
埋点
接口
缓存
后台配置
```

都有可能引用它。

可以把它理解成：

> Interest 的业务主键。

---

# 十五、建议的兴趣库规模

第一版不应该上来做：

```text
300 个兴趣
```

这对用户选择体验很差，也增加维护成本。

我建议先准备大约：

```text
40 ~ 80 个
```

真正高频、容易理解的兴趣。

例如可以覆盖：

```text
旅行、摄影、电影、音乐、唱歌、阅读、做饭、咖啡、美食、健身、
跑步、足球、篮球、羽毛球、游泳、游戏、动漫、宠物、猫、狗、
露营、徒步、骑行、购物、舞蹈、绘画、语言学习、科技、汽车、
钓鱼、桌游、KTV、夜市、海边、自然、美妆、时尚……
```

重点不是多，而是：

> **每个标签都真的能够帮助用户表达自己。**

---

# 十六、最终确定模型

这一部分我建议锁定为：

```text
social_interests
────────────────────────
id
code
name_zh
name_lo
name_en
category
sort_order
is_active
created_at
updated_at
```

以及：

```text
social_profile_interests
────────────────────────
profile_id
interest_id
sort_order
created_at

PK(profile_id, interest_id)
```

产品规则：

```text
平台维护兴趣库
用户不能直接自定义公开兴趣

每个用户：
最少 3 个
最多 10 个

用户可以调整兴趣展示顺序
```

这样这套兴趣模型已经同时满足：

```text
资料展示
中老双语
后台运营
筛选
共同兴趣
推荐算法
统计分析
```

而且结构仍然非常轻。

---

下一步我们继续设计 **`social_profile_languages`**。

这一张表其实很关键，因为你的 Social 不只是普通交友：**语言能力本身就是用户之间建立连接的重要信息**。我们需要明确区分“母语、会说什么语言、学习什么语言、熟练程度”，并且避免和 Learning Domain 的学习进度混在一起。 memcite


---

### [16] USER　status=finished_successfully

继续


---

### [17] ASSISTANT　status=finished_successfully

继续，我们现在设计 **`social_profile_languages`**。

这一块要特别注意：**Social Domain 只表达“这个人在社交场景中的语言画像”，不要直接读取或复用 Learning Domain 的课程进度、等级、学习记录。** 两边有关联，但不是同一个业务事实。memcite

## 一、这张表要表达什么

我们真正需要表达的是：

```text
这个人会什么语言？
哪一个是母语？
熟练程度怎么样？
是否愿意用这门语言交流？
```

而不是：

```text
学了多少课
背了多少单词
考试多少分
连续学习多少天
```

后者全部属于 Learning Domain。

因此建议结构：

```text
social_profiles
      1
      │
      N
social_profile_languages
```

一个 Social Profile 可以有多门语言。

---

## 二、推荐表结构

```sql
CREATE TABLE social_profile_languages (
    profile_id          BIGINT NOT NULL,
    language_code       VARCHAR(10) NOT NULL,

    proficiency_level   VARCHAR(20) NOT NULL,

    is_native           BOOLEAN NOT NULL DEFAULT FALSE,
    is_learning         BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order          SMALLINT NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (profile_id, language_code),

    CONSTRAINT ck_social_profile_languages_proficiency
        CHECK (
            proficiency_level IN (
                'beginner',
                'elementary',
                'intermediate',
                'advanced',
                'fluent',
                'native'
            )
        )
);
```

第一版做到这里其实已经够用了。

---

# 三、`language_code` 不要写中文名称

不要存：

```text
中文
老挝语
英语
```

应该保存稳定代码：

```text
zh
lo
en
```

也就是：

```sql
language_code VARCHAR(10)
```

以后 UI 再翻译成：

```text
zh → 中文 / ພາສາຈີນ / Chinese
lo → 老挝语 / ພາສາລາວ / Lao
en → 英语 / ພາສາອັງກິດ / English
```

如果项目里已经有统一的 `languages` 字典，那么这里最好直接引用那个字典，而不是 Social Domain 再维护一份语言名称。

也就是说，推荐关系是：

```text
languages
   1
   │
   N
social_profile_languages
```

Social Domain 只保存：

```text
language_code
```

或者统一的：

```text
language_id
```

取决于我们前面公共语言字典最终采用什么主键。

---

# 四、母语不能用 `proficiency_level = native` 单独代替

看起来可以写：

```text
proficiency_level = native
```

来判断母语。

但我建议仍然保留：

```sql
is_native BOOLEAN
```

因为两个概念并不完全相同。

例如一个中国用户：

```text
中文：
is_native = true
proficiency_level = native

老挝语：
is_native = false
proficiency_level = fluent
```

还有可能有人从小双语：

```text
中文 native
老挝语 native
```

所以允许：

```text
多个 is_native = true
```

是合理的。

不要限制：

> 每人只能一个母语。

---

# 五、`is_learning` 很重要

这个字段建议保留：

```sql
is_learning BOOLEAN
```

因为：

```text
会一门语言
```

和：

```text
正在学习一门语言
```

不是一回事。

例如用户：

```text
中文
native

英语
advanced

老挝语
beginner + learning
```

Social 页面就可以显示：

```text
母语：中文
会说：英语
正在学习：老挝语
```

这对你的产品非常有价值。

而且以后推荐时：

```text
A 的母语 = 中文
A 正在学习 = 老挝语

B 的母语 = 老挝语
B 正在学习 = 中文
```

这就是非常强的匹配信号：

```text
双向语言交换匹配
```

但我们只记录事实。

具体：

```text
互补语言匹配权重 +20
```

仍然属于 Recommendation/Discovery 逻辑，不存这里。

---

# 六、不要存 `is_teaching`

我不建议现在加：

```text
is_teaching
willing_to_teach
can_teach
```

因为你目前的社交关系不是专业教师市场。

如果用户：

```text
中文母语
老挝语学习中
```

系统完全可以推断他是适合某个老挝用户交流中文的人。

所以第一版：

```text
is_native
is_learning
proficiency_level
```

已经足够。

未来真的上线：

> 找语言老师 / 付费陪练

那应该是新的业务能力，而不是给 Social Language 塞字段。

---

# 七、熟练等级怎么划分

第一版我建议不要直接使用：

```text
HSK 4
CEFR B2
考试分数
```

因为不同语言体系不统一。

Social Profile 需要的是用户容易理解的粗粒度等级。

可以使用：

```text
beginner
elementary
intermediate
advanced
fluent
native
```

UI 显示：

```text
入门
基础
中级
高级
流利
母语
```

这已经足够做：

```text
资料展示
筛选
推荐
```

---

# 八、`native` 和 `is_native` 会不会重复？

有一点重复。

所以还有一种更干净的方案：

```text
proficiency_level:
beginner
elementary
intermediate
advanced
fluent

is_native:
true / false
```

如果：

```text
is_native = true
```

就无需再：

```text
proficiency_level = native
```

我其实更推荐这一种。

最终：

```text
beginner
elementary
intermediate
advanced
fluent
```

然后：

```text
is_native = true
```

单独表达母语身份。

这样不存在：

```text
proficiency_level = native
is_native = false
```

这种矛盾状态。

所以建议最终 CHECK：

```sql
CHECK (
    proficiency_level IN (
        'beginner',
        'elementary',
        'intermediate',
        'advanced',
        'fluent'
    )
)
```

---

# 九、母语用户的 proficiency 怎么填？

如果：

```text
is_native = true
```

可以统一：

```text
proficiency_level = fluent
```

但语义还是有点别扭。

更好的设计其实是：

```sql
proficiency_level VARCHAR(20)
```

允许 `NULL`。

规则：

```text
is_native = true
→ proficiency_level IS NULL

is_native = false
→ proficiency_level NOT NULL
```

例如：

```text
zh:
is_native = true
proficiency_level = NULL

lo:
is_native = false
proficiency_level = beginner
```

数据库 CHECK：

```sql
CHECK (
    (is_native = TRUE AND proficiency_level IS NULL)
    OR
    (
        is_native = FALSE
        AND proficiency_level IN (
            'beginner',
            'elementary',
            'intermediate',
            'advanced',
            'fluent'
        )
    )
)
```

这个模型语义最干净。

我建议采用它。

---

# 十、`is_learning` 与母语是否冲突

业务上：

```text
is_native = true
is_learning = true
```

通常没有意义。

所以可以做 CHECK：

```sql
CHECK (
    NOT (is_native = TRUE AND is_learning = TRUE)
)
```

也就是说：

> 母语不能同时标记为“正在学习”。

这可以直接在数据库保护。

---

# 十一、要不要存“学习目标语言”在 social_profiles？

不要。

比如：

```sql
social_profiles.learning_language_code
```

不应该存在。

因为一个用户未来可能：

```text
学习老挝语
同时学习英语
```

所以它天然是多值关系。

已经由：

```text
social_profile_languages.is_learning
```

表达。

避免重复事实源。

---

# 十二、要不要从 Learning Domain 自动同步？

这里必须非常谨慎。

比如 Learning Domain 已知：

```text
用户正在学老挝语
```

我们可以在创建 Social Profile 时：

> 帮用户预填 `lo + is_learning=true`

但不要把 Social 数据设计成每次实时 JOIN Learning。

原因是用户可能希望：

```text
学习系统里正在学英语
但社交资料不希望展示英语
```

Social Profile 是一种：

> 用户主动公开的资料。

所以推荐规则：

```text
Learning Domain
      ↓
可以帮助初始化
      ↓
Social Profile Language
```

但一旦创建后：

```text
Social 自己拥有自己的数据
```

不要双向强绑定。

---

# 十三、是否需要“愿意交流”字段

比如：

```text
can_chat_in_language
```

我暂时不建议。

正常情况下：

```text
用户主动添加到 Social Profile 的语言
```

就可以理解为愿意公开展示。

真正“不想用某语言聊天”的需求以后如果出现，可以放到：

```text
social_preferences
```

而不是 Language 表。

---

# 十四、sort_order 是否需要

建议保留：

```sql
sort_order SMALLINT
```

例如用户希望显示：

```text
中文 · 母语
老挝语 · 初级 · 学习中
英语 · 中级
```

而不是数据库随机顺序。

第一语言通常放第一位。

不需要额外：

```text
is_primary_language
```

排序足够。

---

# 十五、最少需要几门语言

Social Profile 发布时，我建议：

```text
至少 1 门语言
```

但是对你的核心用户，其实正常情况都会至少两门：

```text
母语
+
学习目标语言
```

例如：

```text
中国用户：
中文 native
老挝语 learning

老挝用户：
老挝语 native
中文 learning
```

不过数据库不要强制至少两条。

因为这属于产品规则，而且未来 Social 功能可能允许：

```text
只交友，不语言交换
```

所以：

> 发布要求至少一门语言，由 Service 层校验。

---

# 十六、是否限制最大语言数量

可以限制产品层：

```text
最多 5 门
```

但现在甚至没必要特别强调。

绝大多数用户只有：

```text
1~3 门
```

所以先不把这个规则写死到数据库。

---

# 十七、完整度怎么计算

语言资料可以参与：

```text
completeness_score
```

例如：

```text
没有语言       +0
只有母语       +5
母语 + 学习语  +10
```

但是同样不要在：

```text
social_profile_languages
```

里记录任何：

```text
profile_score
recommendation_score
```

这些都是派生数据。

---

# 十八、最终推荐结构

我建议最终定成：

```sql
CREATE TABLE social_profile_languages (
    profile_id          BIGINT NOT NULL,
    language_code       VARCHAR(10) NOT NULL,

    proficiency_level   VARCHAR(20),

    is_native           BOOLEAN NOT NULL DEFAULT FALSE,
    is_learning         BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order          SMALLINT NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (profile_id, language_code),

    CONSTRAINT ck_social_profile_languages_level
        CHECK (
            (
                is_native = TRUE
                AND proficiency_level IS NULL
            )
            OR
            (
                is_native = FALSE
                AND proficiency_level IN (
                    'beginner',
                    'elementary',
                    'intermediate',
                    'advanced',
                    'fluent'
                )
            )
        ),

    CONSTRAINT ck_social_profile_languages_native_learning
        CHECK (
            NOT (is_native = TRUE AND is_learning = TRUE)
        )
);
```

最终语义非常明确：

```text
language_code
→ 什么语言

is_native
→ 是否母语

is_learning
→ 是否正在学习

proficiency_level
→ 非母语情况下的熟练程度

sort_order
→ 资料页展示顺序
```

---

到现在为止，我们的 Social Profile 聚合已经有：

```text
social_profiles
social_profile_photos
social_interests
social_profile_interests
social_profile_languages
```

下一步我建议设计 **`social_profile_prompts`**。

这个东西很适合你的产品：除了普通 `bio`，可以让用户回答诸如“我正在学中文是因为……”“我最想去的地方……”“理想的周末……”这类问题。它既能让交友资料更丰富，也能给之后的动态互动、聊天开场和推荐提供很好的内容基础。


---

### [18] USER　status=finished_successfully

继续


---

### [19] ASSISTANT　status=finished_successfully

_(empty)_


---

### [20] ASSISTANT　status=finished_successfully

继续。现在设计 **`social_profile_prompts`**，但我建议不要只做一张“用户回答表”，而是拆成：

```text
social_prompt_templates
social_profile_prompts
```

前者负责“平台提供哪些问题”，后者负责“用户选择了哪些问题、怎么回答”。

这样以后后台可以新增、下线、排序问题，而不用改代码。

## 一、整体关系

```text
social_prompt_templates
          1
          │
          N
social_profile_prompts
          N
          │
          1
social_profiles
```

一个 Prompt 模板可以被很多用户回答。

一个用户可以选择多个 Prompt。

例如平台提供：

```text
我正在学习这门语言，因为……
理想的周末是……
最近最想去的地方是……
最容易让我开心的事情是……
如果我们聊天，可以先聊……
```

用户从中选择 3 个填写。

---

## 二、为什么不能直接在 social_profiles 里放 prompt_1 / prompt_2

不要这样：

```text
prompt_1_question
prompt_1_answer

prompt_2_question
prompt_2_answer

prompt_3_question
prompt_3_answer
```

因为以后你一定会遇到：

```text
增加 Prompt 数量
删除某个问题
调整问题文案
多语言展示
统计哪个问题最受欢迎
推荐聊天开场
```

关系表会干净很多。

---

# 三、social_prompt_templates

我建议：

```sql
CREATE TABLE social_prompt_templates (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    code            VARCHAR(50) NOT NULL,

    question_zh     VARCHAR(200) NOT NULL,
    question_lo     VARCHAR(200),
    question_en     VARCHAR(200),

    category        VARCHAR(50),

    sort_order      INTEGER NOT NULL DEFAULT 0,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_prompt_templates_code
        UNIQUE (code)
);
```

这里和 Interests 一样：

```text
id
```

是数据库标识。

```text
code
```

是稳定业务标识。

例如：

```text
code = ideal_weekend

question_zh = 理想的周末是……
question_lo = ...
question_en = My ideal weekend is...
```

以后文案改了：

```text
理想的周末是……
↓
如果这个周末完全属于你，你会……
```

`code` 不变。

---

# 四、Prompt 分类要不要有

建议保留：

```sql
category VARCHAR(50)
```

第一版可以有：

```text
personality
lifestyle
relationship
language
travel
fun
```

主要用于后台管理和前端选择页分组。

例如：

```text
language
    我学习中文/老挝语是因为……
    最想掌握的一句话是……

lifestyle
    理想的周末是……
    我每天离不开的是……

relationship
    我最看重一个人的……
```

但和 Interest 一样：

> 第一阶段不要再单独建 Prompt Category 表。

没有必要。

---

# 五、social_profile_prompts

用户答案表：

```sql
CREATE TABLE social_profile_prompts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    profile_id          BIGINT NOT NULL,
    prompt_template_id  BIGINT NOT NULL,

    answer              VARCHAR(500) NOT NULL,

    position            SMALLINT NOT NULL,

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT ck_social_profile_prompts_position
        CHECK (position BETWEEN 1 AND 3),

    CONSTRAINT ck_social_profile_prompts_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

第一阶段我建议：

```text
最多 3 个 Prompt
```

这个数量很合适。

Bio 是完整自我介绍。

Prompt 则提供三个更容易产生聊天的话题。

如果开放到：

```text
8~10 个
```

资料页会非常长，而且用户填写压力很大。

---

# 六、为什么这里建议有单独的 id

前面的：

```text
social_profile_interests
social_profile_languages
```

可以使用复合主键。

但 Prompt 我建议一定有：

```sql
id BIGINT
```

因为 Prompt Answer 本身属于一种用户生成内容。

以后它很可能被：

```text
举报
审核
修改
风控
引用
```

例如：

> 举报某用户 Prompt 里的色情文字。

拥有稳定：

```text
social_profile_prompt_id
```

会非常方便。

这和简单关系表不一样。

---

# 七、同一个 Prompt 一个用户只能回答一次

需要保证：

```text
同一个 profile
不能同时回答两次 ideal_weekend
```

所以增加 partial unique index：

```sql
CREATE UNIQUE INDEX uq_social_profile_prompts_active_template
ON social_profile_prompts(profile_id, prompt_template_id)
WHERE deleted_at IS NULL;
```

这样：

```text
用户可以删除旧答案
然后以后重新回答
```

但当前有效资料中只能存在一个。

---

# 八、position 同样不能重复

例如：

```text
position 1
position 2
position 3
```

所以：

```sql
CREATE UNIQUE INDEX uq_social_profile_prompts_active_position
ON social_profile_prompts(profile_id, position)
WHERE deleted_at IS NULL;
```

和照片一样。

用户拖动顺序：

```text
1 理想的周末
2 我学老挝语的原因
3 最近想去的地方
```

就修改 position。

---

# 九、答案长度

第一阶段我建议：

```text
最多 300 字符
```

而不是 500。

数据库可以稍微放宽：

```sql
answer VARCHAR(500)
```

应用层产品限制：

```text
300
```

为什么这么设计？

数据库最大值是数据安全边界。

UI 限制是产品体验。

以后你把 UI 从：

```text
300
```

调整成：

```text
400
```

不需要 migration。

不过也不要直接：

```text
TEXT
```

无限制。

Social UGC 最好始终有明确长度上限。

---

# 十、Prompt 必须审核

这里与 Interest 完全不同。

Interest 是：

```text
平台预定义
```

本身不存在用户输入内容。

Prompt 的：

```text
answer
```

属于 UGC。

所以必须走：

```text
moderation_status
```

第一阶段：

```text
pending
approved
rejected
```

以后机器审核仍然沿用。

---

# 十一、Bio 其实也属于 UGC，那怎么办？

这正好暴露出一个重要问题。

我们之前：

```text
social_profiles.bio
```

只有 Profile 层：

```text
moderation_status
```

如果以后用户修改 Bio：

```text
整个 profile moderation_status = pending
```

那么可能造成整个资料重新下线。

这未必理想。

因此 Social Profile 审核实际上需要区分：

```text
资料级审核
和
内容项审核
```

照片已经有：

```text
social_profile_photos.moderation_status
```

Prompt 也有：

```text
social_profile_prompts.moderation_status
```

而 Bio / display_name / occupation 等文本还在 Profile 主表。

第一阶段，我们可以接受：

> 修改核心文字资料后，Profile 重新进入审核。

这样实现简单。

以后用户量上来，再升级成：

```text
profile revision / pending changes
```

让旧版本继续展示、新版本后台审核。

现在不提前做版本系统。

---

# 十二、用户编辑 Prompt 怎么处理

有两个选择。

例如：

```text
原答案：
我喜欢周末去爬山。

用户修改：
我喜欢周末去爬山和露营。
```

方案 A：

```sql
UPDATE answer = ...
moderation_status = pending
```

简单。

缺点是审核期间旧答案消失。

方案 B：

保留旧答案，新建一个 pending revision。

体验更好，但模型复杂。

第一阶段我建议：

> 直接 UPDATE + 重新审核。

与刚才照片一样，我们暂时不引入内容版本化系统。

这是比较适合现在项目阶段的取舍。

---

# 十三、删除 Prompt 不物理删除

继续延续 Social UGC 原则：

```sql
deleted_at TIMESTAMPTZ
```

用户删除时：

```text
deleted_at = now()
```

不物理删除。

原因：

```text
审核记录
举报记录
风控调查
历史追踪
```

都有可能需要它。

---

# 十四、Prompt 模板下线怎么办？

例如平台有：

```text
“我的微信号是……”
```

后来发现这个 Prompt 不合适。

只需要：

```text
social_prompt_templates.is_active = false
```

不要删。

这样：

```text
新用户不能选择
旧数据仍然存在
```

根据产品规则，可以选择：

```text
旧答案继续显示
```

或者：

```text
要求用户更换 Prompt
```

这由 Service 层决定。

---

# 十五、Prompt Template 文案变化的一个隐藏问题

假设用户 2026 年回答：

```text
Q：最喜欢的旅行地是？
A：琅勃拉邦
```

后来平台把模板改成：

```text
Q：最想去哪里生活？
```

那么原来的答案：

```text
琅勃拉邦
```

虽然还能看，但语义已经改变了。

所以对 Prompt Template 有一个重要原则：

> **只能做不改变语义的文案润色。**

如果问题语义变化，应该：

```text
创建新的 prompt template
新的 code
```

例如：

```text
favorite_travel_destination
```

不能直接改成：

```text
ideal_place_to_live
```

旧模板应该：

```text
is_active = false
```

这是典型的字典主数据治理。

---

# 十六、Prompt 是否可以用户自己写问题？

第一阶段坚决不要。

也就是不能：

```text
自定义问题：我的微信是？
回答：xxxx
```

原因和自定义兴趣类似，但风险更高。

平台控制 Question：

```text
用户只能填写 Answer
```

可以大幅降低垃圾内容和联系方式引流。

当然 Answer 里还是可能写联系方式，所以审核仍然需要。

---

# 十七、Prompt 可以为聊天提供一个很好的入口

以后 Profile 页面可以出现：

```text
理想的周末是……
→ 去山里露营，然后找一家小店喝咖啡。
```

另一个用户可以直接点击：

```text
聊聊这个
```

发送：

```text
“你说喜欢露营，你最喜欢去哪里？”
```

以后甚至可以记录：

```text
conversation_context_type = social_prompt
context_id = social_profile_prompt_id
```

这样聊天系统知道：

> 这次会话是从某个 Prompt 发起的。

这也是为什么 Prompt Answer 拥有独立 `id` 很有价值。

不过：

```text
聊天引用
```

属于 Chat Domain。

现在不放任何聊天字段进 Prompt 表。

---

# 十八、是否参与推荐算法

可以，但不要直接存推荐分。

例如以后：

```text
有 Prompt ≥ 2
→ 资料丰富度提高

Prompt 回答长度适中
→ Profile quality signal

语言相关 Prompt
→ 可能帮助语言交换推荐
```

都可以成为推荐特征。

但是：

```text
recommendation_score
quality_score
engagement_score
```

不要放在这张表。

Social Profile 只保存事实。

---

# 十九、完整度规则

之前我们已经规划：

```text
Prompt >= 2
```

可以贡献资料完整度。

例如：

```text
0 个        +0
1 个        +5
2~3 个      +10
```

用户不一定强制填满 3 个。

我建议发布要求：

```text
Prompt 不作为强制条件
```

也就是说用户可以：

```text
Bio + 照片 + 兴趣
```

就上线。

Prompt 是：

> 鼓励填写，而不是阻止发布。

这样第一阶段降低交友资料创建门槛。

---

# 二十、最终结构

这一部分建议正式锁定：

```text
social_prompt_templates
────────────────────────────
id
code

question_zh
question_lo
question_en

category
sort_order
is_active

created_at
updated_at
```

以及：

```text
social_profile_prompts
────────────────────────────
id
profile_id
prompt_template_id

answer
position

moderation_status
moderated_at

created_at
updated_at
deleted_at
```

约束：

```text
每个 Profile 最多 3 个 Prompt

当前有效数据中：
(profile_id, prompt_template_id) 唯一
(profile_id, position) 唯一

只有：
deleted_at IS NULL
AND moderation_status = approved

才能公开展示
```

到这里，**“我是谁”这一侧已经基本完成了**：

```text
social_profiles
├── social_profile_photos
├── social_profile_interests
├── social_profile_languages
└── social_profile_prompts
```

下一步应该进入非常关键的 **`social_preferences`**。

前面这些表描述的是：

> **我是谁。**

`social_preferences` 开始描述：

> **我想认识谁。**

这里会涉及目标性别、年龄范围、国家/地区、交友目的、语言交换偏好，以及哪些条件是“硬筛选”、哪些只是“推荐偏好”。这个设计会直接影响后面的 Discovery 和 Matching。 memcite


---

### [21] USER　status=finished_successfully

继续


---

### [22] ASSISTANT　status=finished_successfully

_(empty)_


---

### [23] ASSISTANT　status=finished_successfully

继续，我们进入 **`social_preferences`**。这张表会直接决定后面的发现池、筛选和推荐逻辑，所以这次要把“硬条件”和“软偏好”分清楚。

`social_profiles` 描述的是“我是谁”，而 `social_preferences` 描述的是“我想认识谁”。两者一定要分开，不能把目标性别、目标年龄之类字段塞回 `social_profiles`。

## 一、先确定整体原则

我建议 `social_preferences` 第一阶段做成 **一对一配置表**：

```text
social_profiles
      1
      │
      0..1
social_preferences
```

也就是说，一个 Social Profile 最多只有一套当前生效的交友偏好。

它不是历史记录表，也不是推荐结果表。

推荐结构先定为：

```sql
CREATE TABLE social_preferences (
    profile_id              BIGINT PRIMARY KEY,

    min_age                 SMALLINT,
    max_age                 SMALLINT,

    target_country_code     CHAR(2),

    same_country_only       BOOLEAN NOT NULL DEFAULT FALSE,

    language_exchange_only  BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_social_preferences_age_range
        CHECK (
            min_age IS NULL
            OR max_age IS NULL
            OR min_age <= max_age
        )
);
```

但这还只是骨架。目标性别和交友目的不应该直接这样简单塞进去，我们逐个设计。

## 二、目标性别应该支持多选

用户自身性别：

```text
social_profiles.gender
```

是一个单值。

但“希望认识什么性别”天然可能多选。

例如：

```text
男性
女性
```

或者：

```text
不限
```

所以不建议：

```sql
preferred_gender VARCHAR(20)
```

更不要：

```text
preferred_gender = 'all'
```

把 `all` 当成一种性别。

我建议单独建：

```text
social_preference_genders
```

结构：

```sql
CREATE TABLE social_preference_genders (
    profile_id      BIGINT NOT NULL,
    gender          VARCHAR(20) NOT NULL,

    PRIMARY KEY (profile_id, gender),

    CONSTRAINT ck_social_preference_genders_gender
        CHECK (
            gender IN ('male', 'female', 'other')
        )
);
```

如果没有任何记录，就表示：

```text
不限性别
```

这比存：

```text
all
```

语义干净很多。

于是：

```text
0 条记录 = 不限
1 条记录 = 单一目标
多条记录 = 多个目标性别
```

## 三、年龄偏好存 min_age / max_age

这里和用户自己的年龄不同。

用户自己应该存：

```text
birth_date
```

但偏好本身就是一个年龄区间，所以直接保存：

```sql
min_age
max_age
```

是合理的。

例如：

```text
min_age = 22
max_age = 35
```

这是用户明确输入的筛选条件，不是派生字段。

建议数据库加入合理边界：

```sql
CHECK (
    min_age IS NULL
    OR min_age BETWEEN 18 AND 100
)
```

以及：

```sql
CHECK (
    max_age IS NULL
    OR max_age BETWEEN 18 AND 100
)
```

并保证：

```text
min_age <= max_age
```

如果两个都是 NULL：

```text
不限年龄
```

第一阶段我建议产品 UI 默认给一个比较宽的范围，但数据库不强制必须填写。

## 四、国家偏好不要只考虑“异国匹配”

你的产品当前核心场景确实天然存在中国用户和老挝用户之间的连接，但数据库模型不要写死成：

```text
Chinese wants Lao
Lao wants Chinese
```

否则未来会很难扩展。memcite

所以建议：

```sql
target_country_code CHAR(2)
```

例如：

```text
LA
CN
```

如果：

```text
NULL
```

表示不限国家。

但是这里马上有一个问题：

> 一个用户以后可能想同时认识中国和老挝用户。

所以长期看，这其实也是多值关系。

如果我们从数据库设计严谨性来看，我更建议直接采用：

```text
social_preference_countries
```

而不是 `target_country_code`。

结构：

```sql
CREATE TABLE social_preference_countries (
    profile_id      BIGINT NOT NULL,
    country_code    CHAR(2) NOT NULL,

    PRIMARY KEY (profile_id, country_code)
);
```

依然遵循：

```text
0 条记录 = 不限国家
```

这样以后扩展泰国、越南等完全不用改表结构。

所以最终我建议把：

```text
target_country_code
same_country_only
```

都从主表去掉。

国家偏好统一走关系表。

## 五、交友目的也应该支持多选吗？

用户自己的主要目的，我们之前在：

```text
social_profiles.relationship_goal
```

设计成一个主要目标：

```text
friendship
language_exchange
dating
serious_relationship
open_to_anything
```

这是在回答：

> 我来这里主要为了什么？

而 Preferences 中可能需要表达：

> 我愿意认识什么目的的人？

例如自己主要是：

```text
dating
```

但也接受：

```text
friendship
```

所以它理论上也是多选。

可以建立：

```text
social_preference_goals
```

```sql
CREATE TABLE social_preference_goals (
    profile_id          BIGINT NOT NULL,
    relationship_goal   VARCHAR(30) NOT NULL,

    PRIMARY KEY (profile_id, relationship_goal)
);
```

如果没有记录：

```text
不限对方目的
```

如果有：

```text
dating
serious_relationship
```

表示只希望看到这两种。

这个设计比：

```text
language_exchange_only BOOLEAN
```

更统一。

所以我建议不要再增加：

```text
language_exchange_only
dating_only
friendship_only
```

这种布尔字段。

否则几年后会变成：

```text
is_xxx
is_xxx
is_xxx
```

一大堆。

## 六、“硬筛选”和“软偏好”不能混为一谈

这里非常关键。

假设用户设置：

```text
年龄 22~35
女性
老挝
```

到底意味着：

```text
不满足这些条件的人绝对不能出现
```

还是：

```text
优先展示这些人，但偶尔也可以推荐其他人
```

这是两种完全不同的产品逻辑。

我建议第一阶段采用：

> 用户明确选择的性别、年龄等核心条件作为硬筛选；兴趣、语言能力、活跃度、资料完整度作为软推荐。

也就是：

```text
Hard Filters
────────────
年龄
目标性别
目标国家
对方社交目的（如果用户明确限定）

Soft Signals
────────────
共同兴趣
语言互补
活跃度
资料完整度
新鲜度
互动历史
```

这样用户不会遇到：

> 我明明只选女性，为什么系统还推荐男性？

而推荐算法仍然有足够发挥空间。

## 七、语言偏好不要重复存一套

一个很容易犯的错误是再设计：

```text
preferred_native_language
preferred_learning_language
```

我不建议。

因为前面已经有：

```text
social_profile_languages
```

表达每个人：

```text
母语
学习语言
熟练程度
```

发现系统完全可以根据双方语言画像计算：

```text
A native zh + learning lo
B native lo + learning zh
```

这是一个非常好的语言互补匹配。

用户真正需要设置的不是：

> 对方必须母语老挝语

而可能是：

> 我更想找语言交换对象。

这个属于：

```text
relationship_goal = language_exchange
```

已经可以表达。

所以第一阶段不要给 Preferences 再加一套复杂语言筛选。

等以后真的发现用户需要：

```text
只看母语为老挝语的人
```

再专门增加语言偏好关系表。

现在不提前设计。

## 八、距离筛选现在也不要加

暂时不要：

```text
max_distance_km
latitude
longitude
```

因为我们前面已经决定第一阶段不做重型附近的人系统。

当前发现的核心地理条件使用：

```text
国家
地区
城市
```

已经足够。

而且 Preferences 甚至第一阶段可以只提供：

```text
国家
```

不急着提供：

```text
指定城市
```

因为用户量早期如果筛选条件太细，会直接把发现池筛空。

这是社交产品早期非常实际的问题。

数据库可以有能力，但产品不要一开始开放十几个过滤条件。

## 九、偏好表里到底还需要什么字段？

经过前面的拆分，`social_preferences` 主表其实会变得非常小：

```sql
CREATE TABLE social_preferences (
    profile_id      BIGINT PRIMARY KEY,

    min_age         SMALLINT,
    max_age         SMALLINT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_social_preferences_min_age
        CHECK (
            min_age IS NULL
            OR min_age BETWEEN 18 AND 100
        ),

    CONSTRAINT ck_social_preferences_max_age
        CHECK (
            max_age IS NULL
            OR max_age BETWEEN 18 AND 100
        ),

    CONSTRAINT ck_social_preferences_age_range
        CHECK (
            min_age IS NULL
            OR max_age IS NULL
            OR min_age <= max_age
        )
);
```

然后配三个关系表：

```text
social_preference_genders
social_preference_countries
social_preference_goals
```

表面上表数量变多了，但每张表职责极其清晰。

这比以后在一张表里面出现：

```text
preferred_gender_1
preferred_gender_2
country_codes JSONB
goal_codes JSONB
```

要稳定得多。

## 十、0 条关系记录统一表示“不限”

这是这套设计里建议固定下来的一条规则。

例如：

```text
social_preference_genders
0 条
→ 不限性别
```

```text
social_preference_countries
0 条
→ 不限国家
```

```text
social_preference_goals
0 条
→ 不限对方交友目的
```

不要专门创建：

```text
all
any
unlimited
```

这种伪枚举值。

因为：

```text
ANY
```

本质不是一个业务实体，而是“没有施加该过滤条件”。

数据库里直接没有约束关系记录最自然。

## 十一、Preferences 是否允许不存在？

可以。

所以关系：

```text
SocialProfile 1 → 0..1 SocialPreferences
```

如果用户还没有设置：

```text
social_preferences
```

可以使用系统默认规则。

比如：

```text
年龄不限
性别不限
国家不限
目的不限
```

等用户第一次保存筛选条件时再创建。

不过从代码实现简化角度，也可以创建 Social Profile 时一起自动创建一行 Preferences。

我更推荐：

```text
创建 social_profile
↓
同时创建 social_preferences
```

哪怕年龄全 NULL。

这样 Service 层以后不需要不断处理：

```text
preferences == null
```

关系在逻辑上就变成：

```text
1 : 1
```

数据库也更容易理解。

## 十二、发现匹配必须双向满足吗？

这是接下来 Discovery 最重要的问题之一。

例如：

```text
A：
想看女性 22~30

B：
女性 25
但 B 只想看女性
```

那么 A 是否应该看到 B？

我建议：

> **不能。**

因为虽然 B 满足 A 的偏好，但 A 不满足 B 的偏好。

发现候选应该至少满足：

```text
A accepts B
AND
B accepts A
```

也就是 **双向硬条件兼容**。

否则 A 给 B 点关注以后，B 永远不会对 A 感兴趣，匹配效率会非常差。

所以未来 Discovery Candidate 的核心逻辑会是：

```text
candidate satisfies viewer preferences
AND
viewer satisfies candidate preferences
```

再在这批候选里面排序。

这一点非常重要。

## 十三、这与“互相关注 = 匹配成功”正好契合

我们前面已经确定 Social 的核心关系是：

```text
关注
↓
可以持续看对方动态

互相关注
↓
Match
↓
聊天永久免费
```

那么 Discovery 阶段尽量只展示“双向有可能接受”的人，会明显提高：

```text
关注 → 回关 → 匹配
```

的转化效率。memcite

但是注意：

> Preferences 不是 Match。

即使双方偏好完全兼容，也只是：

```text
eligible candidate
```

不能直接变成：

```text
matched
```

匹配仍然必须通过双方实际关注关系产生。

## 十四、不要把 Preferences 设计成推荐算法配置

不要出现：

```text
interest_weight
activity_weight
distance_weight
profile_quality_weight
```

这些不是用户 Preference。

用户 Preferences 是：

> 用户明确告诉我们的条件。

而推荐算法：

> 平台决定如何排序。

必须分开。

所以这里不出现任何 score、weight、rank 字段。

## 十五、最终建议锁定

这一部分最终建议确定为：

```text
social_preferences
├── profile_id
├── min_age
├── max_age
├── created_at
└── updated_at

social_preference_genders
├── profile_id
└── gender

social_preference_countries
├── profile_id
└── country_code

social_preference_goals
├── profile_id
└── relationship_goal
```

其中统一语义：

```text
没有子表记录 = 不限制该条件
```

发现候选采用：

```text
A 的硬条件接受 B
AND
B 的硬条件接受 A
```

然后再根据：

```text
共同兴趣
语言互补
资料完整度
最近活跃
内容质量
关系历史
```

做软排序。

到这里，**Social Profile 聚合基本完整了**。下一步不应该继续往 Profile 里面加东西，而应该正式进入 **Follow / Social Relationship**：谁关注谁、取消关注、互相关注如何生成 Match、拉黑后如何影响 Follow/Match，以及为什么“关注关系”和“匹配关系”不能合成一张表。memcite


---

### [24] USER　status=finished_successfully

继续


---

### [25] ASSISTANT　status=finished_successfully

继续。现在进入 **Follow / Social Relationship**。这一块是整个 Social Domain 的核心，因为我们已经确定产品关系不是“左滑右滑”，而是：

```text
关注对方
→ 可以持续看到对方动态

对方也关注你
→ 双向关系成立
→ Match
→ 可以聊天
```

所以数据库里必须把 **单向关注关系** 和 **双向匹配关系** 分开建模。不能试图用一张表同时表达两种语义。memcite

建议至少拆成：

```text
social_follows
social_matches
social_blocks
```

其中：

```text
social_follows
```

表达“我关注了谁”。

```text
social_matches
```

表达“双方已经形成匹配”。

```text
social_blocks
```

表达“我明确阻止谁与我发生社交关系”。

## 一、先定 social_follows

关系：

```text
social_profiles
      │
      ├── follower_profile_id
      │
      └── following_profile_id
```

推荐：

```sql
CREATE TABLE social_follows (
    follower_profile_id     BIGINT NOT NULL,
    following_profile_id    BIGINT NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        follower_profile_id,
        following_profile_id
    ),

    CONSTRAINT ck_social_follows_not_self
        CHECK (
            follower_profile_id <> following_profile_id
        )
);
```

这里我建议第一版非常克制，就这些字段。

不要一开始加入：

```text
status
is_active
is_mutual
matched
source
weight
```

因为大多数都可以从事实关系计算。

---

## 二、Follow 本质上是有方向的

比如：

```text
A → B
```

数据库记录：

```text
follower_profile_id = A
following_profile_id = B
```

表示：

> A 关注 B。

但这完全不意味着：

```text
B → A
```

存在。

所以：

```text
A follows B
```

和：

```text
B follows A
```

必须是两行独立记录。

例如：

```text
A | B
B | A
```

双向存在时，才说明：

```text
mutual follow
```

成立。

---

## 三、为什么不存 is_mutual

不要：

```sql
is_mutual BOOLEAN
```

因为它是派生结果。

假设：

```text
A → B
```

然后：

```text
B → A
```

你就得同时更新：

```text
A → B is_mutual = true
B → A is_mutual = true
```

之后 B 取消关注，又得同时改两条。

非常容易出现：

```text
A → B = true
B → A = false
```

这种脏数据。

所以：

> Follow 表只记录真实存在的单向关系。

互相关注由两条记录是否同时存在决定。

---

## 四、为什么 Match 不能完全动态算

看到这里可能会产生一个问题：

既然：

```text
A follows B
AND
B follows A
```

就是 Match，

那为什么还需要：

```text
social_matches
```

？

因为“互相关注”是一个当前关系状态，而 **Match 是一个具有业务生命周期的事件和实体**。

以后 Match 会被很多东西引用：

```text
聊天会话
礼物
匹配时间
取消匹配
重新匹配
匹配统计
风控
通知
```

例如：

```text
2026-08-01
A 和 B 首次匹配

2026-08-20
A 取消关注 B

2026-09-05
A 再次关注 B
```

如果 Match 完全动态计算，你很难回答：

> 他们第一次什么时候匹配？

所以：

```text
social_matches
```

应该是独立业务实体。

---

# 五、social_matches 推荐模型

我建议：

```sql
CREATE TABLE social_matches (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    profile_a_id        BIGINT NOT NULL,
    profile_b_id        BIGINT NOT NULL,

    status              VARCHAR(20) NOT NULL DEFAULT 'active',

    matched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_social_matches_not_self
        CHECK (
            profile_a_id <> profile_b_id
        ),

    CONSTRAINT ck_social_matches_order
        CHECK (
            profile_a_id < profile_b_id
        ),

    CONSTRAINT ck_social_matches_status
        CHECK (
            status IN (
                'active',
                'ended'
            )
        )
);
```

这里有一个非常关键的设计：

```text
profile_a_id < profile_b_id
```

始终保证 ID 小的放 A，大的放 B。

例如：

```text
profile 102
profile 58
```

永远保存成：

```text
profile_a_id = 58
profile_b_id = 102
```

而不是根据“谁先关注”决定顺序。

这样可以天然解决：

```text
A,B
B,A
```

重复 Match 问题。

---

# 六、Match 当前唯一性

需要保证一对用户最多只有一个当前有效 Match。

PostgreSQL 可以：

```sql
CREATE UNIQUE INDEX uq_social_matches_active_pair
ON social_matches(profile_a_id, profile_b_id)
WHERE status = 'active';
```

这样：

```text
58 ↔ 102
```

当前不能存在两个 active match。

但历史上可以：

```text
match #1 ended
match #2 active
```

这为未来重新匹配留下空间。

---

# 七、到底要不要允许“重新匹配”

我建议：

> 允许。

因为用户可能：

```text
A 关注 B
B 关注 A
→ Match

后来 A 取消关注
→ Match 结束

几个月后重新互相关注
→ 新 Match
```

这时候最好新建：

```text
social_matches.id = 新记录
```

而不是把旧记录重新：

```text
status = active
```

因为这实际上是新的关系周期。

这样才能保留：

```text
第一次匹配时间
第一次结束时间

第二次匹配时间
……
```

历史很清楚。

---

# 八、取消关注后 Match 怎么处理？

这里建议明确规则：

如果：

```text
A ↛ B
```

也就是 A 取消关注 B，而：

```text
B → A
```

还在，那么：

```text
social_match.status = ended
ended_at = now()
```

因为 Match 的成立条件已经不存在。

但是：

```text
B → A
```

这条 Follow 不应该自动删除。

因此状态变成：

```text
B 仍然关注 A
A 不关注 B
```

双方从：

```text
Match
```

退化成：

```text
单向关注
```

这是非常自然的关系模型。

---

# 九、要不要做“解除匹配”独立操作？

第一阶段我建议：

> 不单独做“解除匹配”。

用户如果不想继续 Match：

```text
取消关注
```

就够了。

因为目前：

```text
互相关注 = Match
```

如果同时存在：

```text
双方互相关注
但不是 Match
```

反而会破坏产品规则。

所以：

```text
unmatch
```

本质应该等价于：

```text
取消关注
```

至少一方的 Follow 被删除/失效。

这样模型最一致。

---

# 十、Follow 是物理删除还是软删除？

这和照片不一样。

我建议：

```text
social_follows
```

当前关系表可以直接物理删除。

也就是说取消关注：

```sql
DELETE FROM social_follows
WHERE follower_profile_id = ?
AND following_profile_id = ?;
```

为什么这里不需要：

```text
deleted_at
```

？

因为当前 Follow 表表达的是：

> 现在正在关注谁。

历史如果以后真的有分析需求，可以通过：

```text
social_follow_events
```

或行为事件系统记录。

不要为了历史审计把所有关系表都变成：

```text
status + deleted_at
```

否则查询会越来越复杂。

---

# 十一、Follow 历史是否完全不重要？

不是。

未来可能会需要：

```text
关注过谁
取消关注次数
反复关注行为
防骚扰
增长统计
```

但这是：

> 事件数据。

不是当前关系事实。

所以如果以后要做，可以：

```text
social_relationship_events
```

或者统一行为事件系统：

```text
followed
unfollowed
matched
match_ended
```

而不是污染：

```text
social_follows
```

当前态表。

---

# 十二、Match 反而必须保留历史

这就是 Follow 和 Match 最大区别之一。

Follow：

```text
当前关系
```

可以直接删。

Match：

```text
业务生命周期实体
```

需要保留：

```text
matched_at
ended_at
```

因为聊天等其它域可能引用它。

---

# 十三、谁先关注谁需要保存吗？

在 Match 表不需要。

因为可以从事件或 Follow 时间推断部分信息，但如果第一条 Follow 后来已经被取消，就不可靠。

如果未来真的需要：

> 是谁发起了这次 Match？

可以在创建 Match 时保存：

```text
completed_by_profile_id
```

表示：

> 谁的这次关注行为使双方从单向变成双向。

例如：

```text
A 先关注 B
B 后关注 A
```

那么：

```text
completed_by_profile_id = B
```

但我建议第一阶段不要加。

因为核心业务暂时不需要。

---

# 十四、social_blocks 必须单独存在

Block 和 Follow 完全不同。

建议：

```sql
CREATE TABLE social_blocks (
    blocker_profile_id      BIGINT NOT NULL,
    blocked_profile_id      BIGINT NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        blocker_profile_id,
        blocked_profile_id
    ),

    CONSTRAINT ck_social_blocks_not_self
        CHECK (
            blocker_profile_id <> blocked_profile_id
        )
);
```

语义：

```text
A blocks B
```

只代表：

> A 屏蔽 B。

它不是双向存储。

---

# 十五、Block 一旦发生，要影响什么？

我建议 Block 是一个非常强的关系：

```text
A blocks B
```

后，至少应该：

```text
双方互相不可发现
双方不可查看对方 Social Profile
双方不可关注
双方不可看对方动态
双方不能新发消息
```

而且现有：

```text
A → B
B → A
```

Follow 都应该移除。

如果已有 Match：

```text
status = ended
```

所以 Block 操作应该是一个事务：

```text
BEGIN

INSERT social_blocks(A,B)

DELETE A→B follow
DELETE B→A follow

END active match

COMMIT
```

---

# 十六、被拉黑的人要不要知道？

数据库不用设计这个概念。

产品层通常不要明确告诉：

> 你被这个人拉黑了。

查询结果可以表现为：

```text
用户不可用
资料不可访问
无法发送消息
```

避免进一步冲突。

这属于 UI/API 行为，不需要额外：

```text
notify_blocked_user
```

之类字段。

---

# 十七、Block 是否需要双向查询？

虽然数据库只存：

```text
A blocks B
```

但判断双方能不能发生任何关系时，需要检查：

```text
A blocks B
OR
B blocks A
```

也就是说：

```text
存在任意方向 Block
→ 两人社会关系隔离
```

这是后面所有 Social 查询都应该统一采用的规则。

---

# 十八、关注之前必须检查什么？

Follow Service 至少应该检查：

```text
自己不能关注自己

双方 Social Profile 都存在

目标 Profile 可参与社交

双方不存在任意方向 Block

没有已经存在的 Follow
```

然后创建：

```text
A → B
```

创建后检查：

```text
B → A
```

是否存在。

如果存在：

```text
创建 social_match
```

所以关注流程：

```text
A 点击关注 B
        ↓
检查 block
        ↓
INSERT A → B
        ↓
检查 B → A
   ├─ 不存在
   │    ↓
   │ 单向关注完成
   │
   └─ 已存在
        ↓
      创建 Match
        ↓
      发送匹配通知
```

非常明确。

---

# 十九、这里必须用事务

尤其是：

```text
创建 Follow
+
创建 Match
```

必须事务化。

否则可能出现：

```text
A → B
B → A
```

已经存在，但：

```text
social_matches
```

因为服务崩溃没有创建。

所以 Follow Service 应该：

```text
BEGIN

INSERT follow

IF reverse follow exists
    INSERT match

COMMIT
```

并依赖数据库唯一索引处理并发。

---

# 二十、双方同时关注的并发问题

比如 A 和 B 几乎同一时刻点击关注：

```text
请求 1：A → B
请求 2：B → A
```

两个事务都有可能检测到对方还不存在。

于是都没有创建 Match。

这是典型并发问题。

所以不能只依赖：

```text
INSERT follow
→ SELECT reverse follow
```

的朴素逻辑。

更稳妥的是：

```text
Follow 写入后
尝试保证 Match 存在
```

并使用：

```text
INSERT ... ON CONFLICT DO NOTHING
```

以及统一排序后的：

```text
profile_a_id
profile_b_id
```

唯一约束。

例如每次 Follow 成功后：

```text
如果双方 Follow 均存在
→ INSERT Match
  ON CONFLICT DO NOTHING
```

即使两个事务都尝试创建，也最终只会产生一个 Match。

---

# 二十一、Match 是否依赖当前 Profile 状态？

创建 Match 时应该依赖：

```text
两边 Social Profile 都有效
```

但已经 Match 后，如果某个人：

```text
profile_status = paused
```

我不建议立即自动结束 Match。

因为：

```text
暂停发现
```

和：

```text
解除关系
```

不是一回事。

例如用户暂时关闭交友发现：

```text
不想认识新的人
```

但已经匹配的人仍然可以聊天。

所以：

```text
paused
```

应该：

```text
从 Discovery 移除
```

但不删除：

```text
Follow
Match
Conversation
```

这点很重要。

---

# 二十二、closed 怎么办？

如果用户真正：

```text
profile_status = closed
```

代表退出 Social。

我建议：

```text
不再发现
Profile 不公开
不能产生新的 Follow
```

现有 Match 是否结束，可以根据产品策略。

第一版我建议：

> closed 时结束所有 active Match，并删除当前 Follow。

因为它表达的是彻底退出社交。

而：

```text
paused
```

才是暂时隐藏。

这进一步证明：

```text
paused
closed
```

不能合并成一个：

```text
inactive
```

---

# 二十三、Follow 和动态的关系

我们之前已经确定：

> 关注后可以持续看到对方动态。

所以 Feed 查询以后可以基于：

```text
social_follows
```

构建：

```text
我关注的人发布的动态
```

而不是：

```text
social_matches
```

也就是说：

```text
单向关注
```

已经足够看动态。

这一点让 Follow 成为 Social Feed 的基础关系。

Match 则主要影响：

```text
聊天
匹配状态
更深层互动
```

---

# 二十四、粉丝数、关注数不要直接存在 social_profiles

不要：

```text
follower_count
following_count
match_count
```

先塞进 Profile 主表。

事实来源分别是：

```text
social_follows
social_matches
```

第一阶段数量不大，可以实时：

```text
COUNT(*)
```

未来数据量大再做：

```text
social_profile_stats
```

缓存：

```text
follower_count
following_count
match_count
post_count
```

但它只能是派生缓存。

---

# 二十五、最终建议锁定

当前关系层定为：

```text
social_follows
────────────────────────
follower_profile_id
following_profile_id
created_at

PK(follower_profile_id, following_profile_id)
```

```text
social_matches
────────────────────────
id

profile_a_id
profile_b_id

status

matched_at
ended_at

created_at
updated_at
```

```text
social_blocks
────────────────────────
blocker_profile_id
blocked_profile_id
created_at

PK(blocker_profile_id, blocked_profile_id)
```

核心规则固定为：

```text
单向 Follow
→ 关注成立，可持续查看动态

A → B
AND
B → A
→ 创建 Match

任意一方取消关注
→ Match ended

任意方向 Block
→ 双方隔离
→ 删除双方 Follow
→ Match ended

paused
→ 不影响已有 Match

closed
→ 退出 Social，终止现有社会关系
```

这样 Social Relationship 已经非常稳定。

下一步建议进入 **Social Post / Dynamic（动态）**。因为关注关系已经建立，接下来就可以设计：文字+图片动态、可见性、图片排序、点赞、评论、删除、审核，以及“关注即可持续查看动态”的 Feed 数据基础。memcite


---

### [26] USER　status=finished_successfully

继续


---

### [27] ASSISTANT　status=finished_successfully

继续。现在进入 **Social Post / Dynamic（动态）**。

这一部分我们先只设计“动态内容本身”，先不急着把 Feed、点赞、评论全部塞进一张表。按照前面已经确定的原则，动态应该拆成：

```text
social_posts
social_post_media
social_post_likes
social_post_comments
```

其中 `social_posts` 是动态聚合根。

## 一、动态第一阶段的产品边界

我们已经确定第一阶段：

```text
支持文字
支持图片
不支持视频
```

所以现在不要为了未来可能的视频，提前设计一套复杂的多媒体内容系统。

但我们仍然应该让动态图片走统一 `media_id`，这样以后真支持视频时，可以扩展 `media_type` 或单独增加视频关系，而不是把 URL 写进动态表。

## 二、social_posts

我建议：

```sql
CREATE TABLE social_posts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    profile_id          BIGINT NOT NULL,

    content             VARCHAR(2000),

    visibility          VARCHAR(20) NOT NULL DEFAULT 'followers',

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    published_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT ck_social_posts_visibility
        CHECK (
            visibility IN (
                'public',
                'followers'
            )
        ),

    CONSTRAINT ck_social_posts_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

第一版先保持很干净。

## 三、`profile_id`，不要直接挂 `user_id`

这里继续保持 Social Domain 自己的身份体系。

应该：

```text
social_posts.profile_id
    ↓
social_profiles.id
```

而不是：

```text
social_posts.user_id
```

原因和前面照片、兴趣一样：

> 动态属于“Social Profile”这个社交身份，而不是账号身份本身。

如果用户没有 Social Profile，就不存在 Social Dynamic。

## 四、content 可以为空

这个地方不要：

```sql
content VARCHAR(2000) NOT NULL
```

因为用户应该可以发布：

```text
只发图片
```

例如：

```text
[旅行照片 × 4]
```

没有任何文字，也应该合法。

所以：

```text
content NULL
```

允许。

但业务层必须保证：

```text
content 非空
OR
至少有一张图片
```

也就是说，禁止：

```text
空文字 + 0 图片
```

这属于跨表约束，不适合简单 CHECK。

## 五、文字长度

第一阶段我建议产品层限制：

```text
1000 字符左右
```

数据库可以稍微宽一点：

```sql
VARCHAR(2000)
```

和 Prompt 一样：

> UI 限制是产品体验，数据库上限是安全边界。

不要直接无限 `TEXT`。

动态不是长文章系统，没有必要支持几万字符。

## 六、visibility 现在只需要两个值

第一阶段：

```text
public
followers
```

含义：

```text
public
→ 任何符合访问规则的人可以查看

followers
→ 只有关注我的人可以查看
```

不过结合我们当前产品，“关注即可持续看动态”是核心机制，我建议实际产品默认：

```text
followers
```

而 `public` 可以暂时保留能力，甚至第一阶段 UI 不一定开放。

为什么还保留？

因为以后可能：

```text
发现页预览用户最新公开动态
```

或者：

```text
用户主页允许展示几条公开内容
```

所以数据库先允许两种可见性是合理的。

## 七、现在不要加 friends / matched

不要一开始做：

```text
public
followers
matches
friends
private
custom
```

因为目前产品关系里：

```text
followers
matches
```

已经够复杂。

尤其：

```text
match-only post
```

是否真的有产品价值还没有验证。

所以第一阶段只有：

```text
public
followers
```

最合适。

以后真需要再 migration。

## 八、动态也必须审核

`content` 是用户自由输入，图片也是 UGC。

所以：

```text
moderation_status
```

必须存在。

第一阶段人工审核：

```text
pending
approved
rejected
```

只有：

```text
approved
```

才进入 Feed。

以后自动审核上线，数据结构仍然不变。

## 九、published_at 和 created_at 要分开

这和 Social Profile 一样。

例如：

```text
10:00 用户创建动态
10:01 提交审核
10:20 审核通过
```

真正应该进入 Feed 的时间，到底用：

```text
created_at = 10:00
```

还是：

```text
approved_at = 10:20
```

我建议：

```text
published_at
```

单独保存。

当动态首次真正公开时：

```text
published_at = now()
```

这样 Feed 排序可以稳定使用：

```text
published_at DESC
```

而不是 `created_at`。

这非常重要。

## 十、审核通过后用户修改怎么办

这里和 Bio / Prompt 一样存在版本问题。

例如动态原来：

```text
今天去万象逛街
```

审核通过。

然后用户修改成：

```text
今天去万象逛街，加我微信 XXXXX
```

如果允许直接修改而不重新审核，审核体系就被绕过了。

所以第一阶段建议：

> 任何内容修改都重新进入审核。

即：

```text
moderation_status = pending
```

在重新通过之前，不公开新内容。

这里同样有“旧版本是否继续展示”的版本化问题。

第一阶段为了控制复杂度，我们不做 Post Revision。

所以最简单规则：

```text
修改动态
→ 暂时从公开 Feed 移除
→ pending
→ 审核通过后重新展示
```

可以接受。

## 十一、动态是否允许编辑

其实从产品复杂度来说，我甚至更建议第一阶段：

```text
发布后不能编辑正文
```

只允许：

```text
删除
```

如果用户写错：

```text
删除后重新发布
```

原因是这样可以显著简化：

```text
审核
缓存
Feed
评论上下文
举报证据
```

很多社交产品本来就对动态编辑比较谨慎。

所以我更倾向当前规则：

```text
草稿阶段可改
审核前可改
正式发布后不允许编辑正文
```

如果以后确实需要，再加编辑版本。

## 十二、我们需要 draft 吗

第一阶段我建议：

> 不做动态草稿系统。

用户点击发布：

```text
创建 social_post
→ pending
```

就够。

如果网络失败，客户端可以本地保留编辑内容。

没必要为了：

```text
未发布草稿
```

增加：

```text
draft
scheduled
publishing
```

等状态。

所以 Post 本身不需要：

```text
status
```

可以通过：

```text
deleted_at
moderation_status
published_at
```

表达全部核心生命周期。

## 十三、为什么不用 status

例如常见设计：

```text
draft
pending
published
rejected
deleted
```

看起来方便，实际上又把不同维度混在一个字段：

```text
内容是否删除
审核结果
是否已经发布
```

我们继续坚持前面的原则：

```text
deleted_at
→ 用户生命周期

moderation_status
→ 平台审核

published_at
→ 发布事实
```

比一个万能 `status` 更清晰。

## 十四、social_post_media

动态图片不要放：

```text
image_url_1
image_url_2
...
```

仍然关系表：

```sql
CREATE TABLE social_post_media (
    post_id         BIGINT NOT NULL,
    media_id        BIGINT NOT NULL,

    position        SMALLINT NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (post_id, media_id),

    CONSTRAINT ck_social_post_media_position
        CHECK (position BETWEEN 1 AND 9),

    CONSTRAINT uq_social_post_media_position
        UNIQUE (post_id, position)
);
```

第一阶段我建议：

```text
最多 9 张图片
```

为什么资料照片是 6 张，而动态可以 9 张？

因为这是两个完全不同的产品场景。

资料照片：

```text
精选个人展示
```

动态：

```text
一次生活内容
```

9 图是很自然的上限。

## 十五、动态图片还需要 moderation_status 吗

这里有两个方案。

方案 A：

```text
Post 整体审核
```

审核员看到：

```text
文字 + 所有图片
```

然后整条：

```text
approved / rejected
```

方案 B：

每张图片也单独：

```text
moderation_status
```

第一阶段我建议 **方案 A**。

也就是：

```text
social_post_media
```

不需要自己的审核状态。

整个：

```text
social_post
```

作为一个审核单元。

原因是：

> 一条动态的文字和图片共同构成语义。

例如某张图片本身没有违规，但是结合文字可能有问题。

人工审核时本来就应该整体看。

资料照片不同，因为每张照片本身是长期独立展示资产，所以每张都需要独立审核。

动态图片没有必要这么拆。

## 十六、媒体表是否允许视频

目前：

```text
social_post_media
```

虽然名字叫 media，但 Service 层必须限制：

```text
media_assets.type = image
```

因为我们第一阶段明确：

```text
不支持视频
```

不要因为表叫 media 就自动认为视频已经支持了。

这是一个很重要的区别：

> 数据模型允许扩展 ≠ 当前产品开放该能力。

## 十七、Post 删除要软删除

这里和其他 UGC 一样：

```sql
deleted_at TIMESTAMPTZ
```

用户删除动态：

```text
deleted_at = now()
```

不要物理删。

因为以后存在：

```text
举报
审核
评论
点赞
礼物互动
风控
```

这些历史引用。

公开查询统一：

```sql
WHERE deleted_at IS NULL
  AND moderation_status = 'approved'
  AND published_at IS NOT NULL
```

## 十八、被审核拒绝的动态怎么办

例如：

```text
moderation_status = rejected
```

不需要：

```text
deleted_at
```

因为：

```text
rejected
```

和：

```text
用户删除
```

不是同一个事实。

用户后台可以看到：

```text
发布失败
内容违反社区规范
```

甚至以后允许修改后重新提交。

所以拒绝内容应该保留记录。

## 十九、动态要不要记录审核原因

和照片一样，我不建议在主表塞：

```text
moderation_reason
reviewer_id
reject_reason
```

正式审核历史应该进入统一 Moderation 体系。

`social_posts` 只保存当前：

```text
moderation_status
moderated_at
```

主业务表不承担完整审核日志。

## 二十、动态发表后是否必须保持 Social Profile active

发布时：

```text
profile_status = active
```

当然应该检查。

但之后用户：

```text
paused
```

怎么办？

我建议：

```text
paused
→ 不再出现在 Discovery
```

但过去动态仍然可以被已经关注他的人查看。

这和前面 Match 的规则一致。

因为：

> 暂停认识新人，不等于删除已有社交关系和内容。

如果：

```text
closed
```

则可以把其内容从公开 Feed 隐藏。

不一定需要修改所有 Post 数据，只需要读取时检查 Profile 状态。

这样不要批量 UPDATE 几万条动态。

## 二十一、Feed 不属于 social_posts 本身

不要在动态表增加：

```text
feed_score
rank
recommended_score
is_hot
```

这些属于 Feed / Recommendation。

`social_posts` 只记录：

> 用户发布了什么内容。

Feed 负责：

> 谁在什么时间应该看到什么内容。

两者必须分开。

## 二十二、关注 Feed 的基本查询模型

以后最简单的关注 Feed：

```text
我的 following
      ↓
social_follows
      ↓
这些人的 social_posts
      ↓
approved + published + not deleted
      ↓
published_at DESC
```

逻辑上就是：

```sql
SELECT p.*
FROM social_posts p
JOIN social_follows f
  ON f.following_profile_id = p.profile_id
WHERE f.follower_profile_id = :viewer_profile_id
  AND p.deleted_at IS NULL
  AND p.moderation_status = 'approved'
  AND p.published_at IS NOT NULL
ORDER BY p.published_at DESC;
```

第一阶段用户量不大，这种 fan-out-on-read 模式完全够用。

现在不要提前建设：

```text
feed inbox
fanout worker
timeline materialization
Kafka
Redis Stream
```

单人项目完全没有必要。

## 二十三、自己的动态能不能看到

当然应该。

所以“我的动态”查询不依赖 Follow。

如果以后做主页：

```text
查看别人主页
```

则根据：

```text
visibility
follow relationship
block relationship
profile status
```

决定哪些动态可见。

## 二十四、Block 必须优先于 visibility

即使：

```text
post.visibility = public
```

只要：

```text
A blocks B
OR
B blocks A
```

双方依然不能看到彼此动态。

所以权限顺序应该类似：

```text
Block
↓
Profile availability
↓
Post status
↓
Post visibility
↓
Follow relationship
```

不能因为 `public` 就绕过 Block。

## 二十五、动态发布时间与排序

第一阶段只需要：

```text
published_at DESC
```

不要一开始做：

```text
hot score
engagement score
AI relevance
personalized rank
```

用户量少时，“最新动态”实际上更符合预期。

以后 Feed 可以逐渐升级：

```text
关注流
→ 时间排序

发现流
→ 推荐排序
```

这是两个不同 Feed。

## 二十六、动态数量要不要放 Profile

仍然不要：

```text
social_profiles.post_count
```

第一阶段：

```sql
COUNT(*)
```

足够。

以后统一进入我们前面提到的：

```text
social_profile_stats
```

缓存表。

## 二十七、最终建议锁定

当前动态主体：

```text
social_posts
────────────────────────
id
profile_id

content
visibility

moderation_status
moderated_at

published_at

created_at
updated_at
deleted_at
```

动态图片：

```text
social_post_media
────────────────────────
post_id
media_id
position
created_at

PK(post_id, media_id)
UNIQUE(post_id, position)
```

第一阶段规则：

```text
文字可为空
图片可为空
但两者不能同时为空

最多 9 张图片
只支持图片，不支持视频

默认 followers 可见

动态整体审核
审核通过才进入 Feed

发布后的正文第一阶段不支持编辑
可以删除

删除采用软删除

关注 Feed 第一阶段按 published_at 倒序读取
```

这样 Dynamic 主体已经定下来了。

下一步应该继续设计 **`social_post_likes` + `social_post_comments`**。其中评论要重点处理：一级评论还是多级回复、删除后的楼层保留、审核、拉黑后的历史评论、评论数量缓存，以及点赞到底是单独一张表还是统一 Reaction 模型。memcite


---

### [28] USER　status=finished_successfully

继续


---

### [29] ASSISTANT　status=finished_successfully

继续。现在设计 **`social_post_likes` + `social_post_comments`**。

这里我建议保持第一阶段足够简单：**点赞只做 Like，不做复杂 Reaction；评论支持一级评论 + 回复某条评论，但不做无限树形嵌套。** 这样既能满足社交互动，又不会把查询和审核复杂度拉高。

## 一、点赞：`social_post_likes`

推荐：

```sql
CREATE TABLE social_post_likes (
    post_id         BIGINT NOT NULL,
    profile_id      BIGINT NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (post_id, profile_id)
);
```

语义非常直接：

```text
一行存在
= 这个 profile 点赞了这条 post
```

取消点赞：

```sql
DELETE FROM social_post_likes
WHERE post_id = ?
  AND profile_id = ?;
```

这里我建议直接物理删除，不做：

```text
deleted_at
status
is_active
```

因为 Like 是典型“当前关系态”。

历史点赞/取消点赞如果以后需要分析，走事件日志，不污染事实表。

---

## 二、为什么现在不做 Reaction

不要一开始做：

```text
like
love
haha
wow
sad
angry
```

你的产品当前更适合一个简单动作：

```text
点赞
```

所以也不需要：

```sql
reaction_type
```

未来真想扩展，再迁移成：

```text
social_post_reactions
```

即可。

第一阶段先把互动闭环跑起来更重要。

---

## 三、谁可以点赞

点赞前至少检查：

```text
Post 当前可见
双方不存在 Block
点赞者 Social Profile 可用
Post 未删除
Post 已审核并发布
```

也就是说：

> 能看到，才能点赞。

不要出现用户通过 API 猜 `post_id`，对自己没有权限看的动态点赞。

---

## 四、取消关注后，旧点赞保不保留？

我建议：

> 保留。

例如：

```text
A 曾经关注 B
A 点赞 B 的动态
后来 A 取消关注 B
```

这个历史点赞没必要自动消失。

取消关注只是：

```text
未来是否继续看到 followers-only 内容
```

不应该改写过去发生的互动事实。

但是如果双方发生 Block，则产品层可以选择隐藏历史互动。

数据库不需要批量删除 Like。

---

# 五、评论：`social_post_comments`

评论比点赞复杂一些。

我建议第一版：

```sql
CREATE TABLE social_post_comments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    post_id             BIGINT NOT NULL,
    profile_id          BIGINT NOT NULL,

    parent_comment_id   BIGINT,

    content             VARCHAR(1000) NOT NULL,

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT ck_social_post_comments_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

---

## 六、评论只支持两层，不做无限嵌套

例如：

```text
Post
 ├─ 评论 A
 │    ├─ 回复 A1
 │    └─ 回复 A2
 ├─ 评论 B
 └─ 评论 C
```

但不要变成：

```text
A
└─ A1
   └─ A1-1
      └─ A1-1-1
```

无限递归。

第一阶段非常没必要。

所以业务规则：

```text
parent_comment_id = NULL
→ 一级评论

parent_comment_id = 某一级评论 id
→ 回复
```

如果用户回复的是一个回复：

```text
A1
```

Service 层仍然把：

```text
parent_comment_id
```

归到 A。

这样数据库永远只有两层。

---

## 七、回复谁需要额外字段吗？

这里有一个场景：

```text
A 评论动态

B 回复 A

C 回复 B
```

由于数据库只保留两层：

```text
C.parent_comment_id = A
```

但 UI 还需要显示：

```text
C 回复 B：
……
```

所以我建议增加：

```sql
reply_to_profile_id BIGINT
```

最终：

```text
parent_comment_id
→ 属于哪条一级评论线程

reply_to_profile_id
→ 这次具体回复谁
```

例如：

```text
评论 A：
id = 10
profile_id = A
parent_comment_id = NULL
reply_to_profile_id = NULL
```

B 回复 A：

```text
id = 11
profile_id = B
parent_comment_id = 10
reply_to_profile_id = A
```

C 回复 B：

```text
id = 12
profile_id = C
parent_comment_id = 10
reply_to_profile_id = B
```

这样 UI 非常好做。

---

# 八、推荐最终评论模型

所以建议改成：

```sql
CREATE TABLE social_post_comments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    post_id             BIGINT NOT NULL,
    profile_id          BIGINT NOT NULL,

    parent_comment_id   BIGINT,
    reply_to_profile_id BIGINT,

    content             VARCHAR(1000) NOT NULL,

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT ck_social_post_comments_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

---

## 九、评论内容长度

UI 第一阶段建议：

```text
最多 500 字符
```

数据库：

```sql
VARCHAR(1000)
```

仍然采用：

```text
产品限制 < 数据库安全上限
```

评论不是长文系统。

---

# 十、评论必须审核吗？

要。

因为评论是用户自由输入的 UGC。

所以：

```text
pending
approved
rejected
```

继续统一。

不过这里会有一个产品体验问题：

如果全部人工审核，那么：

```text
用户评论
→ pending
→ 管理员审核
→ 才出现
```

互动会显得比较慢。

但数据库设计仍然这样做最合适，因为前期你已经决定人工审核，后面自动审核上线后流程可以变成：

```text
评论
↓
自动审核
├─ 低风险 → 立即 approved
└─ 高风险 → pending 人工
```

模型不用改。memcite

---

# 十一、评论发布后第一阶段不要允许编辑

和动态正文一样，我建议：

```text
评论发布后：
可删除
不可编辑
```

写错了：

```text
删除 → 重新评论
```

这样审核简单很多。

所以虽然表里现在有：

```text
updated_at
```

它主要用于后台状态变化或未来扩展，不代表第一阶段开放用户编辑。

---

# 十二、评论删除后是否直接消失

这里要分场景。

如果一级评论：

```text
A
 ├─ B 回复
 └─ C 回复
```

A 删除自己的评论后，如果直接整个线程消失：

```text
B、C 的回复也没了
```

体验不一定好。

我建议采用：

> 一级评论删除后保留楼层占位，但不展示原内容。

例如：

```text
[该评论已删除]
    B：……
    C：……
```

数据库里仍然：

```text
deleted_at != NULL
```

不物理删除。

UI 根据：

```text
存在子回复
```

决定是否显示占位。

如果一级评论没有任何回复，则可以完全不显示。

---

# 十三、回复被删除则可以直接隐藏

例如：

```text
A
 ├─ B
 └─ C
```

B 删除：

```text
A
 └─ C
```

不需要保留：

```text
[回复已删除]
```

因为它不是线程根节点。

所以显示策略可以：

```text
deleted 一级评论 + 有回复
→ 显示占位

deleted 一级评论 + 无回复
→ 不显示

deleted 二级回复
→ 不显示
```

数据库不用增加额外状态。

---

# 十四、被审核拒绝和用户删除还是两个概念

继续保持：

```text
moderation_status = rejected
```

和：

```text
deleted_at IS NOT NULL
```

分别表达。

不要混成：

```text
status = removed
```

因为一个是：

> 平台不允许发布。

另一个是：

> 用户主动删除。

未来审核、举报、申诉都会依赖这个区别。

---

# 十五、评论权限

评论应该遵循和点赞一样的原则：

> 能看到 Post，才能评论。

而且我建议第一阶段：

```text
followers-only 动态
→ 当前 follower 才能发表评论
```

如果用户评论之后取消关注：

> 旧评论保留。

不需要自动删除。

如果发生 Block：

```text
双方之后不可新互动
```

历史评论是否显示给第三方，可以继续保留。

对 Block 双方本人，在查询时屏蔽对方内容即可。

---

# 十六、动态作者能删除别人的评论吗？

这里建议支持。

否则以后有人：

```text
骚扰
广告
引战
```

动态作者只能举报，体验很差。

所以权限：

```text
评论作者
→ 可以删除自己的评论

Post 作者
→ 可以隐藏/删除自己动态下的评论

管理员
→ 可以审核处理
```

但这里有一个语义区别：

如果 Post 作者“删除”别人评论，其实更准确的是：

```text
author_hidden_at
```

而不是：

```text
deleted_at
```

因为 `deleted_at` 应该表达评论作者删除了自己的内容。

为了避免第一阶段太复杂，我建议先统一成：

```text
deleted_at
```

并把操作者记在审计事件里。

如果以后需要区分：

```text
self_deleted
post_owner_hidden
moderator_removed
```

再引入删除原因/移除来源。

---

# 十七、评论点赞第一阶段先不做

不要马上继续加：

```text
social_comment_likes
```

因为它不是核心闭环。

第一阶段互动链已经有：

```text
动态
点赞
评论
回复
```

足够。

等实际用户使用之后，如果评论互动明显，再加 Comment Like。

现在不要无限扩散。

---

# 十八、点赞数 / 评论数要不要存在 posts

第一阶段我建议：

```text
先不存
```

直接：

```sql
COUNT social_post_likes
COUNT social_post_comments
```

但注意评论数应该只算：

```text
moderation_status = approved
AND deleted_at IS NULL
```

如果以后动态量大了，再加：

```text
social_post_stats
```

例如：

```text
post_id
like_count
comment_count
```

作为缓存。

不要一开始直接在：

```text
social_posts
```

加：

```text
like_count
comment_count
```

然后每次互动 UPDATE 主表。

---

# 十九、索引建议

Like 最重要的主键已经覆盖：

```text
(post_id, profile_id)
```

但如果需要查：

> 我点赞过哪些动态

可以以后补：

```sql
CREATE INDEX idx_social_post_likes_profile
ON social_post_likes(profile_id, created_at DESC);
```

评论建议：

```sql
CREATE INDEX idx_social_post_comments_post
ON social_post_comments(post_id, created_at);
```

以及：

```sql
CREATE INDEX idx_social_post_comments_parent
ON social_post_comments(parent_comment_id, created_at)
WHERE parent_comment_id IS NOT NULL;
```

不过继续遵守我们前面的原则：

> 先建立明确查询需要的索引，不提前为假想需求铺几十个索引。

---

# 二十、点赞和评论是否需要通知

需要，但不要往表里加：

```text
notification_sent
```

比如：

```text
A 点赞 B 的动态
→ Notification Domain 创建通知

A 评论 B 的动态
→ Notification Domain 创建通知

C 回复 A 的评论
→ Notification Domain 创建通知
```

Notification 是副作用，不是 Like/Comment 自己的状态。

以后即使通知发送失败，也不能反过来把点赞判定为失败。

---

# 二十一、评论引用关系的一致性必须在 Service 层检查

如果：

```text
parent_comment_id = 100
```

必须保证：

```text
parent comment.post_id = 当前 post_id
```

否则可能出现：

```text
Post A 的评论
```

错误挂到：

```text
Post B
```

仅靠普通 FK 不容易完整表达这个跨字段约束，所以 Service 层创建回复时必须验证。

同时：

```text
parent_comment_id
```

指向的必须是顶级评论。

如果传来一个二级回复 ID：

```text
先找到它的 root parent
```

再写入真正 root。

---

# 二十二、动态删除后怎么办

如果 Post：

```text
deleted_at != NULL
```

其：

```text
likes
comments
```

不要批量删除。

数据库历史关系继续保留。

公开查询因为 Post 已不可见，自然不会加载这些互动。

这样如果以后风控/审核调查原动态，历史仍然完整。

---

# 二十三、最终建议锁定

点赞：

```text
social_post_likes
────────────────────────
post_id
profile_id
created_at

PK(post_id, profile_id)
```

评论：

```text
social_post_comments
────────────────────────
id

post_id
profile_id

parent_comment_id
reply_to_profile_id

content

moderation_status
moderated_at

created_at
updated_at
deleted_at
```

核心规则：

```text
Like 只有当前关系，不软删除

评论支持：
一级评论
+
二级回复

不支持无限层级

评论发布后第一阶段不可编辑
可以删除

UGC 评论必须审核

顶级评论删除但有回复
→ 保留“已删除”占位

回复删除
→ 直接隐藏

Post 删除
→ Like / Comment 历史不级联物理删除

点赞/评论都必须先通过 Post 可见性与 Block 检查
```

到这里，Social 的 **Profile → Follow/Match → Post → Like/Comment** 主链已经形成。

下一步建议设计 **Social Gift（礼物）**。因为我们前面已经确定：**匹配成功后聊天永久免费，但礼物需要购买，是 Social 的核心商业化能力之一。** 礼物设计必须把“礼物目录、价格、购买货币、送礼交易、收礼记录”和 Wallet/Payment 的职责边界分清楚，尤其不能直接在 `social_matches` 或聊天消息里塞一个 `gift_price`。memcite


---

### [30] USER　status=finished_successfully

礼物放在social域还是commerce域


---

### [31] ASSISTANT　status=finished_successfully

_(empty)_


---

### [32] ASSISTANT　status=finished_successfully

我建议 **拆开，不要把“礼物”全部归到一个域里**。

最合理的是：

- **Social Domain** 负责“送了什么礼物给谁、发生在哪段社交关系里”
- **Commerce Domain** 负责“这个礼物多少钱、怎么购买、扣了多少余额、订单和交易是否成功”

也就是说，**Gift 是跨域业务，但商业事实归 Commerce，社交事实归 Social**。memcite

可以这样理解：

```text
Commerce
负责：
礼物商品
价格
货币
购买
余额扣减
订单
支付
交易流水

Social
负责：
谁送给谁
送礼时间
关联 Match / Conversation
附言
展示效果
收礼记录
```

比如用户 A 给 B 送一个“玫瑰”。

Commerce 发生的是：

```text
A 购买/消费：
gift_product_id = rose
price = 10 coins
扣除 10 coins
交易成功
```

Social 发生的是：

```text
A
→ 送给 B
→ rose
→ match_id = 123
→ conversation_id = 456
→ sent_at = ...
```

所以我**不建议**做成：

```text
social_gifts
├── price
├── currency
├── payment_status
├── order_no
├── balance_before
├── balance_after
```

这些明显已经越界到 Commerce。

反过来也不建议 Commerce 里保存：

```text
recipient_profile_id
match_id
conversation_id
```

因为 Commerce 不应该理解“匹配”“聊天”“社交资料”这些概念。

更好的边界是类似：

```text
Commerce Domain
├── commerce_products
├── commerce_gift_products
├── commerce_orders
├── commerce_order_items
├── wallet_accounts
└── wallet_transactions

Social Domain
└── social_gift_sends
```

其中 `commerce_gift_products` 这个名字是否需要单独存在，要等 Commerce Domain 整体设计时决定。也可能最终是统一的：

```text
commerce_products
```

其中：

```text
product_type = gift
```

Social 不关心 Commerce 内部到底怎么组织商品体系，只需要一个稳定的：

```text
gift_product_id
```

或者更通用的：

```text
product_id
```

来引用即可。

我尤其建议把 **“礼物定义”和“送礼行为”分开**。

例如：

```text
玫瑰
爱心
皇冠
跑车
```

这些东西的名称、图标、价格、是否上架、促销价格，本质上都是商品目录，因此应该属于 Commerce。

而：

```text
A 在 8 月 30 日给 B 送了一朵玫瑰
```

这是社交互动，所以属于 Social。

因此我们后面真正需要在 Social 设计的，不是：

```text
social_gifts
```

而更准确应该叫：

```text
social_gift_sends
```

或者：

```text
social_gift_transactions
```

不过我更推荐 **`social_gift_sends`**，因为 `transaction` 很容易和资金交易混淆。

它大概会长这样：

```sql
social_gift_sends
────────────────────
id

sender_profile_id
recipient_profile_id

match_id
conversation_id

product_id
commerce_transaction_id

quantity

message

sent_at
created_at
```

这里有一个关键点：

> **Social 记录“送礼成功的业务结果”，Commerce 才记录“钱是怎么扣的”。**

所以送礼流程未来应该是：

```text
A 点击送礼
      ↓
Social 检查：
双方是否 Match
是否被 Block
是否允许送礼
      ↓
Commerce：
校验商品
校验余额
扣款
生成交易
      ↓
Commerce 成功
      ↓
Social：
创建 social_gift_sends
      ↓
Chat：
生成一条礼物消息/展示事件
      ↓
Notification：
通知 B 收到礼物
```

这样一旦以后你增加：

```text
充值
VIP
会员
道具
活动礼包
优惠券
```

Commerce Domain 都可以继续复用，不会和 Social 绑死。

所以这一块我建议现在正式定下来：

> **礼物商品与支付结算属于 Commerce Domain；送礼行为与社交展示属于 Social Domain。**

而且我建议我们**暂时不要现在深入设计礼物**，因为它依赖 Commerce 的商品、钱包和交易模型。Social 这边先只预留“未来存在送礼行为”的边界即可。

我们当前 Social Domain 更适合继续设计 **Report / Moderation 入口**，或者继续做 **Discovery / Recommendation 候选与曝光记录**。这两块都比现在强行设计 Gift 更顺序合理。


---

### [33] USER　status=finished_successfully

好的，继续


---

### [34] ASSISTANT　status=finished_successfully

继续的话，我建议先做 **Report / Moderation 入口**，因为我们现在 Social 里已经有很多 UGC：资料、照片、Prompt、动态、评论。举报如果不先统一，后面每个内容类型都会各自长出一套举报表。

我建议不要建：

```text
social_profile_reports
social_post_reports
social_comment_reports
social_photo_reports
```

而是统一成一个：

```text
social_reports
```

核心结构可以这样：

```sql
CREATE TABLE social_reports (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    reporter_profile_id BIGINT NOT NULL,

    target_type         VARCHAR(30) NOT NULL,
    target_id           BIGINT NOT NULL,

    reason_code         VARCHAR(50) NOT NULL,
    description         VARCHAR(500),

    status              VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_social_reports_target_type
        CHECK (
            target_type IN (
                'profile',
                'profile_photo',
                'profile_prompt',
                'post',
                'comment'
            )
        ),

    CONSTRAINT ck_social_reports_status
        CHECK (
            status IN (
                'pending',
                'reviewing',
                'resolved',
                'dismissed'
            )
        )
);
```

这里 `target_type + target_id` 是一个典型的多态引用。通常我不太喜欢滥用多态外键，但举报系统是少数非常适合这种结构的场景，因为它本来就是“对不同类型资源统一发起举报”。

这样以后：

```text
举报用户主页
→ target_type = profile

举报头像
→ profile_photo

举报动态
→ post

举报评论
→ comment
```

都进入一个入口。

不过要明确一点：数据库没办法对 `target_id` 做普通 FK，因为它根据 `target_type` 指向不同表。所以创建举报时，Service 层必须校验目标确实存在。

`reason_code` 不建议让用户直接自由输入原因作为唯一依据，而应该是平台定义代码，例如：

```text
spam
harassment
sexual_content
fraud
hate
violence
fake_profile
underage
illegal_content
other
```

用户选择一个原因，再通过：

```text
description
```

补充说明。

举报原因以后一定会涉及后台统计，所以不要只存：

```text
reason = "这个人很烦"
```

这种自由文本。

对于 `reason_code`，第一阶段可以直接 VARCHAR + 应用枚举，不需要单独建举报原因字典表。

另外我建议举报记录里 **不要直接保存 `reported_profile_id`** 作为所有举报的通用字段。

例如举报评论：

```text
target_type = comment
target_id = 987
```

评论自己已经能找到作者。

如果再保存：

```text
reported_profile_id
```

就出现重复事实，未来评论作者和字段不一致时会产生数据问题。

真正需要处理谁，可以在受理举报时通过目标实体解析。

但有一个例外：如果举报的是用户本人：

```text
target_type = profile
```

那自然 `target_id` 就是 profile id。

举报还要防止重复刷。

例如同一个用户疯狂举报同一条动态 100 次。可以增加一个唯一约束，限制“同一个 reporter 对同一个目标的当前有效举报”只能有一条：

```sql
CREATE UNIQUE INDEX uq_social_reports_active_target
ON social_reports (
    reporter_profile_id,
    target_type,
    target_id
)
WHERE status IN ('pending', 'reviewing');
```

这样已经处理完成之后，如果未来又出现新的问题，可以再次举报；但同一个待处理举报不能重复提交。

这里也不要做：

```text
report_count
```

直接放 Post 或 Profile 上。

以后如果需要快速风控，可以做聚合统计或风险系统，但事实来源仍然是 `social_reports`。

更重要的是，**Report 和 Moderation 不是一回事**。

举报是：

```text
用户告诉平台：
“这个东西可能有问题。”
```

Moderation 是：

```text
平台决定：
“这个东西到底有没有问题，以及怎么处置。”
```

所以不要把：

```text
social_reports.status = resolved
```

理解成：

```text
内容已违规
```

`resolved` 只能表示举报处理结束。

真正平台判断可能是：

```text
举报成立
举报不成立
部分成立
```

以及：

```text
删除内容
限制账号
警告用户
不处理
```

这些应该进入统一 Moderation Domain 或 Safety/Trust & Safety 体系，而不是继续往 `social_reports` 里塞几十个字段。

Social 只需要提供举报入口。

我建议后面统一 Moderation 时，让它可以处理：

```text
social_profile
social_profile_photo
social_profile_prompt
social_post
social_post_comment
```

甚至以后还能处理：

```text
chat_message
```

这样人工审核升级成机器审核时也不会推倒重来。

还有一个很重要的业务规则：**Block 和 Report 应该允许组合，但不能强绑定。**

用户举报某人之后，可以在 UI 上提示：

```text
同时拉黑此用户
```

如果用户选择：

```text
Report
+
Block
```

就分别创建：

```text
social_reports
social_blocks
```

但不要设计成：

```text
report automatically means block
```

因为举报某条垃圾评论，不代表用户一定想屏蔽整个作者。

反过来 Block 也不要求一定举报。

所以两者是独立行为。

另外举报本身通常不应该让被举报用户知道是谁举报的。数据库可以保存：

```text
reporter_profile_id
```

用于后台风控，但 API 绝对不能向被举报者暴露。

最终这一块我建议锁定为：

```text
social_reports
────────────────────────
id

reporter_profile_id

target_type
target_id

reason_code
description

status

created_at
updated_at
```

核心规则是：统一举报入口；举报不同 Social 资源都走一张表；同一用户不能重复提交同一待处理举报；举报和拉黑彼此独立；举报记录负责“提出问题”，不负责最终处罚；真正的审核决定交给统一 Moderation。

这样一来 Social Domain 的内容安全入口也完整了。

下一步我建议继续设计 **Discovery / Exposure（发现与曝光）**。这块会决定谁进入候选池、什么叫“看过一个人”、要不要记录曝光、同一个人多久后可以再次出现，以及这些曝光数据如何服务推荐和后面的付费能力。memcite


---

### [35] USER　status=finished_successfully

继续


---

### [36] ASSISTANT　status=finished_successfully

继续。现在进入 **Discovery / Exposure（发现与曝光）**。这一块不要和 Match 混在一起，它解决的是：

> **谁有资格被我看到，以及我已经看过谁。**

我建议第一阶段拆成两层：**候选资格实时算，曝光历史单独记。**

也就是说，不要一上来建一个庞大的 `social_discovery_candidates` 永久候选表。

先用现有事实表实时筛选：

```text
social_profiles
social_preferences
social_preference_genders
social_preference_countries
social_preference_goals
social_profile_languages
social_profile_interests
social_follows
social_blocks
```

然后只把真正发生过的“曝光”记录下来。

## 一、先定义什么叫候选

一个 profile 能进入 A 的 Discovery，至少要满足：

```text
不是自己

双方 Social Profile 可参与发现

双方没有任意方向 Block

A 的硬偏好接受 B

B 的硬偏好接受 A

没有业务上必须排除的关系
```

这里我建议进一步明确：

**已经 Match 的用户不再进入普通 Discovery。**

因为双方已经建立关系，没有必要继续在“发现新人”里重复出现。

已经关注但尚未回关的人，我建议也默认从普通 Discovery 里移除。因为：

```text
A 已经关注 B
B 尚未关注 A
```

A 再看到 B 没有什么新动作可做。

以后可以单独做：

```text
我关注的人
关注我的人
待回关
已匹配
```

这些关系页面。

所以普通 Discovery 主要展示：

```text
从未建立当前 Follow 关系的候选
```

这样体验更干净。

## 二、不要提前保存 Candidate 表

不要现在做：

```text
social_discovery_candidates
────────────────
viewer_profile_id
candidate_profile_id
score
rank
reason
expires_at
```

因为 Candidate 是一个高度派生的数据：

```text
Profile 状态变了
偏好变了
Block 变了
Follow 变了
兴趣变了
活跃度变了
```

候选集合就可能变化。

第一阶段用户量不大，直接查询生成候选池最合适。

未来规模上来后，可以再做：

```text
candidate cache
recommendation materialization
```

但它只能是缓存，不是真相来源。

## 三、真正应该持久化的是 Exposure

我建议建立：

```text
social_discovery_exposures
```

表示：

> 系统确实把某个候选展示给某个用户了。

推荐结构：

```sql
CREATE TABLE social_discovery_exposures (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    viewer_profile_id       BIGINT NOT NULL,
    candidate_profile_id    BIGINT NOT NULL,

    source                  VARCHAR(30) NOT NULL DEFAULT 'discovery',

    exposed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_social_discovery_exposures_not_self
        CHECK (
            viewer_profile_id <> candidate_profile_id
        )
);
```

这里先不要加：

```text
score
rank
algorithm_version
session_id
request_id
```

第一阶段没有必要。

最核心的事实只有：

```text
A 在什么时候看到了 B
```

## 四、为什么 Exposure 很重要

如果不记录曝光，你以后无法回答：

```text
这个用户已经看过多少人？

为什么总是重复出现同一个人？

这个候选昨天是不是已经展示过？

曝光后有多少人产生关注？

某个推荐策略到底有没有效果？
```

而 Follow 只能告诉你：

```text
谁最后关注了谁
```

它无法告诉你：

```text
谁看过但没关注
```

这正是推荐系统最重要的负反馈之一。

例如：

```text
B 被展示给 A 5 次
A 一直没有关注
```

虽然 A 没明确点“不喜欢”，但这已经是一个弱负信号。

所以 Exposure 是推荐数据基础。

## 五、一次接口返回 20 人，算 20 次曝光吗

不要。

只有真正进入用户视野，才应该算曝光。

例如接口：

```text
返回 20 个候选
```

用户只滑到前 4 个。

如果服务器直接把 20 个全记为曝光，会污染数据。

推荐做法：

```text
服务端返回候选
↓
客户端实际展示某个卡片
↓
客户端发送 exposure event
↓
服务端写 social_discovery_exposures
```

也就是说：

> returned candidate ≠ exposed candidate

这个区别以后非常重要。

## 六、要不要一人只保存一条 Exposure

不要。

因为同一个候选以后可能再次被展示。

例如：

```text
8 月 1 日 A 看过 B
8 月 10 日再次看到 B
```

这是两个真实事件。

所以不要：

```text
PRIMARY KEY(viewer_profile_id, candidate_profile_id)
```

而应该允许多行。

这也是为什么 Exposure 自己有：

```text
id
```

## 七、多久允许重复出现

第一阶段我建议采用一个很简单的 cooldown：

```text
已经曝光过
→ 7 天内不重复展示
```

比如 Discovery 查询时：

```sql
NOT EXISTS (
    SELECT 1
    FROM social_discovery_exposures e
    WHERE e.viewer_profile_id = :viewer_profile_id
      AND e.candidate_profile_id = p.id
      AND e.exposed_at >= NOW() - INTERVAL '7 days'
)
```

7 天不是数据库规则，而是产品配置。

以后可以调整成：

```text
3 天
14 天
30 天
```

不要在表里存：

```text
next_show_at
```

因为它可以由最后曝光时间 + 策略算出来。

## 八、如果用户明确关注了对方，还要 cooldown 吗

不用，因为他本来就应该从普通 Discovery 排除。

逻辑优先级是：

```text
Block
↓
已有 Follow / Match
↓
硬偏好
↓
Exposure cooldown
↓
推荐排序
```

而不是先看曝光再看关系。

## 九、要不要做“跳过”

这里需要区分两个动作：

```text
没关注
```

和：

```text
明确点了“不感兴趣”
```

这两个强度完全不同。

第一阶段如果你的 Discovery UI 只是上下浏览资料，并没有“左滑不喜欢”，那就不要制造一个：

```text
social_dislikes
```

因为用户什么都没做，不代表明确拒绝。

Exposure 本身已经能表达：

> 看到了，但没有进一步行动。

如果以后 UI 真正增加：

```text
不感兴趣
隐藏此人
```

那应该单独设计：

```text
social_discovery_dismissals
```

而不是把所有未关注都当 dislike。

## 十、我建议预留 Dismiss，但现在不一定上线

如果以后需要，可以：

```sql
CREATE TABLE social_discovery_dismissals (
    viewer_profile_id       BIGINT NOT NULL,
    candidate_profile_id    BIGINT NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        viewer_profile_id,
        candidate_profile_id
    )
);
```

语义就是：

> A 主动表示暂时不想再看到 B。

但我建议现在先**不建**。

先通过 Exposure cooldown 控制重复即可。

等实际发现“用户需要明确隐藏某个人”时再加。

## 十一、Discovery 排序第一阶段怎么做

第一阶段不要上复杂 AI 推荐。

可以先做一个简单综合排序：

```text
双向硬条件兼容
      ↓
语言互补
      ↓
共同兴趣
      ↓
资料完整度
      ↓
最近活跃
      ↓
新用户适度加权
      ↓
随机扰动
```

例如概念上：

```text
language_match_score
interest_overlap_score
profile_quality_score
activity_score
freshness_score
```

但是这些暂时都**不要存进数据库事实表**。

在查询或 Recommendation Service 中计算即可。

## 十二、必须加一点随机扰动

如果完全按固定分数排序：

```text
A 每次打开 Discovery
```

可能永远看到：

```text
B
C
D
E
```

顺序完全相同。

再加上曝光 cooldown 之前，会很僵硬。

所以排名最后可以有小范围随机扰动，让同分或近似分候选换一下顺序。

但不要纯随机。

否则前面所有画像、语言、兴趣都失去意义。

## 十三、语言互补应该是很强的软信号

比如：

```text
A：
native zh
learning lo

B：
native lo
learning zh
```

这是非常好的匹配。

可以比：

```text
共同喜欢电影
```

权重更高。

但是如果用户 `relationship_goal = dating`，没有学习目标，也完全可以正常推荐。

不能把产品做成：

```text
只有语言交换匹配才能进入 Social
```

Social 是更大的关系场景，语言互补只是优势信号。

## 十四、Relationship Goal 怎么用

前面的：

```text
social_profiles.relationship_goal
```

和：

```text
social_preference_goals
```

可以用于候选硬过滤。

例如 A 明确只接受：

```text
dating
serious_relationship
```

那么 B 如果目标是：

```text
language_exchange
```

就可以直接排除。

但如果 A 没有设置 `social_preference_goals`：

```text
0 条 = 不限制
```

则不应该排除。

## 十五、共同兴趣怎么计算

第一阶段完全可以直接关系表 JOIN：

```text
A interests
∩
B interests
```

得到：

```text
common_interest_count
```

比如：

```text
A: travel, coffee, movies
B: travel, movies, cats
```

共同：

```text
travel
movies
```

所以：

```text
common_interest_count = 2
```

第一阶段甚至不需要复杂权重。

以后再考虑：

```text
稀有兴趣权重
兴趣类别多样性
用户排序优先级
```

现在不要过度设计。

## 十六、last_active_at 会成为非常实用的排序信号

前面在 `social_profiles` 中保留：

```text
last_active_at
```

现在就开始体现价值。

两个候选条件差不多：

```text
B：2 分钟前活跃
C：30 天没上线
```

通常应该优先 B。

但不要做：

```text
last_active_at DESC
```

绝对排序。

否则长期活跃用户永远压住新用户。

它应该只是排序特征之一。

## 十七、Profile completeness 也是软信号

我们前面保留：

```text
completeness_score
```

也可以参与排序。

例如：

```text
只有一张照片
没 Bio
没兴趣
```

和：

```text
6 张照片
有 Bio
兴趣丰富
Prompt 丰富
语言完整
```

后者适当优先。

这可以鼓励用户完善资料。

但不要因为 70 分和 80 分就做极端差异。

## 十八、Discovery 是否要记录“为什么推荐”

数据库第一阶段不要。

比如：

```text
recommendation_reason = LANGUAGE_MATCH
```

这个可以实时生成 UI：

```text
你们都喜欢旅行
正在学习彼此的语言
```

不需要写到 Exposure 里。

以后如果做算法实验、推荐解释追溯，再增加推荐日志系统。

## 十九、曝光表以后会很大

这是我们目前 Social Domain 第一个明显的高增长事件表。

假设：

```text
1 万用户
每天每人看 20 人
```

就是：

```text
20 万 exposure / 天
```

所以它和 Profile 这种主数据完全不一样。

第一阶段 PostgreSQL 仍然完全可以承担，但设计时要知道：

> `social_discovery_exposures` 是事件型、高增长表。

因此至少建议索引：

```sql
CREATE INDEX idx_social_discovery_exposures_viewer_time
ON social_discovery_exposures(
    viewer_profile_id,
    exposed_at DESC
);
```

以及用于判断某个候选最近是否曝光：

```sql
CREATE INDEX idx_social_discovery_exposures_viewer_candidate_time
ON social_discovery_exposures(
    viewer_profile_id,
    candidate_profile_id,
    exposed_at DESC
);
```

第一阶段这两个就够。

## 二十、Exposure 是否永久保存

没必要无限永久保留在线热表。

比如以后数据很多，可以：

```text
最近 90 天
→ 保留在线

更老
→ 归档 / 聚合
```

但现在不要提前做分区、归档系统。

等实际量起来再处理。

不过这个认知要保留：

> 它是行为日志，不是永久主数据。

## 二十一、发现页到底要不要展示已关注我的人

这是一个产品层很重要的问题。

如果：

```text
B → A
```

但：

```text
A 尚未关注 B
```

按照前面“已有任意 Follow 默认不进普通 Discovery”的规则，A 就不会在普通发现里再次看到 B。

这没问题，但必须提供一个明确入口：

```text
关注我的
```

让 A 可以查看这些人并决定是否回关。

否则 Match 转化会被损失。

所以未来关系 UI 至少应该有：

```text
我关注的
关注我的
已匹配
```

数据库不需要新表，都是从：

```text
social_follows
social_matches
```

查询得到。

## 二十二、第一阶段 Discovery 数据流

可以很简单：

```text
用户 A 打开发现
      ↓
读取 A preferences
      ↓
查 social_profiles
      ↓
排除：
自己
Block
当前 Follow
Match
无资格 Profile
硬偏好不兼容
最近曝光
      ↓
计算：
语言互补
共同兴趣
资料完整度
活跃度
      ↓
排序
      ↓
返回候选
      ↓
客户端真正展示某候选
      ↓
写 social_discovery_exposures
```

这已经足够支撑第一版。

## 二十三、最终建议锁定

现在真正新增的表只需要：

```text
social_discovery_exposures
────────────────────────────
id

viewer_profile_id
candidate_profile_id

source
exposed_at
```

其中：

```text
source
```

第一阶段可以只有：

```text
discovery
```

为什么还保留？

因为以后很可能出现：

```text
discovery
search
recommendation
nearby
event
```

曝光来源对数据分析非常有价值，而且成本很低，所以我认为这个字段值得现在保留。

最终原则：

```text
Candidate
→ 实时计算，不作为永久事实

Exposure
→ 真正发生过，要持久化

未关注
≠ 明确不喜欢

最近曝光
→ cooldown 后可以再次出现

当前 Follow / Match
→ 不进入普通 Discovery

双方硬偏好必须兼容

语言、兴趣、活跃、完整度
→ 只参与软排序
```

到这里，Social Domain 的主链已经基本齐了：Profile、偏好、关注、匹配、拉黑、动态、互动、举报、发现/曝光。

下一步我建议做 **Social Domain 收尾：把当前已经设计出来的表完整盘点一遍，找出是否还缺“关系请求/访客/收藏/统计/事件”等真正必要的表，并明确哪些第一阶段不做**。这样避免继续无限加表，然后我们才能进入下一个域。memcite


---

### [37] USER　status=finished_successfully

继续


---

### [38] ASSISTANT　status=finished_successfully

_(empty)_


---

### [39] ASSISTANT　status=finished_successfully

继续。现在我们做 **Social Domain 收尾审查**：不再顺着功能无限加表，而是把当前模型从头到尾盘一遍，判断哪些是真正缺失的，哪些应该明确“不做”。

先给结论：目前 Social Domain 的主业务链已经完整，第一阶段还建议补 **1 张统计缓存表的设计预留**，但暂时不一定创建；“访客、收藏、浏览历史、推荐候选缓存”等都不要现在做。

当前 Social Domain 可以整理成下面这一组：

| 模块 | 表 |
|---|---|
| 社交身份 | `social_profiles` |
| 资料照片 | `social_profile_photos` |
| 兴趣字典 | `social_interests` |
| 用户兴趣 | `social_profile_interests` |
| 社交语言 | `social_profile_languages` |
| Prompt 模板 | `social_prompt_templates` |
| Prompt 回答 | `social_profile_prompts` |
| 交友偏好 | `social_preferences` |
| 目标性别 | `social_preference_genders` |
| 目标国家 | `social_preference_countries` |
| 目标目的 | `social_preference_goals` |
| 关注关系 | `social_follows` |
| 匹配关系 | `social_matches` |
| 拉黑关系 | `social_blocks` |
| 动态 | `social_posts` |
| 动态图片 | `social_post_media` |
| 动态点赞 | `social_post_likes` |
| 动态评论 | `social_post_comments` |
| 举报 | `social_reports` |
| 发现曝光 | `social_discovery_exposures` |

也就是目前大约 **20 张表**。

这看起来不少，但里面很多都是非常小的关系表，实际复杂度并没有 20 个“大业务表”那么高。

---

## 一、先看 Social Domain 是否缺核心能力

按照用户完整生命周期走一遍：

```text
创建 Social Profile
        ↓
填写资料
照片 / 兴趣 / 语言 / Prompt
        ↓
设置想认识谁
        ↓
审核
        ↓
进入 Discovery
        ↓
看到候选
        ↓
关注
        ↓
对方回关
        ↓
Match
        ↓
聊天
        ↓
关注对方动态
        ↓
点赞 / 评论
        ↓
举报 / 拉黑
```

这条链已经闭环。

因此现在最重要的是：

> 不要再因为“某功能以后可能有用”继续往 Social 里堆表。

---

# 二、要不要做“谁看过我”

也就是常见的：

```text
访客
谁看了我的主页
```

技术上可以从：

```text
social_discovery_exposures
```

得到一部分数据，但它不等于 Profile Visit。

因为：

```text
候选卡片曝光
```

和：

```text
主动进入资料主页
```

是两个行为。

如果未来真的做访客功能，可以增加：

```text
social_profile_views
```

例如：

```text
viewer_profile_id
viewed_profile_id
viewed_at
```

但是 **第一阶段不要做**。

原因有三个：

```text
不是核心匹配闭环
会增加隐私产品设计
很容易变成商业化功能
```

尤其以后可能出现：

> 谁看过我仅 VIP 可见。

这时候它已经和 Commerce/Entitlement 有关联。

所以现在明确：

**不创建 `social_profile_views`。**

---

# 三、要不要做“收藏用户”

也暂时不要。

因为现在已经有：

```text
Follow
```

Follow 本身就是一个非常强的“我对这个人感兴趣”动作。

如果再增加：

```text
Favorite
Star
Bookmark
```

用户会开始疑惑：

```text
关注和收藏有什么区别？
```

除非未来出现明确场景：

> 我想保存这个人，但不想让对方知道。

否则没有必要。

所以第一阶段：

**没有 `social_favorites`。**

---

# 四、要不要做“喜欢 / 不喜欢”

也不要。

当前关系模型已经明确：

```text
Follow
→ 有兴趣

没有 Follow
→ 没有明确表达

Block
→ 明确拒绝进一步关系
```

不要再加：

```text
like_profile
dislike_profile
swipe_left
swipe_right
```

否则你会把产品从“关注型社交”慢慢变成 Tinder 型 swipe 模型。

当前产品逻辑不需要。

---

# 五、要不要做“关注请求”

也就是：

```text
A 请求关注 B
B 同意
```

第一阶段不要。

当前 Follow 是直接成立：

```text
A → B
```

然后 A 可以看符合可见性规则的动态。

如果做：

```text
follow_request
approved
rejected
```

关系系统会复杂一倍：

```text
request
follow
match
block
```

而现在没有明确的私密账号需求。

所以：

**不创建 `social_follow_requests`。**

以后如果增加：

```text
private profile
```

再设计。

---

# 六、要不要做 Match Participants 表

不用。

因为 Match 永远只有两个人：

```text
profile_a_id
profile_b_id
```

没有必要设计：

```text
social_match_members
```

那是群聊/多人关系模型才需要的。

这里固定二元关系反而更清楚。

---

# 七、要不要给 Match 增加聊天字段

不要。

比如：

```text
conversation_id
last_message_at
unread_count
```

都不应该进入：

```text
social_matches
```

Match 只负责：

> 两个 Social Profile 当前是否建立匹配关系。

聊天属于 Chat Domain。

未来可以：

```text
match_id
```

被 Chat 引用，或者 Chat 保存自己的参与者和 Social 来源。

具体到 Chat Domain 再决定。

---

# 八、礼物现在也不进入 Social 收尾范围

我们刚刚已经定了边界：

```text
礼物商品 / 钱 / 交易
→ Commerce

送礼行为
→ Social
```

但是由于 Social Gift Send 依赖 Commerce 的商品与资金交易模型，现在不要提前把表锁死。

所以 Social Domain 当前可以在文档里注明：

```text
Future integration:
social_gift_sends
```

但 **现在先不创建**。

等 Commerce Domain 完成后回来补。

这比现在猜：

```text
product_id
transaction_id
order_item_id
```

到底应该引用哪个更稳。

---

# 九、是否需要 Social Stats

这个值得单独讨论。

未来 Profile 页面经常会需要：

```text
关注数
粉丝数
匹配数
动态数
获赞数
```

如果每次都实时：

```sql
COUNT(...)
```

用户量小时完全没问题。

所以第一阶段我建议 **先不创建**。

但是它是一个非常明确的未来缓存表，可以提前把概念定下来：

```text
social_profile_stats
```

未来可能：

```sql
CREATE TABLE social_profile_stats (
    profile_id          BIGINT PRIMARY KEY,

    follower_count      INTEGER NOT NULL DEFAULT 0,
    following_count     INTEGER NOT NULL DEFAULT 0,
    match_count         INTEGER NOT NULL DEFAULT 0,
    post_count          INTEGER NOT NULL DEFAULT 0,
    received_like_count INTEGER NOT NULL DEFAULT 0,

    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

但关键原则：

> 这永远只是缓存，不是真相来源。

真相仍然来自：

```text
social_follows
social_matches
social_posts
social_post_likes
```

所以当前结论：

**定义概念，但第一阶段不建。**

---

# 十、是否需要 Social Events

例如：

```text
profile_created
profile_published
followed
unfollowed
matched
match_ended
post_created
post_liked
```

我们前面多次提到：

> 如果以后需要历史分析，应该走事件记录，而不是污染当前关系表。

这说明未来很可能需要一个统一 Event / Analytics 能力。

但我不建议建：

```text
social_events
```

然后什么都往里面扔。

因为：

```text
业务审计
产品分析
埋点
推荐行为日志
安全日志
```

其实是几种不同需求。

现在统一成一张万能 Event 表，很容易成为新的垃圾桶。

因此：

**Social Domain 暂不设计通用 Event 表。**

等 Analytics / Audit / Recommendation 的整体域设计时再处理。

---

# 十一、Exposure 是目前唯一值得保留的行为型大表

为什么：

```text
social_discovery_exposures
```

我们保留了，而其他 Event 不保留？

因为 Exposure 本身直接参与当前业务：

```text
最近看过的人短期不要重复推荐
```

它不是单纯为了分析。

所以它有明确在线业务价值。

这就是判断一张事件表是否现在应该存在的标准。

---

# 十二、举报是否真的属于 Social Domain

这里也值得再确认一下。

`social_reports` 当前放 Social 是合理的，因为它代表：

> Social 用户针对 Social 对象发起举报。

但最终：

```text
审核任务
审核员
审核结果
处罚
申诉
风险等级
自动审核模型
```

都不应该继续进入 Social。

所以未来很可能形成：

```text
Social
   │
   │ report
   ↓
Moderation / Trust & Safety
```

例如：

```text
social_reports
       ↓
moderation_cases
       ↓
moderation_actions
```

Social 负责入口。

Moderation 负责处理。

这个边界现在已经比较清楚。

---

# 十三、Social Profile 审核还有一个未来升级点

目前：

```text
social_profiles.moderation_status
social_profile_photos.moderation_status
social_profile_prompts.moderation_status
social_posts.moderation_status
social_post_comments.moderation_status
```

都保存当前审核状态。

这是正确的。

但不要因此以后继续加：

```text
reviewer_id
review_reason
model_score
model_version
review_notes
```

到每一张业务表。

未来这些统一进入 Moderation。

业务表只保留：

```text
当前能不能展示
```

完整历史属于审核系统。

这一条建议作为整个项目的统一数据库原则保留下来。

---

# 十四、我们还需要检查一个问题：Profile 的关闭和数据删除

我们已经有：

```text
profile_status = closed
```

但这不是：

```text
用户账号删除
```

也不是：

```text
GDPR/隐私删除
```

所以不要看到 `closed` 就把所有 Social 数据物理删除。

它只是：

> 退出 Social 功能。

如果以后用户重新开启 Social，可以决定：

```text
恢复原 Profile
```

还是：

```text
重新创建
```

这个产品规则以后确定。

真正账号注销的数据生命周期，应由 Account/Identity 和统一 Data Retention 规则处理。

Social 不自己发明一套用户注销系统。

---

# 十五、索引不要现在一次性全部设计完

当前应该只保留我们已经明确知道会用到的：

```text
Profile user 唯一
Photo active position 唯一
Interest relation PK
Language relation PK
Prompt active position/template 唯一
Follow 双向查询需要的关系索引
Match active pair 唯一
Block pair PK
Post profile + published_at
Like post/profile PK
Comment post/time
Exposure viewer/candidate/time
```

最终落 PostgreSQL DDL 时我们再统一做一次：

> 按实际查询路径审计索引。

不要现在每张表机械创建：

```text
created_at index
status index
updated_at index
country index
...
```

很多单列低选择性索引根本不会带来收益。

---

# 十六、Social Domain 最终职责边界

现在可以把 Social 的职责正式压缩成一句话：

> **Social Domain 负责用户的社交身份、交友偏好、发现、关系建立、社交内容和用户间公开互动。**

它负责：

```text
Social Profile
Discovery
Follow
Match
Block
Post
Like
Comment
Report
```

它不负责：

```text
账号登录
学习进度
私聊消息
通知
支付
钱包
订单
商品价格
审核历史
媒体文件存储
推荐模型训练
分析报表
```

这些全部通过其他 Domain 协作。

---

# 十七、当前 Social Domain 的最终第一阶段表清单

建议第一阶段锁定为这 **20 张**：

```text
01 social_profiles

02 social_profile_photos
03 social_interests
04 social_profile_interests
05 social_profile_languages
06 social_prompt_templates
07 social_profile_prompts

08 social_preferences
09 social_preference_genders
10 social_preference_countries
11 social_preference_goals

12 social_follows
13 social_matches
14 social_blocks

15 social_posts
16 social_post_media
17 social_post_likes
18 social_post_comments

19 social_reports

20 social_discovery_exposures
```

暂不创建：

```text
social_profile_stats
social_profile_views
social_favorites
social_follow_requests
social_dislikes
social_discovery_candidates
social_discovery_dismissals
social_events
social_comment_likes
social_gift_sends
```

不是这些永远不要，而是：

> **现在没有足够明确的第一阶段业务价值，不让它们提前进入数据库。**

到这里我认为 **Social Domain 第一轮数据库设计可以正式收口**。

下一步最合理的是进入 **Chat Domain**，因为现在已经有清楚的 Match 事实，正好继续设计：`conversations`、参与者、消息、消息状态、图片消息、礼物消息边界、已读、撤回、拉黑对聊天的影响，以及“匹配成功后聊天永久免费”应该在哪里体现。memcite


---

### [40] USER　status=finished_successfully

好的，在新会话设计chat domain，你写个提示词


---

### [41] SYSTEM　status=finished_successfully

_(empty)_


---

### [42] SYSTEM　status=finished_successfully

_(empty)_


---

### [43] SYSTEM　status=finished_successfully

_(empty)_


---

### [44] ASSISTANT　status=finished_successfully

把下面这段直接发到新会话即可：

:::writing{variant="document" id="58321"}
我们继续当前重写项目的数据库与领域架构设计。

请开始设计 **Chat Domain**，并承接此前已经确定的整体架构、领域边界和数据库设计原则。

已确定与 Chat 直接相关的 Social Domain 规则：

- 用户拥有独立的 Social Profile。
- 用户可以单向关注其他用户。
- 互相关注 = Match 成立。
- Match 成功后，双方可以聊天。
- **匹配成功后的聊天永久免费。**
- 取消关注会结束 Match，但历史 Match 需要保留。
- Block 后双方不能继续发送新消息。
- `paused` 只停止发现新人，不影响已有 Match 和聊天。
- 礼物是跨域能力：
  - 礼物商品、价格、支付、钱包、交易属于 Commerce Domain。
  - 送礼这一社交行为属于 Social Domain。
  - 目前暂不设计 `social_gift_sends`，等 Commerce Domain 完成后再回来确定。
- Media/Asset 由统一媒体能力负责，Chat 不直接保存文件 URL。
- Notification 不属于 Chat Domain。
- Moderation 完整审核记录不属于 Chat Domain；业务表最多保留必要的当前状态。
- 不要把 Social、Commerce、Notification、Media、Moderation 的职责塞进 Chat。

设计时继续遵循：
1. PostgreSQL。
2. 按业务 Domain 划分表。
3. 事实数据与派生/缓存数据分开。
4. 不为了未来可能的需求过度设计。
5. 第一阶段优先满足单人开发、低运维、结构清晰。
6. 状态、软删除、审核、商业化等需要考虑，但不要机械地给所有表加字段。
7. 枚举优先 VARCHAR + 应用枚举/CHECK，不大量使用 PostgreSQL ENUM。
8. 索引根据明确查询路径设计，不提前堆索引。
9. 当前项目直接按当前方案设计，不讨论其他版本或旧实现。

请从 **Chat Domain 的职责边界和 Conversation 聚合设计** 开始，一步一步设计，不要一次把整个 Chat Domain 全部讲完。

重点需要逐步解决：
- Conversation 和 Match 是 1:1 还是允许多段 Conversation
- Conversation 是否应该直接引用 `match_id`
- Conversation Participants 是否需要单独表
- 文本、图片、系统消息、未来礼物消息如何建模
- Message 是否使用统一消息表
- 消息顺序、分页、游标
- 发送、送达、已读状态
- 撤回、删除
- Block / Match ended 对已有聊天的影响
- 历史消息保留
- 图片等媒体引用
- 举报与审核入口
- 未读数和最后一条消息是否缓存
- WebSocket/实时通信需要哪些持久化事实
- 并发、幂等、重复发送
- 数据量增长后的索引和归档问题

先从 **Conversation 聚合根** 开始设计。每完成一个部分再继续下一部分，并明确哪些设计可以锁定、哪些暂缓。
:::

这样新会话会直接从 **Conversation** 开始，不需要重新解释整个 Social Domain。memcite


---

### [45] USER　status=finished_successfully

请基于本会话已经完成的 Social Domain 最终定稿，做一次**针对全域最终审计结果的修正版定稿**。

不要重新设计 Social，也不要改变已经成立的主体模型，只处理以下明确问题：

1. 删除 `social_reports`。

   - 后续 Trust & Safety Domain 已经最终定稿 `trust.reports` 为全系统唯一的举报事实源。
   - Social 可以提供举报入口/API，但不得再拥有第二份举报 canonical fact。
   - 因此 Social 最终表数量从 20 张调整为 19 张。

2. 保留 `social_blocks`。

   - 用户主动拉黑属于 Social relationship fact。
   - Trust 的 enforcement 是平台处罚事实，两者职责不同，不能合并。

3. 修正跨 Domain ID：

   - 如果 Social 内部实体使用 BIGINT PK，可以继续保留。
   - 但所有可能被 Trust、Chat、Operations 或其他 Domain 引用的 Social 实体必须具有稳定 UUID logical/public ID。
   - 至少重点检查：
     - social profile
     - social profile photo
     - social profile prompt
     - social post
     - social post comment
   - 跨 Domain 不得引用 Social 内部 BIGINT PK。

4. 删除所有跨 Domain physical FK。

   - 对 Identity user 等跨域实体只保存 logical UUID。
   - Social Domain 内部表之间继续使用真实 FK。

5. 修正 `social_profile_photos` 的软删除与唯一约束冲突。

   - 如果存在 `deleted_at`，则 `(profile_id, position)` 不应是永久 UNIQUE。
   - 改为仅针对 active row 的 partial UNIQUE。
   - “当前主照片唯一”同样必须排除已软删记录。

6. 修正 `social_matches`：

   - 历史 Match 必须保留。
   - 不允许永久 `UNIQUE(profile_a_id, profile_b_id)` 阻止未来重新匹配。
   - 使用 active-match partial UNIQUE。
   - 保留 `profile_a_id < profile_b_id`。
   - `status / ended_at` 一致性可以使用普通 CHECK。

7. 修正 `social_profile_languages`：

   - “每个 profile 最多一个 native language”不能用普通 CHECK。
   - 使用 partial UNIQUE，例如逻辑上：
     `UNIQUE(profile_id) WHERE is_native = true`

8. 修正跨表 invariant：

   - “至少一张审核通过的主照片才能进入 discovery”属于跨表规则。
   - 不要伪装成 PostgreSQL CHECK。
   - 明确由 Social application/domain service 在进入 discovery / 发布资料时验证。

9. 保留 `social_preferences` 同行 CHECK：

   - `min_age <= max_age` 可以且应该使用 PostgreSQL CHECK。

10. `social_discovery_exposures`：

    - 不允许设置 viewer-target 永久唯一。
    - 同一用户未来允许再次看到相同 profile。
    - 按 viewer/time、target/time 建查询索引，并定义 retention 策略。

最后输出完整的：

- Social Domain 最终 19 表清单
- 每张受影响表的最终字段修正版
- FK / UNIQUE / partial UNIQUE / CHECK / INDEX
- 删除策略
- 跨域 logical ID 契约
- 不可违反的 Social Domain 规则

只修正上述问题，不重新讨论已经被否决的旧方案。


---

### [46] SYSTEM　status=finished_successfully

_(empty)_


---

### [47] SYSTEM　status=finished_successfully

_(empty)_


---

### [48] ASSISTANT　status=finished_successfully

_(empty)_


---

### [49] ASSISTANT　status=finished_successfully

_(empty)_


---

### [50] ASSISTANT　status=finished_successfully

_(empty)_


---

### [51] ASSISTANT　status=finished_successfully

_(empty)_


---

### [52] ASSISTANT　status=finished_successfully

可以。下面按你这次给出的 **全域最终审计修正规则** 对 Social Domain 做一次修正版定稿。

这次不重新设计 Social，只修正已经明确发现的问题。**最终结果：Social Domain 从 20 张表调整为 19 张，`social_reports` 删除；主体模型不变。**

---

# 一、Social Domain 最终 19 表清单

| # | 表 | 职责 |
|---:|---|---|
| 1 | `social.social_profiles` | Social 身份聚合根 |
| 2 | `social.social_profile_photos` | 社交资料照片 |
| 3 | `social.social_interests` | 兴趣字典 |
| 4 | `social.social_profile_interests` | Profile ↔ Interest |
| 5 | `social.social_profile_languages` | 社交可见语言能力 |
| 6 | `social.social_prompt_templates` | Prompt 模板 |
| 7 | `social.social_profile_prompts` | Profile Prompt 回答 |
| 8 | `social.social_preferences` | 交友偏好主表 |
| 9 | `social.social_preference_genders` | 目标性别 |
| 10 | `social.social_preference_countries` | 目标国家 |
| 11 | `social.social_preference_goals` | 可接受关系目标 |
| 12 | `social.social_follows` | 单向关注事实 |
| 13 | `social.social_matches` | 双向关注产生的 Match 生命周期 |
| 14 | `social.social_blocks` | 用户主动拉黑关系 |
| 15 | `social.social_posts` | 动态 |
| 16 | `social.social_post_media` | 动态图片关系 |
| 17 | `social.social_post_likes` | 动态点赞 |
| 18 | `social.social_post_comments` | 动态评论/回复 |
| 19 | `social.social_discovery_exposures` | Discovery 实际曝光事件 |

**正式删除：**

```text
social.social_reports
```

举报事实统一进入：

```text
trust.reports
```

Social 可以提供“举报”API/入口，但不能保存第二份 canonical report fact。

---

# 二、跨 Domain ID 契约定稿

这是这次最重要的统一修正之一。

Social 内部仍然允许：

```text
BIGINT GENERATED ALWAYS AS IDENTITY
```

作为高效内部主键。

但是：

> **BIGINT 只能用于 Social Domain 内部关系，不允许成为跨 Domain 契约。**

所有需要被 Trust、Chat、Operations 等域引用的重要 Social 实体增加：

```sql
public_id UUID NOT NULL DEFAULT gen_random_uuid()
```

并：

```sql
UNIQUE(public_id)
```

本次确定至少以下实体拥有稳定 UUID：

| Social Entity | Internal PK | Cross-domain logical ID |
|---|---|---|
| Profile | `id BIGINT` | `public_id UUID` |
| Profile Photo | `id BIGINT` | `public_id UUID` |
| Profile Prompt | `id BIGINT` | `public_id UUID` |
| Match | `id BIGINT` | `public_id UUID` |
| Post | `id BIGINT` | `public_id UUID` |
| Post Comment | `id BIGINT` | `public_id UUID` |

这里把 **Match** 也纳入，因为 Chat Domain 很可能需要稳定引用一次 Match。

例如：

```text
Chat → social match
```

只能保存：

```text
match_public_id UUID
```

不得保存：

```text
social_matches.id BIGINT
```

同理 Trust 举报 Social Post：

```text
target_type = social_post
target_id   = <post.public_id UUID>
```

不能引用：

```text
social_posts.id
```

---

# 三、跨 Domain physical FK 全部禁止

## Social → Identity

`social_profiles`：

```sql
user_id UUID NOT NULL
```

这里 `user_id` 表示 Identity Domain 的稳定 logical UUID。

**没有数据库 FK：**

```sql
-- 禁止
FOREIGN KEY (user_id)
REFERENCES identity.users(id)
```

跨域完整性由应用层/domain service 保证。

---

## Social → Media

以下字段也必须修正：

```text
social_profile_photos.media_id
social_post_media.media_id
```

统一为：

```sql
media_id UUID NOT NULL
```

它引用 Media/Asset Domain 的 logical ID。

**没有 physical FK。**

---

# 四、`social_profiles` 修正版定稿

```sql
CREATE TABLE social.social_profiles (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid(),

    user_id             UUID NOT NULL,

    display_name        VARCHAR(50) NOT NULL,
    gender              VARCHAR(20),
    birth_date          DATE,

    country_code        CHAR(2),
    region              VARCHAR(100),
    city                VARCHAR(100),

    occupation          VARCHAR(100),
    education_level     VARCHAR(30),

    bio                 VARCHAR(1000),
    relationship_goal   VARCHAR(30),

    profile_status      VARCHAR(20) NOT NULL DEFAULT 'draft',
    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',

    completeness_score  SMALLINT NOT NULL DEFAULT 0,

    published_at        TIMESTAMPTZ,
    last_active_at      TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_profiles_public_id
        UNIQUE (public_id),

    CONSTRAINT uq_social_profiles_user
        UNIQUE (user_id),

    CONSTRAINT ck_social_profiles_gender
        CHECK (
            gender IS NULL
            OR gender IN ('male', 'female', 'other')
        ),

    CONSTRAINT ck_social_profiles_relationship_goal
        CHECK (
            relationship_goal IS NULL
            OR relationship_goal IN (
                'friendship',
                'language_exchange',
                'dating',
                'serious_relationship',
                'open_to_anything'
            )
        ),

    CONSTRAINT ck_social_profiles_profile_status
        CHECK (
            profile_status IN (
                'draft',
                'active',
                'paused',
                'closed'
            )
        ),

    CONSTRAINT ck_social_profiles_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected',
                'restricted'
            )
        ),

    CONSTRAINT ck_social_profiles_completeness
        CHECK (
            completeness_score BETWEEN 0 AND 100
        )
);
```

### FK

无跨域 FK。

```text
user_id
```

只是 Identity logical UUID。

### 删除策略

`profile_status='closed'` 是退出 Social，不代表物理删除，也不等于账号注销。

---

# 五、`social_profile_photos` 修正版定稿

这是本次明确需要修复 UNIQUE + soft-delete 冲突的表。

```sql
CREATE TABLE social.social_profile_photos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid(),

    profile_id          BIGINT NOT NULL,
    media_id            UUID NOT NULL,

    position            SMALLINT NOT NULL,

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_social_profile_photos_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_social_profile_photos_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_profile_photos_position
        CHECK (position BETWEEN 1 AND 6),

    CONSTRAINT ck_social_profile_photos_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

### Active position 唯一

不能使用：

```sql
UNIQUE(profile_id, position)
```

因为旧照片软删除后应该允许新照片占据相同位置。

最终：

```sql
CREATE UNIQUE INDEX uq_social_profile_photos_active_position
ON social.social_profile_photos(profile_id, position)
WHERE deleted_at IS NULL;
```

### 同一个 Media 当前不能重复挂载

```sql
CREATE UNIQUE INDEX uq_social_profile_photos_active_media
ON social.social_profile_photos(profile_id, media_id)
WHERE deleted_at IS NULL;
```

### 主照片

定义继续保持：

```text
position = 1
```

因此：

```text
uq_social_profile_photos_active_position
```

已经保证一个 Profile 当前最多一个 active `position=1`。

不需要再创建一个功能完全重复的 primary-photo unique index。

### 跨域

```text
media_id UUID
```

无 Media physical FK。

### 删除

软删除：

```text
deleted_at
```

历史照片继续保留。

---

# 六、`social_interests`

主体不变：

```sql
CREATE TABLE social.social_interests (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    code            VARCHAR(50) NOT NULL,
    name_zh         VARCHAR(50) NOT NULL,
    name_lo         VARCHAR(50),
    name_en         VARCHAR(50),

    category        VARCHAR(50),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_interests_code
        UNIQUE (code)
);
```

不删除历史 Interest。

废弃使用：

```text
is_active = false
```

---

# 七、`social_profile_interests`

```sql
CREATE TABLE social.social_profile_interests (
    profile_id      BIGINT NOT NULL,
    interest_id     BIGINT NOT NULL,

    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (profile_id, interest_id),

    CONSTRAINT fk_social_profile_interests_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT fk_social_profile_interests_interest
        FOREIGN KEY (interest_id)
        REFERENCES social.social_interests(id)
);
```

全部为 Social 内部关系，因此真实 FK 合法。

删除兴趣关系直接 DELETE。

---

# 八、`social_profile_languages` 修正版定稿

这里按全域审计结果修改：

> 一个 Social Profile 最多一个 native language。

这不是普通行级 CHECK 能解决的。

最终：

```sql
CREATE TABLE social.social_profile_languages (
    profile_id          BIGINT NOT NULL,
    language_code       VARCHAR(10) NOT NULL,

    proficiency_level   VARCHAR(20),

    is_native           BOOLEAN NOT NULL DEFAULT FALSE,
    is_learning         BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order          SMALLINT NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (profile_id, language_code),

    CONSTRAINT fk_social_profile_languages_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_profile_languages_level
        CHECK (
            (
                is_native = TRUE
                AND proficiency_level IS NULL
            )
            OR
            (
                is_native = FALSE
                AND proficiency_level IN (
                    'beginner',
                    'elementary',
                    'intermediate',
                    'advanced',
                    'fluent'
                )
            )
        ),

    CONSTRAINT ck_social_profile_languages_native_learning
        CHECK (
            NOT (
                is_native = TRUE
                AND is_learning = TRUE
            )
        )
);
```

关键修正：

```sql
CREATE UNIQUE INDEX uq_social_profile_languages_one_native
ON social.social_profile_languages(profile_id)
WHERE is_native = TRUE;
```

因此：

```text
每个 profile：
0 或 1 个 native language
```

不能通过 CHECK 实现，必须使用 partial UNIQUE。

---

# 九、`social_prompt_templates`

主体不变：

```sql
CREATE TABLE social.social_prompt_templates (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    code            VARCHAR(50) NOT NULL,

    question_zh     VARCHAR(200) NOT NULL,
    question_lo     VARCHAR(200),
    question_en     VARCHAR(200),

    category        VARCHAR(50),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_prompt_templates_code
        UNIQUE (code)
);
```

模板废弃：

```text
is_active = false
```

不物理删除。

---

# 十、`social_profile_prompts` 修正版

增加稳定 UUID：

```sql
CREATE TABLE social.social_profile_prompts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid(),

    profile_id          BIGINT NOT NULL,
    prompt_template_id  BIGINT NOT NULL,

    answer              VARCHAR(500) NOT NULL,
    position            SMALLINT NOT NULL,

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_social_profile_prompts_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_social_profile_prompts_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT fk_social_profile_prompts_template
        FOREIGN KEY (prompt_template_id)
        REFERENCES social.social_prompt_templates(id),

    CONSTRAINT ck_social_profile_prompts_position
        CHECK (position BETWEEN 1 AND 3),

    CONSTRAINT ck_social_profile_prompts_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

Active template：

```sql
CREATE UNIQUE INDEX uq_social_profile_prompts_active_template
ON social.social_profile_prompts(profile_id, prompt_template_id)
WHERE deleted_at IS NULL;
```

Active position：

```sql
CREATE UNIQUE INDEX uq_social_profile_prompts_active_position
ON social.social_profile_prompts(profile_id, position)
WHERE deleted_at IS NULL;
```

删除使用 `deleted_at`。

Trust 等其他 Domain 使用：

```text
public_id
```

而不是 `id`。

---

# 十一、`social_preferences`

同行 CHECK 保留。

```sql
CREATE TABLE social.social_preferences (
    profile_id      BIGINT PRIMARY KEY,

    min_age         SMALLINT,
    max_age         SMALLINT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_social_preferences_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_preferences_min_age
        CHECK (
            min_age IS NULL
            OR min_age BETWEEN 18 AND 100
        ),

    CONSTRAINT ck_social_preferences_max_age
        CHECK (
            max_age IS NULL
            OR max_age BETWEEN 18 AND 100
        ),

    CONSTRAINT ck_social_preferences_age_range
        CHECK (
            min_age IS NULL
            OR max_age IS NULL
            OR min_age <= max_age
        )
);
```

这里：

```text
min_age <= max_age
```

完全是同一行数据，可以且应该由 PostgreSQL CHECK 保证。

---

# 十二、Preferences 三张子表

## `social_preference_genders`

```sql
CREATE TABLE social.social_preference_genders (
    profile_id      BIGINT NOT NULL,
    gender          VARCHAR(20) NOT NULL,

    PRIMARY KEY (profile_id, gender),

    CONSTRAINT fk_social_preference_genders_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_preference_genders_gender
        CHECK (
            gender IN ('male', 'female', 'other')
        )
);
```

0 行：

```text
不限性别
```

---

## `social_preference_countries`

```sql
CREATE TABLE social.social_preference_countries (
    profile_id      BIGINT NOT NULL,
    country_code    CHAR(2) NOT NULL,

    PRIMARY KEY (profile_id, country_code),

    CONSTRAINT fk_social_preference_countries_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id)
);
```

0 行：

```text
不限国家
```

---

## `social_preference_goals`

```sql
CREATE TABLE social.social_preference_goals (
    profile_id          BIGINT NOT NULL,
    relationship_goal   VARCHAR(30) NOT NULL,

    PRIMARY KEY (profile_id, relationship_goal),

    CONSTRAINT fk_social_preference_goals_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_preference_goals_goal
        CHECK (
            relationship_goal IN (
                'friendship',
                'language_exchange',
                'dating',
                'serious_relationship',
                'open_to_anything'
            )
        )
);
```

0 行：

```text
不限 relationship goal
```

---

# 十三、`social_follows`

```sql
CREATE TABLE social.social_follows (
    follower_profile_id     BIGINT NOT NULL,
    following_profile_id    BIGINT NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        follower_profile_id,
        following_profile_id
    ),

    CONSTRAINT fk_social_follows_follower
        FOREIGN KEY (follower_profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT fk_social_follows_following
        FOREIGN KEY (following_profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_follows_not_self
        CHECK (
            follower_profile_id <> following_profile_id
        )
);
```

为了反向查询“谁关注我”，增加：

```sql
CREATE INDEX idx_social_follows_following
ON social.social_follows(
    following_profile_id,
    created_at DESC
);
```

取消关注：

```text
physical DELETE
```

Follow 是当前关系事实。

---

# 十四、`social_matches` 修正版定稿

这是这次另一个关键修正。

历史 Match 必须保留，因此绝不能：

```sql
UNIQUE(profile_a_id, profile_b_id)
```

否则同一对用户结束 Match 后永远无法重新 Match。

最终：

```sql
CREATE TABLE social.social_matches (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid(),

    profile_a_id    BIGINT NOT NULL,
    profile_b_id    BIGINT NOT NULL,

    status          VARCHAR(20) NOT NULL DEFAULT 'active',

    matched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_social_matches_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_social_matches_profile_a
        FOREIGN KEY (profile_a_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT fk_social_matches_profile_b
        FOREIGN KEY (profile_b_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_matches_not_self
        CHECK (
            profile_a_id <> profile_b_id
        ),

    CONSTRAINT ck_social_matches_order
        CHECK (
            profile_a_id < profile_b_id
        ),

    CONSTRAINT ck_social_matches_status
        CHECK (
            status IN ('active', 'ended')
        ),

    CONSTRAINT ck_social_matches_status_ended_at
        CHECK (
            (
                status = 'active'
                AND ended_at IS NULL
            )
            OR
            (
                status = 'ended'
                AND ended_at IS NOT NULL
            )
        )
);
```

唯一 active Match：

```sql
CREATE UNIQUE INDEX uq_social_matches_active_pair
ON social.social_matches(profile_a_id, profile_b_id)
WHERE status = 'active';
```

因此允许：

```text
A + B
2026-01 active
→ ended

A + B
2026-05 active
→ 新 Match row
```

历史永远保留。

Chat 跨域引用：

```text
social_matches.public_id
```

不能引用：

```text
social_matches.id
```

---

# 十五、`social_blocks`

保留。

它和 Trust Enforcement 完全不同：

```text
social_blocks
= 用户主动建立的 relationship fact

trust enforcement
= 平台对用户/内容实施的处罚事实
```

最终：

```sql
CREATE TABLE social.social_blocks (
    blocker_profile_id      BIGINT NOT NULL,
    blocked_profile_id      BIGINT NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        blocker_profile_id,
        blocked_profile_id
    ),

    CONSTRAINT fk_social_blocks_blocker
        FOREIGN KEY (blocker_profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT fk_social_blocks_blocked
        FOREIGN KEY (blocked_profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_blocks_not_self
        CHECK (
            blocker_profile_id <> blocked_profile_id
        )
);
```

解除拉黑可以 DELETE。

但 Block 引起的：

```text
删除双方 Follow
结束 active Match
禁止新互动
```

属于 Domain Service transaction/invariant，不通过 CHECK 表达。

---

# 十六、`social_posts` 修正版

增加 stable UUID：

```sql
CREATE TABLE social.social_posts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid(),

    profile_id          BIGINT NOT NULL,

    content             VARCHAR(2000),

    visibility          VARCHAR(20) NOT NULL DEFAULT 'followers',

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    published_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_social_posts_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_social_posts_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_posts_visibility
        CHECK (
            visibility IN ('public', 'followers')
        ),

    CONSTRAINT ck_social_posts_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

Feed 查询索引：

```sql
CREATE INDEX idx_social_posts_profile_published
ON social.social_posts(
    profile_id,
    published_at DESC
)
WHERE deleted_at IS NULL
  AND moderation_status = 'approved'
  AND published_at IS NOT NULL;
```

删除：

```text
soft delete
```

Trust 使用：

```text
public_id
```

---

# 十七、`social_post_media`

需要同步修正 Media ID：

```sql
CREATE TABLE social.social_post_media (
    post_id         BIGINT NOT NULL,
    media_id        UUID NOT NULL,
    position        SMALLINT NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (post_id, media_id),

    CONSTRAINT fk_social_post_media_post
        FOREIGN KEY (post_id)
        REFERENCES social.social_posts(id),

    CONSTRAINT uq_social_post_media_position
        UNIQUE (post_id, position),

    CONSTRAINT ck_social_post_media_position
        CHECK (
            position BETWEEN 1 AND 9
        )
);
```

这里：

```text
media_id UUID
```

是 Media Domain logical ID。

无跨域 FK。

由于正式发布后的 Post 第一阶段不编辑，其 media relation 不需要单独软删除。

Post 自身软删除时历史 media relation 可保留。

---

# 十八、`social_post_likes`

```sql
CREATE TABLE social.social_post_likes (
    post_id         BIGINT NOT NULL,
    profile_id      BIGINT NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (post_id, profile_id),

    CONSTRAINT fk_social_post_likes_post
        FOREIGN KEY (post_id)
        REFERENCES social.social_posts(id),

    CONSTRAINT fk_social_post_likes_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id)
);
```

需要从用户维度查询点赞历史时：

```sql
CREATE INDEX idx_social_post_likes_profile
ON social.social_post_likes(
    profile_id,
    created_at DESC
);
```

取消点赞：

```text
physical DELETE
```

不使用 `deleted_at`。

---

# 十九、`social_post_comments` 修正版

增加 stable UUID：

```sql
CREATE TABLE social.social_post_comments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           UUID NOT NULL DEFAULT gen_random_uuid(),

    post_id             BIGINT NOT NULL,
    profile_id          BIGINT NOT NULL,

    parent_comment_id   BIGINT,
    reply_to_profile_id BIGINT,

    content             VARCHAR(1000) NOT NULL,

    moderation_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
    moderated_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_social_post_comments_public_id
        UNIQUE (public_id),

    CONSTRAINT fk_social_post_comments_post
        FOREIGN KEY (post_id)
        REFERENCES social.social_posts(id),

    CONSTRAINT fk_social_post_comments_profile
        FOREIGN KEY (profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT fk_social_post_comments_parent
        FOREIGN KEY (parent_comment_id)
        REFERENCES social.social_post_comments(id),

    CONSTRAINT fk_social_post_comments_reply_profile
        FOREIGN KEY (reply_to_profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_post_comments_moderation_status
        CHECK (
            moderation_status IN (
                'pending',
                'approved',
                'rejected'
            )
        )
);
```

查询：

```sql
CREATE INDEX idx_social_post_comments_post_created
ON social.social_post_comments(
    post_id,
    created_at
);
```

二级回复：

```sql
CREATE INDEX idx_social_post_comments_parent_created
ON social.social_post_comments(
    parent_comment_id,
    created_at
)
WHERE parent_comment_id IS NOT NULL;
```

这里仍然存在跨行 invariant：

```text
parent_comment_id 必须属于同一 post
parent_comment_id 必须指向一级评论
```

这两条不伪装成 CHECK。

由 Social application/domain service 保证。

删除：

```text
soft delete
```

一级评论有子回复时可保留 tombstone。

Trust 引用 comment：

```text
public_id UUID
```

---

# 二十、`social_discovery_exposures` 修正版定稿

同一个 viewer 未来必须允许再次看到同一个 candidate。

因此绝对禁止：

```sql
UNIQUE(viewer_profile_id, candidate_profile_id)
```

最终：

```sql
CREATE TABLE social.social_discovery_exposures (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    viewer_profile_id       BIGINT NOT NULL,
    candidate_profile_id    BIGINT NOT NULL,

    source                  VARCHAR(30) NOT NULL DEFAULT 'discovery',

    exposed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_social_discovery_exposures_viewer
        FOREIGN KEY (viewer_profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT fk_social_discovery_exposures_candidate
        FOREIGN KEY (candidate_profile_id)
        REFERENCES social.social_profiles(id),

    CONSTRAINT ck_social_discovery_exposures_not_self
        CHECK (
            viewer_profile_id <> candidate_profile_id
        )
);
```

索引调整为两个明确的查询方向。

### Viewer 时间线

```sql
CREATE INDEX idx_social_discovery_exposures_viewer_time
ON social.social_discovery_exposures(
    viewer_profile_id,
    exposed_at DESC
);
```

### Candidate 时间线

```sql
CREATE INDEX idx_social_discovery_exposures_candidate_time
ON social.social_discovery_exposures(
    candidate_profile_id,
    exposed_at DESC
);
```

为了高效回答：

> A 最近是否看过 B？

建议再保留：

```sql
CREATE INDEX idx_social_discovery_exposures_viewer_candidate_time
ON social.social_discovery_exposures(
    viewer_profile_id,
    candidate_profile_id,
    exposed_at DESC
);
```

这里没有任何永久唯一约束。

---

# 二十一、Exposure retention 定稿

`social_discovery_exposures` 是高增长行为事实，不需要永久驻留在线主表。

第一阶段策略定为：

```text
在线热数据：
保留最近 90 天

超过 90 天：
允许归档或删除
```

但：

> 90 天属于 retention policy，不做成数据库 CHECK，也不需要现在建设自动分区系统。

第一阶段可以由定时清理任务实现。

将来如果 recommendation/analytics 需要长期统计，应进入相应分析系统，而不是无限扩大 Social 在线事务表。

---

# 二十二、必须明确的跨表 invariant

这次特别纠正一个原则：

> PostgreSQL CHECK 只能验证当前行，不应该伪装成跨表业务规则。

例如：

```text
Profile 必须至少存在一张
approved
且 position = 1
且 deleted_at IS NULL
的照片
才能进入 Discovery
```

不能设计：

```sql
CHECK (has_approved_primary_photo(...))
```

之类跨表伪 CHECK。

正确做法是在：

```text
Social Application Service
/
Social Domain Service
```

执行 Profile 发布、激活或进入 Discovery 候选池时验证：

```text
profile_status = active

AND moderation_status = approved

AND 至少存在一张：
social_profile_photos.position = 1
AND moderation_status = approved
AND deleted_at IS NULL

AND 达到规定的资料完整条件

AND account / Trust 状态允许
```

这是 **跨聚合/跨表业务 invariant**。

---

# 二十三、删除策略最终统一

| 表 | 删除/生命周期策略 |
|---|---|
| `social_profiles` | `profile_status` 生命周期，不把 `closed` 当物理删除 |
| `social_profile_photos` | `deleted_at` 软删除 |
| `social_interests` | `is_active=false` |
| `social_profile_interests` | physical DELETE |
| `social_profile_languages` | physical DELETE |
| `social_prompt_templates` | `is_active=false` |
| `social_profile_prompts` | `deleted_at` |
| `social_preferences` | 随 Profile 生命周期 |
| preference child tables | physical DELETE |
| `social_follows` | unfollow = physical DELETE |
| `social_matches` | **永不因结束而删除；`status=ended`** |
| `social_blocks` | unblock = physical DELETE |
| `social_posts` | `deleted_at` |
| `social_post_media` | 随 Post 历史保留 |
| `social_post_likes` | unlike = physical DELETE |
| `social_post_comments` | `deleted_at` |
| `social_discovery_exposures` | retention / eventual purge |

---

# 二十四、Trust & Safety 边界最终修正

原来的：

```text
social_reports
```

完全删除。

新的唯一事实源：

```text
trust.reports
```

关系变成：

```text
Social UI / API
        ↓
提交举报
        ↓
Trust Domain
        ↓
trust.reports
```

Social 不保存复制。

而：

```text
social_blocks
```

继续完整保留。

因为：

```text
Block
= 用户自己不愿再和另一个用户互动
```

而：

```text
Trust Enforcement
= 平台决定限制、处罚、封禁某个主体
```

这两个事实不能合并。

---

# 二十五、最终 FK 规则

最终只允许两种引用方式：

### Social → Social

使用：

```text
BIGINT internal PK
+
真实 PostgreSQL FK
```

例如：

```text
social_posts.profile_id
→ social_profiles.id
```

这是 Domain 内部 referential integrity。

### Social ↔ Other Domain

使用：

```text
UUID logical/public ID
```

没有 physical FK。

例如：

```text
social_profiles.user_id UUID
→ Identity logical user ID

social_profile_photos.media_id UUID
→ Media logical asset ID

social_post_media.media_id UUID
→ Media logical asset ID
```

反方向：

```text
Trust → Social Profile
Trust → Social Photo
Trust → Social Prompt
Trust → Social Post
Trust → Social Comment
Chat → Social Match
```

全部引用对应：

```text
public_id UUID
```

---

# 二十六、Social Domain 不可违反的最终规则

1. **一个 Identity User 最多一个 Social Profile。**

2. Social 内部关系使用 BIGINT；**BIGINT 不允许作为跨域契约暴露。**

3. 可被其他 Domain 引用的重要 Social 实体必须拥有稳定、不可变的 `public_id UUID`。

4. Social 不建立任何跨 Domain physical FK。

5. `social_reports` 不存在；举报 canonical fact 唯一属于 `trust.reports`。

6. `social_blocks` 必须保留，它是用户关系事实，不是 Trust enforcement。

7. Follow 是单向当前事实：

```text
A → B
```

8. Mutual Follow 才产生 Match。

9. Match 必须保留历史。

10. 同一 pair 同一时刻最多一个 active Match，但历史上允许重复 Match。

11. Match pair 始终满足：

```text
profile_a_id < profile_b_id
```

12. active Match：

```text
ended_at IS NULL
```

ended Match：

```text
ended_at IS NOT NULL
```

13. Block 后不得继续建立 Follow、Match 或新的 Social 互动；相关关系变化由 Domain Service 原子执行。

14. Profile Photo 使用软删除，因此位置唯一约束必须只针对 active rows。

15. `position=1` 是当前主照片，不额外维护 `is_primary`。

16. Discovery Profile 必须存在一张 **未删除 + approved + position=1** 的照片；这是跨表 invariant，由 Domain Service 验证，不是 CHECK。

17. 一个 Profile 最多一个：

```text
is_native = true
```

的 language row；通过 partial UNIQUE 保证。

18. `min_age <= max_age` 是同行 invariant，必须由 PostgreSQL CHECK 保证。

19. Post 允许 text-only 或 image-only，但“正文或图片至少存在一个”属于跨表 invariant，由 Service 验证。

20. Post、Profile Photo、Profile Prompt、Comment 的完整审核历史不属于 Social，只保存 Social 运行所需的当前 moderation state。

21. Exposure 是可重复事件：

```text
A 可以在不同时间多次看到 B
```

禁止 viewer/candidate 永久 UNIQUE。

22. Exposure cooldown 是推荐策略，不是数据库唯一约束。

23. Exposure 是高增长数据，执行 retention；当前建议在线保留最近 90 天。

24. 派生统计，例如：

```text
followers_count
following_count
match_count
post_count
like_count
comment_count
```

不是当前事实表的 canonical source。

25. Chat、Trust、Commerce、Media、Operations 不得通过 Social 的内部 BIGINT ID 与 Social 建立跨域数据库耦合。

---

## 最终结论

这次修正之后，Social Domain 正式从：

```text
20 tables
```

调整为：

```text
19 tables
```

核心变化可以浓缩成：

```text
删除 social_reports
        ↓
trust.reports 成为唯一举报事实源

保留 social_blocks
        ↓
用户关系 ≠ 平台 Enforcement

Domain 内：
BIGINT + physical FK

跨 Domain：
UUID logical/public ID
+ NO physical FK

Soft-delete 表：
partial UNIQUE

Match：
active partial UNIQUE
+ 历史保留

Native language：
partial UNIQUE

Discovery 发布资格：
Domain Service invariant

Exposure：
允许重复 + retention
```

**以上可以作为 Social Domain 的修正版最终定稿，后续数据库文档和 DDL 应以这一版覆盖之前 Social Domain 中冲突的内容。** memcite
