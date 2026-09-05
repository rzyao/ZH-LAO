# Delta spec: identity — admin-operator-password-reset

## ADDED Requirements
- **FR-003** Identity owns generated temporary credentials, hash replacement, `password_change_required`, and target-session revocation.
- **FR-007** A credential marked `password_change_required` permits only completion of password change before protected admin access.
