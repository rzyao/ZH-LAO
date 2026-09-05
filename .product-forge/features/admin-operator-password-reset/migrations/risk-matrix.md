# 迁移风险矩阵

| # | 风险 | 严重度 | 具体缓解措施 |
| --: | --- | :---: | --- |
| 1 | 迁移编号与并行开发的 migration 冲突 | 高 | 实施前重新读取 `database/migrations/`；仅以当时可用的下一编号（当前候选 `1360`）创建受仓库 runner 管理的文件。 |
| 2 | 应用代码先于 schema 发布导致查询列不存在 | 高 | 先应用并验证 migration，再部署读取/写入该列的后端；部署编排以 schema 成功为硬前置条件。 |
| 3 | 回滚丢失已标记账户的强制改密状态 | 高 | 只在下游代码已回退且确认没有 `true` 账户时执行；先执行保存结果的检查查询并取得安全负责人批准。 |
| 4 | 长事务或锁影响后台认证 | 中 | DDL 只增加常量默认值的 boolean 字段；在低峰 staging 演练，设置数据库 migration runner 的锁/语句超时并监控等待锁。 |
| 5 | 旧账户被错误标记为需改密 | 中 | `NOT NULL DEFAULT false` 初始化；执行 `validation.sql` 的计数与历史账户数对账，异常立即停止应用部署。 |
| 6 | 测试环境 schema 漂移掩盖生产问题 | 中 | 在与生产同主版本 PostgreSQL 的 staging 使用实际 migration runner 运行 forward + validation + rollback 演练。 |
