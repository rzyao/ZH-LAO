-- Source: docs/docs/domains/platform/database.md
-- V2 blocker resolution: Platform Feature Flag Overrides uniqueness and index correction.
-- Corrects physical baseline to match frozen docs/docs/domains/platform/database.md.
-- Enforces partial UNIQUE constraints on normalized scopes and a region lookup index.

CREATE UNIQUE INDEX uq_feature_flag_overrides_region
ON platform.feature_flag_overrides (feature_flag_id, region_id)
WHERE region_id IS NOT NULL AND client_platform IS NULL;

CREATE UNIQUE INDEX uq_feature_flag_overrides_client
ON platform.feature_flag_overrides (feature_flag_id, client_platform)
WHERE region_id IS NULL AND client_platform IS NOT NULL;

CREATE UNIQUE INDEX uq_feature_flag_overrides_region_client
ON platform.feature_flag_overrides (feature_flag_id, region_id, client_platform)
WHERE region_id IS NOT NULL AND client_platform IS NOT NULL;

CREATE INDEX idx_feature_flag_overrides_region_id
ON platform.feature_flag_overrides (region_id)
WHERE region_id IS NOT NULL;
