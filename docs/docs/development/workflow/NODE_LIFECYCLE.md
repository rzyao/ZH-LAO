---
status: active
---

# Node 生命周期

每个 Development Node 使用同一条生命周期：

```text
prep → design → execute → verify → gate → done
```

| Phase | 中文 | 目的 |
| --- | --- | --- |
| `prep` | 准备 | Grounding、输入、依赖和范围确认 |
| `design` | 方案 | 可执行规格、Blueprint、契约或流程设计 |
| `execute` | 执行 | 该 Lane 的实际交付 |
| `verify` | 验证 | 独立审计、测试或检查 |
| `gate` | Gate | 最终 PASS / FAIL 裁决 |

`done` 是 Gate PASS 后由 Stage 结果派生的 Node 状态，不是第六个可人工维护的 Phase。历史 Node 可以只记录已有 Stage；不得为满足模板补造历史 Blueprint、验证或 Gate。
