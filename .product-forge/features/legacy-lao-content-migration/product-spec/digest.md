# Product Spec — Digest

> **Feature:** legacy-lao-content-migration  
> **Phase:** product_spec

## Defined behavior

- 将实时源库中的有效音节、词语和句子作为全新的目标 draft 导入。
- 用 Unicode NFC + trim 的 Lao 文本作唯一去重键；同键取最小稳定源 ID，保留其结构和音频，其余版本完整进入隔离报告。
- 按当前 published revision 重建三层有序组成关系，并以 Rule 4404 进行文本拼接验证。
- 将 666 条当前正式音频导入 Asset / Audio 边界，绝不向 Content 表复制 URL，也不继承旧音频版本史。

## Implementation blockers deliberately retained

1. 已从目标数据库确认并配置现有 `super_admin` 作为迁移操作员；不能伪造或绕过审计字段。
2. 用户已确认 R2 映射：provider 为 `r2`，bucket 为 `zh-lao`，public-domain URL 的 pathname（去掉前导 `/`）为对象 key；迁移执行时仍必须验证对象可读取。
3. 两条失效句子关系必须在隔离报告中呈现并跳过该关系；句子父实体和其余有效关系继续导入。重复项按已批准的最小源 ID 规则合并，不阻断提交。

## Handoff

Revalidation 必须确认上述“遇到差异即阻断”的策略是否符合业务迁移窗口；获批后才可桥接为 Spec Kit 规格。
