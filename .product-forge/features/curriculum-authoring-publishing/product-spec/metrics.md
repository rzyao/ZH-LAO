# Metrics & Success Criteria：课程编排与发布

## Success definition

上线后，运营人员能把有效的已发布 Content revision 编排为课程并完成审核发布；学习者只能读到稳定的 published snapshot。

| Metric | Target | Measurement |
|---|---:|---|
| Draft leakage | 0 | Runtime contract/integration tests and production telemetry |
| Illegal direct publish | 0 | Lifecycle test and audit query |
| Atomic publish failures with partial state | 0 | Transaction integration tests |
| BIGINT in client DTO | 0 | Contract tests |

Guardrail：课程发布不能改变 Learning 历史 revision UUID，也不能造成 Content/Admin 既有功能回归。
