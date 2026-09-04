# Quickstart: 后台菜单与路由配置管理 (004-menu-routing-management)

**Feature Branch**: `004-menu-routing-management` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

> ⚠️ 本功能为**架构变更请求**。实施前需 ADR / D-xxx 批准(打破 Platform 6 表边界、
> Admin 信息架构冻结、Operations 权限 catalog 冻结)。

本指南提供可运行的端到端验证场景。详细数据模型见 [data-model.md](./data-model.md),
接口契约见 [contracts/http-api.md](./contracts/http-api.md) 与
[contracts/frontend-nav.md](./contracts/frontend-nav.md)。

## 前置条件

- 后端 `apps/backend` 与前端 `apps/admin` 可本地启动。
- 数据库可迁移(`database/scripts/migrate.mjs`)。
- 需一个具备 `platform.menus.write` 权限的后台操作员(super_admin 自动获得)。

## 一次性设置(实施后)

1. **新增迁移**: `database/migrations/1270_platform_menus.sql`(建表 + seed)。
2. **重新生成 manifest**: `apps/backend/scripts/generate-migration-manifest.mjs`
   → 更新 `required-migrations.generated.ts`(否则 `hasCompatibleBaseline` 失败)。
3. **权限 catalog**: 新增 `platform.menus.read` / `platform.menus.write`,同步
   `permissions.test.ts` 数量断言 26 → 28。
4. **运行迁移**: `database/scripts/migrate.mjs`(seed 随迁移写入当前导航等价配置)。

## 验证场景

### 场景 1: 迁移后导航等价预置 (FR-012 / seed)

**运行**: 启动迁移,登录后台。

**预期**: 侧边栏显示与迁移前**相同**的导航结构(总览、内容管理、运营权限、
平台控制台等分组与条目),升级无感知。`removed` 菜单不显示。

---

### 场景 2: 菜单树读取 (FR-001)

**运行**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:PORT/api/v1/admin/platform/menus
```

**预期**：返回嵌套树 `{ groups: [...] }`；`groups` 是根节点集合的历史字段名，每个节点含
`label`/`route_key`/`status`/`sort_order`/`permissions`。无 `removed` 项。

---

### 场景 3: 创建菜单项 (FR-002/FR-003)

**运行**:
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"parent_id": null, "label": "测试分组", "route_key": "platform", "permissions": ["platform.menus.read"]}' \
  http://localhost:PORT/api/v1/admin/platform/menus
```

**预期**: 201 返回新菜单项;刷新侧边栏立即出现「测试分组」;写审计新增
`platform.menus.write` 记录。

**负向**: 传 `route_key: "https://evil.example"`(白名单外)→ 400,提示仅支持已注册页面。

---

### 场景 4: 层级深度限制 (FR-003)

**运行**：连续创建至少五层目录，并在最深目录下创建带路由的页面节点。

**预期**：全部创建成功并按父子关系返回；系统不设业务深度上限。尝试将祖先移入后代时仍被拒绝且树不变。<!-- CR-004 -->

---

### 场景 5: 可见性权限 OR (FR-007 / US-002)

**运行**: 给某菜单项配置 `["operations.operators.read", "operations.roles.read"]`。

**预期**:
- 仅拥有 `operations.operators.read` 的操作员 → 可见。
- 仅拥有 `operations.roles.read` 的操作员 → 可见(OR)。
- 两者都无 → 不可见。
- 手动输入该菜单 URL → 服务端 403(可见性隐藏 ≠ 授权)。

---

### 场景 6: 停用与重新启用 (State Machine)

**运行**: PATCH `status: "disabled"` → 验证菜单隐藏;再 PATCH `status: "active"`
→ 验证恢复显示。

**预期**: `disabled` 项保留配置但不渲染;`disabled → active` 需 route_key 仍有效。

---

### 场景 7: 删除与级联 (FR-005 / State Machine)

**运行**: 删除含子项的父分组(带 `expected_updated_at`)。

**预期**: 父项与全部子项置 `removed`;审计保留;树中不再显示;数据库不物理删除。

---

### 场景 8: 并发冲突 (FR-011)

**运行**: 操作员 A 读取菜单(得到 `updated_at=T1`);操作员 B 编辑同项(updated_at→T2);
A 再提交 PATCH 带 `expected_updated_at=T1`。

**预期**: A 收到 409 `PLATFORM_CONFLICT`;前端显示冲突提示,无静默覆盖。

---

### 场景 9: 排序 (FR-006 / US-004)

**运行**:
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"order": [12, 10, 15], "expected_updated_at": "..."}' \
  http://localhost:PORT/api/v1/admin/platform/menus/0/order
```

**预期**: 该层按新顺序渲染;审计记录整层前后顺序(US-004-AS2);所有有权限操作员
下次刷新看到新顺序。

---

### 场景 10: 加载失败回退 + 最小导航 (FR-009 / FR-012)

**运行**: 停掉后端服务,刷新前台页面。

**预期**: 侧边栏回退到内置 `NAV_GROUPS`/`SECONDARY_NAV`(安全默认),**不白屏**。
恢复后端后刷新,恢复配置驱动导航。

**运行**: 清空全部菜单配置,刷新。

**预期**: 渲染最小导航(总览 + 退出 + 菜单管理入口),操作员不被锁死,可进入
菜单管理页重建。

---

### 场景 11: 白名单来源一致 (FR-008 / FR-015)

**运行**: 在菜单管理页打开「目标路由」下拉框。

**预期**: 下拉只枚举 `ADMIN_ROUTE_TARGETS`(与 `route-registry.ts` 同源);路由重命名
后菜单项 key 不变不失效。菜单管理页本身在 `/platform/menus`。

---

## 测试命令汇总

| 验证 | 命令/操作 | 预期 |
| --- | --- | --- |
| 迁移 seed | `migrate.mjs` + 登录 | 导航等价预置 |
| 列表 | `GET /platform/menus` | 嵌套树,无 removed |
| 创建 | `POST /platform/menus` | 201 + 侧边栏即时生效 |
| 白名单 | 非法 route_key | 400 |
| 深度 | 第 4 层创建 | 400 |
| 可见性 | 多权限 OR | 任一权限即见,无权隐藏 + 服务端 403 |
| 停用/启用 | PATCH status | disabled 隐藏,active 恢复 |
| 删除 | remove + 级联 | removed + 审计 |
| 并发 | 过期 expected_updated_at | 409 |
| 排序 | reorder | 新顺序 + 审计 |
| 回退 | 停后端 / 清空 | 安全默认 / 最小导航 |
| 白名单 | 下拉框 | 仅 ADMIN_ROUTE_TARGETS |

## 风险提示

- 本功能是架构变更请求,实施前需 ADR / D-xxx 批准。
- 新增迁移后必须重新生成 manifest。
- `super_admin` 自动获得菜单权限(符合预期)。
