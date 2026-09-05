# Tasks: 旧老挝语内容迁移

**Input**: [spec.md](spec.md) and [plan.md](plan.md)  
**Scope**: `database` workspace only; no frozen migration, HTTP API or UI change.

## Phase 1: Test-first foundations

- [ ] TC001 [US1] 为运行配置、源库只读保护和目标预检编写失败测试。
      Paths: database:test/legacy-lao-content-import.test.mjs
      Test-first: true
      Size: M

- [ ] TC002 [US2] 为 NFC 文本键、最小稳定源 ID canonical 选择、稳定 UUID 和重复项隔离报告编写失败测试。
      Paths: database:test/legacy-lao-content-mapping.test.mjs
      Test-first: true
      Size: M

- [ ] TC003 [US3] 为 R2 公共域名→object key 映射、错误前缀和对象预检失败编写失败测试。
      Paths: database:test/legacy-lao-content-r2.test.mjs
      Test-first: true
      Size: M

- [ ] TC004 [US1] 为空目标库导入、draft-only 创建、关系重建、缺失 sentence→word 隔离、全事务回滚和幂等重跑编写失败集成测试。
      Paths: database:test/legacy-lao-content-import.test.mjs
      Test-first: true
      Size: L

## Phase 2: Source, mapping and reports

- [ ] T005 [US2] 实现纯映射模块：源 DTO、NFC + trim 去重键、最小源 ID canonical 选择、确定性 UUID、结构文本校验和隔离记录模型。
      Paths: database:scripts/legacy-lao-content-mapping.mjs
      Size: L

- [ ] T006 [US1] 实现旧 MySQL 只读加载器，只读取有效实体及其 published-revision 组成和 processed 音频，并禁止任何源写入路径。
      Paths: database:scripts/legacy-lao-content-source.mjs
      Size: L

- [ ] T007 [US2] 实现机器可读 JSON 与人类可读 CSV/Markdown 隔离、预览和失败报告，且不输出凭据或完整私有 URL。
      Paths: database:scripts/legacy-lao-content-report.mjs, database:reports/legacy-lao-content-migration/.gitkeep
      Size: M

## Phase 3: R2 and target writer

- [ ] T008 [US3] 添加 R2 S3-compatible 客户端依赖并实现私有配置校验、公共域名映射、HeadObject 预检与元数据转换。
      Paths: database:package.json, database:pnpm-lock.yaml, database:scripts/legacy-lao-content-r2.mjs
      Size: L

- [ ] T009 [US1] 实现目标 PostgreSQL 写入器：advisory lock、确定性冲突检查、单事务 draft Content/revision/materialization/释义/翻译写入，以及字母、音节、词语、句子组成关系。
      Paths: database:scripts/import-legacy-lao-content.mjs
      Size: XL

- [ ] T010 [US3] 在写入器中实现 R2 Asset、draft revision 绑定的 pronunciation Slot、新 pending-review Audio Task/Asset Version；禁止 official pointer 和源审计历史复制。
      Paths: database:scripts/import-legacy-lao-content.mjs
      Size: L

## Phase 4: Command hardening and operational evidence

- [ ] T011 [US1] 完成 CLI 的 `--dry-run` / `--apply`、目标预检、运行配置读取、锁释放、事务回滚和无敏感输出行为。
      Paths: database:scripts/import-legacy-lao-content.mjs, database:README.md, database:.env.example
      Size: M

- [ ] T012 [US1] 运行完整数据库测试与迁移 dry-run，保存不含秘密的计数、隔离、R2 校验和预期目标变更报告。
      Paths: database:test/legacy-lao-content-import.test.mjs, database:reports/legacy-lao-content-migration/
      Size: M

- [ ] T013 [US1] 在用户明确授权后执行一次 `--apply`，比对 dry-run 结果，并立刻重跑验证零新增记录和稳定报告。
      Paths: database:scripts/import-legacy-lao-content.mjs, database:reports/legacy-lao-content-migration/
      Size: M

## Dependencies and execution order

1. TC001–TC004 必须先失败，再进入实现。
2. T005–T007 可在测试基础完成后并行；T008 可与其并行。
3. T009 依赖 T005、T006、T008；T010 依赖 T008、T009。
4. T011 依赖 T009、T010；T012 依赖全部实现任务。
5. T013 是唯一写入目标数据库的任务，必须等待 T012 通过和用户对真实 `--apply` 的单独授权。

## Coverage

| Story / requirement | Tasks |
| --- | --- |
| US1; FR-001, FR-003, FR-008, FR-009, FR-010 | TC001, TC004, T006, T009, T011, T012, T013 |
| US2; FR-002, FR-006 | TC002, T005, T007 |
| US3; FR-004, FR-005, FR-007 | TC003, T008, T009, T010 |

## Execution notes

- T013 is intentionally pending user authorization and must never be inferred from approval of this task breakdown.
- Every generated report is a run artifact, not a new product/domain authority.
- No task may modify a frozen migration or copy R2 credentials into source control.
