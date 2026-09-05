-- ADR-029: Content-owned current and working revision pointers for curriculum
-- aggregate roots.  The pointers are internal BIGINT foreign keys; public
-- callers continue to use course/lesson and revision UUIDs only.

ALTER TABLE content.courses
    ADD COLUMN published_revision_id bigint,
    ADD COLUMN working_revision_id bigint,
    ADD CONSTRAINT courses_published_revision_fk
        FOREIGN KEY (published_revision_id)
        REFERENCES content.content_revisions(id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT courses_working_revision_fk
        FOREIGN KEY (working_revision_id)
        REFERENCES content.content_revisions(id)
        ON DELETE RESTRICT;

ALTER TABLE content.lessons
    ADD COLUMN published_revision_id bigint,
    ADD COLUMN working_revision_id bigint,
    ADD CONSTRAINT lessons_published_revision_fk
        FOREIGN KEY (published_revision_id)
        REFERENCES content.content_revisions(id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT lessons_working_revision_fk
        FOREIGN KEY (working_revision_id)
        REFERENCES content.content_revisions(id)
        ON DELETE RESTRICT;

CREATE INDEX idx_courses_published_revision
    ON content.courses(published_revision_id)
    WHERE published_revision_id IS NOT NULL;

CREATE INDEX idx_lessons_published_revision
    ON content.lessons(published_revision_id)
    WHERE published_revision_id IS NOT NULL;
