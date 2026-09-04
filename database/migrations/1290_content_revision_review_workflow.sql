-- D-158: expand the frozen Content Revision baseline into the approved
-- review-and-publish workflow. Do not edit 1240_content_revision.sql.
-- Existing draft/published/superseded rows remain valid without data rewrite.

ALTER TABLE content.content_revisions
    DROP CONSTRAINT content_revisions_status_check,
    ADD CONSTRAINT content_revisions_status_check
        CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'rejected', 'superseded')),
    ADD COLUMN reviewed_by_operator_id uuid,
    ADD COLUMN review_remark text,
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN lock_version integer NOT NULL DEFAULT 0
        CHECK (lock_version >= 0),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
    ADD CONSTRAINT content_revisions_rejected_remark_check
        CHECK (status <> 'rejected' OR btrim(coalesce(review_remark, '')) <> '');

UPDATE content.content_revisions
SET updated_at = created_at
WHERE updated_at <> created_at;

CREATE UNIQUE INDEX uq_content_revisions_active_work
    ON content.content_revisions (entity_type, entity_id)
    WHERE status IN ('draft', 'pending_review', 'approved', 'rejected');
