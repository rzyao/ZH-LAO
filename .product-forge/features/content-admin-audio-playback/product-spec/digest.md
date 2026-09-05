# 产品规格摘要

## 已定义

- 六个有资格的内容列表均新增统一“音频”列。
- 只播放 Audio 判定为 active、approved 且 fresh 的当前正式音频。
- 播放器每张列表单实例；切换、结束、刷新或离开可见数据时清理播放状态。
- 无音频、stale 与失败状态有明确、无障碍的非播放反馈。

## 不可突破的约束

- 音频实体白名单严格为 `lo_letter`、`lo_syllable`、`lo_word`、`lo_sentence`、`zh_pinyin_element`、`zh_syllable`。
- 不直接访问 `audio.*` 或 Asset storage，也不复用固定为 `NULL` 的遗留 `audioUrl`。
- 需要稳定的公开 official-audio + client-safe delivery 能力；若实现前仍缺失，停止并记录 `IMPLEMENTATION_BLOCKER`。

## 下阶段计划输入

- Admin：可复用的表格单元格播放器、两种现有列表投影、单播放器状态和测试。
- Backend：受权限保护的批量音频可用性投影，复用 Audio public boundary 与 Asset delivery。
- Database：无变更。
