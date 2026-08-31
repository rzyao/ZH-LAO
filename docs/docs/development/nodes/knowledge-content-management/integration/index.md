---
layout: doc
sidebar: false
outline: false
node_id: knowledge-content-management.integration
generated_from: AI_STAGE_REGISTRY + FEATURE_INVENTORY
---

<script setup>
import { nodeDetail, phases, statusMeta } from '../../../workflow/node-model.mjs'
const node = nodeDetail('knowledge-content-management', 'integration')
const phaseLabel = { prep: '准备', design: '方案', execute: '执行', verify: '验证', gate: 'Gate' }
</script>

# { node.object.label } · { node.lane } Node

<p><strong>Node</strong>：<code>{ node.node_id }</code>　<strong>当前状态</strong>：{ statusMeta[node.status][0] } { statusMeta[node.status][1] }　<strong>进度</strong>：{ node.progress }</p>

## 当前 Stage 与下一步

<p><strong>当前 Stage：</strong>{ node.current.id } · { node.current.label }</p>
<p><strong>下一步：</strong>{ node.next.id } · { node.next.label }<template v-if="node.next.blocked_by">（依赖：{ node.next.blocked_by }）</template></p>

## 生命周期

<ol><li v-for="phase in phases" :key="phase"><strong>{ phaseLabel[phase] }</strong>：<template v-if="node.phaseStatus.find((item) => item.phase === phase).stages.length">{ node.phaseStatus.find((item) => item.phase === phase).stages.map((item) => item.status).join(' / ') }</template><template v-else>尚无已调度 Stage</template></li></ol>

## Stage、工件与 Gate

<ul><li v-for="stage in node.stages" :key="stage.id"><strong>{ stage.id }</strong> · { stage.label } · { statusMeta[stage.status][1] } · phase={ stage.phase } · sequence={ stage.sequence }<template v-if="stage.href"> · <a :href="stage.href">工件 / Report / Gate</a></template><template v-if="stage.blocked_by"> · blocked_by={ stage.blocked_by }</template></li></ul>
