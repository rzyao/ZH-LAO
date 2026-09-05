# 技术计划摘要

- 新增 Asset delivery public query、短时 opaque delivery URL 与受限 Object Storage read port；无 Provider 时 fail closed。
- 新增 Audio official/fresh public read，并由 Content Admin API 以批量方式投影到六类白名单列表。
- 管理端使用共享单实例播放器和状态单元格，不触及音频生产工作流。
- 无数据库变更；真实生产可播放依赖未来配置的生产 Object Storage read adapter 与 delivery signing secret。
