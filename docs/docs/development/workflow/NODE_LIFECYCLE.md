---
status: active
---

# Development Node 生命周期

Node 仅描述 Feature Lane 的执行过程：Stage 可以经历准备、设计、执行、验证和 Gate，但 Node 本身不创建页面、也不持有另一份人工状态。

Stage 继续通过 Task Manifest 记录 `feature_id`、`lane` 与 `stage_id`。最终状态和人工说明回写到 Feature Page 对应的六个固定模块：设计、Backend、Admin、Mobile、集成、验收；Stage 细节、证据与 Gate 链留在 Feature Page 和开发工件。
