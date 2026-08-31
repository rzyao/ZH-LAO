import pageIndex from './FEATURE_PAGE_INDEX.json'

export const lanes = ['design', 'backend', 'admin', 'mobile', 'integration', 'acceptance']
export const laneLabels = {
  design: '设计 AI', backend: 'Backend AI', admin: 'Admin AI', mobile: 'Mobile AI', integration: '集成 AI', acceptance: '验收 AI'
}
export const laneAnchors = {
  design: '设计', backend: 'backend', admin: 'admin', mobile: 'mobile', integration: '集成', acceptance: '验收'
}
export const statusMeta = {
  done: ['✓', '完成'], active: ['▶', '进行中'], blocked: ['!', '阻塞'], todo: ['○', '未启动'], na: ['—', '不适用']
}
export const features = pageIndex.features
export const featureHref = (featureId, lane = null) =>
  `/features/${featureId}/${lane ? `#${laneAnchors[lane]}` : ''}`
