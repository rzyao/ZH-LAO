import registry from './AI_STAGE_REGISTRY.json'
import inventory from './FEATURE_INVENTORY.json'
import featureIndex from './FEATURE_PAGE_INDEX.json'

export const lanes = ['design', 'backend', 'admin', 'mobile', 'integration', 'acceptance']
export const phases = ['prep', 'design', 'execute', 'verify', 'gate']
export const laneLabels = { design: '设计 AI', backend: 'Backend AI', admin: 'Admin AI', mobile: 'Mobile AI', integration: '集成 AI', acceptance: '验收 AI' }
export const statusMeta = { done: ['✅', '完成'], ready: ['▶', '就绪'], active: ['⏳', '进行中'], todo: ['○', '未启动'], blocked: ['⛔', '阻塞'], recovery: ['🟣', '恢复'], deferred: ['⏸', '延期'], na: ['—', '不适用'] }

const laneAnchors = { design: '设计', backend: 'backend', admin: 'admin', mobile: 'mobile', integration: '集成', acceptance: '验收' }
const cols = inventory.columns
const inventoryById = new Map(inventory.features.map((row) => {
  const feature = Object.fromEntries(cols.map((key, index) => [key, row[index]]))
  return [feature.id, feature]
}))
const featureById = new Map(featureIndex.features.map((feature) => [feature.id, feature]))
const parents = registry.objects.filter((object) => object.kind !== 'feature')
export const featureHref = (featureId, lane = null) => `/features/${featureId}/${lane ? `#${laneAnchors[lane]}` : ''}`

const stage = (feature, lane) => {
  const status = feature.status[lane]
  if (status === 'na') return []
  const blockedBy = feature.blocks?.[lane] ?? null
  return [[`${feature.id.toUpperCase()}-${lane.toUpperCase()}`, laneLabels[lane], status, featureHref(feature.id, lane), blockedBy]]
}

function canonicalFeature(feature) {
  const inventoryFeature = inventoryById.get(feature.id)
  if (!inventoryFeature) throw new Error(`Feature Page is absent from FEATURE_INVENTORY: ${feature.id}`)
  return {
    ...inventoryFeature,
    ...feature,
    kind: 'feature',
    label: feature.title,
    ...Object.fromEntries(lanes.map((lane) => [lane, stage(feature, lane)]))
  }
}

const features = inventory.features.map((row) => canonicalFeature(featureById.get(row[0])))
const phaseFor = (item, index) => item.phase ?? (item.status === 'done' ? 'gate' : index === 0 ? 'prep' : 'execute')
const expand = (object, lane) => (object?.[lane] ?? []).map((raw, index) => ({ id: raw[0], label: raw[1], status: raw[2], href: raw[3] ?? null, blocked_by: raw[4] ?? null, object_id: object.id, lane, node_id: `${object.id}.${lane}`, phase: phaseFor(raw, index), sequence: index + 1 }))

export const objects = () => parents.flatMap((parent) => [parent, ...features.filter((feature) => feature.parent === parent.id)])
export const stagesFor = (object, lane) => expand(object, lane)
export const objectHref = (object) => object.kind === 'feature'
  ? featureHref(object.id)
  : object.kind === 'domain'
    ? `/domains/${object.id}/`
    : null
export const nodeHref = (objectId, lane) => {
  const object = objects().find((item) => item.id === objectId)
  if (!object) return null
  if (object.kind === 'feature') return featureHref(objectId, lane)
  return stagesFor(object, lane).find((item) => item.href)?.href ?? null
}
