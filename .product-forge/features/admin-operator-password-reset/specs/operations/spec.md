# Delta spec: operations — admin-operator-password-reset

## ADDED Requirements
- **FR-001** Register and enforce `operations.operators.reset_password` and its audit action.
- **FR-002** Enforce actor/target active, non-self, and super_admin-target guards.
- **FR-004** Commit reset audit atomically with the Identity-owned reset mutation.
- **FR-005** Never persist or expose a reset temporary password outside its successful command response.
