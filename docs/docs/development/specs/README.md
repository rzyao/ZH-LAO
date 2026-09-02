---
status: superseded
last_updated: 2026-09-02
---

# Executable Spec Registry

> ⚠️ **SUPERSEDED** — 本 Registry 随 Executable Spec System 一起被 Spec Kit 取代（见 `.specify/memory/constitution.md`）。工件保留为历史参考，不再作为 Feature Spec 事实源。

## Retirement（Stage 6 — 2026-09-02）

- **Source of Truth = NO。** 本目录所有工件（`index.json`、`domains/content.spec.json`、`executable-spec.schema.json`）已标记 `_status: superseded` / `_source_of_truth: false`，仅作历史归档。
- **Canonical authority**：`.specify/memory/constitution.md` + `docs/docs/domains/content/*`。未来真正执行 `/speckit.specify` 时，Spec Kit 的 `FR-/SC-/US-` 根据这些 canonical authority 生成；**不会**把旧 `CNT-*` ID 机械转换成 `FR-*`。
- **55 个 CNT-\* Requirement 已全部分类**（见 `docs/audit/STAGE6_LEGACY_SPEC_RETIREMENT.md`）：产品事实已覆盖于 canonical（仅作 historical ID），纯实现约束单列，1 个 `AUTHORITY_GAP`（Content 8 个精确 permission keys），0 个 `SPEC_CONFLICT` / `OBSOLETE`。
- **Checker 已下线**：`scripts/check_executable_specs.py` 已从 CI（`foundation.yml`）与 `docs/package.json` 的 `spec:check` 移除；脚本文件保留但不作为当前 Spec Gate。仓库当前 **NO_ACTIVE_SPEC_ANALYZE_CI**。
- 历史文档引用（audit 报告等）保留为 evidence，但均明确标记 `superseded`。

本目录承载 [Executable Spec System](../SPEC_SYSTEM.md) 的 machine-readable 工件。

## Scope

Executable Spec 正式支持三种 scope：

```text
domain   → domains/<id>.spec.json
feature  → features/<id>.spec.json
system   → system/<id>.spec.json
```

`index.json` 是 adoption 的唯一 registry。只有列入 `adopted_scopes` 的对象才可以宣称 Executable Spec Coverage。

## Canonical 与 Derived

```text
Authoritative Markdown / Migration / ADR / Public Contract
        ↓
canonical spec
        ↓
Execution Brief → Implementation Blueprint
        ↓
code / tests
        ↓
derived evidence
```

- `domains|features|system/*.spec.json`：authoritative canonical executable spec；
- `evidence/<scope-dir>/*.evidence.json`：derived implementation/gate evidence；必须绑定 canonical spec SHA-256；
- `changes/SC-YYYY-NNN.yaml`：已 adopted spec 的永久 change record；PR 描述不能代替；
- `executable-spec.schema.json`：scope-aware artifact field contract；
- `scripts/check_executable_specs.py`：结构、traceability 与 evidence drift checker。

Blueprint 不放在本目录伪装成 canonical spec。它是当前 repository snapshot 上的 derived implementation guidance，必须绑定 base commit + canonical spec SHA。

## 默认采用

新的正式开发 Task 默认要求 Executable Spec。只有以下显式 exemption 可以跳过：

```text
legacy_pre_spec
pure docs_only
private_refactor with no observable behavior change
recovery_no_semantic_change
```

豁免必须写入 Task Manifest 的 `executable_spec.exemption + reason`；不能使用“如采用”或沉默的 `required: false`。

既有已完成 Domain 不追溯伪造 coverage。其原 Gate/FROZEN 事实继续有效，直到发生实质 design/contract revision 或由具体 Task 正式 adopt。

## Checker

全部 adopted scopes：

```text
python scripts/check_executable_specs.py
```

单一 scope：

```text
python scripts/check_executable_specs.py --scope domain:content
python scripts/check_executable_specs.py --scope feature:login
python scripts/check_executable_specs.py --scope system:mobile-foundation
```

Domain 兼容入口：

```text
python scripts/check_executable_specs.py --domain content
```

实现 Gate evidence：

```text
python scripts/check_executable_specs.py --scope domain:content --require-evidence
```

Checker PASS 只代表它负责的结构/trace/evidence 范围通过，不等于业务 Gate PASS。
