---
status: baseline
last_updated: 2026-09-02
---

# 文档系统迁移记录

本页是文档系统收口后的唯一人读迁移历史摘要。它记录旧人类文档入口如何被《ZH-LAO 产品开发全景》吸收或退役；当前产品画像、用户旅程、能力和交付状态以[产品开发全景](/developer/)为准，执行规格以 `.specify/` 与 `specs/` 为准，真实完成以代码、测试和 CI 为准。

## 已完成的迁移

- 旧 Feature 文档 105 项已迁入 103 个 canonical Feature Page；旧 `docs/docs/features` 已通过 Git 删除。
- 旧 development 树基线 119 项中，17 份仍有引用价值的契约/证据迁入 `developer/reference/contracts/` 与 `developer/reference/evidence/`；其余旧计划、Gate、报告和调度工件仅由 Git 保留。
- 旧产品、架构、领域、Admin、Mobile、治理和 ADR 入口已统一到 `developer/reference/`。
- guide 的产品说明、阅读路径、运行前置与 FAQ 已吸收进产品画像、用户旅程、开始参与开发和本全景 FAQ。
- audit、sources、旧导出物、PROJECT、CHANGELOG 和历史库存不再作为当前文档入口。

## 外围退役清单

最终机器清单是同目录的 `final-retirement-inventory.json`。它记录每个目标的绝对路径、文件数量、是否 tracked、处理方式和可恢复性。

| 旧区域 | 数量 | 处理 | 可恢复性 |
| --- | ---: | --- | --- |
| `docs/docs/guide` | 3 | 内容已吸收后删除 | Git 可恢复 |
| `docs/audit` | 6 | 阶段审计仅由 Git 保留后删除 | Git 可恢复 |
| `docs/sources` | 12 | transcript 仅由 Git 保留后删除 | Git 可恢复 |
| `docs/_exports` | 4 | 已核对为旧 transcript JSON/Markdown 导出，未跟踪，精确删除 | Git 不可恢复 |
| `docs/PROJECT.md` | 1 | 内容已吸收至全景、Reference 和 AI 规则后删除 | Git 可恢复 |
| `docs/CHANGELOG.md` | 1 | 过期未发布说明删除 | Git 可恢复 |
| 根 `docs-inventory.csv`、`docs-tree.txt` | 2 | 旧库存删除 | Git 可恢复 |
| 迁移一次性清单与 builder | 5 | 合并本页和最终机器清单后删除 | Git 可恢复 |

`docs/_exports` 删除前检查了四个文件：它们分别位于日期/UUID 目录，文件名仅为 `transcript.json` 或 `transcript.md`，内容为会话导出；未发现应用源码、数据库凭据、私钥或 API 密钥。它们未被 Git 跟踪，因此删除前已明确记录为不可由 Git 恢复。

## 当前保留边界

- `docs/AGENTS.md`：AI 文档规则，仅指向全景、Reference、`.specify/` 和 `specs/`。
- `docs/README.md`、`docs/package.json` 与 VitePress 配置：文档站运行说明和构建能力。
- `developer/feature-manifest.json`、`feature-catalog.json` 及持续检查脚本：功能目录的持续维护工件，不属于一次性迁移清单。
- `developer/reference/`、`developer/evidence/` 和 `developer/features/`：当前阅读、事实和证据入口。

需要复核迁移前内容时，使用 Git 查看对应提交、文件路径和日期；不要把被退役的旧入口重新作为当前调度入口。
