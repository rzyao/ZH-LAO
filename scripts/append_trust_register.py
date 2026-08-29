"""Idempotently append the Trust final-confirmation rows (D-113..D-117) to the design register.

Safe under concurrent edits: reads, checks for existing IDs, inserts before the
trailing guidance sentence, writes atomically via os.replace.
"""

import os
import sys

PATH = r"C:\project\ZH-LAO\docs\docs\governance\design-register.md"
ANCHOR = "新增主会话结论时"

ROWS = [
    ("D-113", "| D-113 | Trust 跨域 subject 引用升级为**三元组** `subject_domain + subject_type + subject_id`（`subject_domain` ∈ `identity/social/chat/commerce` + CHECK）；证据侧对应 `reference_domain + reference_type + reference_id`；`enforcement_actions` 内容级目标同步新增 `subject_domain`（∈ `social/chat/commerce`，不含 `user`，用户级统一走 `target_user_id`）；`idx_reports_subject_created` / `idx_moderation_cases_subject` 索引前缀改为三元组；T&S-04 / T&S-13 同步改写 | `frozen` | [Trust 数据库](../domains/trust/database.md)、[Trust 域](../domains/trust/index.md)、[Domain Map](../architecture/domain-map.md) | 取代 D-093 的二元组表述；`subject_type` 字典与「领域协议非表名」结论不变 |"),
    ("D-114", "| D-114 | Trust 治理参与方身份拆分：所有 moderator / reviewer / operator 字段引用 **Operations logical ID `operations.operators.id`**（`assigned_operator_id`、`added_by_operator_id`、`decided_by_operator_id`、`reviewer_operator_id`），普通用户仍用 Identity logical ID（`reporter_user_id`、`submitted_by_user_id`、`appellant_user_id`、`target_user_id`）；`moderation_evidence` 的 actor 由单字段拆为「`submitted_by_user_id`（reporter/appellant）+ `added_by_operator_id`（moderator）」并改写 `moderation_evidence_actor_check`；全部不建跨域 FK | `frozen` | [Trust 数据库](../domains/trust/database.md)「跨域逻辑 ID 清单」、[Trust 域](../domains/trust/index.md) | 取代旧字段名 `assigned_reviewer_user_id` / `added_by_user_id` / `decided_by_user_id` / `reviewer_user_id`；与 D-112「Operations 记录轨迹、Trust 保存事实」互补，`operations.operators.id` 类型口径联动 D-107 |"),
    ("D-115", "| D-115 | **`trust.reports` 冻结为全系统唯一 canonical user report fact**；Social / Chat / Commerce 只提供举报入口 API，不得持有第二套举报事实；**原 Social `social_reports` / `post_reports` / `profile_reports` 正式删除**，所有举报最终只落 `trust.reports` | `frozen` | [Trust 数据库](../domains/trust/database.md)、[Trust 域](../domains/trust/index.md)、[Social 动态](../domains/social/community-content.md)、[Domain Map](../architecture/domain-map.md) | **跨会话取代**：D-035「举报入口归 Social」中的**入口**结论保留，但其 `social_reports` 事实表被本会话显式删除（Social 侧标 `superseded`）；与 D-099 Canonical Fact 单一归属一致 |"),
    ("D-116", "| D-116 | `social_blocks ≠ enforcement_actions` 正式冻结：用户主动 Block 是 Social relationship fact，平台 Ban/Suspend/Restrict 是 Trust enforcement fact，两者永不合并、不互为实现；Trust 不拥有 Social Follow/Block/Match、Chat Conversation/Message、Commerce Wallet/Ledger/Order、Rewards 规则；`enforcement_action` 表示平台处罚事实而非远端业务表状态，访问控制由业务域自行实施 | `frozen` | [Trust 域](../domains/trust/index.md)、[Trust 数据库](../domains/trust/database.md)、[Domain Map](../architecture/domain-map.md) | 重申并冻结 D-034 |"),
    ("D-117", "| D-117 | Trust **不建专属 Outbox 表**；跨域处罚传播统一走项目级 `system_outbox_events`（事件 `enforcement.applied / expired / revoked / cancelled / failed`，按 `enforcement_action_id` 幂等）；`system_outbox_events` 属 Platform Infrastructure，不计入 Trust 6 表 | `frozen` | [Trust 数据库](../domains/trust/database.md)、[Trust 域](../domains/trust/index.md) | 与 D-096（Rewards 同结论）、D-101、ADR-018 第七节一致；细化 D-095 的「领域事件」为统一 Outbox |"),
]

# 状态口径同步：Trust 逻辑模型已随 domains/index.md / PROJECT.md 升级为 frozen；
# D-093 被 D-113 三元组取代。
STATUS_FIXES = [
    ("| D-090 |", "| `baseline` |", "| `frozen` |"),
    ("| D-091 |", "| `baseline` |", "| `frozen` |"),
    ("| D-095 |", "| `baseline` |", "| `frozen` |"),
]


def main() -> int:
    with open(PATH, "r", encoding="utf-8") as fh:
        lines = fh.read().split("\n")

    changed = []

    # 1) D-093 -> superseded（含备注改写）
    for i, line in enumerate(lines):
        if line.startswith("| D-093 |") and "`baseline`" in line:
            lines[i] = (
                line.replace("| `baseline` |", "| `superseded` |")
                .replace(
                    "| 与 T&S-03 一致 |",
                    "| 二元组表述已被 **D-113** 的三元组 `subject_domain + subject_type + subject_id` 取代；`subject_type` 字典与「领域协议非表名」结论继续有效 |",
                )
            )
            changed.append("D-093 -> superseded")
            break

    # 2) baseline -> frozen（Trust 逻辑模型已定稿冻结）
    for prefix, old, new in STATUS_FIXES:
        for i, line in enumerate(lines):
            if line.startswith(prefix) and old in line:
                lines[i] = line.replace(old, new, 1)
                changed.append(f"{prefix.strip('| ')} -> frozen")
                break

    # 3) 追加 D-113..D-117（幂等）
    existing = "\n".join(lines)
    pending = [row for did, row in ROWS if f"| {did} |" not in existing]
    if pending:
        anchor_idx = next(
            (i for i, line in enumerate(lines) if line.startswith(ANCHOR)), None
        )
        if anchor_idx is None:
            print("ERROR: anchor line not found", file=sys.stderr)
            return 1
        # 锚点前应为空行，行组插在空行之前
        insert_at = anchor_idx
        while insert_at > 0 and lines[insert_at - 1].strip() == "":
            insert_at -= 1
        lines[insert_at:insert_at] = pending
        changed.append(f"appended {len(pending)} rows")

    if not changed:
        print("no change needed (already up to date)")
        return 0

    tmp = PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as fh:
        fh.write("\n".join(lines))
    os.replace(tmp, PATH)
    print("OK: " + "; ".join(changed))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
