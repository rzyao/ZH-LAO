# Requirements Quality Checklist: 002-lao-alphabet-management

**Purpose**: 针对 Lao Alphabet Management 业务规范（`spec.md`）进行需求质量与合规性审查，确保领域权威源追踪、状态机严密性、不可变版本控制及音频绑定策略无遗漏。  
**Created**: 2026-09-02  
**Feature**: [spec.md](../spec.md)  

**Review Ownership**: 需求质量评审由架构与教研负责人把关。标 `[x]` 表示该需求质量准则已通过审查，不代表代码已完成。  
**Marker Semantics**: `[x]` = 评审通过且满足标准；`[ ]` = 待进一步澄清或评估。

---

## 1. Domain Authority & Single Source of Truth

- [x] CHK001 **事实源完整引用**：所有功能需求（FR-001 ~ FR-009）均显式追溯并引用了 `alphabet.md`、`alphabet-decisions.md`、`versioning-review.md` 及 `audio-binding.md` 中的产品事实。
- [x] CHK002 **无未经授权的设计 (Zero Unauthorized Design)**：未引入任何超出领域文档与决策纪要范围的臆造需求或未经确认的外部依赖。
- [x] CHK003 **无技术实现泄漏**：需求描述完全基于业务能力与状态转移契约，未出现 DDL、SQL 字段、ORM 模型或具体前端组件细节。

---

## 2. Functional Requirements Completeness

- [x] CHK004 **Unicode 精确比对 (FR-001)**：明确要求采用二进制码点级精确匹配（`utf8mb4_bin` 语义），具备字符唯一性全局约束。
- [x] CHK005 **分类体系完备性 (FR-002, FR-003)**：完整覆盖三大核心大类（辅音、元音、符号）及正字法细分子分类（`cons_middle`/`cons_high`/`cons_low`、`vowel_short`/`vowel_long`、`symbol_*`）。
- [x] CHK006 **IPA 音标与发音门禁 (FR-004, FR-005)**：定义了 IPA 标准转写，并对符号类字符强制实施 `no_audio = true` 及音标 `-` 标记。
- [x] CHK007 **展示序与学习解耦 (FR-006)**：定义了显式组内整型 `sort_order`，确保排序可调且不破坏底层语言学数据结构。
- [x] CHK008 **音频槽位与哈希联动失效 (FR-007)**：明确 1:1 白名单槽位绑定契约，并规定文本/音标修改触发 `audio_input_hash` 重新计算及历史音频 `stale` 标记。
- [x] CHK009 **不可变修订版本生命周期 (FR-008)**：严格定义了 `Draft` $\to$ `Pending Review` $\to$ `Approved` $\to$ `Published` $\to$ `Superseded` 状态机，明确已发布内容禁止原地修改及 Active Work Guard 守卫。
- [x] CHK010 **C 端多重可见性守卫 (FR-009)**：完整定义了草稿、待审、已驳回、已下线及无有效音频条目的过滤与投影规则。

---

## 3. User Scenarios & Edge Cases

- [x] CHK011 **优先级分层合理**：明确划分为 P1 (管理员维护基础录入)、P2 (审核员审核与发布)、P3 (学习者消费查询)。
- [x] CHK012 **可独立测试性 (Independent Test)**：每个 User Story 均具备明确、立即可验证的独立验收场景（Given-When-Then）。
- [x] CHK013 **边界与异常覆盖**：充分覆盖 Unicode 冲突拦截、不可变违规防护、并发分叉守卫、音频哈希失效及乐观锁冲突等 5 大典型边界。

---

## 4. State Machine Rigor

- [x] CHK014 **初始与终态明确**：初始状态为 `Draft`，终态为 `Superseded`。
- [x] CHK015 **非法流转全面封堵**：明确禁止跳过审核直接发布、驳回直接上线、已发布版本回退逆流转等非法操作。
- [x] CHK016 **原子切换保证**：明确要求 `published_revision_id` 指针切换、状态变更与归档在单个数据库事务内原子完成。

---

## 5. Success Criteria & Metrics

- [x] CHK017 **量化度量指标 (SC-001 ~ SC-006)**：所有验收成功标准均定义为客观可度量的百分比或布尔指标（如发布可查率 100%、草稿泄露 0%、Unicode 拦截 100%、符号发音槽位严格为 0）。

---

## Notes

- 评审状态：全项通过（17/17 项通过 requirements-quality 评审）。
- 下一步：等待规划阶段指令（plan / tasks），当前 specify 阶段已全部完成。
