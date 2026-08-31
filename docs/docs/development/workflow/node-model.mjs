import registry from './AI_STAGE_REGISTRY.json'
import inventory from './FEATURE_INVENTORY.json'

export const lanes = ['design', 'backend', 'admin', 'mobile', 'integration', 'acceptance']
export const phases = ['prep', 'design', 'execute', 'verify', 'gate']
export const laneLabels = { design: '设计 AI', backend: 'Backend AI', admin: 'Admin AI', mobile: 'Mobile AI', integration: '集成 AI', acceptance: '验收 AI' }
export const statusMeta = { done: ['✅', '完成'], ready: ['▶', '就绪'], active: ['⏳', '进行中'], todo: ['○', '未启动'], blocked: ['⛔', '阻塞'], recovery: ['🟣', '恢复'], deferred: ['⏸', '延期'], na: ['—', '不适用'] }

const cols = inventory.columns
const features = inventory.features.map((row) => Object.fromEntries(cols.map((key, i) => [key, row[i]])))
const parents = registry.objects.filter((object) => object.kind !== 'feature')
const detailed = new Map(registry.objects.filter((object) => object.kind === 'feature').map((object) => [object.id, object]))
const domains = new Map(parents.filter((object) => object.kind === 'domain').map((object) => [object.id, object]))
const stage = (id, label, status, href = null, blockedBy = null) => ({ id, label, status, href, blocked_by: blockedBy })
const phaseFor = (item, index) => item.phase ?? (item.status === 'done' ? 'gate' : index === 0 ? 'prep' : 'execute')
const expand = (object, lane) => (object?.[lane] ?? []).map((raw, index) => ({ id: raw[0], label: raw[1], status: raw[2], href: raw[3] ?? null, blocked_by: raw[4] ?? null, object_id: object.id, lane, node_id: `${object.id}.${lane}`, phase: phaseFor(raw, index), sequence: index + 1 }))

function deriveFeature(feature) {
  const defined = detailed.get(feature.id)
  if (defined) return { ...feature, ...defined, label: feature.label, portfolio_status: feature.portfolio_status }
  const prefix = feature.id.toUpperCase()
  const delivered = new Set(feature.delivered_lanes ?? [])
  const surfaces = new Set(feature.surfaces ?? [])
  const deferred = feature.portfolio_status === 'deferred'
  const unresolved = feature.portfolio_status === 'unresolved'
  const state = (lane) => deferred ? 'deferred' : unresolved ? 'blocked' : delivered.has(lane) ? 'done' : 'todo'
  const blocker = unresolved ? feature.decision_blocker : null
  const object = { ...feature, kind: 'feature' }
  object.design = [stage(`${prefix}-FEATURE-DESIGN`, '功能设计', state('design'), `/features/${feature.id}/`, blocker)]
  object.backend = feature.primary_domain ? [stage(`${prefix}-BACKEND`, 'Backend 依赖', state('backend'), null, blocker)] : []
  for (const lane of ['admin', 'mobile', 'integration', 'acceptance']) object[lane] = surfaces.has(lane) ? [stage(`${prefix}-${lane.toUpperCase()}`, lane === 'acceptance' ? 'E2E 验收' : `${laneLabels[lane]} 实现`, state(lane), null, blocker)] : []
  object.next = stage(`${prefix}-NEXT`, unresolved ? '待裁决' : deferred ? '延期：当前不调度' : '待生成 Task', state('design'), null, blocker)
  return object
}

export const objects = () => parents.flatMap((parent) => [parent, ...features.filter((feature) => feature.parent === parent.id).map(deriveFeature)])
export const stagesFor = (object, lane) => expand(object, lane)
export const nodeHref = (objectId, lane) => `/development/nodes/${objectId}/${lane}`
export function nodeDetail(objectId, lane) {
  const object = objects().find((item) => item.id === objectId)
  if (!object || !lanes.includes(lane)) return null
  const stages = stagesFor(object, lane)
  if (!stages.length) return null
  const current = stages.find((item) => ['active', 'ready'].includes(item.status)) ?? stages.find((item) => !['done', 'deferred'].includes(item.status)) ?? stages.at(-1)
  const status = stages.some((item) => item.status === 'blocked') ? 'blocked' : stages.some((item) => item.status === 'active') ? 'active' : stages.some((item) => item.status === 'ready') ? 'ready' : stages.every((item) => item.status === 'done') ? 'done' : stages.some((item) => item.status === 'deferred') ? 'deferred' : 'todo'
  const completed = status === 'done' ? phases.length : phases.filter((phase) => stages.some((item) => item.phase === phase && item.status === 'done')).length
  return { object, lane, node_id: `${objectId}.${lane}`, stages, current, status, progress: `${completed}/${phases.length}`, next: current, phaseStatus: phases.map((phase) => ({ phase, stages: stages.filter((item) => item.phase === phase) })) }
}
