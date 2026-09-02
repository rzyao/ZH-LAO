---
status: baseline
last_updated: 2026-09-02
---

# 当前开发方式

本页说明开发工作的职责边界，不授予任何具体任务权限。

## 四类来源各自负责什么

| 来源 | 负责内容 | 不能替代 |
| --- | --- | --- |
| [产品开发全景](index) | 产品画像、用户旅程、能力规模与面向人的状态摘要 | 需求、API、数据库设计或任务授权 |
| `.specify/` 与 `specs/` | AI 可执行的 Spec Kit 规格、约束、验收场景与追踪 | 代码已经完成的证明 |
| 代码、测试与 CI | 可运行实现、回归结果和集成证据 | 产品范围或领域所有权 |
| 参考契约/证据快照 | 迁移时保留的 API、用例、权限、审计和报告背景 | 当前调度、任务授权或最新状态 |

## 执行顺序

```text
产品开发全景 / Domain authority
        ↓
Spec Kit（.specify + specs）定义本次变更
        ↓
代码实现 → 测试 / CI → 交付证据
        ↓
回写 Feature detail 的证据摘要与当前状态
```

开始任务前必须确认当前分支、代码、schema、测试和 Spec 的一致性；发现来源冲突时停止并报告。页面存在、Spec、任务勾选或旧报告都不能单独证明实现完成。

## 完成功能后：更新文档状态

功能实现并产生真实证据后，**回写 Feature detail 的分层交付状态**（`delivery_layers` → `dev_status`）。回写必须以真实代码/测试为证据，不靠口头声明（见 [文档契约](DOCUMENT_CONTRACT) 的受控枚举与 Constitution 证据现实原则）。

### 自动检测（Stop hook）

仓库配置了 Claude Code `Stop` hook：每次会话结束自动运行
`python scripts/check_feature_evidence_sync.py`。它对比最近代码改动与功能页
`delivery_layers`，若发现有代码/测试证据但文档未反映的功能，会提示：

```text
以下功能有代码/测试改动，但 delivery_layers 尚未反映证据：
  - <feature-slug>
如确认实现/测试已落地，请运行：
    python scripts/update_feature_evidence.py --feature <slug>
```

### 证据回写

对提示的功能（或任何已完成的功能），运行：

```bash
# 检测并写入证据（含运行后端测试）
python scripts/update_feature_evidence.py --feature <slug> --run-tests

# 先看将如何更新（dry-run，不写文件）
python scripts/update_feature_evidence.py --feature <slug> --check
```

脚本行为：
- 读取真实证据：数据库 migration、后端模块/路由、Admin/Mobile 目录、集成/模块测试文件。
- 按受控枚举更新 `delivery_layers`（`evidenced` / `evidenced_limited`），
  **不会**自动写 `verified`（需人工核验）与 `not_applicable`。
- 已有更高状态的层不会被降级。
- 自动重新生成目录/域页 → `dev_status` 同步更新。

### 人工核验（verified）

`verified` 与 `Acceptance` 层的人工核验结论**只能由人工**在功能页
front matter 填写（含核验说明与证据链接），脚本不会自动写入——这是
Constitution「AI 声明不能自证 Gate PASS」的要求。

## 已退役的调度材料

旧 Gate、Task Manifest、`NEXT_ACTIONS`、Development Progress 和自建 Executable Spec 文档不再是当前授权入口。它们的内容已按迁移清单分类；需要历史背景时从 Git 历史恢复，不应复制成新的调度表。
