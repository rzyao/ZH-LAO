# ZH-LAO 文档系统

本目录维护当前项目的正式设计文档。

- 产品开发全景：[docs/developer/](docs/developer/)
- 人类阅读入口：[docs/index.md](docs/index.md)
- 文档协作与维护规则：[AGENTS.md](AGENTS.md)

## 本地预览 (VitePress)

```bash
# 启动本地开发服务
pnpm docs:dev

文档地址：http://127.0.0.1:15172

# 构建生产站点
pnpm docs:build

# 预览构建结果
pnpm docs:preview
```

状态采用 `baseline/frozen/designing/deferred/illustrative/superseded`；完整判定与维护规则见 [AGENTS.md](AGENTS.md)。文档维护会话不独立补造字段或重大架构决策。
