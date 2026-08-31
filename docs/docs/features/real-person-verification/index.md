---
feature_id: real-person-verification
title: 真人认证提交
portfolio_status: pending_decision
domain:
  - trust
  - identity
  - social
status:
  design: blocked
  backend: blocked
  admin: na
  mobile: blocked
  integration: blocked
  acceptance: blocked
mobile_pages: []
admin_pages: []
blocks:
  design: TRUST_VERIFICATION_DESIGN
  backend: TRUST_VERIFICATION_DESIGN
  mobile: TRUST_VERIFICATION_DESIGN
  integration: TRUST_VERIFICATION_DESIGN
  acceptance: TRUST_VERIFICATION_DESIGN
---

# 真人认证提交

## 功能概览

Portfolio Status：`pending_decision`。

当前仓库只冻结了真人认证的**跨域责任边界**：Trust & Safety 负责审核认证材料并产生 verification result；Identity 继续拥有用户/根账户状态；Social 只能消费明确的认证结果用于资格判断。真人认证的详细 Table / State Machine / API / Media Workflow 尚未冻结。

本 Feature 不得自行把真人认证映射为 `Report → Moderation Case → Evidence → Decision → Enforcement → Appeal` 六事实链，也不得复用其中任何表来“临时实现”认证。

## 设计

状态：blocked

范围：定义用户提交真人认证材料、认证案件/材料事实、审核结果语义以及 Identity/Social 消费边界；当前只能采用已冻结的 owner boundary，不能自行决定认证策略、材料类型、状态机或保留规则。

执行阶段与产物：[Trust Contracts](/domains/trust/contracts) 只给出稳定责任边界；[Trust 数据库](/domains/trust/database) 明确真人认证 Verification 子域仍未正式重新设计。治理未决项 D-094 仍记录旧 `VerificationCase` / `VerificationMedia` 为 designing，而非 frozen canonical tables。

Gate / 完成证据：阻塞证据是当前没有 `TRUST_VERIFICATION_DESIGN` 的 PASS 设计结论；现有 Trust 六表 migration 只覆盖 moderation/appeal 治理链，不包含 Verification canonical tables。仓库的 AI Stage Registry 也没有登记同名 Verification stage，不能把一个未登记 Gate 假装为已执行。

阻塞原因：`TRUST_VERIFICATION_DESIGN` 尚未形成可执行的详细真人认证设计。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：仅完成 Trust / Identity / Social 的责任边界——Trust 审核并产出结果，Identity 保持账户事实所有权，Social 只消费显式结果。

等待条件：产品策略与 D-094 所述 Verification 数据模型、状态机、API、Media/Asset 契约形成正式 canonical 设计，并建立可追踪 Stage/Gate。

下一步：由正式真人认证设计任务裁决最小 V1 产品流程与数据/接口契约；解除阻塞后再进入 Backend/Mobile，而不是从现有 moderation 六表反推实现。

## Backend

状态：blocked

范围：未来 Backend 负责接收认证提交、维护 Verification canonical 状态、受控读取认证材料并产出结果；具体 Service/API/Repository 形态必须服从尚未冻结的 Verification 设计。

执行阶段与产物：[后端开发](/development/backend/) 没有 Trust/Verification Backend 任务目录，`apps/backend` 没有 Verification 模块；当前 `trust` schema 的 6 张表均属于举报/审核/处罚/申诉链，不构成真人认证 Backend 实现。

Gate / 完成证据：没有 Verification 表、Public API、Service、Repository、tests 或 Backend Gate；只有跨域 owner boundary 可作为后续设计输入。

阻塞原因：`TRUST_VERIFICATION_DESIGN` 未完成，Backend 没有稳定可实现契约。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：确认 Backend 不得直接改写 Identity/Social owner facts，也不得把 moderation tables 复用为 Verification tables。

等待条件：Verification canonical table/state/API/media contract 与执行 Brief 冻结，并明确结果发布/消费方式。

