# 任务：中老语言内容管理

## 一、权威决策

- [x] T001——定义并批准中文音节实体、拼音有序组成和前向迁移契约（`BLOCKER-001`）。
      路径：`docs/docs/developer/reference/domains/content/knowledge.md`、`database.md`、`design-register.md`
      规模：中
- [x] T002——定义 Content 类别权限词汇和自定义角色分配规则（`BLOCKER-002`）。
      路径：`versioning-review.md`、Operations 域文档、`design-register.md`
      规模：中
- [x] T003——定义汉字到词语、词语到句子的关系语义（`BLOCKER-003`）。
      路径：Content 知识规格、`design-register.md`
      规模：小

## 二、数据库与后端

- [x] T004——新增已批准的一次性切换前向迁移和数据库检查，确保中老结构模型分离且不存在旧版运行兼容层。<!-- CR-001：不做旧版兼容 -->
      路径：`database/migrations/`、`database/checks/expected-schema.json`
      规模：大
- [x] TC005——先建立 Content 生命周期、语言边界、顺序和发布阻塞集成测试。
      路径：后端 Content 测试
      测试先行：是
      规模：中
- [x] T006——实现分离的 Content 聚合、仓储、用例以及版本和发布校验。
      路径：后端 Content 领域层、应用层和基础设施层
      规模：超大
- [x] T007——新增 Content 管理 HTTP 路由、Operations 权限校验和成功操作审计。
      路径：后端 Content HTTP、Operations 权限登记、数据库迁移
      规模：大

## 三、后台导航与页面

- [x] TC008——为全部 12 个路由增加路由、菜单和类别页面状态测试。
      路径：后台路由、导航和 Content 功能目录
      测试先行：是
      规模：中
- [x] T009——登记 12 个侧边栏路由目标、路由项和菜单迁移，并接入统一递归目录树。
      路径：后台路由登记、路由树、数据库迁移
      规模：大
- [x] T010——使用后台共享组件实现相互独立的中文和老挝语类别页面，并采用功能专属测试标识。
      路径：后台 Content 功能、数据表格和反馈组件
      规模：超大

## 四、验证

- [x] T011——执行数据库、后端、后台、无障碍和 JRN-001 至 JRN-005 测试，并核对路由、菜单及审计证据。
      路径：数据库测试、后端 Content 测试、后台端到端测试和 Content 页面
      规模：大

## 五、完整验证收敛

- [x] T012——按照 US-005、FR-003 和 FR-006，在审核发布页增加版本差异入口、结构化阻塞展示和发布确认对话框（部分完成）。
      路径：`apps/admin/src/features/content/pages/category.tsx`、后台 Content 测试
      规模：大
- [x] TC013——按照 JRN-001 至 JRN-005、EDGE-001 至 EDGE-005，补充真实浏览器操作旅程与 axe WCAG-AA 自动检查（缺失）。
      路径：`apps/admin/e2e/content-management.spec.ts`、后台测试配置
      测试先行：是
      规模：大
- [x] T014——补齐需求、旅程、任务、代码和测试的实时追溯矩阵，并把已批准产品规格的文档状态改为已批准（部分完成）。
      路径：`traceability.yml`、`product-spec/product-spec.md`、`product-spec/README.md`
      规模：中
