-- V2 blocker resolution: one structured Content revision history model.
-- entity_id is a Content logical/public UUID; it is intentionally polymorphic
-- and therefore has no physical FK.

CREATE TABLE content.content_revisions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    revision_public_id uuid NOT NULL UNIQUE,
    entity_type varchar(32) NOT NULL CHECK (entity_type IN (
        'content', 'course', 'lesson', 'exercise', 'question', 'translation'
    )),
    entity_id uuid NOT NULL,
    revision_number integer NOT NULL CHECK (revision_number > 0),
    status varchar(16) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'superseded')),
    snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
    created_by_operator_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    supersedes_revision_id bigint REFERENCES content.content_revisions(id) ON DELETE RESTRICT,
    UNIQUE (entity_type, entity_id, revision_number),
    CONSTRAINT content_revisions_published_time_check CHECK (
        (status = 'published' AND published_at IS NOT NULL)
        OR (status <> 'published' AND published_at IS NULL)
    )
);

CREATE UNIQUE INDEX uq_content_revisions_current_published
    ON content.content_revisions(entity_type, entity_id)
    WHERE status = 'published';
CREATE INDEX idx_content_revisions_entity
    ON content.content_revisions(entity_type, entity_id, revision_number DESC);
CREATE INDEX idx_content_revisions_status_time
    ON content.content_revisions(status, published_at DESC);
