---
layout: page
sidebar: false
aside: false
outline: false
footer: false
pageClass: ai-stage-matrix-page
status: derived-feature-matrix
---

<script setup>
import { lanes, laneLabels, featureHref, features, statusMeta } from './workflow/feature-model.mjs'
</script>

<table class="ai-stage-table">
  <thead><tr><th>功能</th><th v-for="lane in lanes" :key="lane">{{ laneLabels[lane] }}</th></tr></thead>
  <tbody><tr v-for="feature in features" :key="feature.id">
    <td class="feature-cell"><a :href="featureHref(feature.id)">{{ feature.title }}</a></td>
    <td v-for="lane in lanes" :key="lane"><a :href="featureHref(feature.id, lane)" :class="['lane-status', `lane-${feature.status[lane]}`]">{{ statusMeta[feature.status[lane]][0] }} {{ statusMeta[feature.status[lane]][1] }}</a></td>
  </tr></tbody>
</table>

<style>
.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page .VPPage,.ai-stage-matrix-page main,.ai-stage-matrix-page .content-container{width:100%!important;max-width:none!important}.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page main{padding-left:0!important;padding-right:0!important}.ai-stage-table{display:block;width:calc(100vw - 8px);margin:8px 4px;overflow-x:auto;border-collapse:separate;border-spacing:0;font-size:12px;line-height:1.35}.ai-stage-table th,.ai-stage-table td{box-sizing:border-box;min-width:150px;width:150px;padding:8px;vertical-align:top}.ai-stage-table th:first-child,.ai-stage-table td:first-child{position:sticky;left:0;z-index:2;min-width:250px;width:250px;font-weight:700;background:var(--vp-c-bg-soft)}.ai-stage-table thead th{font-weight:700;background:var(--vp-c-bg-soft)}.feature-cell a{text-decoration:none}.lane-status{display:inline-block;padding:3px 7px;border:1px solid transparent;border-radius:7px;font-size:11px;font-weight:700;line-height:1.35;text-decoration:none!important}.lane-done{color:#166534;background:#dcfce7;border-color:#86efac}.lane-active{color:#1d4ed8;background:#dbeafe;border-color:#93c5fd}.lane-todo{color:#4b5563;background:#f3f4f6;border-color:#d1d5db}.lane-blocked{color:#b91c1c;background:#fee2e2;border-color:#fca5a5}.lane-na{color:#6b7280;background:transparent;border-color:transparent}
</style>
