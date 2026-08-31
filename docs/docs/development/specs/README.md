# Executable Spec Registry

本目录承载 [Executable Spec System](../SPEC_SYSTEM.md) 的 machine-readable 工件。

- `index.json` 是正式采用 registry；只有列入它的 Domain 才受本层强制检查。
- `<domain>.spec.json` 是 authoritative canonical spec，格式由 `executable-spec.schema.json` 定义。
- `evidence/<domain>.evidence.json` 是 derived evidence；它必须携带 canonical spec 的 SHA-256，不能独立改变 requirement。
- `changes/`（需要时创建）保存 `SC-YYYY-NNN` change records。

代码级实施说明不放在本目录伪装成 machine-readable spec。采用 Spec 的 implementation Task 应根据 [Implementation Blueprint Template](../IMPLEMENTATION_BLUEPRINT_TEMPLATE.md) 在对应 Domain development 目录生成 `*_IMPLEMENTATION_BLUEPRINT.md`，并由 Task Manifest 引用。

Blueprint 是 derived guidance：

```text
canonical spec / frozen authority
→ Execution Brief
→ Implementation Blueprint
→ code / tests / evidence
```

它必须绑定 `base_commit` 与 canonical spec SHA（若 adopted），包含 Requirement→file/symbol/test trace、Decision Budget 和 Conflict Protocol，但不能定义新的 requirement，也不能独立宣称 Gate PASS。

请不要为旧 Domain 批量伪造 manifests、Blueprint 或 coverage。采用发生在该 Domain 的下一次 Design/contract revision 中，或由具体 Task 显式升级，并由对应 Design Gate / Task Manifest 记录。
