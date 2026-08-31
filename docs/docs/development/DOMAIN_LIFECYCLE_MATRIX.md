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
import inventory from './workflow/FEATURE_INVENTORY.json'

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
  deferred: ['⏸', 'deferred'],
  na: ['—', 'na']
}

const cols = inventory.columns
const inventoryFeatures = inventory.features.map((row) =>
  Object.fromEntries(cols.map((name, index) => [name, row[index]]))
)

const parents = registry.objects.filter((obj) => obj.kind !== 'feature')
const domainMap = new Map(parents.filter((obj) => obj.kind === 'domain').map((obj) => [obj.id, obj]))
const detailedFeatures = new Map(registry.objects.filter((obj) => obj.kind === 'feature').map((obj) => [obj.id, obj]))

const blockerOf = (obj, lane) => {
  const stages = obj?.[lane] ?? []
  const blocked = stages.find((stage) => stage[2] === 'blocked' && stage[4])
  return blocked?.[4] ?? (obj?.next?.[2] === 'blocked' ? obj.next[4] : null)
}

const domainDesignDone = (domainId) => {
  const domain = domainMap.get(domainId)
  const stages = domain?.design ?? []
  return stages.length > 0 && stages.every((stage) => stage[2] === 'done')
}

const domainBackendStage = (domainId, featureId, index) => {
  const domain = domainMap.get(domainId)
  const stages = domain?.backend ?? []
  const label = `${domain?.label ?? domainId} Backend`
  if (!stages.length) return [`${featureId.toUpperCase()}-BACKEND-DEP-${index}`, label, 'todo']
  if (stages.every((stage) => stage[2] === 'done')) {
    return [`${featureId.toUpperCase()}-BACKEND-DEP-${index}`, label, 'done']
  }
  if (stages.some((stage) => stage[2] === 'active')) {
    return [`${featureId.toUpperCase()}-BACKEND-DEP-${index}`, label, 'active']
  }
  const blocker = blockerOf(domain, 'backend')
  if (blocker) {
    return [`${featureId.toUpperCase()}-BACKEND-DEP-${index}`, label, 'blocked', '', blocker]
  }
  return [`${featureId.toUpperCase()}-BACKEND-DEP-${index}`, label, 'todo']
}

const makeStage = (id, label, status, blocker = null) =>
  blocker ? [id, label, status, '', blocker] : [id, label, status]

const deriveFeature = (feature) => {
  const id = feature.id.toUpperCase()
  const decision = feature.decision_blocker
  const primaryReady = feature.primary_domain ? domainDesignDone(feature.primary_domain) : true
  const primaryBlocker = feature.primary_domain ? `${feature.primary_domain.toUpperCase()}_DESIGN_GATE` : null
  const delivered = new Set(feature.delivered_lanes ?? [])
  const surfaces = new Set(feature.surfaces ?? [])
  const domainIds = [...new Set([feature.primary_domain, ...(feature.participating_domains ?? [])].filter(Boolean))]

  let design
  if (feature.portfolio_status === 'deferred') design = [makeStage(`${id}-FEATURE-DESIGN`, '功能设计', 'deferred')]
  else if (feature.portfolio_status === 'unresolved') design = [makeStage(`${id}-FEATURE-DESIGN`, '功能设计', 'blocked', decision ?? 'FEATURE_SCOPE_DECISION')]
  else if (delivered.has('design')) design = [makeStage(`${id}-FEATURE-DESIGN`, '功能设计', 'done')]
  else if (!primaryReady) design = [makeStage(`${id}-FEATURE-DESIGN`, '功能设计', 'blocked', primaryBlocker)]
  else design = [makeStage(`${id}-FEATURE-DESIGN`, '功能设计', 'todo')]

  let backend = []
  if (domainIds.length) {
    if (feature.portfolio_status === 'deferred') {
      backend = [makeStage(`${id}-BACKEND`, 'Backend 依赖', 'deferred')]
    } else if (feature.portfolio_status === 'unresolved') {
      backend = [makeStage(`${id}-BACKEND`, 'Backend 依赖', 'blocked', decision ?? 'FEATURE_SCOPE_DECISION')]
    } else {
      backend = domainIds.map((domainId, index) => domainBackendStage(domainId, feature.id, index + 1))
    }
  }

  const surfaceLane = (lane, label) => {
    if (!surfaces.has(lane)) return []
    if (feature.portfolio_status === 'deferred') return [makeStage(`${id}-${lane.toUpperCase()}`, label, 'deferred')]
    if (feature.portfolio_status === 'unresolved') return [makeStage(`${id}-${lane.toUpperCase()}`, label, 'blocked', decision ?? 'FEATURE_SCOPE_DECISION')]
    if (delivered.has(lane)) return [makeStage(`${id}-${lane.toUpperCase()}`, label, 'done')]
    return [makeStage(`${id}-${lane.toUpperCase()}`, label, 'todo')]
  }

  let integration = surfaceLane('integration', '跨层集成')
  const backendBlockers = backend.filter((stage) => stage[2] === 'blocked' && stage[4]).map((stage) => stage[4])
  if (integration.length && feature.portfolio_status === 'planned' && backendBlockers.length) {
    integration = [makeStage(`${id}-INTEGRATION`, '跨层集成', 'blocked', [...new Set(backendBlockers)].join(' + '))]
  }

  let next
  if (feature.portfolio_status === 'deferred') {
    next = makeStage(`${id}-NEXT`, '延期：当前不调度', 'deferred')
  } else if (feature.portfolio_status === 'unresolved') {
    next = makeStage(`${id}-NEXT`, '待产品 / 契约裁决', 'blocked', decision ?? 'FEATURE_SCOPE_DECISION')
  } else if (delivered.has('design') && delivered.has('acceptance')) {
    next = makeStage(`${id}-COMPLETE`, '功能已完成', 'done')
  } else if (!primaryReady) {
    next = makeStage(`${id}-NEXT`, `等 ${primaryBlocker}`, 'blocked', primaryBlocker)
  } else {
    next = makeStage(`${id}-NEXT`, '待生成 Feature Design Task', 'todo')
  }

  return {
    ...feature,
    kind: 'feature',
    design,
    backend,
    admin: surfaceLane('admin', 'Admin 实现'),
    mobile: surfaceLane('mobile', 'Mobile 实现'),
    integration,
    acceptance: surfaceLane('acceptance', 'E2E 验收'),
    next
  }
}

