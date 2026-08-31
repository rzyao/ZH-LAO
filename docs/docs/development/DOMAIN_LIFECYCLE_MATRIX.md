---
layout: page
sidebar: false
aside: false
outline: false
footer: false
pageClass: ai-stage-matrix-page
status: derived-global-development-navigation
last_updated: 2026-09-01
ui_contract: domain-feature-lane-v2
---

<script setup>
import { lanes, laneLabels, laneHref, matrixStatus, objectHref, objects, portfolioMeta, stagesFor, statusMeta } from './workflow/node-model.mjs'
const allObjects = objects()
const display = (object, lane) => {
  const stages = stagesFor(object, lane)
  if (!stages.length) return { status: 'na', label: '不适用' }
  const statuses = stages.map((item) => matrixStatus(item.status))
  const status = statuses.includes('blocked')
    ? 'blocked'
    : statuses.includes('active')
      ? 'active'
      : statuses.every((item) => item === 'done')
        ? 'done'
        : statuses.every((item) => ['done', 'ready'].includes(item))
          ? 'ready'
          : 'todo'
  return { status, label: statusMeta[status][1] }
}
</script>

<table class="ai-stage-table">
  <thead><tr><th>开发对象</th><th v-for="lane in lanes" :key="lane">{{ laneLabels[lane] }}</th></tr></thead>
  <tbody><tr v-for="object in allObjects" :key="`${object.kind}:${object.id}`">
    <td :class="['object-cell', object.kind]"><a v-if="objectHref(object)" :href="objectHref(object)"><span class="object-label">{{ object.label }}</span><span v-if="object.kind === 'feature' && portfolioMeta[object.portfolio_status]" class="portfolio-badge">[{{ portfolioMeta[object.portfolio_status] }}]</span></a><template v-else><span class="object-label">{{ object.label }}</span></template></td>
    <td v-for="lane in lanes" :key="lane"><a v-if="laneHref(object.id, lane)" :href="laneHref(object.id, lane)" :class="['node-status', `node-${display(object, lane).status}`]">{{ statusMeta[display(object, lane).status][0] }} {{ display(object, lane).label }}</a><span v-else class="node-status node-na">— 不适用</span></td>
  </tr></tbody>
</table>

<style>
.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page .VPPage,.ai-stage-matrix-page main,.ai-stage-matrix-page .content-container{width:100%!important;max-width:none!important}.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page main{padding-left:0!important;padding-right:0!important}.ai-stage-table{display:block;width:calc(100vw - 8px);margin:8px 4px;overflow-x:auto;border-collapse:separate;border-spacing:0;font-size:12px;line-height:1.35}.ai-stage-table th,.ai-stage-table td{box-sizing:border-box;min-width:150px;width:150px;padding:8px;vertical-align:top}.ai-stage-table th:first-child,.ai-stage-table td:first-child{position:sticky;left:0;z-index:2;min-width:290px;width:290px;background:var(--vp-c-bg-soft)}.ai-stage-table thead th{font-weight:700;background:var(--vp-c-bg-soft)}.object-cell a{color:inherit;text-decoration:none}.object-cell.domain,.object-cell.system{font-weight:800;background:var(--vp-c-bg-soft)}.object-cell.feature{padding-left:30px;font-weight:400}.object-label{display:inline}.portfolio-badge{display:inline-block;margin-left:6px;color:var(--vp-c-text-2);font-size:11px;font-weight:600}.node-status{display:inline-block;padding:3px 7px;border:1px solid transparent;border-radius:7px;font-size:11px;font-weight:700;line-height:1.35;text-decoration:none!important}.node-done{color:#166534;background:#dcfce7;border-color:#86efac}.node-ready{color:#0369a1;background:#e0f2fe;border-color:#7dd3fc}.node-active{color:#6d28d9;background:#ede9fe;border-color:#c4b5fd}.node-todo{color:#4b5563;background:#f3f4f6;border-color:#d1d5db}.node-blocked{color:#b91c1c;background:#fee2e2;border-color:#fca5a5}.node-na{color:#6b7280;background:transparent;border-color:transparent}
</style>
