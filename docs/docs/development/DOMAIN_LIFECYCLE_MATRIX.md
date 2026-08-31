---
layout: page
sidebar: false
aside: false
outline: false
footer: false
pageClass: ai-stage-matrix-page
status: derived-ai-stage-matrix
last_updated: 2026-08-31
---

<script setup>
import registry from './workflow/AI_STAGE_REGISTRY.json'

const lanes = [
  ['design', '设计 AI'],
  ['backend', 'Backend AI'],
  ['admin', 'Admin AI'],
  ['mobile', 'Mobile AI'],
  ['integration', '集成 AI'],
  ['acceptance', '验收 AI']
]

const statusMeta = {
  done: ['✅', 'done'],
  ready: ['▶', 'ready'],
  active: ['⏳', 'active'],
  todo: ['○', 'todo'],
  blocked: ['⛔', 'blocked'],
  recovery: ['🟣', 'recovery'],
  na: ['—', 'na']
}

const titleFor = (stage) =>
  stage.length === 5 && stage[4]
    ? `${stage[0]} · blocked_by=${stage[4]}`
    : stage[0]

const objectLabel = (obj) =>
  obj.kind === 'feature' ? `↳ ◇ ${obj.label}` : `◆ ${obj.label}`
</script>

<table class="ai-stage-table">
  <thead>
    <tr>
      <th>对象</th>
      <th v-for="[lane, label] in lanes" :key="lane">{{ label }}</th>
      <th>下一段提示词</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="obj in registry.objects" :key="`${obj.kind}:${obj.id}`">
      <td :class="['object-cell', obj.kind]">{{ objectLabel(obj) }}</td>
      <td v-for="[lane] in lanes" :key="lane">
        <template v-if="obj[lane]?.length">
          <template v-for="stage in obj[lane]" :key="stage[0]">
            <template v-if="stage[3]">
              <a :href="stage[3]" :title="titleFor(stage)" :class="['stage', `stage-${statusMeta[stage[2]][1]}`]">{{ statusMeta[stage[2]][0] }} {{ stage[1] }}</a>
            </template>
            <template v-else>
              <span :title="titleFor(stage)" :class="['stage', `stage-${statusMeta[stage[2]][1]}`]">{{ statusMeta[stage[2]][0] }} {{ stage[1] }}</span>
            </template>
            <br>
          </template>
        </template>
        <span v-else class="stage stage-na">—</span>
      </td>
      <td>
        <template v-if="obj.next[3]">
          <a :href="obj.next[3]" :title="titleFor(obj.next)" :class="['stage', `stage-${statusMeta[obj.next[2]][1]}`]">{{ statusMeta[obj.next[2]][0] }} {{ obj.next[1] }}</a>
        </template>
        <template v-else>
          <span :title="titleFor(obj.next)" :class="['stage', `stage-${statusMeta[obj.next[2]][1]}`]">{{ statusMeta[obj.next[2]][0] }} {{ obj.next[1] }}</span>
        </template>
      </td>
    </tr>
  </tbody>
</table>

<style>
.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page .VPPage,.ai-stage-matrix-page main,.ai-stage-matrix-page .content-container{width:100%!important;max-width:none!important}.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page main{padding-left:0!important;padding-right:0!important}.ai-stage-table{display:block;width:calc(100vw - 8px);margin:8px 4px;overflow-x:auto;border-collapse:separate;border-spacing:0;font-size:12px;line-height:1.35}.ai-stage-table th,.ai-stage-table td{box-sizing:border-box;min-width:180px;width:180px;max-width:180px;padding:8px;vertical-align:top}.ai-stage-table th:first-child,.ai-stage-table td:first-child{position:sticky;left:0;z-index:2;min-width:190px;width:190px;max-width:190px;font-weight:700;background:var(--vp-c-bg-soft)}.ai-stage-table th:last-child,.ai-stage-table td:last-child{min-width:220px;width:220px;max-width:220px}.ai-stage-table thead th{font-weight:700;background:var(--vp-c-bg-soft)}.object-cell.feature{padding-left:22px;font-weight:600}.stage{display:inline-block;max-width:100%;margin:1px 2px 3px 0;padding:3px 7px;border:1px solid transparent;border-radius:7px;font-size:11px;font-weight:700;line-height:1.35;white-space:normal;text-decoration:none!important}.stage-done{color:#166534;background:#dcfce7;border-color:#86efac}.stage-ready{color:#1d4ed8;background:#dbeafe;border-color:#93c5fd}.stage-active{color:#6d28d9;background:#ede9fe;border-color:#c4b5fd}.stage-todo{color:#4b5563;background:#f3f4f6;border-color:#d1d5db}.stage-blocked{color:#b91c1c;background:#fee2e2;border-color:#fca5a5}.stage-recovery{color:#7e22ce;background:#f3e8ff;border-color:#d8b4fe}.stage-na{color:#6b7280;background:transparent;border-color:transparent}.dark .stage-done{color:#86efac;background:rgba(22,101,52,.28);border-color:#166534}.dark .stage-ready{color:#bfdbfe;background:rgba(29,78,216,.28);border-color:#2563eb}.dark .stage-active{color:#ddd6fe;background:rgba(109,40,217,.30);border-color:#7c3aed}.dark .stage-todo{color:#d1d5db;background:rgba(75,85,99,.30);border-color:#6b7280}.dark .stage-blocked{color:#fecaca;background:rgba(185,28,28,.28);border-color:#dc2626}.dark .stage-recovery{color:#e9d5ff;background:rgba(126,34,206,.30);border-color:#9333ea}
</style>
