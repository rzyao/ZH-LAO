---
status: baseline
date: 2026-08-30
---

# ADR-004：Learning Content Registry

## 决策

中文和老挝语知识使用专用实体表，同时以 `learning.contents` 获得统一 Content 身份。课程和跨类型能力引用 Content，不使用指向多张表的万能多态 ID。

## 后果

课程层可统一并获得真实 FK；知识结构仍能按语言演进。Registry 与专用表的一致性约束仍需字段级设计。