下一步：解除阻塞后创建 Trust Verification Backend Execution Brief，按正式设计实现 API、状态转换、材料访问、审计与测试。

## Admin

状态：na

范围：本 Feature 是“真人认证提交”，不承担运营审核工作台；认证审核属于独立的 verification review 能力，不能在提交 Feature 内顺带定义后台策略。

执行阶段与产物：本 Feature `admin_pages` 为空；当前没有需要由本页登记的 Admin 页面。

Gate / 完成证据：不适用。

下一步：无；如后续真人认证设计冻结审核工作流，应由对应审核 Feature/页面单独承接。

## Mobile

状态：blocked

范围：未来 Mobile 负责认证入口、材料采集/上传、提交反馈与认证状态展示；材料类型、拍摄/上传方式、重试、隐私提示和状态枚举目前均不能自行假定。

执行阶段与产物：[Mobile 页面清单](/mobile/pages) 没有真人认证页面，`mobile_pages` 为空；现有 Mobile 源码也没有 Verification flow。

Gate / 完成证据：没有 Mobile Design/Implementation Gate；缺失的不是页面编码，而是上游 `TRUST_VERIFICATION_DESIGN` 的产品与数据/API/Media 契约。

阻塞原因：`TRUST_VERIFICATION_DESIGN` 未冻结用户提交材料与状态展示契约。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：只确认 Mobile 不拥有认证事实，最终结果必须来自 Trust canonical contract。

等待条件：明确 V1 认证材料、上传协议、状态机、隐私/保留规则与 Backend Public API。

下一步：解除阻塞后建立 Mobile page contract，再实现采集/上传/提交/错误恢复与状态展示测试。

## 集成

状态：blocked

范围：未来集成链需要连接 Mobile submission、Trust Verification result，以及 Identity/Social 对结果的显式消费；各域保持自己的 canonical fact，不允许通过跨域表写入耦合。

执行阶段与产物：[Trust Contracts](/domains/trust/contracts) 仅冻结“Trust 产出结果、Identity 拥有账户状态、Social 消费资格”的方向性边界；没有 Verification API/event schema、共享 Outbox event type 或消费状态机。

Gate / 完成证据：没有可执行的 Verification Integration Contract，也没有跨域 tests/Gate；现有 Trust moderation shared-outbox 规则不能自动推导真人认证事件格式。

阻塞原因：`TRUST_VERIFICATION_DESIGN` 尚未定义具体 result contract 与跨域交互。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：跨域 owner boundary 已明确，且已排除 Trust 直接写 Identity/Social schema 的做法。

等待条件：Verification result schema、发布/查询方式、Identity/Social 消费语义和失败/重试策略正式冻结。

下一步：解除阻塞后建立 Integration Stage，按正式 contract 实现 producer/consumer 或同步查询，并补幂等与失败恢复测试。

## 验收

状态：blocked

范围：未来验收应覆盖用户提交、材料处理、审核结果、状态展示和 Identity/Social 消费的一致性，同时验证隐私/审计/失败路径；当前不能提前发明验收口径。

执行阶段与产物：仓库没有 Verification Acceptance Plan / Report；现有 Trust database baseline 不包含真人认证模型，因此不能作为该 Feature E2E 完成证据。

Gate / 完成证据：`TRUST_VERIFICATION_DESIGN` 未 PASS，导致可验收的状态、API、材料与跨域结果均未定义，当前不存在合法 Acceptance Gate。

阻塞原因：验收依赖尚未冻结的真人认证产品与技术契约。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：已明确验收必须尊重 Trust / Identity / Social owner boundary，且不能把 moderation 六表通过测试即视为真人认证完成。

等待条件：Design、Backend、Mobile、Integration 的正式合同和实现证据齐备。

下一步：解除阻塞后基于最终 Verification contract 建立 E2E/Acceptance 清单，再验证 happy path、拒绝/重试、材料访问、结果消费与审计。