const effectiveFeature = (feature) => {
  const detailed = detailedFeatures.get(feature.id)
  if (!detailed) return deriveFeature(feature)
  return {
    ...feature,
    ...detailed,
    label: feature.label,
    primary_domain: feature.primary_domain,
    participating_domains: feature.participating_domains,
    portfolio_status: feature.portfolio_status
  }
}

const objects = parents.flatMap((parent) => [
  parent,
  ...inventoryFeatures.filter((feature) => feature.parent === parent.id).map(effectiveFeature)
])

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
    <tr v-for="obj in objects" :key="`${obj.kind}:${obj.id}`">
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
        <span v-else class="stage stage-na">— 不适用</span>
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
.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page .VPPage,.ai-stage-matrix-page main,.ai-stage-matrix-page .content-container{width:100%!important;max-width:none!important}
.ai-stage-matrix-page .VPContent,.ai-stage-matrix-page main{padding-left:0!important;padding-right:0!important}
.ai-stage-table{display:block;width:calc(100vw - 8px);margin:8px 4px;overflow-x:auto;border-collapse:separate;border-spacing:0;font-size:12px;line-height:1.35}
.ai-stage-table th,.ai-stage-table td{box-sizing:border-box;min-width:180px;width:180px;max-width:180px;padding:8px;vertical-align:top}
.ai-stage-table th:first-child,.ai-stage-table td:first-child{position:sticky;left:0;z-index:2;min-width:250px;width:250px;max-width:250px;font-weight:700;background:var(--vp-c-bg-soft)}
.ai-stage-table th:last-child,.ai-stage-table td:last-child{min-width:230px;width:230px;max-width:230px}
.ai-stage-table thead th{font-weight:700;background:var(--vp-c-bg-soft)}
.object-cell.feature{padding-left:22px;font-weight:600}
.stage{display:inline-block;max-width:100%;margin:1px 2px 3px 0;padding:3px 7px;border:1px solid transparent;border-radius:7px;font-size:11px;font-weight:700;line-height:1.35;white-space:normal;text-decoration:none!important}
.stage-done{color:#166534;background:#dcfce7;border-color:#86efac}.stage-ready{color:#1d4ed8;background:#dbeafe;border-color:#93c5fd}.stage-active{color:#6d28d9;background:#ede9fe;border-color:#c4b5fd}.stage-todo{color:#4b5563;background:#f3f4f6;border-color:#d1d5db}.stage-blocked{color:#b91c1c;background:#fee2e2;border-color:#fca5a5}.stage-recovery{color:#7e22ce;background:#f3e8ff;border-color:#d8b4fe}.stage-deferred{color:#92400e;background:#fef3c7;border-color:#fcd34d}.stage-na{color:#6b7280;background:transparent;border-color:transparent}
.dark .stage-done{color:#86efac;background:rgba(22,101,52,.28);border-color:#166534}.dark .stage-ready{color:#bfdbfe;background:rgba(29,78,216,.28);border-color:#2563eb}.dark .stage-active{color:#ddd6fe;background:rgba(109,40,217,.30);border-color:#7c3aed}.dark .stage-todo{color:#d1d5db;background:rgba(75,85,99,.30);border-color:#6b7280}.dark .stage-blocked{color:#fecaca;background:rgba(185,28,28,.28);border-color:#dc2626}.dark .stage-recovery{color:#e9d5ff;background:rgba(126,34,206,.30);border-color:#9333ea}.dark .stage-deferred{color:#fde68a;background:rgba(146,64,14,.30);border-color:#d97706}
</style>
