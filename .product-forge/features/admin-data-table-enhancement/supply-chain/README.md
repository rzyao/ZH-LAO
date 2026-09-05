# 供应链检查：管理端通用数据表增强

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| 生产依赖审计 | 通过 | `pnpm audit --prod --registry=https://registry.npmjs.org` 在 admin 与 backend 均未发现已知漏洞。 |
| SBOM（Syft） | 未执行 | 当前机器没有 `syft`；发布前生成 CycloneDX SBOM。 |
| SCA/许可证（OSV-Scanner） | 未执行 | 当前机器没有 `osv-scanner`；发布前按项目 SPDX 允许列表扫描。 |
| 构建溯源 | 未配置 | `.github/workflows/foundation.yml` 没有 `actions/attest-build-provenance` 步骤。 |

工具缺失本身不代表存在漏洞，但这些检查仍是发布前行动项。
