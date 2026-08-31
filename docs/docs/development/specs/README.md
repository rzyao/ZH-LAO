# Executable Spec Registry

本目录承载 [Executable Spec System](../SPEC_SYSTEM.md) 的 machine-readable 工件。

- `index.json` 是正式采用 registry；只有列入它的 Domain 才受本层强制检查。
- `<domain>.spec.json` 是 authoritative canonical spec，格式由 `executable-spec.schema.json` 定义。
- `evidence/<domain>.evidence.json` 是 derived evidence；它必须携带 canonical spec 的 SHA-256，不能独立改变 requirement。
- `changes/`（需要时创建）保存 `SC-YYYY-NNN` change records。

请不要为旧 Domain 批量伪造 manifests 或 coverage。采用发生在该 Domain 的下一次 Design/contract revision 中，并由对应 Design Gate 记录。
