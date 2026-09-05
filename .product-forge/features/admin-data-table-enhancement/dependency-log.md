# Dependency Log — 管理端通用数据表增强

| Workspace | Dependency | Version | Purpose | Registry evidence (2026-09-05) | Verdict |
| --- | --- | --- | --- | --- | --- |
| `apps/admin` | `@vitest/coverage-v8` | `4.1.11` | Enable the existing `test:coverage` command with the provider matching Vitest 4.1.11. | npm package exists; first published 2023-06-06; 144,992,820 downloads in the preceding month; matching release exists. | PASS |
| `apps/backend` | `@vitest/coverage-v8` | `3.2.7` | Add a backend coverage command with the provider matching the installed Vitest 3.2.7 runtime. | npm package exists; first published 2023-06-06; 144,992,820 downloads in the preceding month; matching release exists. | PASS |

Both entries are development-only test tooling. Production lockfile audits reported no known vulnerabilities; `osv-scanner` and a repository SAST command were unavailable, so that part of the machine gate remains a documented degraded pass.
