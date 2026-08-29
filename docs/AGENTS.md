# Agent Collaboration Rules

## 事实源与阅读顺序

1. 阅读 `PROJECT.md`，确认项目阶段、领域成熟度和入口。
2. 阅读与任务直接相关的 `docs/product/`、`docs/architecture/` 或 `docs/domains/<domain>/`。
3. 阅读 `docs/governance/design-register.md` 与 `open-questions.md`，确认结论来源和未决项。
4. 涉及长期取舍时阅读相关 ADR；需要历史变化时查 Git。

## 会话结论认定

- 用户明确选择或确认的内容，写入当前设计基线。
- 助手提出方案后，用户以“继续”“继续下一步”等方式推进且未反对，视为已接受的当前基线。
- 明确说“待定”“以后讨论”“暂不决定”的内容标记为 `deferred`。
- 尚缺字段、约束或关系的内容标记为 `designing`，但不得因此把已确定的上层模型整体降级。
- 对话中的示例数字、示例权重和演示数据标记为 `illustrative`，不得当成正式规则。
- 后续结论覆盖早期结论时，采用后续结论，并在设计台账中把早期内容标记为 `superseded`。

## 状态体系

状态可用于文档、章节、表或单项决策：

- `baseline`：当前可执行设计基线。
- `frozen`：已经明确冻结，后续修改需进入 revision。
- `designing`：方向存在，但仍缺少实现所需决策。
- `deferred`：明确推迟到以后决定。
- `illustrative`：仅为示例。
- `superseded`：已经被后续结论取代。

一份文档可以同时包含不同状态的章节；不得用一个粗粒度状态掩盖已确认内容。

## 文档路由与完整性

| 内容 | 唯一事实源 |
| --- | --- |
| 项目状态、成熟度和入口 | `PROJECT.md` |
| 产品定位、范围、业务与商业模型 | `docs/product/` |
| 跨域边界、数据流、数据库总规范 | `docs/architecture/` |
| 单个领域的职责、流程、实体、表与字段 | `docs/domains/<domain>/` |
| 长期架构选择与取舍 | `docs/adr/` |
| 决策来源、状态、替代关系 | `docs/governance/design-register.md` |
| 明确未决或延期事项 | `docs/governance/open-questions.md` |
| 会话结论覆盖检查 | `docs/governance/source-coverage.md` |

领域文档必须尽可能完整保存：业务规则、范围与非范围、流程、子域、核心实体、表、字段、类型、可空性、默认值、PK/FK/UNIQUE/CHECK、索引意图、失败情形、反例、延期事项和来源。不得以“避免重复”为由把事实压缩成无法实施的摘要。

## 唯一事实源与引用

- 不创建 `xxx-v2.md`、`xxx-final.md`、`xxx-new.md` 等平行版本。
- 一个结论只在最合适的文档中完整定义；其他页面使用链接和短摘要。
- ADR 保存决策原因，不复制完整字段规格。
- Git 保存历史；当前文档直接更新为现行事实。

## 更新流程与完成标准

1. 读取主架构会话的新增有效回合。
2. 更新设计台账，判定 `baseline/frozen/designing/deferred/illustrative/superseded`。
3. 更新对应唯一事实源，并同步 `PROJECT.md` 的成熟度。
4. 更新未决事项；重要长期决策新增 ADR。
5. 检查相对链接、front matter、占位符、状态一致性、重复事实和来源覆盖。

文档维护会话不得自行补造主会话没有决定的字段或重大业务规则；应精确标到字段级 `designing`。
