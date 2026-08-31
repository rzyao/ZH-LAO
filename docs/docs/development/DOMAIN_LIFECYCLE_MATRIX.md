---
layout: page
sidebar: false
aside: false
outline: false
footer: false
pageClass: ai-stage-matrix-page
status: derived-development-node-matrix
last_updated: 2026-08-31
ui_contract: tree-v1-frozen
---

<script setup>
import { lanes, laneLabels, nodeHref, objectHref, objects, stagesFor, statusMeta } from './workflow/node-model.mjs'
const allObjects = objects()
const display = (object, lane) => {
  const stages = stagesFor(object, lane)
  if (!stages.length) return { status: 'na', label: '不适用' }
  const status = stages.some((item) => item.status === 'blocked') ? 'blocked' : stages.some((item) => item.status === 'active') ? 'active' : stages.some((item) => item.status === 'ready') ? 'ready' : stages.every((item) => item.status === 'done') ? 'done' : stages.some((item) => item.status === 'deferred') ? 'deferred' : 'todo'
  return { status, label: statusMeta[status][1] }
}
</script>

<table class="ai-stage-table">
  <thead><tr><th>对象</th><th v-for="lane in lanes" :key="lane">{{ laneLabels[lane] }}</th></tr></thead>
  <tbody><tr v-for="object in allObjects" :key="`${object.kind}:${object.id}`">
    <td :class="['object-cell', object.kind]"><a v-if="objectHref(object)" :href="objectHref(object)">{{ object.kind === 'feature' ? '↳ ◇ ' : '◆ ' }}{{ object.label }}</a><template v-else>{{ object.kind === 'feature' ? '↳ ◇ ' : '◆ ' }}{{ object.label }}</template></td>
    <td v-for="lane in lanes" :key="lane"><a v-if="nodeHref(object.id, lane)" :href="nodeHref(object.id, lane)" :class="['node-status', `node-${display(object, lane).status}`]">{{ statusMeta[display(object, lane).status][0] }} {{ display(object, lane).label }}</a><span v-else class="node-status node-na">— 不适用</span></td>
  </tr></tbody>
</table>

<style>
.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page .VPPage,.ai-stage-matrix-page main,.ai-stage-matrix-page .content-container{width:100%!important;max-width:none!important}.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page main{padding-left:0!important;padding-right:0!important}.ai-stage-table{display:block;width:calc(100vw - 8px);margin:8px 4px;overflow-x:auto;border-collapse:separate;border-spacing:0;font-size:12px;line-height:1.35}.ai-stage-table th,.ai-stage-table td{box-sizing:border-box;min-width:150px;width:150px;padding:8px;vertical-align:top}.ai-stage-table th:first-child,.ai-stage-table td:first-child{position:sticky;left:0;z-index:2;min-width:250px;width:250px;font-weight:700;background:var(--vp-c-bg-soft)}.ai-stage-table thead th{font-weight:700;background:var(--vp-c-bg-soft)}.object-cell a{color:inherit;text-decoration:none}.object-cell.feature{padding-left:22px;font-weight:600}.node-status{display:inline-block;padding:3px 7px;border:1px solid transparent;border-radius:7px;font-size:11px;font-weight:700;line-height:1.35;text-decoration:none!important}.node-done{color:#166534;background:#dcfce7;border-color:#86efac}.node-ready{color:#1d4ed8;background:#dbeafe;border-color:#93c5fd}.node-active{color:#6d28d9;background:#ede9fe;border-color:#c4b5fd}.node-todo{color:#4b5563;background:#f3f4f6;border-color:#d1d5db}.node-blocked{color:#b91c1c;background:#fee2e2;border-color:#fca5a5}.node-deferred{color:#92400e;background:#fef3c7;border-color:#fcd34d}.node-na{color:#6b7280;background:transparent;border-color:transparent}
</style>
