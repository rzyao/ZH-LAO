-- WARNING: rollback is destructive — all Lao-letter batch task and item
-- history stored in these tables will be permanently lost.
-- Take and verify a backup before applying forward.sql, and do not run this
-- rollback after production writes without explicit Content-owner approval.
-- Prefer rolling back the application while leaving this additive schema in place.

BEGIN;

DROP TABLE content.lo_letter_batch_task_items;
DROP TABLE content.lo_letter_batch_tasks;

COMMIT;
