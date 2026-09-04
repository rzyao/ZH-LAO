# V2 Database Baseline Report

Generated from PostgreSQL catalog at: 2026-09-04T15:29:06.954Z

Final status: **PASS**

## Runtime and infrastructure

| Item | Value |
| --- | --- |
| Database | zh_lao |
| PostgreSQL | 18.6 |
| Role | postgres |
| Business schemas | identity, content, learning, social, chat, audio, commerce, rewards, trust, operations, platform |
| Infrastructure schemas | infrastructure |
| Business tables | 129 core+revision / 121 original target |
| Infrastructure tables | 2 |
| Extensions | pg_trgm 1.6, plpgsql 1.0 |
| Illegal cross-domain FK | 0 |

Only `pg_trgm` was added by V2. `plpgsql` is built in. The V2 baseline did not install PostGIS, citext, or pgcrypto. Physical asset and outbox infrastructure is isolated in the `infrastructure` schema.

## Migration files

| Migration | SHA-256 | Applied at |
| --- | --- | --- |
| 0000_infrastructure.sql | 5d918e0280348c62b2f9ca1a8a7d57cf15a779f2da40c2f2cb0493ce70099e5a | 2026-09-04T02:09:12.748Z |
| 0100_identity.sql | 0e6d17346ed339145b4cdc7dc0c6772262685169eca64f1b503ca2bedb183d36 | 2026-09-04T02:09:12.763Z |
| 0200_operations.sql | c35fa48ff2bf841550cac0927879b999b827c23b84a01ebf9bd55b01986fc632 | 2026-09-04T02:09:12.779Z |
| 0300_platform.sql | 42df6a8c3a78ab149f57e4bd28e6896aae1590e8349a0a9dc2e54b5fa4791183 | 2026-09-04T02:09:12.800Z |
| 0400_content.sql | c722654def7a71079d98c355d046d8d6bc3a68f304f3998573d0862540a40986 | 2026-09-04T02:09:12.832Z |
| 0500_learning.sql | 7f6007c313f684385a5dba4cf9ad134b49293468d7479cc7a415c5bfbabfb06c | 2026-09-04T02:09:12.975Z |
| 0600_audio.sql | 42ca0d357babb1acf6b4ead5a500b16c096a8b8a1b3861b67e0ee3f4dddbc453 | 2026-09-04T02:09:13.014Z |
| 0700_social.sql | b5853d01e9fecb129cf0d95f71e36d6d221dbec8a3c50d6ef0a3e8d93120b4a9 | 2026-09-04T02:09:13.102Z |
| 0800_chat.sql | 32b0ab8f5e4f1c05a229c99fd6063fbfd4947e3f2014578ae6bc0a5cefeb8126 | 2026-09-04T02:09:13.229Z |
| 0900_commerce.sql | 79c56da178e30e303955fa88837a7c735e707a04578a5cc9c56d9ea8d188282d | 2026-09-04T02:09:13.259Z |
| 1000_rewards.sql | 86f4dc243a826481a51e37e595d90923d1e570f62923e69e13c6396b78c5a792 | 2026-09-04T02:09:13.370Z |
| 1100_trust.sql | c08b1476e4ffe1736e135657dff0001ca92c57465e6236fbf645fd1f5c20964a | 2026-09-04T02:09:13.429Z |
| 1200_asset_infrastructure.sql | d30944c818f6b39aa9bb1dd8b4584869991425d1c0df6d4067c8675ba402056d | 2026-09-04T02:09:13.466Z |
| 1210_trust_evidence.sql | 5a5978b55b50c5aec09ed02542e72ecb11f6cc6f80cd44ca0a881fd865d0d930 | 2026-09-04T02:09:13.476Z |
| 1220_identity_auth_runtime.sql | 37adee07f83b4b49499c4497b0c1fa9a9f76820273917169110cfdc0fa3755e8 | 2026-09-04T02:09:13.487Z |
| 1230_system_outbox.sql | 69752dd12ec2f925c1ab86fefc3616040c13aa59828f11fbad34532bd5b331db | 2026-09-04T02:09:13.512Z |
| 1240_content_revision.sql | e2f29697c5d328b938642f9393e0e0e356aa5df6a400c839b4c306cd0a9dbd77 | 2026-09-04T02:09:13.521Z |
| 1250_platform_override_indexes.sql | 7365c2b163588aea63aa19a931b195e9c33a5115662582310207a7df28d9f7b1 | 2026-09-04T02:09:13.533Z |
| 1260_admin_credentials.sql | a61edef0fc199688303852f7c73725e11b05b82ab3371d780fd5f33d9fbac96f | 2026-09-04T02:09:13.540Z |
| 1270_platform_menus.sql | acb25a095c6a4d916d8fba71fd6c56b1d3e5fbf4caad7d78c1eb4d66ee1da35a | 2026-09-04T02:09:13.546Z |
| 1280_content_letter_permissions.sql | 136b9abcf8d0e04f9c1cbf1b7ed11af15c4a1aa44ff092f9805da41fde6c56e4 | 2026-09-04T06:00:27.319Z |
| 1290_content_revision_review_workflow.sql | 6d63133a6667c7bdd80459e5df888c77eb6a9b117e543c14cd81fac60bbf41c6 | 2026-09-04T06:18:04.607Z |
| 1300_content_language_navigation.sql | 3b512b6ce3b31e9301e6e59669bac4ebb22acb3b3a7a3e833723ad65ff1b380d | 2026-09-04T13:32:27.308Z |
| 1310_content_language_structures.sql | 3142fb45053a3d0c794286d03e4e4727632480dfda4cc2aa1fb732baeb7f0ab4 | 2026-09-04T13:54:56.255Z |
| 1320_content_language_permissions.sql | 684994303405b9a0cbb07b8ccecab24eaabed8cc45aa049ecb5c316ab4a185c3 | 2026-09-04T13:54:56.297Z |
| 1330_platform_menu_recursive_directories.sql | ce3abae555be0b7984a325ef3342a8ea0d5defd529dfcede6d6c712eec1b6a01 | 2026-09-04T15:29:05.772Z |

## Domain summary

| Schema | Tables | PK | FK | UNIQUE constraints | CHECK | Indexes |
| --- | --- | --- | --- | --- | --- | --- |
| identity | 8 | 8 | 8 | 6 | 15 | 23 |
| content | 36 | 36 | 49 | 29 | 54 | 76 |
| learning | 10 | 10 | 1 | 1 | 15 | 17 |
| social | 19 | 19 | 26 | 10 | 26 | 43 |
| chat | 7 | 7 | 9 | 6 | 14 | 15 |
| audio | 9 | 9 | 12 | 14 | 34 | 33 |
| commerce | 16 | 16 | 20 | 16 | 76 | 66 |
| rewards | 5 | 5 | 5 | 8 | 31 | 32 |
| trust | 6 | 6 | 7 | 2 | 45 | 28 |
| operations | 5 | 5 | 4 | 2 | 13 | 12 |
| platform | 8 | 8 | 5 | 5 | 32 | 20 |

### Infrastructure inventory

| Schema | Tables | PK | FK | UNIQUE constraints | CHECK | Indexes |
| --- | --- | --- | --- | --- | --- | --- |
| infrastructure | 2 | 2 | 0 | 2 | 10 | 9 |

## Baseline integrity summary

| Metric | Result |
| --- | --- |
| Tables without primary key | 0 |
| Illegal cross-domain foreign keys | 0 |
| Logical UUID violations | 0 |
| TIMESTAMP WITHOUT TIME ZONE columns | 0 |
| Unresolved specification blockers | 0 |

## Previously missing business tables

| Table | Present |
| --- | --- |
| identity.otp_challenges | YES |
| identity.sessions | YES |
| identity.devices | YES |
| trust.moderation_evidence | YES |

## Cross-domain FK audit

**PASS: 0 illegal cross-domain FK.**

## Logical UUID audit

| Contract column | Actual type | Result |
| --- | --- | --- |
| identity.users.public_id | uuid | PASS |
| identity.basic_profiles.avatar_media_id | uuid | PASS |
| content.contents.public_id | uuid | PASS |
| content.courses.public_id | uuid | PASS |
| content.lessons.public_id | uuid | PASS |
| content.lesson_sections.public_id | uuid | PASS |
| content.exercises.public_id | uuid | PASS |
| content.questions.public_id | uuid | PASS |
| learning.learning_activities.user_id | uuid | PASS |
| learning.learning_activities.course_id | uuid | PASS |
| learning.learning_activities.lesson_id | uuid | PASS |
| learning.learning_activities.content_id | uuid | PASS |
| learning.learning_activities.exercise_id | uuid | PASS |
| learning.course_progress.user_id | uuid | PASS |
| learning.course_progress.course_id | uuid | PASS |
| learning.lesson_progress.user_id | uuid | PASS |
| learning.lesson_progress.lesson_id | uuid | PASS |
| learning.content_mastery.user_id | uuid | PASS |
| learning.content_mastery.content_id | uuid | PASS |
| learning.content_reviews.user_id | uuid | PASS |
| learning.content_reviews.content_id | uuid | PASS |
| learning.content_bookmarks.user_id | uuid | PASS |
| learning.content_bookmarks.content_id | uuid | PASS |
| learning.exercise_attempts.user_id | uuid | PASS |
| learning.exercise_attempts.exercise_id | uuid | PASS |
| learning.question_attempts.question_id | uuid | PASS |
| social.social_profiles.public_id | uuid | PASS |
| social.social_profiles.user_id | uuid | PASS |
| social.social_profile_photos.public_id | uuid | PASS |
| social.social_profile_photos.media_id | uuid | PASS |
| social.social_profile_prompts.public_id | uuid | PASS |
| social.social_matches.public_id | uuid | PASS |
| social.social_posts.public_id | uuid | PASS |
| social.social_post_media.media_id | uuid | PASS |
| social.social_post_comments.public_id | uuid | PASS |
| chat.chat_conversation.public_id | uuid | PASS |
| chat.chat_message.public_id | uuid | PASS |
| chat.chat_message_image.asset_id | uuid | PASS |
| audio.audio_slots.content_entity_id | uuid | PASS |
| audio.audio_slots.required_content_revision_id | uuid | PASS |
| audio.audio_tasks.content_revision_id | uuid | PASS |
| audio.audio_tasks.assignee_operator_id | uuid | PASS |
| audio.audio_tasks.created_by_operator_id | uuid | PASS |
| audio.audio_asset_versions.content_revision_id | uuid | PASS |
| audio.audio_asset_versions.asset_id | uuid | PASS |
| audio.audio_asset_versions.producer_operator_id | uuid | PASS |
| audio.audio_reviews.reviewer_operator_id | uuid | PASS |
| operations.operators.id | uuid | PASS |
| operations.operators.auth_subject_id | uuid | PASS |
| operations.operator_audit_logs.target_id | uuid | PASS |
| rewards.reward_events.source_event_id | uuid | PASS |
| rewards.reward_events.subject_user_id | uuid | PASS |
| rewards.reward_events.source_reference_id | uuid | PASS |
| rewards.reward_grants.grant_no | uuid | PASS |
| rewards.reward_grants.user_id | uuid | PASS |
| rewards.reward_deliveries.target_reference_id | uuid | PASS |
| trust.reports.reporter_user_id | uuid | PASS |
| trust.reports.subject_id | uuid | PASS |
| trust.moderation_evidence.asset_id | uuid | PASS |
| content.content_revisions.entity_id | uuid | PASS |
| content.content_revisions.created_by_operator_id | uuid | PASS |
| infrastructure.assets.id | uuid | PASS |
| infrastructure.system_outbox_events.id | uuid | PASS |
| infrastructure.system_outbox_events.event_id | uuid | PASS |
| infrastructure.system_outbox_events.aggregate_id | uuid | PASS |

## Document / migration / PostgreSQL differences

- Content authoritative list is Curriculum 5 + Practice 5 = 31; the higher-level 6 + 4 grouping is treated as a non-blocking categorization mismatch.
- Identity `users.public_id` is UUID and `basic_profiles.avatar_media_id` is UUID without FK, applying ADR-018/D-152 over the older Identity field page.
- The original 121-table business inventory is complete; `content.content_revisions` is an additional Content-owned physical table required by the revision contract, so the final business count is 122.

## Resolved blockers

- Identity OTP, Session, and Device contracts are frozen in `1220_identity_auth_runtime.sql` with hashed secrets, lifecycle CHECKs, domain FKs, and targeted indexes.
- Trust evidence stores nullable `asset_id` for file evidence and no longer stores `storage_key`; physical file facts belong only to `infrastructure.assets`.
- Media/Asset Infrastructure is frozen as `infrastructure.assets`; business domains retain only UUID logical references.
- The shared transactional outbox is frozen as `infrastructure.system_outbox_events` with UUID event/aggregate IDs and unpublished-event scanning indexes.
- Content revisions are frozen as `content.content_revisions` with polymorphic Content logical UUIDs, monotonic revision numbers, lifecycle status, snapshots, and one published revision per entity.

Unresolved specification blockers: 0.

## Complete PostgreSQL catalog

### identity

#### identity.admin_credentials

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | bigint | false | — | — |
| username | character varying(100) | false | — | — |
| password_hash | character varying(255) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_admin_credentials_password_hash_not_blank | c | CHECK (btrim(password_hash::text) <> ''::text) |
| ck_admin_credentials_username_not_blank | c | CHECK (btrim(username::text) <> ''::text) |
| admin_credentials_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE RESTRICT |
| admin_credentials_created_at_not_null | n | NOT NULL created_at |
| admin_credentials_id_not_null | n | NOT NULL id |
| admin_credentials_password_hash_not_null | n | NOT NULL password_hash |
| admin_credentials_updated_at_not_null | n | NOT NULL updated_at |
| admin_credentials_user_id_not_null | n | NOT NULL user_id |
| admin_credentials_username_not_null | n | NOT NULL username |
| admin_credentials_pkey | p | PRIMARY KEY (id) |
| admin_credentials_user_id_key | u | UNIQUE (user_id) |
| admin_credentials_username_key | u | UNIQUE (username) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| admin_credentials_pkey | true | — | CREATE UNIQUE INDEX admin_credentials_pkey ON identity.admin_credentials USING btree (id) |
| admin_credentials_user_id_key | true | — | CREATE UNIQUE INDEX admin_credentials_user_id_key ON identity.admin_credentials USING btree (user_id) |
| admin_credentials_username_key | true | — | CREATE UNIQUE INDEX admin_credentials_username_key ON identity.admin_credentials USING btree (username) |

#### identity.auth_identities

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | bigint | false | — | — |
| provider | character varying(32) | false | — | — |
| provider_subject | character varying(255) | false | — | — |
| verified_at | timestamp with time zone | true | — | — |
| last_login_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| auth_identities_provider_check | c | CHECK (provider::text = ANY (ARRAY['phone'::character varying, 'facebook'::character varying]::text[])) |
| auth_identities_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE RESTRICT |
| auth_identities_created_at_not_null | n | NOT NULL created_at |
| auth_identities_id_not_null | n | NOT NULL id |
| auth_identities_provider_not_null | n | NOT NULL provider |
| auth_identities_provider_subject_not_null | n | NOT NULL provider_subject |
| auth_identities_updated_at_not_null | n | NOT NULL updated_at |
| auth_identities_user_id_not_null | n | NOT NULL user_id |
| auth_identities_pkey | p | PRIMARY KEY (id) |
| auth_identities_provider_provider_subject_key | u | UNIQUE (provider, provider_subject) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| auth_identities_pkey | true | — | CREATE UNIQUE INDEX auth_identities_pkey ON identity.auth_identities USING btree (id) |
| auth_identities_provider_provider_subject_key | true | — | CREATE UNIQUE INDEX auth_identities_provider_provider_subject_key ON identity.auth_identities USING btree (provider, provider_subject) |
| idx_auth_identities_user_id | false | — | CREATE INDEX idx_auth_identities_user_id ON identity.auth_identities USING btree (user_id) |

#### identity.basic_profiles

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| user_id | bigint | false | — | — |
| display_name | character varying(64) | true | — | — |
| gender | character varying(16) | true | — | — |
| birth_date | date | true | — | — |
| country_code | character(2) | true | — | — |
| region_code | character varying(32) | true | — | — |
| avatar_media_id | uuid | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| basic_profiles_gender_check | c | CHECK (gender IS NULL OR (gender::text = ANY (ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying, 'unspecified'::character varying]::text[]))) |
| basic_profiles_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE RESTRICT |
| basic_profiles_created_at_not_null | n | NOT NULL created_at |
| basic_profiles_updated_at_not_null | n | NOT NULL updated_at |
| basic_profiles_user_id_not_null | n | NOT NULL user_id |
| basic_profiles_pkey | p | PRIMARY KEY (user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| basic_profiles_pkey | true | — | CREATE UNIQUE INDEX basic_profiles_pkey ON identity.basic_profiles USING btree (user_id) |

#### identity.devices

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | bigint | false | — | — |
| installation_id | uuid | false | — | — |
| platform | character varying(16) | false | — | — |
| device_name | character varying(128) | true | — | — |
| app_version | character varying(32) | true | — | — |
| push_token | text | true | — | — |
| first_seen_at | timestamp with time zone | false | now() | — |
| last_seen_at | timestamp with time zone | true | — | — |
| revoked_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| devices_platform_check | c | CHECK (platform::text = ANY (ARRAY['android'::character varying, 'ios'::character varying]::text[])) |
| devices_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE RESTRICT |
| devices_created_at_not_null | n | NOT NULL created_at |
| devices_first_seen_at_not_null | n | NOT NULL first_seen_at |
| devices_id_not_null | n | NOT NULL id |
| devices_installation_id_not_null | n | NOT NULL installation_id |
| devices_platform_not_null | n | NOT NULL platform |
| devices_updated_at_not_null | n | NOT NULL updated_at |
| devices_user_id_not_null | n | NOT NULL user_id |
| devices_pkey | p | PRIMARY KEY (id) |
| devices_installation_id_key | u | UNIQUE (installation_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| devices_installation_id_key | true | — | CREATE UNIQUE INDEX devices_installation_id_key ON identity.devices USING btree (installation_id) |
| devices_pkey | true | — | CREATE UNIQUE INDEX devices_pkey ON identity.devices USING btree (id) |
| idx_devices_user | false | — | CREATE INDEX idx_devices_user ON identity.devices USING btree (user_id, last_seen_at DESC) |
| uq_devices_push_token | true | ((push_token IS NOT NULL) AND (revoked_at IS NULL)) | CREATE UNIQUE INDEX uq_devices_push_token ON identity.devices USING btree (push_token) WHERE ((push_token IS NOT NULL) AND (revoked_at IS NULL)) |

#### identity.learning_profiles

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| user_id | bigint | false | — | — |
| native_language | character varying(8) | false | — | — |
| learning_language | character varying(8) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| learning_profiles_language_pair_check | c | CHECK (native_language::text = 'lo'::text AND learning_language::text = 'zh'::text OR native_language::text = 'zh'::text AND learning_language::text = 'lo'::text) |
| learning_profiles_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE RESTRICT |
| learning_profiles_created_at_not_null | n | NOT NULL created_at |
| learning_profiles_learning_language_not_null | n | NOT NULL learning_language |
| learning_profiles_native_language_not_null | n | NOT NULL native_language |
| learning_profiles_user_id_not_null | n | NOT NULL user_id |
| learning_profiles_pkey | p | PRIMARY KEY (user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| learning_profiles_pkey | true | — | CREATE UNIQUE INDEX learning_profiles_pkey ON identity.learning_profiles USING btree (user_id) |

#### identity.otp_challenges

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | bigint | true | — | — |
| phone_number | character varying(32) | false | — | — |
| purpose | character varying(32) | false | — | — |
| code_hash | character varying(255) | false | — | — |
| status | character varying(16) | false | 'pending'::character varying | — |
| attempt_count | integer | false | 0 | — |
| max_attempts | smallint | false | 5 | — |
| expires_at | timestamp with time zone | false | — | — |
| verified_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| otp_challenges_attempt_count_check | c | CHECK (attempt_count >= 0) |
| otp_challenges_attempt_limit_check | c | CHECK (attempt_count <= max_attempts) |
| otp_challenges_max_attempts_check | c | CHECK (max_attempts > 0) |
| otp_challenges_purpose_check | c | CHECK (purpose::text = ANY (ARRAY['login'::character varying, 'bind_phone'::character varying, 'change_phone'::character varying]::text[])) |
| otp_challenges_status_check | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'expired'::character varying, 'cancelled'::character varying, 'locked'::character varying]::text[])) |
| otp_challenges_status_time_check | c | CHECK (status::text = 'verified'::text AND verified_at IS NOT NULL OR status::text <> 'verified'::text AND verified_at IS NULL) |
| otp_challenges_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE RESTRICT |
| otp_challenges_attempt_count_not_null | n | NOT NULL attempt_count |
| otp_challenges_code_hash_not_null | n | NOT NULL code_hash |
| otp_challenges_created_at_not_null | n | NOT NULL created_at |
| otp_challenges_expires_at_not_null | n | NOT NULL expires_at |
| otp_challenges_id_not_null | n | NOT NULL id |
| otp_challenges_max_attempts_not_null | n | NOT NULL max_attempts |
| otp_challenges_phone_number_not_null | n | NOT NULL phone_number |
| otp_challenges_purpose_not_null | n | NOT NULL purpose |
| otp_challenges_status_not_null | n | NOT NULL status |
| otp_challenges_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_otp_challenges_destination_purpose | false | — | CREATE INDEX idx_otp_challenges_destination_purpose ON identity.otp_challenges USING btree (phone_number, purpose, created_at DESC) |
| idx_otp_challenges_expiry | false | ((status)::text = 'pending'::text) | CREATE INDEX idx_otp_challenges_expiry ON identity.otp_challenges USING btree (expires_at) WHERE ((status)::text = 'pending'::text) |
| idx_otp_challenges_status_created | false | — | CREATE INDEX idx_otp_challenges_status_created ON identity.otp_challenges USING btree (status, created_at DESC) |
| otp_challenges_pkey | true | — | CREATE UNIQUE INDEX otp_challenges_pkey ON identity.otp_challenges USING btree (id) |

#### identity.sessions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | bigint | false | — | — |
| device_id | bigint | true | — | — |
| refresh_token_hash | character varying(255) | false | — | — |
| status | character varying(16) | false | 'active'::character varying | — |
| expires_at | timestamp with time zone | false | — | — |
| last_active_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| revoked_at | timestamp with time zone | true | — | — |
| revocation_reason | character varying(64) | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| sessions_status_check | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'revoked'::character varying, 'expired'::character varying]::text[])) |
| sessions_status_revocation_check | c | CHECK (status::text = 'revoked'::text AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL OR status::text <> 'revoked'::text AND revoked_at IS NULL AND revocation_reason IS NULL) |
| sessions_device_id_fkey | f | FOREIGN KEY (device_id) REFERENCES identity.devices(id) ON DELETE RESTRICT |
| sessions_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE RESTRICT |
| sessions_created_at_not_null | n | NOT NULL created_at |
| sessions_expires_at_not_null | n | NOT NULL expires_at |
| sessions_id_not_null | n | NOT NULL id |
| sessions_refresh_token_hash_not_null | n | NOT NULL refresh_token_hash |
| sessions_status_not_null | n | NOT NULL status |
| sessions_user_id_not_null | n | NOT NULL user_id |
| sessions_pkey | p | PRIMARY KEY (id) |
| sessions_refresh_token_hash_key | u | UNIQUE (refresh_token_hash) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_sessions_device | false | (device_id IS NOT NULL) | CREATE INDEX idx_sessions_device ON identity.sessions USING btree (device_id, created_at DESC) WHERE (device_id IS NOT NULL) |
| idx_sessions_expiry | false | ((status)::text = 'active'::text) | CREATE INDEX idx_sessions_expiry ON identity.sessions USING btree (expires_at) WHERE ((status)::text = 'active'::text) |
| idx_sessions_user_status | false | — | CREATE INDEX idx_sessions_user_status ON identity.sessions USING btree (user_id, status, created_at DESC) |
| sessions_pkey | true | — | CREATE UNIQUE INDEX sessions_pkey ON identity.sessions USING btree (id) |
| sessions_refresh_token_hash_key | true | — | CREATE UNIQUE INDEX sessions_refresh_token_hash_key ON identity.sessions USING btree (refresh_token_hash) |

#### identity.users

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| status | character varying(32) | false | 'active'::character varying | — |
| registered_at | timestamp with time zone | false | now() | — |
| last_active_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| users_status_check | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying, 'closed'::character varying]::text[])) |
| users_created_at_not_null | n | NOT NULL created_at |
| users_id_not_null | n | NOT NULL id |
| users_public_id_not_null | n | NOT NULL public_id |
| users_registered_at_not_null | n | NOT NULL registered_at |
| users_status_not_null | n | NOT NULL status |
| users_updated_at_not_null | n | NOT NULL updated_at |
| users_pkey | p | PRIMARY KEY (id) |
| users_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| users_pkey | true | — | CREATE UNIQUE INDEX users_pkey ON identity.users USING btree (id) |
| users_public_id_key | true | — | CREATE UNIQUE INDEX users_public_id_key ON identity.users USING btree (public_id) |

### content

#### content.answer_rules

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| question_id | bigint | false | — | — |
| rule_type | character varying(32) | false | — | — |
| expected_text | text | true | — | — |
| content_id | bigint | true | — | — |
| sort_order | integer | false | 1 | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| answer_rules_metadata_check | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| answer_rules_rule_type_check | c | CHECK (rule_type::text = ANY (ARRAY['exact_text'::character varying, 'normalized_text'::character varying, 'content'::character varying, 'sequence'::character varying, 'matching'::character varying]::text[])) |
| answer_rules_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| answer_rules_question_id_fkey | f | FOREIGN KEY (question_id) REFERENCES content.questions(id) ON DELETE RESTRICT |
| answer_rules_created_at_not_null | n | NOT NULL created_at |
| answer_rules_id_not_null | n | NOT NULL id |
| answer_rules_metadata_not_null | n | NOT NULL metadata |
| answer_rules_question_id_not_null | n | NOT NULL question_id |
| answer_rules_rule_type_not_null | n | NOT NULL rule_type |
| answer_rules_sort_order_not_null | n | NOT NULL sort_order |
| answer_rules_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| answer_rules_pkey | true | — | CREATE UNIQUE INDEX answer_rules_pkey ON content.answer_rules USING btree (id) |

#### content.content_equivalents

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| source_content_id | bigint | false | — | — |
| target_content_id | bigint | false | — | — |
| relation_type | character varying(32) | false | 'translation'::character varying | — |
| confidence | numeric(5,2) | true | — | — |
| is_primary | boolean | false | false | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| content_equivalents_check | c | CHECK (source_content_id <> target_content_id) |
| content_equivalents_confidence_check | c | CHECK (confidence IS NULL OR confidence >= 0::numeric AND confidence <= 100::numeric) |
| content_equivalents_relation_type_check | c | CHECK (relation_type::text = ANY (ARRAY['translation'::character varying, 'equivalent'::character varying, 'approximate'::character varying]::text[])) |
| content_equivalents_source_content_id_fkey | f | FOREIGN KEY (source_content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| content_equivalents_target_content_id_fkey | f | FOREIGN KEY (target_content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| content_equivalents_created_at_not_null | n | NOT NULL created_at |
| content_equivalents_id_not_null | n | NOT NULL id |
| content_equivalents_is_primary_not_null | n | NOT NULL is_primary |
| content_equivalents_relation_type_not_null | n | NOT NULL relation_type |
| content_equivalents_source_content_id_not_null | n | NOT NULL source_content_id |
| content_equivalents_target_content_id_not_null | n | NOT NULL target_content_id |
| content_equivalents_updated_at_not_null | n | NOT NULL updated_at |
| content_equivalents_pkey | p | PRIMARY KEY (id) |
| content_equivalents_source_content_id_target_content_id_rel_key | u | UNIQUE (source_content_id, target_content_id, relation_type) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| content_equivalents_pkey | true | — | CREATE UNIQUE INDEX content_equivalents_pkey ON content.content_equivalents USING btree (id) |
| content_equivalents_source_content_id_target_content_id_rel_key | true | — | CREATE UNIQUE INDEX content_equivalents_source_content_id_target_content_id_rel_key ON content.content_equivalents USING btree (source_content_id, target_content_id, relation_type) |

#### content.content_relations

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| source_content_id | bigint | false | — | — |
| target_content_id | bigint | false | — | — |
| relation_type | character varying(32) | false | — | — |
| sort_order | smallint | false | 1 | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| content_relations_check | c | CHECK (source_content_id <> target_content_id) |
| content_relations_relation_type_check | c | CHECK (relation_type::text = ANY (ARRAY['synonym'::character varying, 'antonym'::character varying, 'related'::character varying, 'derived'::character varying, 'variant'::character varying]::text[])) |
| content_relations_source_content_id_fkey | f | FOREIGN KEY (source_content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| content_relations_target_content_id_fkey | f | FOREIGN KEY (target_content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| content_relations_created_at_not_null | n | NOT NULL created_at |
| content_relations_id_not_null | n | NOT NULL id |
| content_relations_relation_type_not_null | n | NOT NULL relation_type |
| content_relations_sort_order_not_null | n | NOT NULL sort_order |
| content_relations_source_content_id_not_null | n | NOT NULL source_content_id |
| content_relations_target_content_id_not_null | n | NOT NULL target_content_id |
| content_relations_pkey | p | PRIMARY KEY (id) |
| content_relations_source_content_id_target_content_id_relat_key | u | UNIQUE (source_content_id, target_content_id, relation_type) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| content_relations_pkey | true | — | CREATE UNIQUE INDEX content_relations_pkey ON content.content_relations USING btree (id) |
| content_relations_source_content_id_target_content_id_relat_key | true | — | CREATE UNIQUE INDEX content_relations_source_content_id_target_content_id_relat_key ON content.content_relations USING btree (source_content_id, target_content_id, relation_type) |

#### content.content_revisions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| revision_public_id | uuid | false | — | — |
| entity_type | character varying(32) | false | — | — |
| entity_id | uuid | false | — | — |
| revision_number | integer | false | — | — |
| status | character varying(16) | false | 'draft'::character varying | — |
| snapshot | jsonb | false | — | — |
| created_by_operator_id | uuid | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| published_at | timestamp with time zone | true | — | — |
| supersedes_revision_id | bigint | true | — | — |
| reviewed_by_operator_id | uuid | true | — | — |
| review_remark | text | true | — | — |
| reviewed_at | timestamp with time zone | true | — | — |
| lock_version | integer | false | 0 | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| content_revisions_entity_type_check | c | CHECK (entity_type::text = ANY (ARRAY['content'::character varying, 'course'::character varying, 'lesson'::character varying, 'exercise'::character varying, 'question'::character varying, 'translation'::character varying]::text[])) |
| content_revisions_lock_version_check | c | CHECK (lock_version >= 0) |
| content_revisions_published_time_check | c | CHECK (status::text = 'published'::text AND published_at IS NOT NULL OR status::text <> 'published'::text AND published_at IS NULL) |
| content_revisions_rejected_remark_check | c | CHECK (status::text <> 'rejected'::text OR btrim(COALESCE(review_remark, ''::text)) <> ''::text) |
| content_revisions_revision_number_check | c | CHECK (revision_number > 0) |
| content_revisions_snapshot_check | c | CHECK (jsonb_typeof(snapshot) = 'object'::text) |
| content_revisions_status_check | c | CHECK (status::text = ANY (ARRAY['draft'::character varying, 'pending_review'::character varying, 'approved'::character varying, 'published'::character varying, 'rejected'::character varying, 'superseded'::character varying]::text[])) |
| content_revisions_supersedes_revision_id_fkey | f | FOREIGN KEY (supersedes_revision_id) REFERENCES content.content_revisions(id) ON DELETE RESTRICT |
| content_revisions_created_at_not_null | n | NOT NULL created_at |
| content_revisions_entity_id_not_null | n | NOT NULL entity_id |
| content_revisions_entity_type_not_null | n | NOT NULL entity_type |
| content_revisions_id_not_null | n | NOT NULL id |
| content_revisions_lock_version_not_null | n | NOT NULL lock_version |
| content_revisions_revision_number_not_null | n | NOT NULL revision_number |
| content_revisions_revision_public_id_not_null | n | NOT NULL revision_public_id |
| content_revisions_snapshot_not_null | n | NOT NULL snapshot |
| content_revisions_status_not_null | n | NOT NULL status |
| content_revisions_updated_at_not_null | n | NOT NULL updated_at |
| content_revisions_pkey | p | PRIMARY KEY (id) |
| content_revisions_entity_type_entity_id_revision_number_key | u | UNIQUE (entity_type, entity_id, revision_number) |
| content_revisions_revision_public_id_key | u | UNIQUE (revision_public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| content_revisions_entity_type_entity_id_revision_number_key | true | — | CREATE UNIQUE INDEX content_revisions_entity_type_entity_id_revision_number_key ON content.content_revisions USING btree (entity_type, entity_id, revision_number) |
| content_revisions_pkey | true | — | CREATE UNIQUE INDEX content_revisions_pkey ON content.content_revisions USING btree (id) |
| content_revisions_revision_public_id_key | true | — | CREATE UNIQUE INDEX content_revisions_revision_public_id_key ON content.content_revisions USING btree (revision_public_id) |
| idx_content_revisions_entity | false | — | CREATE INDEX idx_content_revisions_entity ON content.content_revisions USING btree (entity_type, entity_id, revision_number DESC) |
| idx_content_revisions_status_time | false | — | CREATE INDEX idx_content_revisions_status_time ON content.content_revisions USING btree (status, published_at DESC) |
| uq_content_revisions_active_work | true | ((status)::text = ANY ((ARRAY['draft'::character varying, 'pending_review'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])) | CREATE UNIQUE INDEX uq_content_revisions_active_work ON content.content_revisions USING btree (entity_type, entity_id) WHERE ((status)::text = ANY ((ARRAY['draft'::character varying, 'pending_review'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])) |
| uq_content_revisions_current_published | true | ((status)::text = 'published'::text) | CREATE UNIQUE INDEX uq_content_revisions_current_published ON content.content_revisions USING btree (entity_type, entity_id) WHERE ((status)::text = 'published'::text) |

#### content.content_tags

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| tag_id | bigint | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| content_tags_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| content_tags_tag_id_fkey | f | FOREIGN KEY (tag_id) REFERENCES content.tags(id) ON DELETE RESTRICT |
| content_tags_content_id_not_null | n | NOT NULL content_id |
| content_tags_created_at_not_null | n | NOT NULL created_at |
| content_tags_tag_id_not_null | n | NOT NULL tag_id |
| content_tags_pkey | p | PRIMARY KEY (content_id, tag_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| content_tags_pkey | true | — | CREATE UNIQUE INDEX content_tags_pkey ON content.content_tags USING btree (content_id, tag_id) |

#### content.contents

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| language | character varying(8) | false | — | — |
| content_type | character varying(32) | false | — | — |
| status | character varying(16) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| contents_content_type_check | c | CHECK (content_type::text = ANY (ARRAY['zh_pinyin_element'::character varying, 'zh_syllable'::character varying, 'zh_hanzi'::character varying, 'zh_word'::character varying, 'zh_sentence'::character varying, 'lo_letter'::character varying, 'lo_syllable'::character varying, 'lo_word'::character varying, 'lo_sentence'::character varying]::text[])) |
| contents_language_check | c | CHECK (language::text = ANY (ARRAY['zh'::character varying, 'lo'::character varying]::text[])) |
| contents_status_check | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying, 'archived'::character varying]::text[])) |
| contents_content_type_not_null | n | NOT NULL content_type |
| contents_created_at_not_null | n | NOT NULL created_at |
| contents_id_not_null | n | NOT NULL id |
| contents_language_not_null | n | NOT NULL language |
| contents_public_id_not_null | n | NOT NULL public_id |
| contents_status_not_null | n | NOT NULL status |
| contents_updated_at_not_null | n | NOT NULL updated_at |
| contents_pkey | p | PRIMARY KEY (id) |
| contents_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| contents_pkey | true | — | CREATE UNIQUE INDEX contents_pkey ON content.contents USING btree (id) |
| contents_public_id_key | true | — | CREATE UNIQUE INDEX contents_public_id_key ON content.contents USING btree (public_id) |

#### content.courses

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| learning_language | character varying(8) | false | — | — |
| title | character varying(128) | false | — | — |
| subtitle | character varying(256) | true | — | — |
| description | text | true | — | — |
| cover_media_id | uuid | true | — | — |
| status | character varying(16) | false | 'draft'::character varying | — |
| sort_order | integer | false | 0 | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| courses_learning_language_check | c | CHECK (learning_language::text = ANY (ARRAY['zh'::character varying, 'lo'::character varying]::text[])) |
| courses_status_check | c | CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])) |
| courses_created_at_not_null | n | NOT NULL created_at |
| courses_id_not_null | n | NOT NULL id |
| courses_learning_language_not_null | n | NOT NULL learning_language |
| courses_public_id_not_null | n | NOT NULL public_id |
| courses_sort_order_not_null | n | NOT NULL sort_order |
| courses_status_not_null | n | NOT NULL status |
| courses_title_not_null | n | NOT NULL title |
| courses_updated_at_not_null | n | NOT NULL updated_at |
| courses_pkey | p | PRIMARY KEY (id) |
| courses_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| courses_pkey | true | — | CREATE UNIQUE INDEX courses_pkey ON content.courses USING btree (id) |
| courses_public_id_key | true | — | CREATE UNIQUE INDEX courses_public_id_key ON content.courses USING btree (public_id) |

#### content.examples

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| content_id | bigint | false | — | — |
| meaning_id | bigint | true | — | — |
| sentence_content_id | bigint | false | — | — |
| sort_order | smallint | false | 1 | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| examples_sort_order_check | c | CHECK (sort_order > 0) |
| examples_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| examples_meaning_id_fkey | f | FOREIGN KEY (meaning_id) REFERENCES content.meanings(id) ON DELETE RESTRICT |
| examples_sentence_content_id_fkey | f | FOREIGN KEY (sentence_content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| examples_content_id_not_null | n | NOT NULL content_id |
| examples_created_at_not_null | n | NOT NULL created_at |
| examples_id_not_null | n | NOT NULL id |
| examples_sentence_content_id_not_null | n | NOT NULL sentence_content_id |
| examples_sort_order_not_null | n | NOT NULL sort_order |
| examples_pkey | p | PRIMARY KEY (id) |
| examples_content_id_sentence_content_id_meaning_id_key | u | UNIQUE (content_id, sentence_content_id, meaning_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| examples_content_id_sentence_content_id_meaning_id_key | true | — | CREATE UNIQUE INDEX examples_content_id_sentence_content_id_meaning_id_key ON content.examples USING btree (content_id, sentence_content_id, meaning_id) |
| examples_pkey | true | — | CREATE UNIQUE INDEX examples_pkey ON content.examples USING btree (id) |

#### content.exercises

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| title | character varying(128) | true | — | — |
| description | text | true | — | — |
| exercise_type | character varying(32) | false | 'practice'::character varying | — |
| passing_score | smallint | true | — | — |
| max_attempts | smallint | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| exercises_exercise_type_check | c | CHECK (exercise_type::text = ANY (ARRAY['practice'::character varying, 'review'::character varying, 'test'::character varying]::text[])) |
| exercises_max_attempts_check | c | CHECK (max_attempts IS NULL OR max_attempts > 0) |
| exercises_passing_score_check | c | CHECK (passing_score IS NULL OR passing_score >= 0 AND passing_score <= 100) |
| exercises_created_at_not_null | n | NOT NULL created_at |
| exercises_exercise_type_not_null | n | NOT NULL exercise_type |
| exercises_id_not_null | n | NOT NULL id |
| exercises_public_id_not_null | n | NOT NULL public_id |
| exercises_updated_at_not_null | n | NOT NULL updated_at |
| exercises_pkey | p | PRIMARY KEY (id) |
| exercises_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| exercises_pkey | true | — | CREATE UNIQUE INDEX exercises_pkey ON content.exercises USING btree (id) |
| exercises_public_id_key | true | — | CREATE UNIQUE INDEX exercises_public_id_key ON content.exercises USING btree (public_id) |

#### content.lesson_items

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| section_id | bigint | false | — | — |
| item_type | character varying(32) | false | — | — |
| content_id | bigint | true | — | — |
| exercise_id | bigint | true | — | — |
| media_id | uuid | true | — | — |
| title | character varying(256) | true | — | — |
| body | text | true | — | — |
| sort_order | integer | false | — | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| is_required | boolean | false | true | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lesson_items_item_type_check | c | CHECK (item_type::text = ANY (ARRAY['text'::character varying, 'knowledge'::character varying, 'image'::character varying, 'audio'::character varying, 'exercise'::character varying, 'tip'::character varying, 'dialogue'::character varying]::text[])) |
| lesson_items_metadata_check | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| lesson_items_required_value_check | c | CHECK ((item_type::text <> 'knowledge'::text OR content_id IS NOT NULL) AND (item_type::text <> 'exercise'::text OR exercise_id IS NOT NULL) AND ((item_type::text <> ALL (ARRAY['image'::character varying, 'audio'::character varying]::text[])) OR media_id IS NOT NULL) AND ((item_type::text <> ALL (ARRAY['text'::character varying, 'tip'::character varying, 'dialogue'::character varying]::text[])) OR body IS NOT NULL)) |
| lesson_items_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| lesson_items_exercise_id_fkey | f | FOREIGN KEY (exercise_id) REFERENCES content.exercises(id) ON DELETE RESTRICT |
| lesson_items_section_id_fkey | f | FOREIGN KEY (section_id) REFERENCES content.lesson_sections(id) ON DELETE RESTRICT |
| lesson_items_created_at_not_null | n | NOT NULL created_at |
| lesson_items_id_not_null | n | NOT NULL id |
| lesson_items_is_required_not_null | n | NOT NULL is_required |
| lesson_items_item_type_not_null | n | NOT NULL item_type |
| lesson_items_metadata_not_null | n | NOT NULL metadata |
| lesson_items_section_id_not_null | n | NOT NULL section_id |
| lesson_items_sort_order_not_null | n | NOT NULL sort_order |
| lesson_items_updated_at_not_null | n | NOT NULL updated_at |
| lesson_items_pkey | p | PRIMARY KEY (id) |
| lesson_items_section_id_sort_order_key | u | UNIQUE (section_id, sort_order) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lesson_items_pkey | true | — | CREATE UNIQUE INDEX lesson_items_pkey ON content.lesson_items USING btree (id) |
| lesson_items_section_id_sort_order_key | true | — | CREATE UNIQUE INDEX lesson_items_section_id_sort_order_key ON content.lesson_items USING btree (section_id, sort_order) |

#### content.lesson_sections

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| lesson_id | bigint | false | — | — |
| section_type | character varying(32) | false | — | — |
| title | character varying(128) | true | — | — |
| description | text | true | — | — |
| sort_order | integer | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lesson_sections_section_type_check | c | CHECK (section_type::text = ANY (ARRAY['introduction'::character varying, 'knowledge'::character varying, 'example'::character varying, 'practice'::character varying, 'summary'::character varying, 'custom'::character varying]::text[])) |
| lesson_sections_lesson_id_fkey | f | FOREIGN KEY (lesson_id) REFERENCES content.lessons(id) ON DELETE RESTRICT |
| lesson_sections_created_at_not_null | n | NOT NULL created_at |
| lesson_sections_id_not_null | n | NOT NULL id |
| lesson_sections_lesson_id_not_null | n | NOT NULL lesson_id |
| lesson_sections_public_id_not_null | n | NOT NULL public_id |
| lesson_sections_section_type_not_null | n | NOT NULL section_type |
| lesson_sections_sort_order_not_null | n | NOT NULL sort_order |
| lesson_sections_updated_at_not_null | n | NOT NULL updated_at |
| lesson_sections_pkey | p | PRIMARY KEY (id) |
| lesson_sections_lesson_id_sort_order_key | u | UNIQUE (lesson_id, sort_order) |
| lesson_sections_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lesson_sections_lesson_id_sort_order_key | true | — | CREATE UNIQUE INDEX lesson_sections_lesson_id_sort_order_key ON content.lesson_sections USING btree (lesson_id, sort_order) |
| lesson_sections_pkey | true | — | CREATE UNIQUE INDEX lesson_sections_pkey ON content.lesson_sections USING btree (id) |
| lesson_sections_public_id_key | true | — | CREATE UNIQUE INDEX lesson_sections_public_id_key ON content.lesson_sections USING btree (public_id) |

#### content.lessons

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| unit_id | bigint | false | — | — |
| title | character varying(128) | false | — | — |
| description | text | true | — | — |
| sort_order | integer | false | — | — |
| estimated_minutes | smallint | true | — | — |
| status | character varying(16) | false | 'draft'::character varying | — |
| published_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lessons_estimated_minutes_check | c | CHECK (estimated_minutes IS NULL OR estimated_minutes > 0) |
| lessons_status_check | c | CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])) |
| lessons_unit_id_fkey | f | FOREIGN KEY (unit_id) REFERENCES content.units(id) ON DELETE RESTRICT |
| lessons_created_at_not_null | n | NOT NULL created_at |
| lessons_id_not_null | n | NOT NULL id |
| lessons_public_id_not_null | n | NOT NULL public_id |
| lessons_sort_order_not_null | n | NOT NULL sort_order |
| lessons_status_not_null | n | NOT NULL status |
| lessons_title_not_null | n | NOT NULL title |
| lessons_unit_id_not_null | n | NOT NULL unit_id |
| lessons_updated_at_not_null | n | NOT NULL updated_at |
| lessons_pkey | p | PRIMARY KEY (id) |
| lessons_public_id_key | u | UNIQUE (public_id) |
| lessons_unit_id_sort_order_key | u | UNIQUE (unit_id, sort_order) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lessons_pkey | true | — | CREATE UNIQUE INDEX lessons_pkey ON content.lessons USING btree (id) |
| lessons_public_id_key | true | — | CREATE UNIQUE INDEX lessons_public_id_key ON content.lessons USING btree (public_id) |
| lessons_unit_id_sort_order_key | true | — | CREATE UNIQUE INDEX lessons_unit_id_sort_order_key ON content.lessons USING btree (unit_id, sort_order) |

#### content.lo_letters

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| character | character varying(16) | false | — | — |
| letter_type | character varying(16) | false | — | — |
| letter_class | character varying(16) | true | — | — |
| name | character varying(64) | true | — | — |
| romanization | character varying(64) | true | — | — |
| sort_order | smallint | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lo_letters_letter_type_check | c | CHECK (letter_type::text = ANY (ARRAY['consonant'::character varying, 'vowel'::character varying, 'tone_mark'::character varying, 'other'::character varying]::text[])) |
| lo_letters_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| lo_letters_character_not_null | n | NOT NULL "character" |
| lo_letters_content_id_not_null | n | NOT NULL content_id |
| lo_letters_letter_type_not_null | n | NOT NULL letter_type |
| lo_letters_pkey | p | PRIMARY KEY (content_id) |
| lo_letters_character_letter_type_key | u | UNIQUE ("character", letter_type) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lo_letters_character_letter_type_key | true | — | CREATE UNIQUE INDEX lo_letters_character_letter_type_key ON content.lo_letters USING btree ("character", letter_type) |
| lo_letters_pkey | true | — | CREATE UNIQUE INDEX lo_letters_pkey ON content.lo_letters USING btree (content_id) |

#### content.lo_sentence_words

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| sentence_content_id | bigint | false | — | — |
| word_content_id | bigint | false | — | — |
| position | smallint | false | — | — |
| surface_form | text | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lo_sentence_words_position_check | c | CHECK ("position" > 0) |
| lo_sentence_words_sentence_content_id_fkey | f | FOREIGN KEY (sentence_content_id) REFERENCES content.lo_sentences(content_id) ON DELETE RESTRICT |
| lo_sentence_words_word_content_id_fkey | f | FOREIGN KEY (word_content_id) REFERENCES content.lo_words(content_id) ON DELETE RESTRICT |
| lo_sentence_words_position_not_null | n | NOT NULL "position" |
| lo_sentence_words_sentence_content_id_not_null | n | NOT NULL sentence_content_id |
| lo_sentence_words_word_content_id_not_null | n | NOT NULL word_content_id |
| lo_sentence_words_pkey | p | PRIMARY KEY (sentence_content_id, "position") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lo_sentence_words_pkey | true | — | CREATE UNIQUE INDEX lo_sentence_words_pkey ON content.lo_sentence_words USING btree (sentence_content_id, "position") |

#### content.lo_sentences

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| text | text | false | — | — |
| romanization | text | true | — | — |
| difficulty_level | smallint | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lo_sentences_difficulty_level_check | c | CHECK (difficulty_level IS NULL OR difficulty_level >= 1) |
| lo_sentences_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| lo_sentences_content_id_not_null | n | NOT NULL content_id |
| lo_sentences_text_not_null | n | NOT NULL text |
| lo_sentences_pkey | p | PRIMARY KEY (content_id) |
| lo_sentences_text_key | u | UNIQUE (text) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lo_sentences_pkey | true | — | CREATE UNIQUE INDEX lo_sentences_pkey ON content.lo_sentences USING btree (content_id) |
| lo_sentences_text_key | true | — | CREATE UNIQUE INDEX lo_sentences_text_key ON content.lo_sentences USING btree (text) |

#### content.lo_syllable_letters

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| syllable_content_id | bigint | false | — | — |
| letter_content_id | bigint | false | — | — |
| position | smallint | false | — | — |
| role | character varying(16) | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lo_syllable_letters_position_check | c | CHECK ("position" > 0) |
| lo_syllable_letters_role_check | c | CHECK (role IS NULL OR (role::text = ANY (ARRAY['initial'::character varying, 'vowel'::character varying, 'final'::character varying, 'tone_mark'::character varying, 'other'::character varying]::text[]))) |
| lo_syllable_letters_letter_content_id_fkey | f | FOREIGN KEY (letter_content_id) REFERENCES content.lo_letters(content_id) ON DELETE RESTRICT |
| lo_syllable_letters_syllable_content_id_fkey | f | FOREIGN KEY (syllable_content_id) REFERENCES content.lo_syllables(content_id) ON DELETE RESTRICT |
| lo_syllable_letters_letter_content_id_not_null | n | NOT NULL letter_content_id |
| lo_syllable_letters_position_not_null | n | NOT NULL "position" |
| lo_syllable_letters_syllable_content_id_not_null | n | NOT NULL syllable_content_id |
| lo_syllable_letters_pkey | p | PRIMARY KEY (syllable_content_id, "position") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lo_syllable_letters_pkey | true | — | CREATE UNIQUE INDEX lo_syllable_letters_pkey ON content.lo_syllable_letters USING btree (syllable_content_id, "position") |

#### content.lo_syllables

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| text | character varying(64) | false | — | — |
| romanization | character varying(128) | true | — | — |
| tone | smallint | true | — | — |
| pronunciation_key | character varying(128) | true | — | — |
| difficulty_level | smallint | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lo_syllables_difficulty_level_check | c | CHECK (difficulty_level IS NULL OR difficulty_level >= 1) |
| lo_syllables_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| lo_syllables_content_id_not_null | n | NOT NULL content_id |
| lo_syllables_text_not_null | n | NOT NULL text |
| lo_syllables_pkey | p | PRIMARY KEY (content_id) |
| lo_syllables_text_key | u | UNIQUE (text) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lo_syllables_pkey | true | — | CREATE UNIQUE INDEX lo_syllables_pkey ON content.lo_syllables USING btree (content_id) |
| lo_syllables_text_key | true | — | CREATE UNIQUE INDEX lo_syllables_text_key ON content.lo_syllables USING btree (text) |

#### content.lo_word_syllables

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| word_content_id | bigint | false | — | — |
| syllable_content_id | bigint | false | — | — |
| position | smallint | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lo_word_syllables_position_check | c | CHECK ("position" > 0) |
| lo_word_syllables_syllable_content_id_fkey | f | FOREIGN KEY (syllable_content_id) REFERENCES content.lo_syllables(content_id) ON DELETE RESTRICT |
| lo_word_syllables_word_content_id_fkey | f | FOREIGN KEY (word_content_id) REFERENCES content.lo_words(content_id) ON DELETE RESTRICT |
| lo_word_syllables_position_not_null | n | NOT NULL "position" |
| lo_word_syllables_syllable_content_id_not_null | n | NOT NULL syllable_content_id |
| lo_word_syllables_word_content_id_not_null | n | NOT NULL word_content_id |
| lo_word_syllables_pkey | p | PRIMARY KEY (word_content_id, "position") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lo_word_syllables_pkey | true | — | CREATE UNIQUE INDEX lo_word_syllables_pkey ON content.lo_word_syllables USING btree (word_content_id, "position") |

#### content.lo_words

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| text | character varying(256) | false | — | — |
| romanization | character varying(256) | true | — | — |
| word_class | character varying(32) | true | — | — |
| difficulty_level | smallint | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lo_words_difficulty_level_check | c | CHECK (difficulty_level IS NULL OR difficulty_level >= 1) |
| lo_words_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| lo_words_content_id_not_null | n | NOT NULL content_id |
| lo_words_text_not_null | n | NOT NULL text |
| lo_words_pkey | p | PRIMARY KEY (content_id) |
| lo_words_text_key | u | UNIQUE (text) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_lo_words_romanization_trgm | false | — | CREATE INDEX idx_lo_words_romanization_trgm ON content.lo_words USING gin (romanization gin_trgm_ops) |
| idx_lo_words_text_trgm | false | — | CREATE INDEX idx_lo_words_text_trgm ON content.lo_words USING gin (text gin_trgm_ops) |
| lo_words_pkey | true | — | CREATE UNIQUE INDEX lo_words_pkey ON content.lo_words USING btree (content_id) |
| lo_words_text_key | true | — | CREATE UNIQUE INDEX lo_words_text_key ON content.lo_words USING btree (text) |

#### content.meanings

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| content_id | bigint | false | — | — |
| language | character varying(8) | false | — | — |
| word_class | character varying(32) | true | — | — |
| definition | text | false | — | — |
| sense_order | smallint | false | 1 | — |
| status | character varying(16) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| meanings_language_check | c | CHECK (language::text = ANY (ARRAY['zh'::character varying, 'lo'::character varying]::text[])) |
| meanings_sense_order_check | c | CHECK (sense_order > 0) |
| meanings_status_check | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying]::text[])) |
| meanings_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| meanings_content_id_not_null | n | NOT NULL content_id |
| meanings_created_at_not_null | n | NOT NULL created_at |
| meanings_definition_not_null | n | NOT NULL definition |
| meanings_id_not_null | n | NOT NULL id |
| meanings_language_not_null | n | NOT NULL language |
| meanings_sense_order_not_null | n | NOT NULL sense_order |
| meanings_status_not_null | n | NOT NULL status |
| meanings_updated_at_not_null | n | NOT NULL updated_at |
| meanings_pkey | p | PRIMARY KEY (id) |
| meanings_content_id_language_sense_order_key | u | UNIQUE (content_id, language, sense_order) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| meanings_content_id_language_sense_order_key | true | — | CREATE UNIQUE INDEX meanings_content_id_language_sense_order_key ON content.meanings USING btree (content_id, language, sense_order) |
| meanings_pkey | true | — | CREATE UNIQUE INDEX meanings_pkey ON content.meanings USING btree (id) |

#### content.pronunciations

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| content_id | bigint | false | — | — |
| pronunciation_text | character varying(256) | true | — | — |
| pronunciation_key | character varying(128) | true | — | — |
| accent | character varying(32) | true | — | — |
| source | character varying(16) | false | — | — |
| is_primary | boolean | false | false | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| pronunciations_source_check | c | CHECK (source::text = ANY (ARRAY['human'::character varying, 'tts'::character varying, 'system'::character varying]::text[])) |
| pronunciations_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| pronunciations_content_id_not_null | n | NOT NULL content_id |
| pronunciations_created_at_not_null | n | NOT NULL created_at |
| pronunciations_id_not_null | n | NOT NULL id |
| pronunciations_is_primary_not_null | n | NOT NULL is_primary |
| pronunciations_source_not_null | n | NOT NULL source |
| pronunciations_updated_at_not_null | n | NOT NULL updated_at |
| pronunciations_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| pronunciations_pkey | true | — | CREATE UNIQUE INDEX pronunciations_pkey ON content.pronunciations USING btree (id) |

#### content.question_contents

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| question_id | bigint | false | — | — |
| role | character varying(32) | false | — | — |
| content_id | bigint | true | — | — |
| media_id | uuid | true | — | — |
| text_value | text | true | — | — |
| sort_order | integer | false | 1 | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| question_contents_role_check | c | CHECK (role::text = ANY (ARRAY['prompt'::character varying, 'audio'::character varying, 'image'::character varying, 'reference'::character varying, 'hint'::character varying]::text[])) |
| question_contents_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| question_contents_question_id_fkey | f | FOREIGN KEY (question_id) REFERENCES content.questions(id) ON DELETE RESTRICT |
| question_contents_created_at_not_null | n | NOT NULL created_at |
| question_contents_id_not_null | n | NOT NULL id |
| question_contents_question_id_not_null | n | NOT NULL question_id |
| question_contents_role_not_null | n | NOT NULL role |
| question_contents_sort_order_not_null | n | NOT NULL sort_order |
| question_contents_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| question_contents_pkey | true | — | CREATE UNIQUE INDEX question_contents_pkey ON content.question_contents USING btree (id) |

#### content.question_options

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| question_id | bigint | false | — | — |
| content_id | bigint | true | — | — |
| text_value | text | true | — | — |
| media_id | uuid | true | — | — |
| sort_order | integer | false | — | — |
| is_correct | boolean | false | false | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| question_options_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| question_options_question_id_fkey | f | FOREIGN KEY (question_id) REFERENCES content.questions(id) ON DELETE RESTRICT |
| question_options_created_at_not_null | n | NOT NULL created_at |
| question_options_id_not_null | n | NOT NULL id |
| question_options_is_correct_not_null | n | NOT NULL is_correct |
| question_options_question_id_not_null | n | NOT NULL question_id |
| question_options_sort_order_not_null | n | NOT NULL sort_order |
| question_options_pkey | p | PRIMARY KEY (id) |
| question_options_question_id_sort_order_key | u | UNIQUE (question_id, sort_order) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| question_options_pkey | true | — | CREATE UNIQUE INDEX question_options_pkey ON content.question_options USING btree (id) |
| question_options_question_id_sort_order_key | true | — | CREATE UNIQUE INDEX question_options_question_id_sort_order_key ON content.question_options USING btree (question_id, sort_order) |

#### content.questions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| exercise_id | bigint | false | — | — |
| question_type | character varying(32) | false | — | — |
| prompt | text | true | — | — |
| sort_order | integer | false | — | — |
| score | numeric(8,2) | false | 1 | — |
| explanation | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| questions_question_type_check | c | CHECK (question_type::text = ANY (ARRAY['single_choice'::character varying, 'multiple_choice'::character varying, 'true_false'::character varying, 'fill_blank'::character varying, 'ordering'::character varying, 'matching'::character varying, 'listen_choice'::character varying, 'content_choice'::character varying]::text[])) |
| questions_score_check | c | CHECK (score >= 0::numeric) |
| questions_exercise_id_fkey | f | FOREIGN KEY (exercise_id) REFERENCES content.exercises(id) ON DELETE RESTRICT |
| questions_created_at_not_null | n | NOT NULL created_at |
| questions_exercise_id_not_null | n | NOT NULL exercise_id |
| questions_id_not_null | n | NOT NULL id |
| questions_public_id_not_null | n | NOT NULL public_id |
| questions_question_type_not_null | n | NOT NULL question_type |
| questions_score_not_null | n | NOT NULL score |
| questions_sort_order_not_null | n | NOT NULL sort_order |
| questions_updated_at_not_null | n | NOT NULL updated_at |
| questions_pkey | p | PRIMARY KEY (id) |
| questions_exercise_id_sort_order_key | u | UNIQUE (exercise_id, sort_order) |
| questions_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| questions_exercise_id_sort_order_key | true | — | CREATE UNIQUE INDEX questions_exercise_id_sort_order_key ON content.questions USING btree (exercise_id, sort_order) |
| questions_pkey | true | — | CREATE UNIQUE INDEX questions_pkey ON content.questions USING btree (id) |
| questions_public_id_key | true | — | CREATE UNIQUE INDEX questions_public_id_key ON content.questions USING btree (public_id) |

#### content.tags

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| code | character varying(64) | false | — | — |
| name | character varying(64) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| tags_code_not_null | n | NOT NULL code |
| tags_created_at_not_null | n | NOT NULL created_at |
| tags_id_not_null | n | NOT NULL id |
| tags_name_not_null | n | NOT NULL name |
| tags_pkey | p | PRIMARY KEY (id) |
| tags_code_key | u | UNIQUE (code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| tags_code_key | true | — | CREATE UNIQUE INDEX tags_code_key ON content.tags USING btree (code) |
| tags_pkey | true | — | CREATE UNIQUE INDEX tags_pkey ON content.tags USING btree (id) |

#### content.translations

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| content_id | bigint | false | — | — |
| language | character varying(8) | false | — | — |
| text | text | false | — | — |
| is_primary | boolean | false | false | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| translations_language_check | c | CHECK (language::text = ANY (ARRAY['zh'::character varying, 'lo'::character varying]::text[])) |
| translations_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| translations_content_id_not_null | n | NOT NULL content_id |
| translations_created_at_not_null | n | NOT NULL created_at |
| translations_id_not_null | n | NOT NULL id |
| translations_is_primary_not_null | n | NOT NULL is_primary |
| translations_language_not_null | n | NOT NULL language |
| translations_text_not_null | n | NOT NULL text |
| translations_updated_at_not_null | n | NOT NULL updated_at |
| translations_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| translations_pkey | true | — | CREATE UNIQUE INDEX translations_pkey ON content.translations USING btree (id) |
| uq_translations_primary | true | is_primary | CREATE UNIQUE INDEX uq_translations_primary ON content.translations USING btree (content_id, language) WHERE is_primary |

#### content.units

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| course_id | bigint | false | — | — |
| title | character varying(128) | false | — | — |
| description | text | true | — | — |
| sort_order | integer | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| units_course_id_fkey | f | FOREIGN KEY (course_id) REFERENCES content.courses(id) ON DELETE RESTRICT |
| units_course_id_not_null | n | NOT NULL course_id |
| units_created_at_not_null | n | NOT NULL created_at |
| units_id_not_null | n | NOT NULL id |
| units_sort_order_not_null | n | NOT NULL sort_order |
| units_title_not_null | n | NOT NULL title |
| units_updated_at_not_null | n | NOT NULL updated_at |
| units_pkey | p | PRIMARY KEY (id) |
| units_course_id_sort_order_key | u | UNIQUE (course_id, sort_order) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| units_course_id_sort_order_key | true | — | CREATE UNIQUE INDEX units_course_id_sort_order_key ON content.units USING btree (course_id, sort_order) |
| units_pkey | true | — | CREATE UNIQUE INDEX units_pkey ON content.units USING btree (id) |

#### content.zh_hanzi

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| character | character varying(4) | false | — | — |
| traditional_character | character varying(4) | true | — | — |
| stroke_count | smallint | true | — | — |
| radical | character varying(8) | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_hanzi_stroke_count_check | c | CHECK (stroke_count IS NULL OR stroke_count > 0) |
| zh_hanzi_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| zh_hanzi_character_not_null | n | NOT NULL "character" |
| zh_hanzi_content_id_not_null | n | NOT NULL content_id |
| zh_hanzi_pkey | p | PRIMARY KEY (content_id) |
| zh_hanzi_character_key | u | UNIQUE ("character") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| zh_hanzi_character_key | true | — | CREATE UNIQUE INDEX zh_hanzi_character_key ON content.zh_hanzi USING btree ("character") |
| zh_hanzi_pkey | true | — | CREATE UNIQUE INDEX zh_hanzi_pkey ON content.zh_hanzi USING btree (content_id) |

#### content.zh_hanzi_syllables

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| hanzi_content_id | bigint | false | — | — |
| syllable_content_id | bigint | false | — | — |
| is_primary | boolean | false | false | — |
| usage_note | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_hanzi_syllables_hanzi_content_id_fkey | f | FOREIGN KEY (hanzi_content_id) REFERENCES content.zh_hanzi(content_id) ON DELETE RESTRICT |
| zh_hanzi_syllables_syllable_content_id_fkey | f | FOREIGN KEY (syllable_content_id) REFERENCES content.zh_syllables(content_id) ON DELETE RESTRICT |
| zh_hanzi_syllables_created_at_not_null | n | NOT NULL created_at |
| zh_hanzi_syllables_hanzi_content_id_not_null | n | NOT NULL hanzi_content_id |
| zh_hanzi_syllables_is_primary_not_null | n | NOT NULL is_primary |
| zh_hanzi_syllables_syllable_content_id_not_null | n | NOT NULL syllable_content_id |
| zh_hanzi_syllables_pkey | p | PRIMARY KEY (hanzi_content_id, syllable_content_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| uq_zh_hanzi_syllables_primary | true | is_primary | CREATE UNIQUE INDEX uq_zh_hanzi_syllables_primary ON content.zh_hanzi_syllables USING btree (hanzi_content_id) WHERE is_primary |
| zh_hanzi_syllables_pkey | true | — | CREATE UNIQUE INDEX zh_hanzi_syllables_pkey ON content.zh_hanzi_syllables USING btree (hanzi_content_id, syllable_content_id) |

#### content.zh_pinyin_elements

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| element_type | character varying(16) | false | — | — |
| value | character varying(16) | false | — | — |
| display_form | character varying(16) | false | — | — |
| sort_order | smallint | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_pinyin_elements_element_type_check | c | CHECK (element_type::text = ANY (ARRAY['initial'::character varying, 'final'::character varying, 'tone_mark'::character varying, 'separator'::character varying, 'other'::character varying]::text[])) |
| zh_pinyin_elements_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| zh_pinyin_elements_content_id_not_null | n | NOT NULL content_id |
| zh_pinyin_elements_display_form_not_null | n | NOT NULL display_form |
| zh_pinyin_elements_element_type_not_null | n | NOT NULL element_type |
| zh_pinyin_elements_value_not_null | n | NOT NULL value |
| zh_pinyin_elements_pkey | p | PRIMARY KEY (content_id) |
| zh_pinyin_elements_element_type_value_key | u | UNIQUE (element_type, value) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| zh_pinyin_elements_element_type_value_key | true | — | CREATE UNIQUE INDEX zh_pinyin_elements_element_type_value_key ON content.zh_pinyin_elements USING btree (element_type, value) |
| zh_pinyin_elements_pkey | true | — | CREATE UNIQUE INDEX zh_pinyin_elements_pkey ON content.zh_pinyin_elements USING btree (content_id) |

#### content.zh_sentence_words

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| sentence_content_id | bigint | false | — | — |
| word_content_id | bigint | false | — | — |
| position | smallint | false | — | — |
| surface_form | text | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_sentence_words_position_check | c | CHECK ("position" > 0) |
| zh_sentence_words_sentence_content_id_fkey | f | FOREIGN KEY (sentence_content_id) REFERENCES content.zh_sentences(content_id) ON DELETE RESTRICT |
| zh_sentence_words_word_content_id_fkey | f | FOREIGN KEY (word_content_id) REFERENCES content.zh_words(content_id) ON DELETE RESTRICT |
| zh_sentence_words_position_not_null | n | NOT NULL "position" |
| zh_sentence_words_sentence_content_id_not_null | n | NOT NULL sentence_content_id |
| zh_sentence_words_word_content_id_not_null | n | NOT NULL word_content_id |
| zh_sentence_words_pkey | p | PRIMARY KEY (sentence_content_id, "position") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| zh_sentence_words_pkey | true | — | CREATE UNIQUE INDEX zh_sentence_words_pkey ON content.zh_sentence_words USING btree (sentence_content_id, "position") |

#### content.zh_sentences

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| text | text | false | — | — |
| pinyin_text | text | true | — | — |
| difficulty_level | smallint | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_sentences_difficulty_level_check | c | CHECK (difficulty_level IS NULL OR difficulty_level >= 1) |
| zh_sentences_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| zh_sentences_content_id_not_null | n | NOT NULL content_id |
| zh_sentences_text_not_null | n | NOT NULL text |
| zh_sentences_pkey | p | PRIMARY KEY (content_id) |
| zh_sentences_text_key | u | UNIQUE (text) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| zh_sentences_pkey | true | — | CREATE UNIQUE INDEX zh_sentences_pkey ON content.zh_sentences USING btree (content_id) |
| zh_sentences_text_key | true | — | CREATE UNIQUE INDEX zh_sentences_text_key ON content.zh_sentences USING btree (text) |

#### content.zh_syllable_pinyin_elements

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| syllable_content_id | bigint | false | — | — |
| pinyin_element_content_id | bigint | false | — | — |
| position | smallint | false | — | — |
| role | character varying(16) | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_syllable_pinyin_elements_position_check | c | CHECK ("position" > 0) |
| zh_syllable_pinyin_elements_role_check | c | CHECK (role IS NULL OR (role::text = ANY (ARRAY['initial'::character varying, 'final'::character varying, 'tone_mark'::character varying, 'separator'::character varying, 'other'::character varying]::text[]))) |
| zh_syllable_pinyin_elements_pinyin_element_content_id_fkey | f | FOREIGN KEY (pinyin_element_content_id) REFERENCES content.zh_pinyin_elements(content_id) ON DELETE RESTRICT |
| zh_syllable_pinyin_elements_syllable_content_id_fkey | f | FOREIGN KEY (syllable_content_id) REFERENCES content.zh_syllables(content_id) ON DELETE RESTRICT |
| zh_syllable_pinyin_elements_pinyin_element_content_id_not_null | n | NOT NULL pinyin_element_content_id |
| zh_syllable_pinyin_elements_position_not_null | n | NOT NULL "position" |
| zh_syllable_pinyin_elements_syllable_content_id_not_null | n | NOT NULL syllable_content_id |
| zh_syllable_pinyin_elements_pkey | p | PRIMARY KEY (syllable_content_id, "position") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| zh_syllable_pinyin_elements_pkey | true | — | CREATE UNIQUE INDEX zh_syllable_pinyin_elements_pkey ON content.zh_syllable_pinyin_elements USING btree (syllable_content_id, "position") |

#### content.zh_syllables

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| base_form | character varying(32) | false | — | — |
| tone | smallint | false | — | — |
| display_form | character varying(32) | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_syllables_tone_check | c | CHECK (tone >= 1 AND tone <= 5) |
| zh_syllables_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| zh_syllables_base_form_not_null | n | NOT NULL base_form |
| zh_syllables_content_id_not_null | n | NOT NULL content_id |
| zh_syllables_display_form_not_null | n | NOT NULL display_form |
| zh_syllables_tone_not_null | n | NOT NULL tone |
| zh_syllables_pkey | p | PRIMARY KEY (content_id) |
| zh_syllables_base_form_tone_key | u | UNIQUE (base_form, tone) |
| zh_syllables_display_form_key | u | UNIQUE (display_form) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| zh_syllables_base_form_tone_key | true | — | CREATE UNIQUE INDEX zh_syllables_base_form_tone_key ON content.zh_syllables USING btree (base_form, tone) |
| zh_syllables_display_form_key | true | — | CREATE UNIQUE INDEX zh_syllables_display_form_key ON content.zh_syllables USING btree (display_form) |
| zh_syllables_pkey | true | — | CREATE UNIQUE INDEX zh_syllables_pkey ON content.zh_syllables USING btree (content_id) |

#### content.zh_word_hanzi

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| word_content_id | bigint | false | — | — |
| hanzi_content_id | bigint | false | — | — |
| position | smallint | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_word_hanzi_position_check | c | CHECK ("position" > 0) |
| zh_word_hanzi_hanzi_content_id_fkey | f | FOREIGN KEY (hanzi_content_id) REFERENCES content.zh_hanzi(content_id) ON DELETE RESTRICT |
| zh_word_hanzi_word_content_id_fkey | f | FOREIGN KEY (word_content_id) REFERENCES content.zh_words(content_id) ON DELETE RESTRICT |
| zh_word_hanzi_hanzi_content_id_not_null | n | NOT NULL hanzi_content_id |
| zh_word_hanzi_position_not_null | n | NOT NULL "position" |
| zh_word_hanzi_word_content_id_not_null | n | NOT NULL word_content_id |
| zh_word_hanzi_pkey | p | PRIMARY KEY (word_content_id, "position") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| zh_word_hanzi_pkey | true | — | CREATE UNIQUE INDEX zh_word_hanzi_pkey ON content.zh_word_hanzi USING btree (word_content_id, "position") |

#### content.zh_words

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| content_id | bigint | false | — | — |
| simplified | character varying(128) | false | — | — |
| traditional | character varying(128) | true | — | — |
| pinyin_text | character varying(256) | true | — | — |
| word_class | character varying(32) | true | — | — |
| difficulty_level | smallint | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| zh_words_difficulty_level_check | c | CHECK (difficulty_level IS NULL OR difficulty_level >= 1) |
| zh_words_content_id_fkey | f | FOREIGN KEY (content_id) REFERENCES content.contents(id) ON DELETE RESTRICT |
| zh_words_content_id_not_null | n | NOT NULL content_id |
| zh_words_simplified_not_null | n | NOT NULL simplified |
| zh_words_pkey | p | PRIMARY KEY (content_id) |
| zh_words_simplified_key | u | UNIQUE (simplified) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_zh_words_pinyin_text_trgm | false | — | CREATE INDEX idx_zh_words_pinyin_text_trgm ON content.zh_words USING gin (pinyin_text gin_trgm_ops) |
| idx_zh_words_simplified_trgm | false | — | CREATE INDEX idx_zh_words_simplified_trgm ON content.zh_words USING gin (simplified gin_trgm_ops) |
| idx_zh_words_traditional_trgm | false | — | CREATE INDEX idx_zh_words_traditional_trgm ON content.zh_words USING gin (traditional gin_trgm_ops) |
| zh_words_pkey | true | — | CREATE UNIQUE INDEX zh_words_pkey ON content.zh_words USING btree (content_id) |
| zh_words_simplified_key | true | — | CREATE UNIQUE INDEX zh_words_simplified_key ON content.zh_words USING btree (simplified) |

### learning

#### learning.content_bookmarks

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| user_id | uuid | false | — | — |
| content_id | uuid | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| content_bookmarks_content_id_not_null | n | NOT NULL content_id |
| content_bookmarks_created_at_not_null | n | NOT NULL created_at |
| content_bookmarks_user_id_not_null | n | NOT NULL user_id |
| content_bookmarks_pkey | p | PRIMARY KEY (user_id, content_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| content_bookmarks_pkey | true | — | CREATE UNIQUE INDEX content_bookmarks_pkey ON learning.content_bookmarks USING btree (user_id, content_id) |

#### learning.content_mastery

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| user_id | uuid | false | — | — |
| content_id | uuid | false | — | — |
| mastery_status | character varying(16) | false | 'new'::character varying | — |
| mastery_score | numeric(5,2) | true | — | — |
| correct_count | integer | false | 0 | — |
| incorrect_count | integer | false | 0 | — |
| first_learned_at | timestamp with time zone | true | — | — |
| last_practiced_at | timestamp with time zone | true | — | — |
| mastered_at | timestamp with time zone | true | — | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| content_mastery_correct_count_check | c | CHECK (correct_count >= 0) |
| content_mastery_incorrect_count_check | c | CHECK (incorrect_count >= 0) |
| content_mastery_mastery_score_check | c | CHECK (mastery_score IS NULL OR mastery_score >= 0::numeric AND mastery_score <= 100::numeric) |
| content_mastery_mastery_status_check | c | CHECK (mastery_status::text = ANY (ARRAY['new'::character varying, 'learning'::character varying, 'familiar'::character varying, 'mastered'::character varying]::text[])) |
| content_mastery_content_id_not_null | n | NOT NULL content_id |
| content_mastery_correct_count_not_null | n | NOT NULL correct_count |
| content_mastery_incorrect_count_not_null | n | NOT NULL incorrect_count |
| content_mastery_mastery_status_not_null | n | NOT NULL mastery_status |
| content_mastery_updated_at_not_null | n | NOT NULL updated_at |
| content_mastery_user_id_not_null | n | NOT NULL user_id |
| content_mastery_pkey | p | PRIMARY KEY (user_id, content_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| content_mastery_pkey | true | — | CREATE UNIQUE INDEX content_mastery_pkey ON learning.content_mastery USING btree (user_id, content_id) |

#### learning.content_reviews

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| user_id | uuid | false | — | — |
| content_id | uuid | false | — | — |
| next_review_at | timestamp with time zone | false | — | — |
| priority | smallint | false | 0 | — |
| review_count | integer | false | 0 | — |
| last_reviewed_at | timestamp with time zone | true | — | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| content_reviews_review_count_check | c | CHECK (review_count >= 0) |
| content_reviews_content_id_not_null | n | NOT NULL content_id |
| content_reviews_next_review_at_not_null | n | NOT NULL next_review_at |
| content_reviews_priority_not_null | n | NOT NULL priority |
| content_reviews_review_count_not_null | n | NOT NULL review_count |
| content_reviews_updated_at_not_null | n | NOT NULL updated_at |
| content_reviews_user_id_not_null | n | NOT NULL user_id |
| content_reviews_pkey | p | PRIMARY KEY (user_id, content_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| content_reviews_pkey | true | — | CREATE UNIQUE INDEX content_reviews_pkey ON learning.content_reviews USING btree (user_id, content_id) |
| idx_content_reviews_due | false | — | CREATE INDEX idx_content_reviews_due ON learning.content_reviews USING btree (next_review_at, priority DESC) |

#### learning.course_progress

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| user_id | uuid | false | — | — |
| course_id | uuid | false | — | — |
| status | character varying(16) | false | 'not_started'::character varying | — |
| started_at | timestamp with time zone | true | — | — |
| completed_at | timestamp with time zone | true | — | — |
| last_lesson_id | uuid | true | — | — |
| progress_percent | numeric(5,2) | false | 0 | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| course_progress_progress_percent_check | c | CHECK (progress_percent >= 0::numeric AND progress_percent <= 100::numeric) |
| course_progress_status_check | c | CHECK (status::text = ANY (ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying]::text[])) |
| course_progress_course_id_not_null | n | NOT NULL course_id |
| course_progress_progress_percent_not_null | n | NOT NULL progress_percent |
| course_progress_status_not_null | n | NOT NULL status |
| course_progress_updated_at_not_null | n | NOT NULL updated_at |
| course_progress_user_id_not_null | n | NOT NULL user_id |
| course_progress_pkey | p | PRIMARY KEY (user_id, course_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| course_progress_pkey | true | — | CREATE UNIQUE INDEX course_progress_pkey ON learning.course_progress USING btree (user_id, course_id) |

#### learning.dictionary_search_history

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | uuid | false | — | — |
| query_text | character varying(256) | false | — | — |
| selected_content_id | uuid | true | — | — |
| searched_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| dictionary_search_history_id_not_null | n | NOT NULL id |
| dictionary_search_history_query_text_not_null | n | NOT NULL query_text |
| dictionary_search_history_searched_at_not_null | n | NOT NULL searched_at |
| dictionary_search_history_user_id_not_null | n | NOT NULL user_id |
| dictionary_search_history_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| dictionary_search_history_pkey | true | — | CREATE UNIQUE INDEX dictionary_search_history_pkey ON learning.dictionary_search_history USING btree (id) |
| idx_dictionary_search_user_time | false | — | CREATE INDEX idx_dictionary_search_user_time ON learning.dictionary_search_history USING btree (user_id, searched_at DESC) |

#### learning.exercise_attempts

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | uuid | false | — | — |
| exercise_id | uuid | false | — | — |
| status | character varying(16) | false | 'in_progress'::character varying | — |
| total_score | numeric(10,2) | true | — | — |
| earned_score | numeric(10,2) | true | — | — |
| score_percent | numeric(5,2) | true | — | — |
| started_at | timestamp with time zone | false | now() | — |
| completed_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| exercise_attempts_score_percent_check | c | CHECK (score_percent IS NULL OR score_percent >= 0::numeric AND score_percent <= 100::numeric) |
| exercise_attempts_status_check | c | CHECK (status::text = ANY (ARRAY['in_progress'::character varying, 'completed'::character varying, 'abandoned'::character varying]::text[])) |
| exercise_attempts_created_at_not_null | n | NOT NULL created_at |
| exercise_attempts_exercise_id_not_null | n | NOT NULL exercise_id |
| exercise_attempts_id_not_null | n | NOT NULL id |
| exercise_attempts_started_at_not_null | n | NOT NULL started_at |
| exercise_attempts_status_not_null | n | NOT NULL status |
| exercise_attempts_user_id_not_null | n | NOT NULL user_id |
| exercise_attempts_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| exercise_attempts_pkey | true | — | CREATE UNIQUE INDEX exercise_attempts_pkey ON learning.exercise_attempts USING btree (id) |
| idx_exercise_attempts_exercise_time | false | — | CREATE INDEX idx_exercise_attempts_exercise_time ON learning.exercise_attempts USING btree (exercise_id, started_at DESC) |
| idx_exercise_attempts_user_time | false | — | CREATE INDEX idx_exercise_attempts_user_time ON learning.exercise_attempts USING btree (user_id, started_at DESC) |

#### learning.learning_activities

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | uuid | false | — | — |
| activity_type | character varying(32) | false | — | — |
| course_id | uuid | true | — | — |
| lesson_id | uuid | true | — | — |
| content_id | uuid | true | — | — |
| exercise_id | uuid | true | — | — |
| occurred_at | timestamp with time zone | false | now() | — |
| metadata | jsonb | false | '{}'::jsonb | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| learning_activities_activity_type_check | c | CHECK (activity_type::text = ANY (ARRAY['course_started'::character varying, 'lesson_started'::character varying, 'lesson_completed'::character varying, 'content_viewed'::character varying, 'content_practiced'::character varying, 'exercise_started'::character varying, 'exercise_completed'::character varying, 'review_completed'::character varying]::text[])) |
| learning_activities_metadata_check | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| learning_activities_activity_type_not_null | n | NOT NULL activity_type |
| learning_activities_id_not_null | n | NOT NULL id |
| learning_activities_metadata_not_null | n | NOT NULL metadata |
| learning_activities_occurred_at_not_null | n | NOT NULL occurred_at |
| learning_activities_user_id_not_null | n | NOT NULL user_id |
| learning_activities_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_learning_activities_user_time | false | — | CREATE INDEX idx_learning_activities_user_time ON learning.learning_activities USING btree (user_id, occurred_at DESC) |
| learning_activities_pkey | true | — | CREATE UNIQUE INDEX learning_activities_pkey ON learning.learning_activities USING btree (id) |

#### learning.lesson_progress

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| user_id | uuid | false | — | — |
| lesson_id | uuid | false | — | — |
| status | character varying(16) | false | 'not_started'::character varying | — |
| started_at | timestamp with time zone | true | — | — |
| completed_at | timestamp with time zone | true | — | — |
| last_section_id | uuid | true | — | — |
| progress_percent | numeric(5,2) | false | 0 | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| lesson_progress_progress_percent_check | c | CHECK (progress_percent >= 0::numeric AND progress_percent <= 100::numeric) |
| lesson_progress_status_check | c | CHECK (status::text = ANY (ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying]::text[])) |
| lesson_progress_lesson_id_not_null | n | NOT NULL lesson_id |
| lesson_progress_progress_percent_not_null | n | NOT NULL progress_percent |
| lesson_progress_status_not_null | n | NOT NULL status |
| lesson_progress_updated_at_not_null | n | NOT NULL updated_at |
| lesson_progress_user_id_not_null | n | NOT NULL user_id |
| lesson_progress_pkey | p | PRIMARY KEY (user_id, lesson_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| lesson_progress_pkey | true | — | CREATE UNIQUE INDEX lesson_progress_pkey ON learning.lesson_progress USING btree (user_id, lesson_id) |

#### learning.question_attempts

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| exercise_attempt_id | bigint | false | — | — |
| question_id | uuid | false | — | — |
| answer_data | jsonb | false | — | — |
| is_correct | boolean | true | — | — |
| earned_score | numeric(10,2) | true | — | — |
| answered_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| question_attempts_exercise_attempt_id_fkey | f | FOREIGN KEY (exercise_attempt_id) REFERENCES learning.exercise_attempts(id) ON DELETE RESTRICT |
| question_attempts_answer_data_not_null | n | NOT NULL answer_data |
| question_attempts_answered_at_not_null | n | NOT NULL answered_at |
| question_attempts_exercise_attempt_id_not_null | n | NOT NULL exercise_attempt_id |
| question_attempts_id_not_null | n | NOT NULL id |
| question_attempts_question_id_not_null | n | NOT NULL question_id |
| question_attempts_pkey | p | PRIMARY KEY (id) |
| question_attempts_exercise_attempt_id_question_id_key | u | UNIQUE (exercise_attempt_id, question_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| question_attempts_exercise_attempt_id_question_id_key | true | — | CREATE UNIQUE INDEX question_attempts_exercise_attempt_id_question_id_key ON learning.question_attempts USING btree (exercise_attempt_id, question_id) |
| question_attempts_pkey | true | — | CREATE UNIQUE INDEX question_attempts_pkey ON learning.question_attempts USING btree (id) |

#### learning.translation_requests

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| user_id | uuid | true | — | — |
| source_language | character varying(8) | false | — | — |
| target_language | character varying(8) | false | — | — |
| source_text | text | false | — | — |
| translated_text | text | true | — | — |
| provider | character varying(64) | true | — | — |
| model | character varying(128) | true | — | — |
| status | character varying(16) | false | 'pending'::character varying | — |
| error_code | character varying(64) | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| completed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| translation_requests_language_pair_check | c | CHECK (source_language::text = 'zh'::text AND target_language::text = 'lo'::text OR source_language::text = 'lo'::text AND target_language::text = 'zh'::text) |
| translation_requests_status_check | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying]::text[])) |
| translation_requests_created_at_not_null | n | NOT NULL created_at |
| translation_requests_id_not_null | n | NOT NULL id |
| translation_requests_source_language_not_null | n | NOT NULL source_language |
| translation_requests_source_text_not_null | n | NOT NULL source_text |
| translation_requests_status_not_null | n | NOT NULL status |
| translation_requests_target_language_not_null | n | NOT NULL target_language |
| translation_requests_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_translation_requests_user_time | false | (user_id IS NOT NULL) | CREATE INDEX idx_translation_requests_user_time ON learning.translation_requests USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL) |
| translation_requests_pkey | true | — | CREATE UNIQUE INDEX translation_requests_pkey ON learning.translation_requests USING btree (id) |

### social

#### social.social_blocks

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| blocker_profile_id | bigint | false | — | — |
| blocked_profile_id | bigint | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_blocks_check | c | CHECK (blocker_profile_id <> blocked_profile_id) |
| social_blocks_blocked_profile_id_fkey | f | FOREIGN KEY (blocked_profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_blocks_blocker_profile_id_fkey | f | FOREIGN KEY (blocker_profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_blocks_blocked_profile_id_not_null | n | NOT NULL blocked_profile_id |
| social_blocks_blocker_profile_id_not_null | n | NOT NULL blocker_profile_id |
| social_blocks_created_at_not_null | n | NOT NULL created_at |
| social_blocks_pkey | p | PRIMARY KEY (blocker_profile_id, blocked_profile_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_blocks_pkey | true | — | CREATE UNIQUE INDEX social_blocks_pkey ON social.social_blocks USING btree (blocker_profile_id, blocked_profile_id) |

#### social.social_discovery_exposures

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| viewer_profile_id | bigint | false | — | — |
| candidate_profile_id | bigint | false | — | — |
| source | character varying(30) | false | 'discovery'::character varying | — |
| exposed_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_discovery_exposures_check | c | CHECK (viewer_profile_id <> candidate_profile_id) |
| social_discovery_exposures_candidate_profile_id_fkey | f | FOREIGN KEY (candidate_profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_discovery_exposures_viewer_profile_id_fkey | f | FOREIGN KEY (viewer_profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_discovery_exposures_candidate_profile_id_not_null | n | NOT NULL candidate_profile_id |
| social_discovery_exposures_exposed_at_not_null | n | NOT NULL exposed_at |
| social_discovery_exposures_id_not_null | n | NOT NULL id |
| social_discovery_exposures_source_not_null | n | NOT NULL source |
| social_discovery_exposures_viewer_profile_id_not_null | n | NOT NULL viewer_profile_id |
| social_discovery_exposures_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_social_exposures_candidate_time | false | — | CREATE INDEX idx_social_exposures_candidate_time ON social.social_discovery_exposures USING btree (candidate_profile_id, exposed_at DESC) |
| idx_social_exposures_pair_time | false | — | CREATE INDEX idx_social_exposures_pair_time ON social.social_discovery_exposures USING btree (viewer_profile_id, candidate_profile_id, exposed_at DESC) |
| idx_social_exposures_viewer_time | false | — | CREATE INDEX idx_social_exposures_viewer_time ON social.social_discovery_exposures USING btree (viewer_profile_id, exposed_at DESC) |
| social_discovery_exposures_pkey | true | — | CREATE UNIQUE INDEX social_discovery_exposures_pkey ON social.social_discovery_exposures USING btree (id) |

#### social.social_follows

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| follower_profile_id | bigint | false | — | — |
| following_profile_id | bigint | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_follows_check | c | CHECK (follower_profile_id <> following_profile_id) |
| social_follows_follower_profile_id_fkey | f | FOREIGN KEY (follower_profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_follows_following_profile_id_fkey | f | FOREIGN KEY (following_profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_follows_created_at_not_null | n | NOT NULL created_at |
| social_follows_follower_profile_id_not_null | n | NOT NULL follower_profile_id |
| social_follows_following_profile_id_not_null | n | NOT NULL following_profile_id |
| social_follows_pkey | p | PRIMARY KEY (follower_profile_id, following_profile_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_social_follows_following_time | false | — | CREATE INDEX idx_social_follows_following_time ON social.social_follows USING btree (following_profile_id, created_at DESC) |
| social_follows_pkey | true | — | CREATE UNIQUE INDEX social_follows_pkey ON social.social_follows USING btree (follower_profile_id, following_profile_id) |

#### social.social_interests

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| code | character varying(50) | false | — | — |
| name_zh | character varying(50) | false | — | — |
| name_lo | character varying(50) | true | — | — |
| name_en | character varying(50) | true | — | — |
| category | character varying(50) | true | — | — |
| sort_order | integer | false | 0 | — |
| is_active | boolean | false | true | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_interests_code_not_null | n | NOT NULL code |
| social_interests_created_at_not_null | n | NOT NULL created_at |
| social_interests_id_not_null | n | NOT NULL id |
| social_interests_is_active_not_null | n | NOT NULL is_active |
| social_interests_name_zh_not_null | n | NOT NULL name_zh |
| social_interests_sort_order_not_null | n | NOT NULL sort_order |
| social_interests_updated_at_not_null | n | NOT NULL updated_at |
| social_interests_pkey | p | PRIMARY KEY (id) |
| social_interests_code_key | u | UNIQUE (code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_interests_code_key | true | — | CREATE UNIQUE INDEX social_interests_code_key ON social.social_interests USING btree (code) |
| social_interests_pkey | true | — | CREATE UNIQUE INDEX social_interests_pkey ON social.social_interests USING btree (id) |

#### social.social_matches

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | gen_random_uuid() | — |
| profile_a_id | bigint | false | — | — |
| profile_b_id | bigint | false | — | — |
| status | character varying(20) | false | 'active'::character varying | — |
| matched_at | timestamp with time zone | false | now() | — |
| ended_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_matches_check | c | CHECK (profile_a_id < profile_b_id) |
| social_matches_check1 | c | CHECK (status::text = 'active'::text AND ended_at IS NULL OR status::text = 'ended'::text AND ended_at IS NOT NULL) |
| social_matches_status_check | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'ended'::character varying]::text[])) |
| social_matches_profile_a_id_fkey | f | FOREIGN KEY (profile_a_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_matches_profile_b_id_fkey | f | FOREIGN KEY (profile_b_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_matches_created_at_not_null | n | NOT NULL created_at |
| social_matches_id_not_null | n | NOT NULL id |
| social_matches_matched_at_not_null | n | NOT NULL matched_at |
| social_matches_profile_a_id_not_null | n | NOT NULL profile_a_id |
| social_matches_profile_b_id_not_null | n | NOT NULL profile_b_id |
| social_matches_public_id_not_null | n | NOT NULL public_id |
| social_matches_status_not_null | n | NOT NULL status |
| social_matches_updated_at_not_null | n | NOT NULL updated_at |
| social_matches_pkey | p | PRIMARY KEY (id) |
| social_matches_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_matches_pkey | true | — | CREATE UNIQUE INDEX social_matches_pkey ON social.social_matches USING btree (id) |
| social_matches_public_id_key | true | — | CREATE UNIQUE INDEX social_matches_public_id_key ON social.social_matches USING btree (public_id) |
| uq_social_matches_active_pair | true | ((status)::text = 'active'::text) | CREATE UNIQUE INDEX uq_social_matches_active_pair ON social.social_matches USING btree (profile_a_id, profile_b_id) WHERE ((status)::text = 'active'::text) |

#### social.social_post_comments

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | gen_random_uuid() | — |
| post_id | bigint | false | — | — |
| profile_id | bigint | false | — | — |
| parent_comment_id | bigint | true | — | — |
| reply_to_profile_id | bigint | true | — | — |
| content | character varying(1000) | false | — | — |
| moderation_status | character varying(20) | false | 'pending'::character varying | — |
| moderated_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| deleted_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_post_comments_moderation_status_check | c | CHECK (moderation_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])) |
| social_post_comments_parent_comment_id_fkey | f | FOREIGN KEY (parent_comment_id) REFERENCES social.social_post_comments(id) ON DELETE RESTRICT |
| social_post_comments_post_id_fkey | f | FOREIGN KEY (post_id) REFERENCES social.social_posts(id) ON DELETE RESTRICT |
| social_post_comments_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_post_comments_reply_to_profile_id_fkey | f | FOREIGN KEY (reply_to_profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_post_comments_content_not_null | n | NOT NULL content |
| social_post_comments_created_at_not_null | n | NOT NULL created_at |
| social_post_comments_id_not_null | n | NOT NULL id |
| social_post_comments_moderation_status_not_null | n | NOT NULL moderation_status |
| social_post_comments_post_id_not_null | n | NOT NULL post_id |
| social_post_comments_profile_id_not_null | n | NOT NULL profile_id |
| social_post_comments_public_id_not_null | n | NOT NULL public_id |
| social_post_comments_updated_at_not_null | n | NOT NULL updated_at |
| social_post_comments_pkey | p | PRIMARY KEY (id) |
| social_post_comments_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_social_post_comments_parent_time | false | (parent_comment_id IS NOT NULL) | CREATE INDEX idx_social_post_comments_parent_time ON social.social_post_comments USING btree (parent_comment_id, created_at) WHERE (parent_comment_id IS NOT NULL) |
| idx_social_post_comments_post_time | false | — | CREATE INDEX idx_social_post_comments_post_time ON social.social_post_comments USING btree (post_id, created_at) |
| social_post_comments_pkey | true | — | CREATE UNIQUE INDEX social_post_comments_pkey ON social.social_post_comments USING btree (id) |
| social_post_comments_public_id_key | true | — | CREATE UNIQUE INDEX social_post_comments_public_id_key ON social.social_post_comments USING btree (public_id) |

#### social.social_post_likes

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| post_id | bigint | false | — | — |
| profile_id | bigint | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_post_likes_post_id_fkey | f | FOREIGN KEY (post_id) REFERENCES social.social_posts(id) ON DELETE RESTRICT |
| social_post_likes_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_post_likes_created_at_not_null | n | NOT NULL created_at |
| social_post_likes_post_id_not_null | n | NOT NULL post_id |
| social_post_likes_profile_id_not_null | n | NOT NULL profile_id |
| social_post_likes_pkey | p | PRIMARY KEY (post_id, profile_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_social_post_likes_profile_time | false | — | CREATE INDEX idx_social_post_likes_profile_time ON social.social_post_likes USING btree (profile_id, created_at DESC) |
| social_post_likes_pkey | true | — | CREATE UNIQUE INDEX social_post_likes_pkey ON social.social_post_likes USING btree (post_id, profile_id) |

#### social.social_post_media

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| post_id | bigint | false | — | — |
| media_id | uuid | false | — | — |
| position | smallint | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_post_media_position_check | c | CHECK ("position" >= 1 AND "position" <= 9) |
| social_post_media_post_id_fkey | f | FOREIGN KEY (post_id) REFERENCES social.social_posts(id) ON DELETE RESTRICT |
| social_post_media_created_at_not_null | n | NOT NULL created_at |
| social_post_media_media_id_not_null | n | NOT NULL media_id |
| social_post_media_position_not_null | n | NOT NULL "position" |
| social_post_media_post_id_not_null | n | NOT NULL post_id |
| social_post_media_pkey | p | PRIMARY KEY (post_id, media_id) |
| social_post_media_post_id_position_key | u | UNIQUE (post_id, "position") |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_post_media_pkey | true | — | CREATE UNIQUE INDEX social_post_media_pkey ON social.social_post_media USING btree (post_id, media_id) |
| social_post_media_post_id_position_key | true | — | CREATE UNIQUE INDEX social_post_media_post_id_position_key ON social.social_post_media USING btree (post_id, "position") |

#### social.social_posts

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | gen_random_uuid() | — |
| profile_id | bigint | false | — | — |
| content | character varying(2000) | true | — | — |
| visibility | character varying(20) | false | 'followers'::character varying | — |
| moderation_status | character varying(20) | false | 'pending'::character varying | — |
| moderated_at | timestamp with time zone | true | — | — |
| published_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| deleted_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_posts_moderation_status_check | c | CHECK (moderation_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])) |
| social_posts_visibility_check | c | CHECK (visibility::text = ANY (ARRAY['public'::character varying, 'followers'::character varying]::text[])) |
| social_posts_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_posts_created_at_not_null | n | NOT NULL created_at |
| social_posts_id_not_null | n | NOT NULL id |
| social_posts_moderation_status_not_null | n | NOT NULL moderation_status |
| social_posts_profile_id_not_null | n | NOT NULL profile_id |
| social_posts_public_id_not_null | n | NOT NULL public_id |
| social_posts_updated_at_not_null | n | NOT NULL updated_at |
| social_posts_visibility_not_null | n | NOT NULL visibility |
| social_posts_pkey | p | PRIMARY KEY (id) |
| social_posts_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_social_posts_profile_feed | false | ((deleted_at IS NULL) AND ((moderation_status)::text = 'approved'::text) AND (published_at IS NOT NULL)) | CREATE INDEX idx_social_posts_profile_feed ON social.social_posts USING btree (profile_id, published_at DESC) WHERE ((deleted_at IS NULL) AND ((moderation_status)::text = 'approved'::text) AND (published_at IS NOT NULL)) |
| social_posts_pkey | true | — | CREATE UNIQUE INDEX social_posts_pkey ON social.social_posts USING btree (id) |
| social_posts_public_id_key | true | — | CREATE UNIQUE INDEX social_posts_public_id_key ON social.social_posts USING btree (public_id) |

#### social.social_preference_countries

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| profile_id | bigint | false | — | — |
| country_code | character(2) | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_preference_countries_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_preference_countries_country_code_not_null | n | NOT NULL country_code |
| social_preference_countries_profile_id_not_null | n | NOT NULL profile_id |
| social_preference_countries_pkey | p | PRIMARY KEY (profile_id, country_code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_preference_countries_pkey | true | — | CREATE UNIQUE INDEX social_preference_countries_pkey ON social.social_preference_countries USING btree (profile_id, country_code) |

#### social.social_preference_genders

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| profile_id | bigint | false | — | — |
| gender | character varying(20) | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_preference_genders_gender_check | c | CHECK (gender::text = ANY (ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying]::text[])) |
| social_preference_genders_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_preference_genders_gender_not_null | n | NOT NULL gender |
| social_preference_genders_profile_id_not_null | n | NOT NULL profile_id |
| social_preference_genders_pkey | p | PRIMARY KEY (profile_id, gender) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_preference_genders_pkey | true | — | CREATE UNIQUE INDEX social_preference_genders_pkey ON social.social_preference_genders USING btree (profile_id, gender) |

#### social.social_preference_goals

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| profile_id | bigint | false | — | — |
| relationship_goal | character varying(30) | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_preference_goals_relationship_goal_check | c | CHECK (relationship_goal::text = ANY (ARRAY['friendship'::character varying, 'language_exchange'::character varying, 'dating'::character varying, 'serious_relationship'::character varying, 'open_to_anything'::character varying]::text[])) |
| social_preference_goals_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_preference_goals_profile_id_not_null | n | NOT NULL profile_id |
| social_preference_goals_relationship_goal_not_null | n | NOT NULL relationship_goal |
| social_preference_goals_pkey | p | PRIMARY KEY (profile_id, relationship_goal) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_preference_goals_pkey | true | — | CREATE UNIQUE INDEX social_preference_goals_pkey ON social.social_preference_goals USING btree (profile_id, relationship_goal) |

#### social.social_preferences

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| profile_id | bigint | false | — | — |
| min_age | smallint | true | — | — |
| max_age | smallint | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_preferences_check | c | CHECK (min_age IS NULL OR max_age IS NULL OR min_age <= max_age) |
| social_preferences_max_age_check | c | CHECK (max_age IS NULL OR max_age >= 18 AND max_age <= 100) |
| social_preferences_min_age_check | c | CHECK (min_age IS NULL OR min_age >= 18 AND min_age <= 100) |
| social_preferences_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_preferences_created_at_not_null | n | NOT NULL created_at |
| social_preferences_profile_id_not_null | n | NOT NULL profile_id |
| social_preferences_updated_at_not_null | n | NOT NULL updated_at |
| social_preferences_pkey | p | PRIMARY KEY (profile_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_preferences_pkey | true | — | CREATE UNIQUE INDEX social_preferences_pkey ON social.social_preferences USING btree (profile_id) |

#### social.social_profile_interests

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| profile_id | bigint | false | — | — |
| interest_id | bigint | false | — | — |
| sort_order | smallint | false | 0 | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_profile_interests_interest_id_fkey | f | FOREIGN KEY (interest_id) REFERENCES social.social_interests(id) ON DELETE RESTRICT |
| social_profile_interests_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_profile_interests_created_at_not_null | n | NOT NULL created_at |
| social_profile_interests_interest_id_not_null | n | NOT NULL interest_id |
| social_profile_interests_profile_id_not_null | n | NOT NULL profile_id |
| social_profile_interests_sort_order_not_null | n | NOT NULL sort_order |
| social_profile_interests_pkey | p | PRIMARY KEY (profile_id, interest_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_profile_interests_pkey | true | — | CREATE UNIQUE INDEX social_profile_interests_pkey ON social.social_profile_interests USING btree (profile_id, interest_id) |

#### social.social_profile_languages

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| profile_id | bigint | false | — | — |
| language_code | character varying(10) | false | — | — |
| proficiency_level | character varying(20) | true | — | — |
| is_native | boolean | false | false | — |
| is_learning | boolean | false | false | — |
| sort_order | smallint | false | 0 | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_profile_languages_check | c | CHECK (NOT (is_native AND is_learning)) |
| social_profile_languages_level_check | c | CHECK (is_native AND proficiency_level IS NULL OR NOT is_native AND (proficiency_level::text = ANY (ARRAY['beginner'::character varying, 'elementary'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'fluent'::character varying]::text[]))) |
| social_profile_languages_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_profile_languages_created_at_not_null | n | NOT NULL created_at |
| social_profile_languages_is_learning_not_null | n | NOT NULL is_learning |
| social_profile_languages_is_native_not_null | n | NOT NULL is_native |
| social_profile_languages_language_code_not_null | n | NOT NULL language_code |
| social_profile_languages_profile_id_not_null | n | NOT NULL profile_id |
| social_profile_languages_sort_order_not_null | n | NOT NULL sort_order |
| social_profile_languages_updated_at_not_null | n | NOT NULL updated_at |
| social_profile_languages_pkey | p | PRIMARY KEY (profile_id, language_code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_profile_languages_pkey | true | — | CREATE UNIQUE INDEX social_profile_languages_pkey ON social.social_profile_languages USING btree (profile_id, language_code) |
| uq_social_profile_languages_native | true | is_native | CREATE UNIQUE INDEX uq_social_profile_languages_native ON social.social_profile_languages USING btree (profile_id) WHERE is_native |

#### social.social_profile_photos

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | gen_random_uuid() | — |
| profile_id | bigint | false | — | — |
| media_id | uuid | false | — | — |
| position | smallint | false | — | — |
| moderation_status | character varying(20) | false | 'pending'::character varying | — |
| moderated_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| deleted_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_profile_photos_moderation_status_check | c | CHECK (moderation_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])) |
| social_profile_photos_position_check | c | CHECK ("position" >= 1 AND "position" <= 6) |
| social_profile_photos_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_profile_photos_created_at_not_null | n | NOT NULL created_at |
| social_profile_photos_id_not_null | n | NOT NULL id |
| social_profile_photos_media_id_not_null | n | NOT NULL media_id |
| social_profile_photos_moderation_status_not_null | n | NOT NULL moderation_status |
| social_profile_photos_position_not_null | n | NOT NULL "position" |
| social_profile_photos_profile_id_not_null | n | NOT NULL profile_id |
| social_profile_photos_public_id_not_null | n | NOT NULL public_id |
| social_profile_photos_updated_at_not_null | n | NOT NULL updated_at |
| social_profile_photos_pkey | p | PRIMARY KEY (id) |
| social_profile_photos_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_profile_photos_pkey | true | — | CREATE UNIQUE INDEX social_profile_photos_pkey ON social.social_profile_photos USING btree (id) |
| social_profile_photos_public_id_key | true | — | CREATE UNIQUE INDEX social_profile_photos_public_id_key ON social.social_profile_photos USING btree (public_id) |
| uq_social_profile_photos_active_media | true | (deleted_at IS NULL) | CREATE UNIQUE INDEX uq_social_profile_photos_active_media ON social.social_profile_photos USING btree (profile_id, media_id) WHERE (deleted_at IS NULL) |
| uq_social_profile_photos_active_position | true | (deleted_at IS NULL) | CREATE UNIQUE INDEX uq_social_profile_photos_active_position ON social.social_profile_photos USING btree (profile_id, "position") WHERE (deleted_at IS NULL) |

#### social.social_profile_prompts

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | gen_random_uuid() | — |
| profile_id | bigint | false | — | — |
| prompt_template_id | bigint | false | — | — |
| answer | character varying(500) | false | — | — |
| position | smallint | false | — | — |
| moderation_status | character varying(20) | false | 'pending'::character varying | — |
| moderated_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| deleted_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_profile_prompts_moderation_status_check | c | CHECK (moderation_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])) |
| social_profile_prompts_position_check | c | CHECK ("position" >= 1 AND "position" <= 3) |
| social_profile_prompts_profile_id_fkey | f | FOREIGN KEY (profile_id) REFERENCES social.social_profiles(id) ON DELETE RESTRICT |
| social_profile_prompts_prompt_template_id_fkey | f | FOREIGN KEY (prompt_template_id) REFERENCES social.social_prompt_templates(id) ON DELETE RESTRICT |
| social_profile_prompts_answer_not_null | n | NOT NULL answer |
| social_profile_prompts_created_at_not_null | n | NOT NULL created_at |
| social_profile_prompts_id_not_null | n | NOT NULL id |
| social_profile_prompts_moderation_status_not_null | n | NOT NULL moderation_status |
| social_profile_prompts_position_not_null | n | NOT NULL "position" |
| social_profile_prompts_profile_id_not_null | n | NOT NULL profile_id |
| social_profile_prompts_prompt_template_id_not_null | n | NOT NULL prompt_template_id |
| social_profile_prompts_public_id_not_null | n | NOT NULL public_id |
| social_profile_prompts_updated_at_not_null | n | NOT NULL updated_at |
| social_profile_prompts_pkey | p | PRIMARY KEY (id) |
| social_profile_prompts_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_profile_prompts_pkey | true | — | CREATE UNIQUE INDEX social_profile_prompts_pkey ON social.social_profile_prompts USING btree (id) |
| social_profile_prompts_public_id_key | true | — | CREATE UNIQUE INDEX social_profile_prompts_public_id_key ON social.social_profile_prompts USING btree (public_id) |
| uq_social_profile_prompts_active_position | true | (deleted_at IS NULL) | CREATE UNIQUE INDEX uq_social_profile_prompts_active_position ON social.social_profile_prompts USING btree (profile_id, "position") WHERE (deleted_at IS NULL) |
| uq_social_profile_prompts_active_template | true | (deleted_at IS NULL) | CREATE UNIQUE INDEX uq_social_profile_prompts_active_template ON social.social_profile_prompts USING btree (profile_id, prompt_template_id) WHERE (deleted_at IS NULL) |

#### social.social_profiles

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | gen_random_uuid() | — |
| user_id | uuid | false | — | — |
| display_name | character varying(50) | false | — | — |
| gender | character varying(20) | true | — | — |
| birth_date | date | true | — | — |
| country_code | character(2) | true | — | — |
| region | character varying(100) | true | — | — |
| city | character varying(100) | true | — | — |
| occupation | character varying(100) | true | — | — |
| education_level | character varying(30) | true | — | — |
| bio | character varying(1000) | true | — | — |
| relationship_goal | character varying(30) | true | — | — |
| profile_status | character varying(20) | false | 'draft'::character varying | — |
| moderation_status | character varying(20) | false | 'pending'::character varying | — |
| completeness_score | smallint | false | 0 | — |
| published_at | timestamp with time zone | true | — | — |
| last_active_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_profiles_completeness_score_check | c | CHECK (completeness_score >= 0 AND completeness_score <= 100) |
| social_profiles_gender_check | c | CHECK (gender IS NULL OR (gender::text = ANY (ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying]::text[]))) |
| social_profiles_moderation_status_check | c | CHECK (moderation_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'restricted'::character varying]::text[])) |
| social_profiles_profile_status_check | c | CHECK (profile_status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'closed'::character varying]::text[])) |
| social_profiles_relationship_goal_check | c | CHECK (relationship_goal IS NULL OR (relationship_goal::text = ANY (ARRAY['friendship'::character varying, 'language_exchange'::character varying, 'dating'::character varying, 'serious_relationship'::character varying, 'open_to_anything'::character varying]::text[]))) |
| social_profiles_completeness_score_not_null | n | NOT NULL completeness_score |
| social_profiles_created_at_not_null | n | NOT NULL created_at |
| social_profiles_display_name_not_null | n | NOT NULL display_name |
| social_profiles_id_not_null | n | NOT NULL id |
| social_profiles_moderation_status_not_null | n | NOT NULL moderation_status |
| social_profiles_profile_status_not_null | n | NOT NULL profile_status |
| social_profiles_public_id_not_null | n | NOT NULL public_id |
| social_profiles_updated_at_not_null | n | NOT NULL updated_at |
| social_profiles_user_id_not_null | n | NOT NULL user_id |
| social_profiles_pkey | p | PRIMARY KEY (id) |
| social_profiles_public_id_key | u | UNIQUE (public_id) |
| social_profiles_user_id_key | u | UNIQUE (user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_profiles_pkey | true | — | CREATE UNIQUE INDEX social_profiles_pkey ON social.social_profiles USING btree (id) |
| social_profiles_public_id_key | true | — | CREATE UNIQUE INDEX social_profiles_public_id_key ON social.social_profiles USING btree (public_id) |
| social_profiles_user_id_key | true | — | CREATE UNIQUE INDEX social_profiles_user_id_key ON social.social_profiles USING btree (user_id) |

#### social.social_prompt_templates

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| code | character varying(50) | false | — | — |
| question_zh | character varying(200) | false | — | — |
| question_lo | character varying(200) | true | — | — |
| question_en | character varying(200) | true | — | — |
| category | character varying(50) | true | — | — |
| sort_order | integer | false | 0 | — |
| is_active | boolean | false | true | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| social_prompt_templates_code_not_null | n | NOT NULL code |
| social_prompt_templates_created_at_not_null | n | NOT NULL created_at |
| social_prompt_templates_id_not_null | n | NOT NULL id |
| social_prompt_templates_is_active_not_null | n | NOT NULL is_active |
| social_prompt_templates_question_zh_not_null | n | NOT NULL question_zh |
| social_prompt_templates_sort_order_not_null | n | NOT NULL sort_order |
| social_prompt_templates_updated_at_not_null | n | NOT NULL updated_at |
| social_prompt_templates_pkey | p | PRIMARY KEY (id) |
| social_prompt_templates_code_key | u | UNIQUE (code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| social_prompt_templates_code_key | true | — | CREATE UNIQUE INDEX social_prompt_templates_code_key ON social.social_prompt_templates USING btree (code) |
| social_prompt_templates_pkey | true | — | CREATE UNIQUE INDEX social_prompt_templates_pkey ON social.social_prompt_templates USING btree (id) |

### chat

#### chat.chat_conversation

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| type | character varying(32) | false | — | — |
| status | character varying(32) | false | — | — |
| last_message_seq | bigint | false | 0 | — |
| last_message_id | bigint | true | — | — |
| last_message_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_chat_conversation_last_message_seq | c | CHECK (last_message_seq >= 0) |
| ck_chat_conversation_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'closed'::character varying]::text[])) |
| ck_chat_conversation_type | c | CHECK (type::text = 'direct'::text) |
| fk_chat_conversation_last_message | f | FOREIGN KEY (last_message_id) REFERENCES chat.chat_message(id) |
| chat_conversation_created_at_not_null | n | NOT NULL created_at |
| chat_conversation_id_not_null | n | NOT NULL id |
| chat_conversation_last_message_seq_not_null | n | NOT NULL last_message_seq |
| chat_conversation_public_id_not_null | n | NOT NULL public_id |
| chat_conversation_status_not_null | n | NOT NULL status |
| chat_conversation_type_not_null | n | NOT NULL type |
| chat_conversation_updated_at_not_null | n | NOT NULL updated_at |
| chat_conversation_pkey | p | PRIMARY KEY (id) |
| chat_conversation_public_id_key | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| chat_conversation_pkey | true | — | CREATE UNIQUE INDEX chat_conversation_pkey ON chat.chat_conversation USING btree (id) |
| chat_conversation_public_id_key | true | — | CREATE UNIQUE INDEX chat_conversation_public_id_key ON chat.chat_conversation USING btree (public_id) |

#### chat.chat_conversation_member

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| conversation_id | bigint | false | — | — |
| user_id | uuid | false | — | — |
| joined_at | timestamp with time zone | false | now() | — |
| last_read_seq | bigint | false | 0 | — |
| last_read_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_chat_member_last_read | c | CHECK (last_read_seq = 0 AND last_read_at IS NULL OR last_read_seq > 0 AND last_read_at IS NOT NULL) |
| ck_chat_member_last_read_seq | c | CHECK (last_read_seq >= 0) |
| fk_chat_member_conversation | f | FOREIGN KEY (conversation_id) REFERENCES chat.chat_conversation(id) |
| chat_conversation_member_conversation_id_not_null | n | NOT NULL conversation_id |
| chat_conversation_member_joined_at_not_null | n | NOT NULL joined_at |
| chat_conversation_member_last_read_seq_not_null | n | NOT NULL last_read_seq |
| chat_conversation_member_user_id_not_null | n | NOT NULL user_id |
| chat_conversation_member_pkey | p | PRIMARY KEY (conversation_id, user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| chat_conversation_member_pkey | true | — | CREATE UNIQUE INDEX chat_conversation_member_pkey ON chat.chat_conversation_member USING btree (conversation_id, user_id) |
| idx_chat_member_user | false | — | CREATE INDEX idx_chat_member_user ON chat.chat_conversation_member USING btree (user_id, conversation_id) |

#### chat.chat_conversation_user_state

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| conversation_id | bigint | false | — | — |
| user_id | uuid | false | — | — |
| hidden_at | timestamp with time zone | true | — | — |
| cleared_before_seq | bigint | false | 0 | — |
| is_pinned | boolean | false | false | — |
| pinned_at | timestamp with time zone | true | — | — |
| is_muted | boolean | false | false | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_chat_conversation_user_state_cleared_seq | c | CHECK (cleared_before_seq >= 0) |
| ck_chat_conversation_user_state_pin | c | CHECK (is_pinned = false AND pinned_at IS NULL OR is_pinned = true AND pinned_at IS NOT NULL) |
| fk_chat_conversation_user_state_member | f | FOREIGN KEY (conversation_id, user_id) REFERENCES chat.chat_conversation_member(conversation_id, user_id) |
| chat_conversation_user_state_cleared_before_seq_not_null | n | NOT NULL cleared_before_seq |
| chat_conversation_user_state_conversation_id_not_null | n | NOT NULL conversation_id |
| chat_conversation_user_state_is_muted_not_null | n | NOT NULL is_muted |
| chat_conversation_user_state_is_pinned_not_null | n | NOT NULL is_pinned |
| chat_conversation_user_state_updated_at_not_null | n | NOT NULL updated_at |
| chat_conversation_user_state_user_id_not_null | n | NOT NULL user_id |
| chat_conversation_user_state_pkey | p | PRIMARY KEY (conversation_id, user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| chat_conversation_user_state_pkey | true | — | CREATE UNIQUE INDEX chat_conversation_user_state_pkey ON chat.chat_conversation_user_state USING btree (conversation_id, user_id) |
| idx_chat_conversation_user_state_user | false | — | CREATE INDEX idx_chat_conversation_user_state_user ON chat.chat_conversation_user_state USING btree (user_id, conversation_id) |

#### chat.chat_direct_conversation

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| conversation_id | bigint | false | — | — |
| user_low_id | uuid | false | — | — |
| user_high_id | uuid | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_chat_direct_user_order | c | CHECK (user_low_id < user_high_id) |
| fk_chat_direct_conversation | f | FOREIGN KEY (conversation_id) REFERENCES chat.chat_conversation(id) |
| chat_direct_conversation_conversation_id_not_null | n | NOT NULL conversation_id |
| chat_direct_conversation_user_high_id_not_null | n | NOT NULL user_high_id |
| chat_direct_conversation_user_low_id_not_null | n | NOT NULL user_low_id |
| chat_direct_conversation_pkey | p | PRIMARY KEY (conversation_id) |
| uq_chat_direct_users | u | UNIQUE (user_low_id, user_high_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| chat_direct_conversation_pkey | true | — | CREATE UNIQUE INDEX chat_direct_conversation_pkey ON chat.chat_direct_conversation USING btree (conversation_id) |
| uq_chat_direct_users | true | — | CREATE UNIQUE INDEX uq_chat_direct_users ON chat.chat_direct_conversation USING btree (user_low_id, user_high_id) |

#### chat.chat_message

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | — | — |
| conversation_id | bigint | false | — | — |
| sender_user_id | uuid | false | — | — |
| client_message_id | uuid | false | — | — |
| seq | bigint | false | — | — |
| type | character varying(32) | false | — | — |
| status | character varying(32) | false | — | — |
| reply_to_message_id | bigint | true | — | — |
| recalled_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_chat_message_recall | c | CHECK (status::text = 'normal'::text AND recalled_at IS NULL OR status::text = 'recalled'::text AND recalled_at IS NOT NULL) |
| ck_chat_message_seq | c | CHECK (seq > 0) |
| ck_chat_message_status | c | CHECK (status::text = ANY (ARRAY['normal'::character varying, 'recalled'::character varying]::text[])) |
| ck_chat_message_type | c | CHECK (type::text = ANY (ARRAY['text'::character varying, 'image'::character varying]::text[])) |
| fk_chat_message_conversation | f | FOREIGN KEY (conversation_id) REFERENCES chat.chat_conversation(id) |
| fk_chat_message_reply | f | FOREIGN KEY (reply_to_message_id) REFERENCES chat.chat_message(id) |
| fk_chat_message_sender_member | f | FOREIGN KEY (conversation_id, sender_user_id) REFERENCES chat.chat_conversation_member(conversation_id, user_id) |
| chat_message_client_message_id_not_null | n | NOT NULL client_message_id |
| chat_message_conversation_id_not_null | n | NOT NULL conversation_id |
| chat_message_created_at_not_null | n | NOT NULL created_at |
| chat_message_id_not_null | n | NOT NULL id |
| chat_message_public_id_not_null | n | NOT NULL public_id |
| chat_message_sender_user_id_not_null | n | NOT NULL sender_user_id |
| chat_message_seq_not_null | n | NOT NULL seq |
| chat_message_status_not_null | n | NOT NULL status |
| chat_message_type_not_null | n | NOT NULL type |
| chat_message_pkey | p | PRIMARY KEY (id) |
| chat_message_public_id_key | u | UNIQUE (public_id) |
| uq_chat_message_client_id | u | UNIQUE (sender_user_id, client_message_id) |
| uq_chat_message_seq | u | UNIQUE (conversation_id, seq) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| chat_message_pkey | true | — | CREATE UNIQUE INDEX chat_message_pkey ON chat.chat_message USING btree (id) |
| chat_message_public_id_key | true | — | CREATE UNIQUE INDEX chat_message_public_id_key ON chat.chat_message USING btree (public_id) |
| uq_chat_message_client_id | true | — | CREATE UNIQUE INDEX uq_chat_message_client_id ON chat.chat_message USING btree (sender_user_id, client_message_id) |
| uq_chat_message_seq | true | — | CREATE UNIQUE INDEX uq_chat_message_seq ON chat.chat_message USING btree (conversation_id, seq) |

#### chat.chat_message_image

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| message_id | bigint | false | — | — |
| asset_id | uuid | false | — | — |
| position | smallint | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_chat_message_image_position | c | CHECK ("position" >= 0) |
| fk_chat_message_image_message | f | FOREIGN KEY (message_id) REFERENCES chat.chat_message(id) |
| chat_message_image_asset_id_not_null | n | NOT NULL asset_id |
| chat_message_image_message_id_not_null | n | NOT NULL message_id |
| chat_message_image_position_not_null | n | NOT NULL "position" |
| chat_message_image_pkey | p | PRIMARY KEY (message_id, "position") |
| uq_chat_message_image_asset | u | UNIQUE (message_id, asset_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| chat_message_image_pkey | true | — | CREATE UNIQUE INDEX chat_message_image_pkey ON chat.chat_message_image USING btree (message_id, "position") |
| uq_chat_message_image_asset | true | — | CREATE UNIQUE INDEX uq_chat_message_image_asset ON chat.chat_message_image USING btree (message_id, asset_id) |

#### chat.chat_message_text

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| message_id | bigint | false | — | — |
| text | text | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_chat_message_text_not_blank | c | CHECK (length(btrim(text)) > 0) |
| fk_chat_message_text_message | f | FOREIGN KEY (message_id) REFERENCES chat.chat_message(id) |
| chat_message_text_message_id_not_null | n | NOT NULL message_id |
| chat_message_text_text_not_null | n | NOT NULL text |
| chat_message_text_pkey | p | PRIMARY KEY (message_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| chat_message_text_pkey | true | — | CREATE UNIQUE INDEX chat_message_text_pkey ON chat.chat_message_text USING btree (message_id) |

### audio

#### audio.audio_asset_versions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| slot_id | uuid | false | — | — |
| task_id | uuid | false | — | — |
| version | integer | false | — | — |
| generation_attempt_id | uuid | true | — | — |
| producer_operator_id | uuid | true | — | — |
| content_revision_id | uuid | false | — | — |
| audio_input_hash | character varying | false | — | — |
| asset_id | uuid | false | — | — |
| duration_ms | bigint | false | — | — |
| sample_rate_hz | integer | true | — | — |
| channels | smallint | true | — | — |
| review_status | character varying(32) | false | 'pending_review'::character varying | — |
| first_published_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_asset_versions_channels_check | c | CHECK (channels IS NULL OR channels > 0) |
| audio_asset_versions_duration_ms_check | c | CHECK (duration_ms > 0) |
| audio_asset_versions_review_status_check | c | CHECK (review_status::text = ANY (ARRAY['pending_review'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])) |
| audio_asset_versions_sample_rate_hz_check | c | CHECK (sample_rate_hz IS NULL OR sample_rate_hz > 0) |
| audio_asset_versions_source_check | c | CHECK (generation_attempt_id IS NOT NULL AND producer_operator_id IS NULL OR generation_attempt_id IS NULL AND producer_operator_id IS NOT NULL) |
| audio_asset_versions_version_check | c | CHECK (version > 0) |
| audio_asset_versions_generation_attempt_id_fkey | f | FOREIGN KEY (generation_attempt_id) REFERENCES audio.audio_generation_attempts(id) ON DELETE RESTRICT |
| audio_asset_versions_slot_id_fkey | f | FOREIGN KEY (slot_id) REFERENCES audio.audio_slots(id) ON DELETE RESTRICT |
| audio_asset_versions_task_id_fkey | f | FOREIGN KEY (task_id) REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT |
| audio_asset_versions_asset_id_not_null | n | NOT NULL asset_id |
| audio_asset_versions_audio_input_hash_not_null | n | NOT NULL audio_input_hash |
| audio_asset_versions_content_revision_id_not_null | n | NOT NULL content_revision_id |
| audio_asset_versions_created_at_not_null | n | NOT NULL created_at |
| audio_asset_versions_duration_ms_not_null | n | NOT NULL duration_ms |
| audio_asset_versions_id_not_null | n | NOT NULL id |
| audio_asset_versions_review_status_not_null | n | NOT NULL review_status |
| audio_asset_versions_slot_id_not_null | n | NOT NULL slot_id |
| audio_asset_versions_task_id_not_null | n | NOT NULL task_id |
| audio_asset_versions_updated_at_not_null | n | NOT NULL updated_at |
| audio_asset_versions_version_not_null | n | NOT NULL version |
| audio_asset_versions_pkey | p | PRIMARY KEY (id) |
| audio_asset_versions_asset_id_key | u | UNIQUE (asset_id) |
| audio_asset_versions_generation_attempt_id_key | u | UNIQUE (generation_attempt_id) |
| audio_asset_versions_slot_id_id_key | u | UNIQUE (slot_id, id) |
| audio_asset_versions_slot_id_version_key | u | UNIQUE (slot_id, version) |
| audio_asset_versions_task_id_key | u | UNIQUE (task_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_asset_versions_asset_id_key | true | — | CREATE UNIQUE INDEX audio_asset_versions_asset_id_key ON audio.audio_asset_versions USING btree (asset_id) |
| audio_asset_versions_generation_attempt_id_key | true | — | CREATE UNIQUE INDEX audio_asset_versions_generation_attempt_id_key ON audio.audio_asset_versions USING btree (generation_attempt_id) |
| audio_asset_versions_pkey | true | — | CREATE UNIQUE INDEX audio_asset_versions_pkey ON audio.audio_asset_versions USING btree (id) |
| audio_asset_versions_slot_id_id_key | true | — | CREATE UNIQUE INDEX audio_asset_versions_slot_id_id_key ON audio.audio_asset_versions USING btree (slot_id, id) |
| audio_asset_versions_slot_id_version_key | true | — | CREATE UNIQUE INDEX audio_asset_versions_slot_id_version_key ON audio.audio_asset_versions USING btree (slot_id, version) |
| audio_asset_versions_task_id_key | true | — | CREATE UNIQUE INDEX audio_asset_versions_task_id_key ON audio.audio_asset_versions USING btree (task_id) |

#### audio.audio_default_presets

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| source_domain | character varying | false | — | — |
| content_entity_type | character varying | false | — | — |
| language_code | character varying | false | — | — |
| audio_role | character varying | false | — | — |
| default_tts_preset_key | character varying | false | — | — |
| enabled | boolean | false | true | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_default_presets_audio_role_not_null | n | NOT NULL audio_role |
| audio_default_presets_content_entity_type_not_null | n | NOT NULL content_entity_type |
| audio_default_presets_created_at_not_null | n | NOT NULL created_at |
| audio_default_presets_default_tts_preset_key_not_null | n | NOT NULL default_tts_preset_key |
| audio_default_presets_enabled_not_null | n | NOT NULL enabled |
| audio_default_presets_id_not_null | n | NOT NULL id |
| audio_default_presets_language_code_not_null | n | NOT NULL language_code |
| audio_default_presets_source_domain_not_null | n | NOT NULL source_domain |
| audio_default_presets_updated_at_not_null | n | NOT NULL updated_at |
| audio_default_presets_pkey | p | PRIMARY KEY (id) |
| audio_default_presets_source_domain_content_entity_type_lan_key | u | UNIQUE (source_domain, content_entity_type, language_code, audio_role) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_default_presets_pkey | true | — | CREATE UNIQUE INDEX audio_default_presets_pkey ON audio.audio_default_presets USING btree (id) |
| audio_default_presets_source_domain_content_entity_type_lan_key | true | — | CREATE UNIQUE INDEX audio_default_presets_source_domain_content_entity_type_lan_key ON audio.audio_default_presets USING btree (source_domain, content_entity_type, language_code, audio_role) |

#### audio.audio_generation_attempts

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| task_id | uuid | false | — | — |
| attempt_no | integer | false | — | — |
| request_id | character varying | false | — | — |
| external_job_id | character varying | true | — | — |
| status | character varying(32) | false | — | — |
| transport_retry_count | integer | false | 0 | — |
| next_retry_at | timestamp with time zone | true | — | — |
| lease_until | timestamp with time zone | true | — | — |
| failure_code | character varying | true | — | — |
| failure_message | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| submitted_at | timestamp with time zone | true | — | — |
| completed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_generation_attempts_attempt_no_check | c | CHECK (attempt_no > 0) |
| audio_generation_attempts_status_check | c | CHECK (status::text = ANY (ARRAY['queued'::character varying, 'submitting'::character varying, 'processing'::character varying, 'retry_wait'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'dead_letter'::character varying, 'canceled'::character varying]::text[])) |
| audio_generation_attempts_transport_retry_count_check | c | CHECK (transport_retry_count >= 0) |
| audio_generation_attempts_task_id_fkey | f | FOREIGN KEY (task_id) REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT |
| audio_generation_attempts_attempt_no_not_null | n | NOT NULL attempt_no |
| audio_generation_attempts_created_at_not_null | n | NOT NULL created_at |
| audio_generation_attempts_id_not_null | n | NOT NULL id |
| audio_generation_attempts_request_id_not_null | n | NOT NULL request_id |
| audio_generation_attempts_status_not_null | n | NOT NULL status |
| audio_generation_attempts_task_id_not_null | n | NOT NULL task_id |
| audio_generation_attempts_transport_retry_count_not_null | n | NOT NULL transport_retry_count |
| audio_generation_attempts_pkey | p | PRIMARY KEY (id) |
| audio_generation_attempts_request_id_key | u | UNIQUE (request_id) |
| audio_generation_attempts_task_id_attempt_no_key | u | UNIQUE (task_id, attempt_no) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_generation_attempts_pkey | true | — | CREATE UNIQUE INDEX audio_generation_attempts_pkey ON audio.audio_generation_attempts USING btree (id) |
| audio_generation_attempts_request_id_key | true | — | CREATE UNIQUE INDEX audio_generation_attempts_request_id_key ON audio.audio_generation_attempts USING btree (request_id) |
| audio_generation_attempts_task_id_attempt_no_key | true | — | CREATE UNIQUE INDEX audio_generation_attempts_task_id_attempt_no_key ON audio.audio_generation_attempts USING btree (task_id, attempt_no) |
| idx_audio_attempts_queue | false | — | CREATE INDEX idx_audio_attempts_queue ON audio.audio_generation_attempts USING btree (status, next_retry_at, lease_until) |
| uq_audio_attempts_external_job | true | (external_job_id IS NOT NULL) | CREATE UNIQUE INDEX uq_audio_attempts_external_job ON audio.audio_generation_attempts USING btree (external_job_id) WHERE (external_job_id IS NOT NULL) |

#### audio.audio_reviews

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| asset_version_id | uuid | false | — | — |
| reviewer_operator_id | uuid | false | — | — |
| decision | character varying(32) | false | — | — |
| reject_reason | character varying(32) | true | — | — |
| remark | text | true | — | — |
| request_id | character varying | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_reviews_decision_check | c | CHECK (decision::text = ANY (ARRAY['approved'::character varying, 'rejected'::character varying, 'approval_revoked'::character varying]::text[])) |
| audio_reviews_decision_reason_check | c | CHECK (decision::text = 'rejected'::text AND reject_reason IS NOT NULL OR decision::text <> 'rejected'::text AND reject_reason IS NULL) |
| audio_reviews_reject_reason_check | c | CHECK (reject_reason IS NULL OR (reject_reason::text = ANY (ARRAY['pronunciation_error'::character varying, 'speed_too_fast'::character varying, 'speed_too_slow'::character varying, 'noise'::character varying, 'clipping'::character varying, 'truncated'::character varying, 'text_mismatch'::character varying, 'other'::character varying]::text[]))) |
| audio_reviews_revoke_remark_check | c | CHECK (decision::text <> 'approval_revoked'::text OR remark IS NOT NULL) |
| audio_reviews_asset_version_id_fkey | f | FOREIGN KEY (asset_version_id) REFERENCES audio.audio_asset_versions(id) ON DELETE RESTRICT |
| audio_reviews_asset_version_id_not_null | n | NOT NULL asset_version_id |
| audio_reviews_created_at_not_null | n | NOT NULL created_at |
| audio_reviews_decision_not_null | n | NOT NULL decision |
| audio_reviews_id_not_null | n | NOT NULL id |
| audio_reviews_request_id_not_null | n | NOT NULL request_id |
| audio_reviews_reviewer_operator_id_not_null | n | NOT NULL reviewer_operator_id |
| audio_reviews_pkey | p | PRIMARY KEY (id) |
| audio_reviews_request_id_key | u | UNIQUE (request_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_reviews_pkey | true | — | CREATE UNIQUE INDEX audio_reviews_pkey ON audio.audio_reviews USING btree (id) |
| audio_reviews_request_id_key | true | — | CREATE UNIQUE INDEX audio_reviews_request_id_key ON audio.audio_reviews USING btree (request_id) |
| idx_audio_reviews_asset_time | false | — | CREATE INDEX idx_audio_reviews_asset_time ON audio.audio_reviews USING btree (asset_version_id, created_at) |

#### audio.audio_slots

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| source_domain | character varying | false | — | — |
| content_entity_type | character varying | false | — | — |
| content_entity_id | uuid | false | — | — |
| language_code | character varying | false | — | — |
| audio_role | character varying | false | — | — |
| required_content_revision_id | uuid | false | — | — |
| required_audio_input_hash | character varying | false | — | — |
| status | character varying(32) | false | 'active'::character varying | — |
| official_asset_version_id | uuid | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_slots_source_domain_check | c | CHECK (source_domain::text = 'content'::text) |
| audio_slots_status_check | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'offline'::character varying]::text[])) |
| audio_slots_official_asset_fk | f | FOREIGN KEY (id, official_asset_version_id) REFERENCES audio.audio_asset_versions(slot_id, id) ON DELETE RESTRICT |
| audio_slots_audio_role_not_null | n | NOT NULL audio_role |
| audio_slots_content_entity_id_not_null | n | NOT NULL content_entity_id |
| audio_slots_content_entity_type_not_null | n | NOT NULL content_entity_type |
| audio_slots_id_not_null | n | NOT NULL id |
| audio_slots_language_code_not_null | n | NOT NULL language_code |
| audio_slots_required_audio_input_hash_not_null | n | NOT NULL required_audio_input_hash |
| audio_slots_required_content_revision_id_not_null | n | NOT NULL required_content_revision_id |
| audio_slots_source_domain_not_null | n | NOT NULL source_domain |
| audio_slots_status_not_null | n | NOT NULL status |
| audio_slots_pkey | p | PRIMARY KEY (id) |
| audio_slots_source_domain_content_entity_type_content_entit_key | u | UNIQUE (source_domain, content_entity_type, content_entity_id, language_code, audio_role) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_slots_pkey | true | — | CREATE UNIQUE INDEX audio_slots_pkey ON audio.audio_slots USING btree (id) |
| audio_slots_source_domain_content_entity_type_content_entit_key | true | — | CREATE UNIQUE INDEX audio_slots_source_domain_content_entity_type_content_entit_key ON audio.audio_slots USING btree (source_domain, content_entity_type, content_entity_id, language_code, audio_role) |
| idx_audio_slots_entity | false | — | CREATE INDEX idx_audio_slots_entity ON audio.audio_slots USING btree (content_entity_type, content_entity_id) |
| idx_audio_slots_status | false | — | CREATE INDEX idx_audio_slots_status ON audio.audio_slots USING btree (status) |

#### audio.audio_task_batch_items

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| batch_id | uuid | false | — | — |
| item_no | integer | false | — | — |
| slot_id | uuid | true | — | — |
| task_id | uuid | true | — | — |
| result_status | character varying(32) | false | — | — |
| result_code | character varying | true | — | — |
| result_message | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_batch_items_created_check | c | CHECK (result_status::text <> 'created'::text OR slot_id IS NOT NULL AND task_id IS NOT NULL) |
| audio_task_batch_items_item_no_check | c | CHECK (item_no > 0) |
| audio_task_batch_items_result_status_check | c | CHECK (result_status::text = ANY (ARRAY['created'::character varying, 'skipped'::character varying, 'failed'::character varying]::text[])) |
| audio_task_batch_items_batch_id_fkey | f | FOREIGN KEY (batch_id) REFERENCES audio.audio_task_batches(id) ON DELETE RESTRICT |
| audio_task_batch_items_slot_id_fkey | f | FOREIGN KEY (slot_id) REFERENCES audio.audio_slots(id) ON DELETE RESTRICT |
| audio_task_batch_items_task_id_fkey | f | FOREIGN KEY (task_id) REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT |
| audio_task_batch_items_batch_id_not_null | n | NOT NULL batch_id |
| audio_task_batch_items_created_at_not_null | n | NOT NULL created_at |
| audio_task_batch_items_id_not_null | n | NOT NULL id |
| audio_task_batch_items_item_no_not_null | n | NOT NULL item_no |
| audio_task_batch_items_result_status_not_null | n | NOT NULL result_status |
| audio_task_batch_items_pkey | p | PRIMARY KEY (id) |
| audio_task_batch_items_batch_id_item_no_key | u | UNIQUE (batch_id, item_no) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_task_batch_items_batch_id_item_no_key | true | — | CREATE UNIQUE INDEX audio_task_batch_items_batch_id_item_no_key ON audio.audio_task_batch_items USING btree (batch_id, item_no) |
| audio_task_batch_items_pkey | true | — | CREATE UNIQUE INDEX audio_task_batch_items_pkey ON audio.audio_task_batch_items USING btree (id) |
| uq_audio_batch_items_slot | true | (slot_id IS NOT NULL) | CREATE UNIQUE INDEX uq_audio_batch_items_slot ON audio.audio_task_batch_items USING btree (batch_id, slot_id) WHERE (slot_id IS NOT NULL) |

#### audio.audio_task_batches

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| production_method | character varying(32) | false | — | — |
| tts_preset_key | character varying | true | — | — |
| client_idempotency_key | character varying | false | — | — |
| request_hash | character varying | false | — | — |
| status | character varying(32) | false | — | — |
| requested_count | integer | false | — | — |
| created_count | integer | false | 0 | — |
| skipped_count | integer | false | 0 | — |
| failed_count | integer | false | 0 | — |
| created_by_operator_id | uuid | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| completed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_task_batches_created_count_check | c | CHECK (created_count >= 0) |
| audio_task_batches_failed_count_check | c | CHECK (failed_count >= 0) |
| audio_task_batches_preset_check | c | CHECK (production_method::text = 'tts'::text OR tts_preset_key IS NULL) |
| audio_task_batches_production_method_check | c | CHECK (production_method::text = ANY (ARRAY['tts'::character varying, 'human_recording'::character varying]::text[])) |
| audio_task_batches_requested_count_check | c | CHECK (requested_count >= 0) |
| audio_task_batches_skipped_count_check | c | CHECK (skipped_count >= 0) |
| audio_task_batches_status_check | c | CHECK (status::text = ANY (ARRAY['creating'::character varying, 'completed'::character varying, 'failed'::character varying, 'canceled'::character varying]::text[])) |
| audio_task_batches_client_idempotency_key_not_null | n | NOT NULL client_idempotency_key |
| audio_task_batches_created_at_not_null | n | NOT NULL created_at |
| audio_task_batches_created_by_operator_id_not_null | n | NOT NULL created_by_operator_id |
| audio_task_batches_created_count_not_null | n | NOT NULL created_count |
| audio_task_batches_failed_count_not_null | n | NOT NULL failed_count |
| audio_task_batches_id_not_null | n | NOT NULL id |
| audio_task_batches_production_method_not_null | n | NOT NULL production_method |
| audio_task_batches_request_hash_not_null | n | NOT NULL request_hash |
| audio_task_batches_requested_count_not_null | n | NOT NULL requested_count |
| audio_task_batches_skipped_count_not_null | n | NOT NULL skipped_count |
| audio_task_batches_status_not_null | n | NOT NULL status |
| audio_task_batches_pkey | p | PRIMARY KEY (id) |
| audio_task_batches_client_idempotency_key_key | u | UNIQUE (client_idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_task_batches_client_idempotency_key_key | true | — | CREATE UNIQUE INDEX audio_task_batches_client_idempotency_key_key ON audio.audio_task_batches USING btree (client_idempotency_key) |
| audio_task_batches_pkey | true | — | CREATE UNIQUE INDEX audio_task_batches_pkey ON audio.audio_task_batches USING btree (id) |

#### audio.audio_task_events

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| task_id | uuid | false | — | — |
| event_type | character varying(32) | false | — | — |
| actor_type | character varying(32) | false | — | — |
| actor_id | uuid | true | — | — |
| from_status | character varying | true | — | — |
| to_status | character varying | true | — | — |
| request_id | character varying | false | — | — |
| payload | jsonb | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_task_events_actor_check | c | CHECK (actor_type::text <> 'operator'::text OR actor_id IS NOT NULL) |
| audio_task_events_actor_type_check | c | CHECK (actor_type::text = ANY (ARRAY['operator'::character varying, 'system'::character varying, 'tts'::character varying]::text[])) |
| audio_task_events_event_type_check | c | CHECK (event_type::text = ANY (ARRAY['task_created'::character varying, 'assigned'::character varying, 'production_started'::character varying, 'production_retry'::character varying, 'production_failed'::character varying, 'asset_created'::character varying, 'review_approved'::character varying, 'review_rejected'::character varying, 'review_revoked'::character varying, 'successor_created'::character varying, 'published'::character varying, 'canceled'::character varying]::text[])) |
| audio_task_events_payload_check | c | CHECK (payload IS NULL OR jsonb_typeof(payload) = 'object'::text) |
| audio_task_events_task_id_fkey | f | FOREIGN KEY (task_id) REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT |
| audio_task_events_actor_type_not_null | n | NOT NULL actor_type |
| audio_task_events_created_at_not_null | n | NOT NULL created_at |
| audio_task_events_event_type_not_null | n | NOT NULL event_type |
| audio_task_events_id_not_null | n | NOT NULL id |
| audio_task_events_request_id_not_null | n | NOT NULL request_id |
| audio_task_events_task_id_not_null | n | NOT NULL task_id |
| audio_task_events_pkey | p | PRIMARY KEY (id) |
| audio_task_events_request_id_key | u | UNIQUE (request_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_task_events_pkey | true | — | CREATE UNIQUE INDEX audio_task_events_pkey ON audio.audio_task_events USING btree (id) |
| audio_task_events_request_id_key | true | — | CREATE UNIQUE INDEX audio_task_events_request_id_key ON audio.audio_task_events USING btree (request_id) |
| idx_audio_task_events_task_time | false | — | CREATE INDEX idx_audio_task_events_task_time ON audio.audio_task_events USING btree (task_id, created_at) |
| idx_audio_task_events_type_time | false | — | CREATE INDEX idx_audio_task_events_type_time ON audio.audio_task_events USING btree (event_type, created_at) |

#### audio.audio_tasks

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| slot_id | uuid | false | — | — |
| predecessor_task_id | uuid | true | — | — |
| production_method | character varying(32) | false | — | — |
| status | character varying(32) | false | — | — |
| content_revision_id | uuid | false | — | — |
| text_snapshot | text | false | — | — |
| pronunciation_snapshot | jsonb | true | — | — |
| audio_input_hash | character varying | false | — | — |
| tts_preset_key | character varying | true | — | — |
| assignee_operator_id | uuid | true | — | — |
| created_by_operator_id | uuid | false | — | — |
| client_idempotency_key | character varying | false | — | — |
| lock_version | integer | false | 0 | — |
| created_at | timestamp with time zone | false | now() | — |
| started_at | timestamp with time zone | true | — | — |
| completed_at | timestamp with time zone | true | — | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| audio_tasks_lock_version_check | c | CHECK (lock_version >= 0) |
| audio_tasks_preset_check | c | CHECK (production_method::text = 'tts'::text AND tts_preset_key IS NOT NULL OR production_method::text = 'human_recording'::text AND tts_preset_key IS NULL) |
| audio_tasks_production_method_check | c | CHECK (production_method::text = ANY (ARRAY['tts'::character varying, 'human_recording'::character varying]::text[])) |
| audio_tasks_pronunciation_snapshot_check | c | CHECK (pronunciation_snapshot IS NULL OR (jsonb_typeof(pronunciation_snapshot) = ANY (ARRAY['object'::text, 'string'::text]))) |
| audio_tasks_status_check | c | CHECK (status::text = ANY (ARRAY['pending_assignment'::character varying, 'assigned'::character varying, 'producing'::character varying, 'pending_review'::character varying, 'production_failed'::character varying, 'approved'::character varying, 'rejected'::character varying, 'published'::character varying, 'canceled'::character varying]::text[])) |
| audio_tasks_predecessor_task_id_fkey | f | FOREIGN KEY (predecessor_task_id) REFERENCES audio.audio_tasks(id) ON DELETE RESTRICT |
| audio_tasks_slot_id_fkey | f | FOREIGN KEY (slot_id) REFERENCES audio.audio_slots(id) ON DELETE RESTRICT |
| audio_tasks_audio_input_hash_not_null | n | NOT NULL audio_input_hash |
| audio_tasks_client_idempotency_key_not_null | n | NOT NULL client_idempotency_key |
| audio_tasks_content_revision_id_not_null | n | NOT NULL content_revision_id |
| audio_tasks_created_at_not_null | n | NOT NULL created_at |
| audio_tasks_created_by_operator_id_not_null | n | NOT NULL created_by_operator_id |
| audio_tasks_id_not_null | n | NOT NULL id |
| audio_tasks_lock_version_not_null | n | NOT NULL lock_version |
| audio_tasks_production_method_not_null | n | NOT NULL production_method |
| audio_tasks_slot_id_not_null | n | NOT NULL slot_id |
| audio_tasks_status_not_null | n | NOT NULL status |
| audio_tasks_text_snapshot_not_null | n | NOT NULL text_snapshot |
| audio_tasks_updated_at_not_null | n | NOT NULL updated_at |
| audio_tasks_pkey | p | PRIMARY KEY (id) |
| audio_tasks_client_idempotency_key_key | u | UNIQUE (client_idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| audio_tasks_client_idempotency_key_key | true | — | CREATE UNIQUE INDEX audio_tasks_client_idempotency_key_key ON audio.audio_tasks USING btree (client_idempotency_key) |
| audio_tasks_pkey | true | — | CREATE UNIQUE INDEX audio_tasks_pkey ON audio.audio_tasks USING btree (id) |
| idx_audio_tasks_assignee_status | false | (assignee_operator_id IS NOT NULL) | CREATE INDEX idx_audio_tasks_assignee_status ON audio.audio_tasks USING btree (assignee_operator_id, status) WHERE (assignee_operator_id IS NOT NULL) |
| uq_audio_tasks_slot_active | true | ((status)::text = ANY ((ARRAY['pending_assignment'::character varying, 'assigned'::character varying, 'producing'::character varying, 'pending_review'::character varying, 'production_failed'::character varying, 'approved'::character varying])::text[])) | CREATE UNIQUE INDEX uq_audio_tasks_slot_active ON audio.audio_tasks USING btree (slot_id) WHERE ((status)::text = ANY ((ARRAY['pending_assignment'::character varying, 'assigned'::character varying, 'producing'::character varying, 'pending_review'::character varying, 'production_failed'::character varying, 'approved'::character varying])::text[])) |

### commerce

#### commerce.commerce_coin_packs

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| product_id | uuid | false | — | — |
| coin_amount | bigint | false | — | — |
| bonus_coin_amount | bigint | false | 0 | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_coin_packs_amount | c | CHECK (coin_amount > 0) |
| ck_commerce_coin_packs_bonus | c | CHECK (bonus_coin_amount >= 0) |
| fk_commerce_coin_packs_product | f | FOREIGN KEY (product_id) REFERENCES commerce.commerce_products(id) ON DELETE RESTRICT |
| commerce_coin_packs_bonus_coin_amount_not_null | n | NOT NULL bonus_coin_amount |
| commerce_coin_packs_coin_amount_not_null | n | NOT NULL coin_amount |
| commerce_coin_packs_created_at_not_null | n | NOT NULL created_at |
| commerce_coin_packs_product_id_not_null | n | NOT NULL product_id |
| commerce_coin_packs_updated_at_not_null | n | NOT NULL updated_at |
| commerce_coin_packs_pkey | p | PRIMARY KEY (product_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_coin_packs_pkey | true | — | CREATE UNIQUE INDEX commerce_coin_packs_pkey ON commerce.commerce_coin_packs USING btree (product_id) |

#### commerce.commerce_gift_sends

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| sender_user_id | uuid | false | — | — |
| receiver_user_id | uuid | false | — | — |
| gift_id | uuid | false | — | — |
| conversation_id | uuid | true | — | — |
| status | character varying(24) | false | 'succeeded'::character varying | — |
| quantity | integer | false | — | — |
| unit_coin_cost | bigint | false | — | — |
| total_coin_cost | bigint | false | — | — |
| gift_code_snapshot | character varying(64) | false | — | — |
| gift_name_snapshot | character varying(128) | false | — | — |
| gift_image_asset_id_snapshot | uuid | true | — | — |
| idempotency_key | character varying(128) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| succeeded_at | timestamp with time zone | false | now() | — |
| reversed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_gift_sends_code | c | CHECK (btrim(gift_code_snapshot::text) <> ''::text) |
| ck_commerce_gift_sends_name | c | CHECK (btrim(gift_name_snapshot::text) <> ''::text) |
| ck_commerce_gift_sends_quantity | c | CHECK (quantity > 0) |
| ck_commerce_gift_sends_status | c | CHECK (status::text = ANY (ARRAY['succeeded'::character varying, 'reversed'::character varying]::text[])) |
| ck_commerce_gift_sends_total_cost | c | CHECK (total_coin_cost = (unit_coin_cost * quantity)) |
| ck_commerce_gift_sends_unit_cost | c | CHECK (unit_coin_cost > 0) |
| ck_commerce_gift_sends_users | c | CHECK (sender_user_id <> receiver_user_id) |
| fk_commerce_gift_sends_gift | f | FOREIGN KEY (gift_id) REFERENCES commerce.commerce_gifts(id) ON DELETE RESTRICT |
| commerce_gift_sends_created_at_not_null | n | NOT NULL created_at |
| commerce_gift_sends_gift_code_snapshot_not_null | n | NOT NULL gift_code_snapshot |
| commerce_gift_sends_gift_id_not_null | n | NOT NULL gift_id |
| commerce_gift_sends_gift_name_snapshot_not_null | n | NOT NULL gift_name_snapshot |
| commerce_gift_sends_id_not_null | n | NOT NULL id |
| commerce_gift_sends_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_gift_sends_quantity_not_null | n | NOT NULL quantity |
| commerce_gift_sends_receiver_user_id_not_null | n | NOT NULL receiver_user_id |
| commerce_gift_sends_sender_user_id_not_null | n | NOT NULL sender_user_id |
| commerce_gift_sends_status_not_null | n | NOT NULL status |
| commerce_gift_sends_succeeded_at_not_null | n | NOT NULL succeeded_at |
| commerce_gift_sends_total_coin_cost_not_null | n | NOT NULL total_coin_cost |
| commerce_gift_sends_unit_coin_cost_not_null | n | NOT NULL unit_coin_cost |
| commerce_gift_sends_updated_at_not_null | n | NOT NULL updated_at |
| commerce_gift_sends_pkey | p | PRIMARY KEY (id) |
| uq_commerce_gift_sends_idempotency | u | UNIQUE (sender_user_id, idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_gift_sends_pkey | true | — | CREATE UNIQUE INDEX commerce_gift_sends_pkey ON commerce.commerce_gift_sends USING btree (id) |
| idx_commerce_gift_sends_conversation | false | (conversation_id IS NOT NULL) | CREATE INDEX idx_commerce_gift_sends_conversation ON commerce.commerce_gift_sends USING btree (conversation_id, created_at DESC) WHERE (conversation_id IS NOT NULL) |
| idx_commerce_gift_sends_gift | false | — | CREATE INDEX idx_commerce_gift_sends_gift ON commerce.commerce_gift_sends USING btree (gift_id, created_at DESC) |
| idx_commerce_gift_sends_receiver | false | — | CREATE INDEX idx_commerce_gift_sends_receiver ON commerce.commerce_gift_sends USING btree (receiver_user_id, created_at DESC) |
| idx_commerce_gift_sends_sender | false | — | CREATE INDEX idx_commerce_gift_sends_sender ON commerce.commerce_gift_sends USING btree (sender_user_id, created_at DESC) |
| uq_commerce_gift_sends_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_gift_sends_idempotency ON commerce.commerce_gift_sends USING btree (sender_user_id, idempotency_key) |

#### commerce.commerce_gifts

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| code | character varying(64) | false | — | — |
| name | character varying(128) | false | — | — |
| description | text | true | — | — |
| coin_cost | bigint | false | — | — |
| image_asset_id | uuid | true | — | — |
| status | character varying(24) | false | 'draft'::character varying | — |
| sort_order | integer | false | 0 | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_gifts_code | c | CHECK (btrim(code::text) <> ''::text) |
| ck_commerce_gifts_coin_cost | c | CHECK (coin_cost > 0) |
| ck_commerce_gifts_metadata | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| ck_commerce_gifts_name | c | CHECK (btrim(name::text) <> ''::text) |
| ck_commerce_gifts_status | c | CHECK (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'inactive'::character varying, 'archived'::character varying]::text[])) |
| commerce_gifts_code_not_null | n | NOT NULL code |
| commerce_gifts_coin_cost_not_null | n | NOT NULL coin_cost |
| commerce_gifts_created_at_not_null | n | NOT NULL created_at |
| commerce_gifts_id_not_null | n | NOT NULL id |
| commerce_gifts_metadata_not_null | n | NOT NULL metadata |
| commerce_gifts_name_not_null | n | NOT NULL name |
| commerce_gifts_sort_order_not_null | n | NOT NULL sort_order |
| commerce_gifts_status_not_null | n | NOT NULL status |
| commerce_gifts_updated_at_not_null | n | NOT NULL updated_at |
| commerce_gifts_pkey | p | PRIMARY KEY (id) |
| uq_commerce_gifts_code | u | UNIQUE (code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_gifts_pkey | true | — | CREATE UNIQUE INDEX commerce_gifts_pkey ON commerce.commerce_gifts USING btree (id) |
| idx_commerce_gifts_active_sort | false | ((status)::text = 'active'::text) | CREATE INDEX idx_commerce_gifts_active_sort ON commerce.commerce_gifts USING btree (sort_order, id) WHERE ((status)::text = 'active'::text) |
| uq_commerce_gifts_code | true | — | CREATE UNIQUE INDEX uq_commerce_gifts_code ON commerce.commerce_gifts USING btree (code) |

#### commerce.commerce_order_fulfillments

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| order_id | uuid | false | — | — |
| order_item_id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| fulfillment_type | character varying(32) | false | — | — |
| status | character varying(24) | false | 'pending'::character varying | — |
| quantity | bigint | false | — | — |
| fulfillment_payload | jsonb | false | '{}'::jsonb | — |
| idempotency_key | character varying(128) | false | — | — |
| attempt_count | integer | false | 0 | — |
| failure_code | character varying(64) | true | — | — |
| failure_message | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| started_at | timestamp with time zone | true | — | — |
| succeeded_at | timestamp with time zone | true | — | — |
| failed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_fulfillments_attempts | c | CHECK (attempt_count >= 0) |
| ck_commerce_fulfillments_payload | c | CHECK (jsonb_typeof(fulfillment_payload) = 'object'::text) |
| ck_commerce_fulfillments_quantity | c | CHECK (quantity > 0) |
| ck_commerce_fulfillments_status | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])) |
| ck_commerce_fulfillments_type | c | CHECK (fulfillment_type::text = ANY (ARRAY['wallet_credit'::character varying, 'subscription_grant'::character varying, 'boost_grant'::character varying, 'entitlement_grant'::character varying]::text[])) |
| fk_commerce_fulfillments_item | f | FOREIGN KEY (order_item_id) REFERENCES commerce.commerce_order_items(id) ON DELETE RESTRICT |
| fk_commerce_fulfillments_order | f | FOREIGN KEY (order_id) REFERENCES commerce.commerce_orders(id) ON DELETE RESTRICT |
| commerce_order_fulfillments_attempt_count_not_null | n | NOT NULL attempt_count |
| commerce_order_fulfillments_created_at_not_null | n | NOT NULL created_at |
| commerce_order_fulfillments_fulfillment_payload_not_null | n | NOT NULL fulfillment_payload |
| commerce_order_fulfillments_fulfillment_type_not_null | n | NOT NULL fulfillment_type |
| commerce_order_fulfillments_id_not_null | n | NOT NULL id |
| commerce_order_fulfillments_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_order_fulfillments_order_id_not_null | n | NOT NULL order_id |
| commerce_order_fulfillments_order_item_id_not_null | n | NOT NULL order_item_id |
| commerce_order_fulfillments_quantity_not_null | n | NOT NULL quantity |
| commerce_order_fulfillments_status_not_null | n | NOT NULL status |
| commerce_order_fulfillments_updated_at_not_null | n | NOT NULL updated_at |
| commerce_order_fulfillments_user_id_not_null | n | NOT NULL user_id |
| commerce_order_fulfillments_pkey | p | PRIMARY KEY (id) |
| uq_commerce_fulfillments_idempotency | u | UNIQUE (idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_order_fulfillments_pkey | true | — | CREATE UNIQUE INDEX commerce_order_fulfillments_pkey ON commerce.commerce_order_fulfillments USING btree (id) |
| idx_commerce_fulfillments_item | false | — | CREATE INDEX idx_commerce_fulfillments_item ON commerce.commerce_order_fulfillments USING btree (order_item_id, id) |
| idx_commerce_fulfillments_order | false | — | CREATE INDEX idx_commerce_fulfillments_order ON commerce.commerce_order_fulfillments USING btree (order_id, id) |
| idx_commerce_fulfillments_status | false | — | CREATE INDEX idx_commerce_fulfillments_status ON commerce.commerce_order_fulfillments USING btree (status, created_at) |
| uq_commerce_fulfillments_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_fulfillments_idempotency ON commerce.commerce_order_fulfillments USING btree (idempotency_key) |

#### commerce.commerce_order_items

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| order_id | uuid | false | — | — |
| product_id | uuid | false | — | — |
| product_price_id | uuid | false | — | — |
| product_code_snapshot | character varying(64) | false | — | — |
| product_name_snapshot | character varying(128) | false | — | — |
| product_type_snapshot | character varying(32) | false | — | — |
| quantity | integer | false | — | — |
| unit_price_minor | bigint | false | — | — |
| subtotal_minor | bigint | false | — | — |
| fulfillment_payload | jsonb | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_order_items_code | c | CHECK (btrim(product_code_snapshot::text) <> ''::text) |
| ck_commerce_order_items_name | c | CHECK (btrim(product_name_snapshot::text) <> ''::text) |
| ck_commerce_order_items_payload | c | CHECK (jsonb_typeof(fulfillment_payload) = 'object'::text) |
| ck_commerce_order_items_price_amount | c | CHECK (unit_price_minor > 0) |
| ck_commerce_order_items_quantity | c | CHECK (quantity > 0) |
| ck_commerce_order_items_subtotal | c | CHECK (subtotal_minor = (unit_price_minor * quantity)) |
| ck_commerce_order_items_type | c | CHECK (product_type_snapshot::text = ANY (ARRAY['coin_pack'::character varying, 'subscription'::character varying, 'boost'::character varying, 'consumable'::character varying]::text[])) |
| fk_commerce_order_items_order | f | FOREIGN KEY (order_id) REFERENCES commerce.commerce_orders(id) ON DELETE RESTRICT |
| fk_commerce_order_items_price | f | FOREIGN KEY (product_price_id) REFERENCES commerce.commerce_product_prices(id) ON DELETE RESTRICT |
| fk_commerce_order_items_product | f | FOREIGN KEY (product_id) REFERENCES commerce.commerce_products(id) ON DELETE RESTRICT |
| commerce_order_items_created_at_not_null | n | NOT NULL created_at |
| commerce_order_items_fulfillment_payload_not_null | n | NOT NULL fulfillment_payload |
| commerce_order_items_id_not_null | n | NOT NULL id |
| commerce_order_items_order_id_not_null | n | NOT NULL order_id |
| commerce_order_items_product_code_snapshot_not_null | n | NOT NULL product_code_snapshot |
| commerce_order_items_product_id_not_null | n | NOT NULL product_id |
| commerce_order_items_product_name_snapshot_not_null | n | NOT NULL product_name_snapshot |
| commerce_order_items_product_price_id_not_null | n | NOT NULL product_price_id |
| commerce_order_items_product_type_snapshot_not_null | n | NOT NULL product_type_snapshot |
| commerce_order_items_quantity_not_null | n | NOT NULL quantity |
| commerce_order_items_subtotal_minor_not_null | n | NOT NULL subtotal_minor |
| commerce_order_items_unit_price_minor_not_null | n | NOT NULL unit_price_minor |
| commerce_order_items_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_order_items_pkey | true | — | CREATE UNIQUE INDEX commerce_order_items_pkey ON commerce.commerce_order_items USING btree (id) |
| idx_commerce_order_items_order | false | — | CREATE INDEX idx_commerce_order_items_order ON commerce.commerce_order_items USING btree (order_id, id) |
| idx_commerce_order_items_product | false | — | CREATE INDEX idx_commerce_order_items_product ON commerce.commerce_order_items USING btree (product_id, created_at DESC) |

#### commerce.commerce_orders

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| order_no | character varying(32) | false | — | — |
| user_id | uuid | false | — | — |
| status | character varying(24) | false | 'pending_payment'::character varying | — |
| currency | character varying(3) | false | — | — |
| subtotal_minor | bigint | false | — | — |
| discount_minor | bigint | false | 0 | — |
| total_minor | bigint | false | — | — |
| sales_channel | character varying(32) | false | — | — |
| idempotency_key | character varying(128) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| expires_at | timestamp with time zone | true | — | — |
| paid_at | timestamp with time zone | true | — | — |
| cancelled_at | timestamp with time zone | true | — | — |
| refunded_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_orders_amounts | c | CHECK (discount_minor <= subtotal_minor AND total_minor = (subtotal_minor - discount_minor)) |
| ck_commerce_orders_channel | c | CHECK (sales_channel::text = ANY (ARRAY['ios'::character varying, 'android'::character varying, 'web'::character varying]::text[])) |
| ck_commerce_orders_currency | c | CHECK (currency::text ~ '^[A-Z]{3}$'::text) |
| ck_commerce_orders_discount | c | CHECK (discount_minor >= 0) |
| ck_commerce_orders_expiry | c | CHECK (expires_at IS NULL OR expires_at > created_at) |
| ck_commerce_orders_no | c | CHECK (btrim(order_no::text) <> ''::text) |
| ck_commerce_orders_status | c | CHECK (status::text = ANY (ARRAY['pending_payment'::character varying, 'paid'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'refunded'::character varying]::text[])) |
| ck_commerce_orders_subtotal | c | CHECK (subtotal_minor > 0) |
| ck_commerce_orders_total | c | CHECK (total_minor > 0) |
| commerce_orders_created_at_not_null | n | NOT NULL created_at |
| commerce_orders_currency_not_null | n | NOT NULL currency |
| commerce_orders_discount_minor_not_null | n | NOT NULL discount_minor |
| commerce_orders_id_not_null | n | NOT NULL id |
| commerce_orders_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_orders_order_no_not_null | n | NOT NULL order_no |
| commerce_orders_sales_channel_not_null | n | NOT NULL sales_channel |
| commerce_orders_status_not_null | n | NOT NULL status |
| commerce_orders_subtotal_minor_not_null | n | NOT NULL subtotal_minor |
| commerce_orders_total_minor_not_null | n | NOT NULL total_minor |
| commerce_orders_updated_at_not_null | n | NOT NULL updated_at |
| commerce_orders_user_id_not_null | n | NOT NULL user_id |
| commerce_orders_pkey | p | PRIMARY KEY (id) |
| uq_commerce_orders_idempotency | u | UNIQUE (user_id, idempotency_key) |
| uq_commerce_orders_no | u | UNIQUE (order_no) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_orders_pkey | true | — | CREATE UNIQUE INDEX commerce_orders_pkey ON commerce.commerce_orders USING btree (id) |
| idx_commerce_orders_pending_expiry | false | (((status)::text = 'pending_payment'::text) AND (expires_at IS NOT NULL)) | CREATE INDEX idx_commerce_orders_pending_expiry ON commerce.commerce_orders USING btree (expires_at) WHERE (((status)::text = 'pending_payment'::text) AND (expires_at IS NOT NULL)) |
| idx_commerce_orders_status_created | false | — | CREATE INDEX idx_commerce_orders_status_created ON commerce.commerce_orders USING btree (status, created_at) |
| idx_commerce_orders_user_created | false | — | CREATE INDEX idx_commerce_orders_user_created ON commerce.commerce_orders USING btree (user_id, created_at DESC, id DESC) |
| uq_commerce_orders_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_orders_idempotency ON commerce.commerce_orders USING btree (user_id, idempotency_key) |
| uq_commerce_orders_no | true | — | CREATE UNIQUE INDEX uq_commerce_orders_no ON commerce.commerce_orders USING btree (order_no) |

#### commerce.commerce_payment_events

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| provider | character varying(32) | false | — | — |
| provider_event_id | character varying(191) | true | — | — |
| event_type | character varying(64) | false | — | — |
| payment_id | uuid | true | — | — |
| order_id | uuid | true | — | — |
| provider_payment_id | character varying(191) | true | — | — |
| provider_transaction_id | character varying(191) | true | — | — |
| payload | jsonb | false | — | — |
| status | character varying(24) | false | 'received'::character varying | — |
| processing_error | text | true | — | — |
| received_at | timestamp with time zone | false | now() | — |
| processed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_payment_events_payload | c | CHECK (jsonb_typeof(payload) = 'object'::text) |
| ck_commerce_payment_events_provider | c | CHECK (provider::text = ANY (ARRAY['apple'::character varying, 'google'::character varying, 'wechat'::character varying, 'alipay'::character varying, 'stripe'::character varying, 'manual'::character varying]::text[])) |
| ck_commerce_payment_events_status | c | CHECK (status::text = ANY (ARRAY['received'::character varying, 'processing'::character varying, 'processed'::character varying, 'ignored'::character varying, 'failed'::character varying]::text[])) |
| ck_commerce_payment_events_type | c | CHECK (btrim(event_type::text) <> ''::text) |
| fk_commerce_payment_events_order | f | FOREIGN KEY (order_id) REFERENCES commerce.commerce_orders(id) ON DELETE RESTRICT |
| fk_commerce_payment_events_payment | f | FOREIGN KEY (payment_id) REFERENCES commerce.commerce_payments(id) ON DELETE RESTRICT |
| commerce_payment_events_event_type_not_null | n | NOT NULL event_type |
| commerce_payment_events_id_not_null | n | NOT NULL id |
| commerce_payment_events_payload_not_null | n | NOT NULL payload |
| commerce_payment_events_provider_not_null | n | NOT NULL provider |
| commerce_payment_events_received_at_not_null | n | NOT NULL received_at |
| commerce_payment_events_status_not_null | n | NOT NULL status |
| commerce_payment_events_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_payment_events_pkey | true | — | CREATE UNIQUE INDEX commerce_payment_events_pkey ON commerce.commerce_payment_events USING btree (id) |
| idx_commerce_payment_events_payment | false | — | CREATE INDEX idx_commerce_payment_events_payment ON commerce.commerce_payment_events USING btree (payment_id, received_at DESC) |
| idx_commerce_payment_events_status | false | — | CREATE INDEX idx_commerce_payment_events_status ON commerce.commerce_payment_events USING btree (status, received_at) |
| idx_commerce_payment_events_transaction | false | (provider_transaction_id IS NOT NULL) | CREATE INDEX idx_commerce_payment_events_transaction ON commerce.commerce_payment_events USING btree (provider, provider_transaction_id) WHERE (provider_transaction_id IS NOT NULL) |
| uq_commerce_payment_events_provider_event | true | (provider_event_id IS NOT NULL) | CREATE UNIQUE INDEX uq_commerce_payment_events_provider_event ON commerce.commerce_payment_events USING btree (provider, provider_event_id) WHERE (provider_event_id IS NOT NULL) |

#### commerce.commerce_payments

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| order_id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| provider | character varying(32) | false | — | — |
| payment_method | character varying(32) | true | — | — |
| status | character varying(24) | false | 'pending'::character varying | — |
| currency | character varying(3) | false | — | — |
| amount_minor | bigint | false | — | — |
| provider_payment_id | character varying(191) | true | — | — |
| provider_transaction_id | character varying(191) | true | — | — |
| idempotency_key | character varying(128) | false | — | — |
| failure_code | character varying(64) | true | — | — |
| failure_message | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| succeeded_at | timestamp with time zone | true | — | — |
| failed_at | timestamp with time zone | true | — | — |
| cancelled_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_payments_amount | c | CHECK (amount_minor > 0) |
| ck_commerce_payments_currency | c | CHECK (currency::text ~ '^[A-Z]{3}$'::text) |
| ck_commerce_payments_provider | c | CHECK (provider::text = ANY (ARRAY['apple'::character varying, 'google'::character varying, 'wechat'::character varying, 'alipay'::character varying, 'stripe'::character varying, 'manual'::character varying]::text[])) |
| ck_commerce_payments_status | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'partially_refunded'::character varying, 'refunded'::character varying]::text[])) |
| fk_commerce_payments_order | f | FOREIGN KEY (order_id) REFERENCES commerce.commerce_orders(id) ON DELETE RESTRICT |
| commerce_payments_amount_minor_not_null | n | NOT NULL amount_minor |
| commerce_payments_created_at_not_null | n | NOT NULL created_at |
| commerce_payments_currency_not_null | n | NOT NULL currency |
| commerce_payments_id_not_null | n | NOT NULL id |
| commerce_payments_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_payments_order_id_not_null | n | NOT NULL order_id |
| commerce_payments_provider_not_null | n | NOT NULL provider |
| commerce_payments_status_not_null | n | NOT NULL status |
| commerce_payments_updated_at_not_null | n | NOT NULL updated_at |
| commerce_payments_user_id_not_null | n | NOT NULL user_id |
| commerce_payments_pkey | p | PRIMARY KEY (id) |
| uq_commerce_payments_idempotency | u | UNIQUE (user_id, idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_payments_pkey | true | — | CREATE UNIQUE INDEX commerce_payments_pkey ON commerce.commerce_payments USING btree (id) |
| idx_commerce_payments_order | false | — | CREATE INDEX idx_commerce_payments_order ON commerce.commerce_payments USING btree (order_id, created_at DESC) |
| idx_commerce_payments_user | false | — | CREATE INDEX idx_commerce_payments_user ON commerce.commerce_payments USING btree (user_id, created_at DESC) |
| uq_commerce_payments_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_payments_idempotency ON commerce.commerce_payments USING btree (user_id, idempotency_key) |
| uq_commerce_payments_provider_payment | true | (provider_payment_id IS NOT NULL) | CREATE UNIQUE INDEX uq_commerce_payments_provider_payment ON commerce.commerce_payments USING btree (provider, provider_payment_id) WHERE (provider_payment_id IS NOT NULL) |
| uq_commerce_payments_provider_transaction | true | (provider_transaction_id IS NOT NULL) | CREATE UNIQUE INDEX uq_commerce_payments_provider_transaction ON commerce.commerce_payments USING btree (provider, provider_transaction_id) WHERE (provider_transaction_id IS NOT NULL) |

#### commerce.commerce_product_prices

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| product_id | uuid | false | — | — |
| sales_channel | character varying(32) | false | — | — |
| currency | character varying(3) | false | — | — |
| amount_minor | bigint | false | — | — |
| provider_product_id | character varying(191) | true | — | — |
| status | character varying(24) | false | 'inactive'::character varying | — |
| starts_at | timestamp with time zone | true | — | — |
| ends_at | timestamp with time zone | true | — | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_prices_amount | c | CHECK (amount_minor > 0) |
| ck_commerce_prices_channel | c | CHECK (sales_channel::text = ANY (ARRAY['ios'::character varying, 'android'::character varying, 'web'::character varying]::text[])) |
| ck_commerce_prices_currency | c | CHECK (currency::text ~ '^[A-Z]{3}$'::text) |
| ck_commerce_prices_metadata | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| ck_commerce_prices_period | c | CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at) |
| ck_commerce_prices_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'archived'::character varying]::text[])) |
| fk_commerce_prices_product | f | FOREIGN KEY (product_id) REFERENCES commerce.commerce_products(id) ON DELETE RESTRICT |
| commerce_product_prices_amount_minor_not_null | n | NOT NULL amount_minor |
| commerce_product_prices_created_at_not_null | n | NOT NULL created_at |
| commerce_product_prices_currency_not_null | n | NOT NULL currency |
| commerce_product_prices_id_not_null | n | NOT NULL id |
| commerce_product_prices_metadata_not_null | n | NOT NULL metadata |
| commerce_product_prices_product_id_not_null | n | NOT NULL product_id |
| commerce_product_prices_sales_channel_not_null | n | NOT NULL sales_channel |
| commerce_product_prices_status_not_null | n | NOT NULL status |
| commerce_product_prices_updated_at_not_null | n | NOT NULL updated_at |
| commerce_product_prices_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_product_prices_pkey | true | — | CREATE UNIQUE INDEX commerce_product_prices_pkey ON commerce.commerce_product_prices USING btree (id) |
| idx_commerce_prices_lookup | false | — | CREATE INDEX idx_commerce_prices_lookup ON commerce.commerce_product_prices USING btree (product_id, sales_channel, currency, status) |
| uq_commerce_prices_provider_product | true | (provider_product_id IS NOT NULL) | CREATE UNIQUE INDEX uq_commerce_prices_provider_product ON commerce.commerce_product_prices USING btree (sales_channel, provider_product_id) WHERE (provider_product_id IS NOT NULL) |

#### commerce.commerce_products

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| code | character varying(64) | false | — | — |
| product_type | character varying(32) | false | — | — |
| name | character varying(128) | false | — | — |
| description | text | true | — | — |
| status | character varying(24) | false | 'draft'::character varying | — |
| sort_order | integer | false | 0 | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_products_code | c | CHECK (btrim(code::text) <> ''::text) |
| ck_commerce_products_metadata | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| ck_commerce_products_name | c | CHECK (btrim(name::text) <> ''::text) |
| ck_commerce_products_status | c | CHECK (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'inactive'::character varying, 'archived'::character varying]::text[])) |
| ck_commerce_products_type | c | CHECK (product_type::text = ANY (ARRAY['coin_pack'::character varying, 'subscription'::character varying, 'boost'::character varying, 'consumable'::character varying]::text[])) |
| commerce_products_code_not_null | n | NOT NULL code |
| commerce_products_created_at_not_null | n | NOT NULL created_at |
| commerce_products_id_not_null | n | NOT NULL id |
| commerce_products_metadata_not_null | n | NOT NULL metadata |
| commerce_products_name_not_null | n | NOT NULL name |
| commerce_products_product_type_not_null | n | NOT NULL product_type |
| commerce_products_sort_order_not_null | n | NOT NULL sort_order |
| commerce_products_status_not_null | n | NOT NULL status |
| commerce_products_updated_at_not_null | n | NOT NULL updated_at |
| commerce_products_pkey | p | PRIMARY KEY (id) |
| uq_commerce_products_code | u | UNIQUE (code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_products_pkey | true | — | CREATE UNIQUE INDEX commerce_products_pkey ON commerce.commerce_products USING btree (id) |
| idx_commerce_products_active_sort | false | ((status)::text = 'active'::text) | CREATE INDEX idx_commerce_products_active_sort ON commerce.commerce_products USING btree (sort_order, id) WHERE ((status)::text = 'active'::text) |
| uq_commerce_products_code | true | — | CREATE UNIQUE INDEX uq_commerce_products_code ON commerce.commerce_products USING btree (code) |

#### commerce.commerce_refund_recoveries

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| refund_id | uuid | false | — | — |
| fulfillment_id | uuid | false | — | — |
| wallet_id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| status | character varying(24) | false | 'pending'::character varying | — |
| coin_amount | bigint | false | — | — |
| idempotency_key | character varying(128) | false | — | — |
| attempt_count | integer | false | 0 | — |
| failure_code | character varying(64) | true | — | — |
| failure_message | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| succeeded_at | timestamp with time zone | true | — | — |
| failed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_refund_recoveries_amount | c | CHECK (coin_amount > 0) |
| ck_commerce_refund_recoveries_attempts | c | CHECK (attempt_count >= 0) |
| ck_commerce_refund_recoveries_status | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying]::text[])) |
| fk_commerce_refund_recoveries_fulfillment | f | FOREIGN KEY (fulfillment_id) REFERENCES commerce.commerce_order_fulfillments(id) ON DELETE RESTRICT |
| fk_commerce_refund_recoveries_refund | f | FOREIGN KEY (refund_id) REFERENCES commerce.commerce_refunds(id) ON DELETE RESTRICT |
| fk_commerce_refund_recoveries_wallet | f | FOREIGN KEY (wallet_id) REFERENCES commerce.commerce_wallets(id) ON DELETE RESTRICT |
| commerce_refund_recoveries_attempt_count_not_null | n | NOT NULL attempt_count |
| commerce_refund_recoveries_coin_amount_not_null | n | NOT NULL coin_amount |
| commerce_refund_recoveries_created_at_not_null | n | NOT NULL created_at |
| commerce_refund_recoveries_fulfillment_id_not_null | n | NOT NULL fulfillment_id |
| commerce_refund_recoveries_id_not_null | n | NOT NULL id |
| commerce_refund_recoveries_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_refund_recoveries_refund_id_not_null | n | NOT NULL refund_id |
| commerce_refund_recoveries_status_not_null | n | NOT NULL status |
| commerce_refund_recoveries_updated_at_not_null | n | NOT NULL updated_at |
| commerce_refund_recoveries_user_id_not_null | n | NOT NULL user_id |
| commerce_refund_recoveries_wallet_id_not_null | n | NOT NULL wallet_id |
| commerce_refund_recoveries_pkey | p | PRIMARY KEY (id) |
| uq_commerce_refund_recoveries_idempotency | u | UNIQUE (idempotency_key) |
| uq_commerce_refund_recoveries_source | u | UNIQUE (refund_id, fulfillment_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_refund_recoveries_pkey | true | — | CREATE UNIQUE INDEX commerce_refund_recoveries_pkey ON commerce.commerce_refund_recoveries USING btree (id) |
| idx_commerce_refund_recoveries_status | false | — | CREATE INDEX idx_commerce_refund_recoveries_status ON commerce.commerce_refund_recoveries USING btree (status, created_at) |
| idx_commerce_refund_recoveries_wallet | false | — | CREATE INDEX idx_commerce_refund_recoveries_wallet ON commerce.commerce_refund_recoveries USING btree (wallet_id, created_at DESC) |
| uq_commerce_refund_recoveries_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_refund_recoveries_idempotency ON commerce.commerce_refund_recoveries USING btree (idempotency_key) |
| uq_commerce_refund_recoveries_source | true | — | CREATE UNIQUE INDEX uq_commerce_refund_recoveries_source ON commerce.commerce_refund_recoveries USING btree (refund_id, fulfillment_id) |

#### commerce.commerce_refunds

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| payment_id | uuid | false | — | — |
| order_id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| provider | character varying(32) | false | — | — |
| status | character varying(24) | false | 'pending'::character varying | — |
| currency | character varying(3) | false | — | — |
| amount_minor | bigint | false | — | — |
| provider_refund_id | character varying(191) | true | — | — |
| provider_transaction_id | character varying(191) | true | — | — |
| reason_code | character varying(64) | true | — | — |
| reason_detail | text | true | — | — |
| requested_by_type | character varying(32) | false | — | — |
| requested_by_id | uuid | true | — | — |
| idempotency_key | character varying(128) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| succeeded_at | timestamp with time zone | true | — | — |
| failed_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_refunds_amount | c | CHECK (amount_minor > 0) |
| ck_commerce_refunds_currency | c | CHECK (currency::text ~ '^[A-Z]{3}$'::text) |
| ck_commerce_refunds_provider | c | CHECK (provider::text = ANY (ARRAY['apple'::character varying, 'google'::character varying, 'wechat'::character varying, 'alipay'::character varying, 'stripe'::character varying, 'manual'::character varying]::text[])) |
| ck_commerce_refunds_requested_by | c | CHECK (requested_by_type::text = ANY (ARRAY['admin'::character varying, 'system'::character varying, 'provider'::character varying]::text[])) |
| ck_commerce_refunds_status | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])) |
| fk_commerce_refunds_order | f | FOREIGN KEY (order_id) REFERENCES commerce.commerce_orders(id) ON DELETE RESTRICT |
| fk_commerce_refunds_payment | f | FOREIGN KEY (payment_id) REFERENCES commerce.commerce_payments(id) ON DELETE RESTRICT |
| commerce_refunds_amount_minor_not_null | n | NOT NULL amount_minor |
| commerce_refunds_created_at_not_null | n | NOT NULL created_at |
| commerce_refunds_currency_not_null | n | NOT NULL currency |
| commerce_refunds_id_not_null | n | NOT NULL id |
| commerce_refunds_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_refunds_order_id_not_null | n | NOT NULL order_id |
| commerce_refunds_payment_id_not_null | n | NOT NULL payment_id |
| commerce_refunds_provider_not_null | n | NOT NULL provider |
| commerce_refunds_requested_by_type_not_null | n | NOT NULL requested_by_type |
| commerce_refunds_status_not_null | n | NOT NULL status |
| commerce_refunds_updated_at_not_null | n | NOT NULL updated_at |
| commerce_refunds_user_id_not_null | n | NOT NULL user_id |
| commerce_refunds_pkey | p | PRIMARY KEY (id) |
| uq_commerce_refunds_idempotency | u | UNIQUE (idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_refunds_pkey | true | — | CREATE UNIQUE INDEX commerce_refunds_pkey ON commerce.commerce_refunds USING btree (id) |
| idx_commerce_refunds_payment | false | — | CREATE INDEX idx_commerce_refunds_payment ON commerce.commerce_refunds USING btree (payment_id, created_at DESC) |
| idx_commerce_refunds_status | false | — | CREATE INDEX idx_commerce_refunds_status ON commerce.commerce_refunds USING btree (status, created_at) |
| idx_commerce_refunds_user | false | — | CREATE INDEX idx_commerce_refunds_user ON commerce.commerce_refunds USING btree (user_id, created_at DESC) |
| uq_commerce_refunds_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_refunds_idempotency ON commerce.commerce_refunds USING btree (idempotency_key) |
| uq_commerce_refunds_provider_refund | true | (provider_refund_id IS NOT NULL) | CREATE UNIQUE INDEX uq_commerce_refunds_provider_refund ON commerce.commerce_refunds USING btree (provider, provider_refund_id) WHERE (provider_refund_id IS NOT NULL) |

#### commerce.commerce_wallet_adjustments

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| wallet_id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| amount | bigint | false | — | — |
| reason_code | character varying(64) | false | — | — |
| remark | text | true | — | — |
| operator_type | character varying(32) | false | — | — |
| operator_id | uuid | true | — | — |
| idempotency_key | character varying(128) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_wallet_adjustments_amount | c | CHECK (amount <> 0) |
| ck_commerce_wallet_adjustments_operator | c | CHECK (operator_type::text = ANY (ARRAY['admin'::character varying, 'system'::character varying]::text[])) |
| ck_commerce_wallet_adjustments_reason | c | CHECK (btrim(reason_code::text) <> ''::text) |
| fk_commerce_wallet_adjustments_wallet | f | FOREIGN KEY (wallet_id) REFERENCES commerce.commerce_wallets(id) ON DELETE RESTRICT |
| commerce_wallet_adjustments_amount_not_null | n | NOT NULL amount |
| commerce_wallet_adjustments_created_at_not_null | n | NOT NULL created_at |
| commerce_wallet_adjustments_id_not_null | n | NOT NULL id |
| commerce_wallet_adjustments_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_wallet_adjustments_operator_type_not_null | n | NOT NULL operator_type |
| commerce_wallet_adjustments_reason_code_not_null | n | NOT NULL reason_code |
| commerce_wallet_adjustments_user_id_not_null | n | NOT NULL user_id |
| commerce_wallet_adjustments_wallet_id_not_null | n | NOT NULL wallet_id |
| commerce_wallet_adjustments_pkey | p | PRIMARY KEY (id) |
| uq_commerce_wallet_adjustments_idempotency | u | UNIQUE (idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_wallet_adjustments_pkey | true | — | CREATE UNIQUE INDEX commerce_wallet_adjustments_pkey ON commerce.commerce_wallet_adjustments USING btree (id) |
| idx_commerce_wallet_adjustments_wallet | false | — | CREATE INDEX idx_commerce_wallet_adjustments_wallet ON commerce.commerce_wallet_adjustments USING btree (wallet_id, created_at DESC) |
| uq_commerce_wallet_adjustments_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_wallet_adjustments_idempotency ON commerce.commerce_wallet_adjustments USING btree (idempotency_key) |

#### commerce.commerce_wallet_ledger

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| wallet_id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| amount | bigint | false | — | — |
| balance_before | bigint | false | — | — |
| balance_after | bigint | false | — | — |
| business_type | character varying(32) | false | — | — |
| business_id | uuid | false | — | — |
| idempotency_key | character varying(128) | false | — | — |
| description | character varying(255) | true | — | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_wallet_ledger_after | c | CHECK (balance_after >= 0) |
| ck_commerce_wallet_ledger_amount | c | CHECK (amount <> 0) |
| ck_commerce_wallet_ledger_balance | c | CHECK (balance_after = (balance_before + amount)) |
| ck_commerce_wallet_ledger_before | c | CHECK (balance_before >= 0) |
| ck_commerce_wallet_ledger_business_type | c | CHECK (business_type::text = ANY (ARRAY['order_fulfillment'::character varying, 'reward_delivery'::character varying, 'gift_send'::character varying, 'wallet_adjustment'::character varying, 'wallet_reversal'::character varying, 'refund_recovery'::character varying]::text[])) |
| ck_commerce_wallet_ledger_metadata | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| fk_commerce_wallet_ledger_wallet | f | FOREIGN KEY (wallet_id) REFERENCES commerce.commerce_wallets(id) ON DELETE RESTRICT |
| commerce_wallet_ledger_amount_not_null | n | NOT NULL amount |
| commerce_wallet_ledger_balance_after_not_null | n | NOT NULL balance_after |
| commerce_wallet_ledger_balance_before_not_null | n | NOT NULL balance_before |
| commerce_wallet_ledger_business_id_not_null | n | NOT NULL business_id |
| commerce_wallet_ledger_business_type_not_null | n | NOT NULL business_type |
| commerce_wallet_ledger_created_at_not_null | n | NOT NULL created_at |
| commerce_wallet_ledger_id_not_null | n | NOT NULL id |
| commerce_wallet_ledger_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_wallet_ledger_metadata_not_null | n | NOT NULL metadata |
| commerce_wallet_ledger_user_id_not_null | n | NOT NULL user_id |
| commerce_wallet_ledger_wallet_id_not_null | n | NOT NULL wallet_id |
| commerce_wallet_ledger_pkey | p | PRIMARY KEY (id) |
| uq_commerce_wallet_ledger_business | u | UNIQUE (wallet_id, business_type, business_id) |
| uq_commerce_wallet_ledger_idempotency | u | UNIQUE (wallet_id, idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_wallet_ledger_pkey | true | — | CREATE UNIQUE INDEX commerce_wallet_ledger_pkey ON commerce.commerce_wallet_ledger USING btree (id) |
| idx_commerce_wallet_ledger_user | false | — | CREATE INDEX idx_commerce_wallet_ledger_user ON commerce.commerce_wallet_ledger USING btree (user_id, created_at DESC, id DESC) |
| idx_commerce_wallet_ledger_wallet | false | — | CREATE INDEX idx_commerce_wallet_ledger_wallet ON commerce.commerce_wallet_ledger USING btree (wallet_id, created_at DESC, id DESC) |
| uq_commerce_wallet_ledger_business | true | — | CREATE UNIQUE INDEX uq_commerce_wallet_ledger_business ON commerce.commerce_wallet_ledger USING btree (wallet_id, business_type, business_id) |
| uq_commerce_wallet_ledger_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_wallet_ledger_idempotency ON commerce.commerce_wallet_ledger USING btree (wallet_id, idempotency_key) |

#### commerce.commerce_wallet_reversals

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| wallet_id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| original_ledger_entry_id | uuid | false | — | — |
| amount | bigint | false | — | — |
| reason_code | character varying(64) | false | — | — |
| remark | text | true | — | — |
| operator_type | character varying(32) | false | — | — |
| operator_id | uuid | true | — | — |
| idempotency_key | character varying(128) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_wallet_reversals_amount | c | CHECK (amount <> 0) |
| ck_commerce_wallet_reversals_operator | c | CHECK (operator_type::text = ANY (ARRAY['admin'::character varying, 'system'::character varying]::text[])) |
| ck_commerce_wallet_reversals_reason | c | CHECK (btrim(reason_code::text) <> ''::text) |
| fk_commerce_wallet_reversals_original | f | FOREIGN KEY (original_ledger_entry_id) REFERENCES commerce.commerce_wallet_ledger(id) ON DELETE RESTRICT |
| fk_commerce_wallet_reversals_wallet | f | FOREIGN KEY (wallet_id) REFERENCES commerce.commerce_wallets(id) ON DELETE RESTRICT |
| commerce_wallet_reversals_amount_not_null | n | NOT NULL amount |
| commerce_wallet_reversals_created_at_not_null | n | NOT NULL created_at |
| commerce_wallet_reversals_id_not_null | n | NOT NULL id |
| commerce_wallet_reversals_idempotency_key_not_null | n | NOT NULL idempotency_key |
| commerce_wallet_reversals_operator_type_not_null | n | NOT NULL operator_type |
| commerce_wallet_reversals_original_ledger_entry_id_not_null | n | NOT NULL original_ledger_entry_id |
| commerce_wallet_reversals_reason_code_not_null | n | NOT NULL reason_code |
| commerce_wallet_reversals_user_id_not_null | n | NOT NULL user_id |
| commerce_wallet_reversals_wallet_id_not_null | n | NOT NULL wallet_id |
| commerce_wallet_reversals_pkey | p | PRIMARY KEY (id) |
| uq_commerce_wallet_reversals_idempotency | u | UNIQUE (idempotency_key) |
| uq_commerce_wallet_reversals_original | u | UNIQUE (original_ledger_entry_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_wallet_reversals_pkey | true | — | CREATE UNIQUE INDEX commerce_wallet_reversals_pkey ON commerce.commerce_wallet_reversals USING btree (id) |
| idx_commerce_wallet_reversals_wallet | false | — | CREATE INDEX idx_commerce_wallet_reversals_wallet ON commerce.commerce_wallet_reversals USING btree (wallet_id, created_at DESC) |
| uq_commerce_wallet_reversals_idempotency | true | — | CREATE UNIQUE INDEX uq_commerce_wallet_reversals_idempotency ON commerce.commerce_wallet_reversals USING btree (idempotency_key) |
| uq_commerce_wallet_reversals_original | true | — | CREATE UNIQUE INDEX uq_commerce_wallet_reversals_original ON commerce.commerce_wallet_reversals USING btree (original_ledger_entry_id) |

#### commerce.commerce_wallets

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| user_id | uuid | false | — | — |
| balance | bigint | false | 0 | — |
| version | bigint | false | 0 | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_commerce_wallets_balance | c | CHECK (balance >= 0) |
| ck_commerce_wallets_version | c | CHECK (version >= 0) |
| commerce_wallets_balance_not_null | n | NOT NULL balance |
| commerce_wallets_created_at_not_null | n | NOT NULL created_at |
| commerce_wallets_id_not_null | n | NOT NULL id |
| commerce_wallets_updated_at_not_null | n | NOT NULL updated_at |
| commerce_wallets_user_id_not_null | n | NOT NULL user_id |
| commerce_wallets_version_not_null | n | NOT NULL version |
| commerce_wallets_pkey | p | PRIMARY KEY (id) |
| uq_commerce_wallets_user | u | UNIQUE (user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| commerce_wallets_pkey | true | — | CREATE UNIQUE INDEX commerce_wallets_pkey ON commerce.commerce_wallets USING btree (id) |
| uq_commerce_wallets_user | true | — | CREATE UNIQUE INDEX uq_commerce_wallets_user ON commerce.commerce_wallets USING btree (user_id) |

### rewards

#### rewards.reward_deliveries

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| grant_id | bigint | false | — | — |
| target_domain | character varying(32) | false | — | — |
| delivery_type | character varying(32) | false | — | — |
| idempotency_key | character varying(128) | false | — | — |
| status | character varying(16) | false | — | — |
| attempt_count | integer | false | 0 | — |
| processing_started_at | timestamp with time zone | true | — | — |
| next_retry_at | timestamp with time zone | true | — | — |
| target_reference_id | uuid | true | — | — |
| last_error_code | character varying(64) | true | — | — |
| last_error_message | text | true | — | — |
| delivered_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| reward_deliveries_attempt_count_check | c | CHECK (attempt_count >= 0) |
| reward_deliveries_check | c | CHECK (status::text <> 'PROCESSING'::text OR processing_started_at IS NOT NULL) |
| reward_deliveries_check1 | c | CHECK (status::text <> 'RETRY_WAIT'::text OR next_retry_at IS NOT NULL) |
| reward_deliveries_check2 | c | CHECK (status::text <> 'SUCCEEDED'::text OR delivered_at IS NOT NULL AND target_reference_id IS NOT NULL) |
| reward_deliveries_check3 | c | CHECK (status::text = 'SUCCEEDED'::text OR delivered_at IS NULL) |
| reward_deliveries_delivery_type_check | c | CHECK (delivery_type::text = 'ASSET_CREDIT'::text) |
| reward_deliveries_status_check | c | CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'RETRY_WAIT'::character varying, 'SUCCEEDED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying]::text[])) |
| reward_deliveries_target_domain_check | c | CHECK (target_domain::text = 'COMMERCE'::text) |
| reward_deliveries_grant_id_fkey | f | FOREIGN KEY (grant_id) REFERENCES rewards.reward_grants(id) ON DELETE RESTRICT |
| reward_deliveries_attempt_count_not_null | n | NOT NULL attempt_count |
| reward_deliveries_created_at_not_null | n | NOT NULL created_at |
| reward_deliveries_delivery_type_not_null | n | NOT NULL delivery_type |
| reward_deliveries_grant_id_not_null | n | NOT NULL grant_id |
| reward_deliveries_id_not_null | n | NOT NULL id |
| reward_deliveries_idempotency_key_not_null | n | NOT NULL idempotency_key |
| reward_deliveries_status_not_null | n | NOT NULL status |
| reward_deliveries_target_domain_not_null | n | NOT NULL target_domain |
| reward_deliveries_updated_at_not_null | n | NOT NULL updated_at |
| reward_deliveries_pkey | p | PRIMARY KEY (id) |
| reward_deliveries_grant_id_key | u | UNIQUE (grant_id) |
| reward_deliveries_idempotency_key_key | u | UNIQUE (idempotency_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_reward_deliveries_retry_queue | false | ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'RETRY_WAIT'::character varying])::text[])) | CREATE INDEX idx_reward_deliveries_retry_queue ON rewards.reward_deliveries USING btree (next_retry_at, created_at) WHERE ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'RETRY_WAIT'::character varying])::text[])) |
| idx_reward_deliveries_stale_processing | false | ((status)::text = 'PROCESSING'::text) | CREATE INDEX idx_reward_deliveries_stale_processing ON rewards.reward_deliveries USING btree (processing_started_at) WHERE ((status)::text = 'PROCESSING'::text) |
| idx_reward_deliveries_status_created | false | — | CREATE INDEX idx_reward_deliveries_status_created ON rewards.reward_deliveries USING btree (status, created_at) |
| idx_reward_deliveries_target_status | false | — | CREATE INDEX idx_reward_deliveries_target_status ON rewards.reward_deliveries USING btree (target_domain, status) |
| reward_deliveries_grant_id_key | true | — | CREATE UNIQUE INDEX reward_deliveries_grant_id_key ON rewards.reward_deliveries USING btree (grant_id) |
| reward_deliveries_idempotency_key_key | true | — | CREATE UNIQUE INDEX reward_deliveries_idempotency_key_key ON rewards.reward_deliveries USING btree (idempotency_key) |
| reward_deliveries_pkey | true | — | CREATE UNIQUE INDEX reward_deliveries_pkey ON rewards.reward_deliveries USING btree (id) |
| uq_reward_deliveries_target_reference | true | (target_reference_id IS NOT NULL) | CREATE UNIQUE INDEX uq_reward_deliveries_target_reference ON rewards.reward_deliveries USING btree (target_domain, target_reference_id) WHERE (target_reference_id IS NOT NULL) |

#### rewards.reward_events

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| source_domain | character varying(32) | false | — | — |
| source_event_id | uuid | false | — | — |
| event_type | character varying(64) | false | — | — |
| event_version | integer | false | — | — |
| subject_user_id | uuid | false | — | — |
| source_reference_type | character varying(64) | true | — | — |
| source_reference_id | uuid | true | — | — |
| occurred_at | timestamp with time zone | false | — | — |
| payload | jsonb | false | — | — |
| processing_status | character varying(16) | false | 'RECEIVED'::character varying | — |
| attempt_count | integer | false | 0 | — |
| processing_started_at | timestamp with time zone | true | — | — |
| next_retry_at | timestamp with time zone | true | — | — |
| processed_at | timestamp with time zone | true | — | — |
| last_error_code | character varying(64) | true | — | — |
| last_error_message | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| reward_events_attempt_count_check | c | CHECK (attempt_count >= 0) |
| reward_events_check | c | CHECK (source_reference_type IS NULL AND source_reference_id IS NULL OR source_reference_type IS NOT NULL AND source_reference_id IS NOT NULL) |
| reward_events_check1 | c | CHECK (processing_status::text <> 'PROCESSING'::text OR processing_started_at IS NOT NULL) |
| reward_events_check2 | c | CHECK ((processing_status::text <> ALL (ARRAY['PROCESSED'::character varying, 'IGNORED'::character varying]::text[])) OR processed_at IS NOT NULL) |
| reward_events_event_version_check | c | CHECK (event_version > 0) |
| reward_events_payload_check | c | CHECK (jsonb_typeof(payload) = 'object'::text) |
| reward_events_processing_status_check | c | CHECK (processing_status::text = ANY (ARRAY['RECEIVED'::character varying, 'PROCESSING'::character varying, 'PROCESSED'::character varying, 'IGNORED'::character varying, 'FAILED'::character varying]::text[])) |
| reward_events_attempt_count_not_null | n | NOT NULL attempt_count |
| reward_events_created_at_not_null | n | NOT NULL created_at |
| reward_events_event_type_not_null | n | NOT NULL event_type |
| reward_events_event_version_not_null | n | NOT NULL event_version |
| reward_events_id_not_null | n | NOT NULL id |
| reward_events_occurred_at_not_null | n | NOT NULL occurred_at |
| reward_events_payload_not_null | n | NOT NULL payload |
| reward_events_processing_status_not_null | n | NOT NULL processing_status |
| reward_events_source_domain_not_null | n | NOT NULL source_domain |
| reward_events_source_event_id_not_null | n | NOT NULL source_event_id |
| reward_events_subject_user_id_not_null | n | NOT NULL subject_user_id |
| reward_events_updated_at_not_null | n | NOT NULL updated_at |
| reward_events_pkey | p | PRIMARY KEY (id) |
| reward_events_source_domain_source_event_id_key | u | UNIQUE (source_domain, source_event_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_reward_events_processing_queue | false | ((processing_status)::text = 'RECEIVED'::text) | CREATE INDEX idx_reward_events_processing_queue ON rewards.reward_events USING btree (next_retry_at, created_at) WHERE ((processing_status)::text = 'RECEIVED'::text) |
| idx_reward_events_source_reference | false | (source_reference_id IS NOT NULL) | CREATE INDEX idx_reward_events_source_reference ON rewards.reward_events USING btree (source_reference_type, source_reference_id) WHERE (source_reference_id IS NOT NULL) |
| idx_reward_events_stale_processing | false | ((processing_status)::text = 'PROCESSING'::text) | CREATE INDEX idx_reward_events_stale_processing ON rewards.reward_events USING btree (processing_started_at) WHERE ((processing_status)::text = 'PROCESSING'::text) |
| idx_reward_events_type_occurred | false | — | CREATE INDEX idx_reward_events_type_occurred ON rewards.reward_events USING btree (event_type, occurred_at DESC) |
| idx_reward_events_user_occurred | false | — | CREATE INDEX idx_reward_events_user_occurred ON rewards.reward_events USING btree (subject_user_id, occurred_at DESC) |
| reward_events_pkey | true | — | CREATE UNIQUE INDEX reward_events_pkey ON rewards.reward_events USING btree (id) |
| reward_events_source_domain_source_event_id_key | true | — | CREATE UNIQUE INDEX reward_events_source_domain_source_event_id_key ON rewards.reward_events USING btree (source_domain, source_event_id) |

#### rewards.reward_grants

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| grant_no | uuid | false | — | — |
| program_id | bigint | false | — | — |
| rule_id | bigint | false | — | — |
| event_id | bigint | false | — | — |
| user_id | uuid | false | — | — |
| reward_type | character varying(32) | false | — | — |
| reward_amount | bigint | false | — | — |
| reason_code | character varying(64) | false | — | — |
| dedupe_key | character varying(200) | false | — | — |
| decision_status | character varying(16) | false | — | — |
| granted_at | timestamp with time zone | false | — | — |
| voided_at | timestamp with time zone | true | — | — |
| void_reason | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| reward_grants_check | c | CHECK (decision_status::text = 'VOIDED'::text AND voided_at IS NOT NULL AND void_reason IS NOT NULL OR decision_status::text = 'GRANTED'::text AND voided_at IS NULL AND void_reason IS NULL) |
| reward_grants_decision_status_check | c | CHECK (decision_status::text = ANY (ARRAY['GRANTED'::character varying, 'VOIDED'::character varying]::text[])) |
| reward_grants_reward_amount_check | c | CHECK (reward_amount > 0) |
| reward_grants_reward_type_check | c | CHECK (reward_type::text = 'COIN'::text) |
| reward_grants_event_id_fkey | f | FOREIGN KEY (event_id) REFERENCES rewards.reward_events(id) ON DELETE RESTRICT |
| reward_grants_program_id_fkey | f | FOREIGN KEY (program_id) REFERENCES rewards.reward_programs(id) ON DELETE RESTRICT |
| reward_grants_rule_id_fkey | f | FOREIGN KEY (rule_id) REFERENCES rewards.reward_rules(id) ON DELETE RESTRICT |
| reward_grants_created_at_not_null | n | NOT NULL created_at |
| reward_grants_decision_status_not_null | n | NOT NULL decision_status |
| reward_grants_dedupe_key_not_null | n | NOT NULL dedupe_key |
| reward_grants_event_id_not_null | n | NOT NULL event_id |
| reward_grants_grant_no_not_null | n | NOT NULL grant_no |
| reward_grants_granted_at_not_null | n | NOT NULL granted_at |
| reward_grants_id_not_null | n | NOT NULL id |
| reward_grants_program_id_not_null | n | NOT NULL program_id |
| reward_grants_reason_code_not_null | n | NOT NULL reason_code |
| reward_grants_reward_amount_not_null | n | NOT NULL reward_amount |
| reward_grants_reward_type_not_null | n | NOT NULL reward_type |
| reward_grants_rule_id_not_null | n | NOT NULL rule_id |
| reward_grants_updated_at_not_null | n | NOT NULL updated_at |
| reward_grants_user_id_not_null | n | NOT NULL user_id |
| reward_grants_pkey | p | PRIMARY KEY (id) |
| reward_grants_dedupe_key_key | u | UNIQUE (dedupe_key) |
| reward_grants_grant_no_key | u | UNIQUE (grant_no) |
| reward_grants_rule_id_event_id_user_id_key | u | UNIQUE (rule_id, event_id, user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_reward_grants_event | false | — | CREATE INDEX idx_reward_grants_event ON rewards.reward_grants USING btree (event_id) |
| idx_reward_grants_program_time | false | — | CREATE INDEX idx_reward_grants_program_time ON rewards.reward_grants USING btree (program_id, granted_at DESC) |
| idx_reward_grants_rule_user_status | false | — | CREATE INDEX idx_reward_grants_rule_user_status ON rewards.reward_grants USING btree (rule_id, user_id, decision_status) |
| idx_reward_grants_user_time | false | — | CREATE INDEX idx_reward_grants_user_time ON rewards.reward_grants USING btree (user_id, granted_at DESC) |
| reward_grants_dedupe_key_key | true | — | CREATE UNIQUE INDEX reward_grants_dedupe_key_key ON rewards.reward_grants USING btree (dedupe_key) |
| reward_grants_grant_no_key | true | — | CREATE UNIQUE INDEX reward_grants_grant_no_key ON rewards.reward_grants USING btree (grant_no) |
| reward_grants_pkey | true | — | CREATE UNIQUE INDEX reward_grants_pkey ON rewards.reward_grants USING btree (id) |
| reward_grants_rule_id_event_id_user_id_key | true | — | CREATE UNIQUE INDEX reward_grants_rule_id_event_id_user_id_key ON rewards.reward_grants USING btree (rule_id, event_id, user_id) |

#### rewards.reward_programs

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| program_key | character varying(64) | false | — | — |
| name | character varying(120) | false | — | — |
| description | text | true | — | — |
| status | character varying(16) | false | 'DRAFT'::character varying | — |
| starts_at | timestamp with time zone | true | — | — |
| ends_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| reward_programs_check | c | CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at) |
| reward_programs_status_check | c | CHECK (status::text = ANY (ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying, 'PAUSED'::character varying, 'ENDED'::character varying, 'ARCHIVED'::character varying]::text[])) |
| reward_programs_created_at_not_null | n | NOT NULL created_at |
| reward_programs_id_not_null | n | NOT NULL id |
| reward_programs_name_not_null | n | NOT NULL name |
| reward_programs_program_key_not_null | n | NOT NULL program_key |
| reward_programs_status_not_null | n | NOT NULL status |
| reward_programs_updated_at_not_null | n | NOT NULL updated_at |
| reward_programs_pkey | p | PRIMARY KEY (id) |
| reward_programs_program_key_key | u | UNIQUE (program_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_reward_programs_status | false | — | CREATE INDEX idx_reward_programs_status ON rewards.reward_programs USING btree (status) |
| reward_programs_pkey | true | — | CREATE UNIQUE INDEX reward_programs_pkey ON rewards.reward_programs USING btree (id) |
| reward_programs_program_key_key | true | — | CREATE UNIQUE INDEX reward_programs_program_key_key ON rewards.reward_programs USING btree (program_key) |

#### rewards.reward_rules

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| program_id | bigint | false | — | — |
| rule_key | character varying(64) | false | — | — |
| version | integer | false | 1 | — |
| name | character varying(120) | false | — | — |
| status | character varying(16) | false | 'DRAFT'::character varying | — |
| trigger_event_type | character varying(64) | false | — | — |
| reward_type | character varying(32) | false | 'COIN'::character varying | — |
| reward_amount | bigint | false | — | — |
| condition_config | jsonb | false | '{}'::jsonb | — |
| limit_config | jsonb | false | '{}'::jsonb | — |
| priority | integer | false | 100 | — |
| effective_from | timestamp with time zone | true | — | — |
| effective_to | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| reward_rules_check | c | CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from) |
| reward_rules_check1 | c | CHECK (status::text = 'DRAFT'::text OR effective_from IS NOT NULL) |
| reward_rules_check2 | c | CHECK (status::text <> 'RETIRED'::text OR effective_to IS NOT NULL) |
| reward_rules_condition_config_check | c | CHECK (jsonb_typeof(condition_config) = 'object'::text) |
| reward_rules_limit_config_check | c | CHECK (jsonb_typeof(limit_config) = 'object'::text) |
| reward_rules_priority_check | c | CHECK (priority >= 0) |
| reward_rules_reward_amount_check | c | CHECK (reward_amount > 0) |
| reward_rules_reward_type_check | c | CHECK (reward_type::text = 'COIN'::text) |
| reward_rules_status_check | c | CHECK (status::text = ANY (ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying, 'PAUSED'::character varying, 'RETIRED'::character varying]::text[])) |
| reward_rules_version_check | c | CHECK (version > 0) |
| reward_rules_program_id_fkey | f | FOREIGN KEY (program_id) REFERENCES rewards.reward_programs(id) ON DELETE RESTRICT |
| reward_rules_condition_config_not_null | n | NOT NULL condition_config |
| reward_rules_created_at_not_null | n | NOT NULL created_at |
| reward_rules_id_not_null | n | NOT NULL id |
| reward_rules_limit_config_not_null | n | NOT NULL limit_config |
| reward_rules_name_not_null | n | NOT NULL name |
| reward_rules_priority_not_null | n | NOT NULL priority |
| reward_rules_program_id_not_null | n | NOT NULL program_id |
| reward_rules_reward_amount_not_null | n | NOT NULL reward_amount |
| reward_rules_reward_type_not_null | n | NOT NULL reward_type |
| reward_rules_rule_key_not_null | n | NOT NULL rule_key |
| reward_rules_status_not_null | n | NOT NULL status |
| reward_rules_trigger_event_type_not_null | n | NOT NULL trigger_event_type |
| reward_rules_updated_at_not_null | n | NOT NULL updated_at |
| reward_rules_version_not_null | n | NOT NULL version |
| reward_rules_pkey | p | PRIMARY KEY (id) |
| reward_rules_program_id_rule_key_version_key | u | UNIQUE (program_id, rule_key, version) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_reward_rules_program_status | false | — | CREATE INDEX idx_reward_rules_program_status ON rewards.reward_rules USING btree (program_id, status) |
| idx_reward_rules_trigger | false | — | CREATE INDEX idx_reward_rules_trigger ON rewards.reward_rules USING btree (trigger_event_type) |
| idx_reward_rules_trigger_window | false | — | CREATE INDEX idx_reward_rules_trigger_window ON rewards.reward_rules USING btree (trigger_event_type, effective_from, effective_to) |
| reward_rules_pkey | true | — | CREATE UNIQUE INDEX reward_rules_pkey ON rewards.reward_rules USING btree (id) |
| reward_rules_program_id_rule_key_version_key | true | — | CREATE UNIQUE INDEX reward_rules_program_id_rule_key_version_key ON rewards.reward_rules USING btree (program_id, rule_key, version) |
| uq_reward_rules_current | true | ((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'PAUSED'::character varying])::text[])) | CREATE UNIQUE INDEX uq_reward_rules_current ON rewards.reward_rules USING btree (program_id, rule_key) WHERE ((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'PAUSED'::character varying])::text[])) |

### trust

#### trust.appeals

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| decision_id | uuid | false | — | — |
| appellant_user_id | uuid | false | — | — |
| reason | text | false | — | — |
| status | character varying(24) | false | 'submitted'::character varying | — |
| resolution | character varying(24) | true | — | — |
| reviewer_operator_id | uuid | true | — | — |
| resolution_note | text | true | — | — |
| submitted_at | timestamp with time zone | false | now() | — |
| review_started_at | timestamp with time zone | true | — | — |
| closed_at | timestamp with time zone | true | — | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| appeals_lifecycle_check | c | CHECK (status::text = 'submitted'::text AND reviewer_operator_id IS NULL AND review_started_at IS NULL AND closed_at IS NULL AND resolution IS NULL OR status::text = 'under_review'::text AND reviewer_operator_id IS NOT NULL AND review_started_at IS NOT NULL AND closed_at IS NULL AND resolution IS NULL OR status::text = 'resolved'::text AND reviewer_operator_id IS NOT NULL AND review_started_at IS NOT NULL AND closed_at IS NOT NULL AND resolution IS NOT NULL AND resolution_note IS NOT NULL OR status::text = 'withdrawn'::text AND closed_at IS NOT NULL AND resolution IS NULL) |
| appeals_resolution_check | c | CHECK (resolution IS NULL OR (resolution::text = ANY (ARRAY['denied'::character varying, 'partially_granted'::character varying, 'granted'::character varying]::text[]))) |
| appeals_status_check | c | CHECK (status::text = ANY (ARRAY['submitted'::character varying, 'under_review'::character varying, 'resolved'::character varying, 'withdrawn'::character varying]::text[])) |
| appeals_time_order_check | c | CHECK ((review_started_at IS NULL OR review_started_at >= submitted_at) AND (closed_at IS NULL OR closed_at >= submitted_at) AND (review_started_at IS NULL OR closed_at IS NULL OR closed_at >= review_started_at)) |
| appeals_decision_fk | f | FOREIGN KEY (decision_id) REFERENCES trust.moderation_decisions(id) ON DELETE RESTRICT |
| appeals_appellant_user_id_not_null | n | NOT NULL appellant_user_id |
| appeals_decision_id_not_null | n | NOT NULL decision_id |
| appeals_id_not_null | n | NOT NULL id |
| appeals_reason_not_null | n | NOT NULL reason |
| appeals_status_not_null | n | NOT NULL status |
| appeals_submitted_at_not_null | n | NOT NULL submitted_at |
| appeals_updated_at_not_null | n | NOT NULL updated_at |
| appeals_pkey | p | PRIMARY KEY (id) |
| appeals_decision_appellant_unique | u | UNIQUE (decision_id, appellant_user_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| appeals_decision_appellant_unique | true | — | CREATE UNIQUE INDEX appeals_decision_appellant_unique ON trust.appeals USING btree (decision_id, appellant_user_id) |
| appeals_pkey | true | — | CREATE UNIQUE INDEX appeals_pkey ON trust.appeals USING btree (id) |
| idx_appeals_appellant | false | — | CREATE INDEX idx_appeals_appellant ON trust.appeals USING btree (appellant_user_id, submitted_at DESC) |
| idx_appeals_queue | false | ((status)::text = 'submitted'::text) | CREATE INDEX idx_appeals_queue ON trust.appeals USING btree (submitted_at) WHERE ((status)::text = 'submitted'::text) |
| idx_appeals_reviewer | false | ((status)::text = 'under_review'::text) | CREATE INDEX idx_appeals_reviewer ON trust.appeals USING btree (reviewer_operator_id, submitted_at) WHERE ((status)::text = 'under_review'::text) |

#### trust.enforcement_actions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| decision_id | uuid | false | — | — |
| appeal_id | uuid | true | — | — |
| action_type | character varying(32) | false | — | — |
| target_user_id | uuid | true | — | — |
| subject_domain | character varying(32) | true | — | — |
| subject_type | character varying(32) | true | — | — |
| subject_id | uuid | true | — | — |
| status | character varying(24) | false | 'pending'::character varying | — |
| effective_at | timestamp with time zone | false | — | — |
| expires_at | timestamp with time zone | true | — | — |
| applied_at | timestamp with time zone | true | — | — |
| ended_at | timestamp with time zone | true | — | — |
| status_reason_code | character varying(64) | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| enforcement_actions_ban_check | c | CHECK (action_type::text <> 'account_ban'::text OR expires_at IS NULL) |
| enforcement_actions_expiry_check | c | CHECK (expires_at IS NULL OR expires_at > effective_at) |
| enforcement_actions_lifecycle_check | c | CHECK (status::text = 'pending'::text AND applied_at IS NULL AND ended_at IS NULL AND status_reason_code IS NULL OR status::text = 'applied'::text AND applied_at IS NOT NULL AND ended_at IS NULL AND status_reason_code IS NULL OR status::text = 'expired'::text AND applied_at IS NOT NULL AND ended_at IS NOT NULL AND expires_at IS NOT NULL OR status::text = 'revoked'::text AND applied_at IS NOT NULL AND ended_at IS NOT NULL AND status_reason_code IS NOT NULL OR status::text = 'cancelled'::text AND applied_at IS NULL AND ended_at IS NOT NULL AND status_reason_code IS NOT NULL OR status::text = 'failed'::text AND applied_at IS NULL AND ended_at IS NOT NULL AND status_reason_code IS NOT NULL) |
| enforcement_actions_permanent_action_expiry_check | c | CHECK ((action_type::text <> ALL (ARRAY['warning'::character varying, 'content_remove'::character varying]::text[])) OR expires_at IS NULL) |
| enforcement_actions_status_check | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'applied'::character varying, 'expired'::character varying, 'revoked'::character varying, 'cancelled'::character varying, 'failed'::character varying]::text[])) |
| enforcement_actions_subject_domain_check | c | CHECK (subject_domain IS NULL OR (subject_domain::text = ANY (ARRAY['social'::character varying, 'chat'::character varying, 'commerce'::character varying]::text[]))) |
| enforcement_actions_subject_type_check | c | CHECK (subject_type IS NULL OR (subject_type::text = ANY (ARRAY['social_profile'::character varying, 'social_post'::character varying, 'social_post_image'::character varying, 'chat_message'::character varying, 'conversation'::character varying]::text[]))) |
| enforcement_actions_suspend_check | c | CHECK (action_type::text <> 'account_suspend'::text OR expires_at IS NOT NULL) |
| enforcement_actions_target_check | c | CHECK ((action_type::text = ANY (ARRAY['warning'::character varying, 'social_post_restrict'::character varying, 'chat_send_restrict'::character varying, 'account_suspend'::character varying, 'account_ban'::character varying]::text[])) AND target_user_id IS NOT NULL AND subject_domain IS NULL AND subject_type IS NULL AND subject_id IS NULL OR (action_type::text = ANY (ARRAY['content_remove'::character varying, 'content_restrict'::character varying]::text[])) AND target_user_id IS NULL AND subject_domain IS NOT NULL AND subject_type IS NOT NULL AND subject_id IS NOT NULL) |
| enforcement_actions_time_order_check | c | CHECK ((applied_at IS NULL OR applied_at >= effective_at) AND (applied_at IS NULL OR ended_at IS NULL OR ended_at >= applied_at) AND (status::text <> 'expired'::text OR ended_at >= expires_at)) |
| enforcement_actions_type_check | c | CHECK (action_type::text = ANY (ARRAY['warning'::character varying, 'content_remove'::character varying, 'content_restrict'::character varying, 'social_post_restrict'::character varying, 'chat_send_restrict'::character varying, 'account_suspend'::character varying, 'account_ban'::character varying]::text[])) |
| enforcement_actions_appeal_fk | f | FOREIGN KEY (appeal_id) REFERENCES trust.appeals(id) ON DELETE RESTRICT |
| enforcement_actions_decision_fk | f | FOREIGN KEY (decision_id) REFERENCES trust.moderation_decisions(id) ON DELETE RESTRICT |
| enforcement_actions_action_type_not_null | n | NOT NULL action_type |
| enforcement_actions_created_at_not_null | n | NOT NULL created_at |
| enforcement_actions_decision_id_not_null | n | NOT NULL decision_id |
| enforcement_actions_effective_at_not_null | n | NOT NULL effective_at |
| enforcement_actions_id_not_null | n | NOT NULL id |
| enforcement_actions_status_not_null | n | NOT NULL status |
| enforcement_actions_updated_at_not_null | n | NOT NULL updated_at |
| enforcement_actions_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| enforcement_actions_pkey | true | — | CREATE UNIQUE INDEX enforcement_actions_pkey ON trust.enforcement_actions USING btree (id) |
| idx_enforcement_actions_appeal | false | (appeal_id IS NOT NULL) | CREATE INDEX idx_enforcement_actions_appeal ON trust.enforcement_actions USING btree (appeal_id, created_at) WHERE (appeal_id IS NOT NULL) |
| idx_enforcement_actions_decision | false | — | CREATE INDEX idx_enforcement_actions_decision ON trust.enforcement_actions USING btree (decision_id, created_at) |
| idx_enforcement_actions_expiry | false | (((status)::text = 'applied'::text) AND (expires_at IS NOT NULL)) | CREATE INDEX idx_enforcement_actions_expiry ON trust.enforcement_actions USING btree (expires_at) WHERE (((status)::text = 'applied'::text) AND (expires_at IS NOT NULL)) |
| idx_enforcement_actions_pending | false | ((status)::text = 'pending'::text) | CREATE INDEX idx_enforcement_actions_pending ON trust.enforcement_actions USING btree (effective_at) WHERE ((status)::text = 'pending'::text) |
| idx_enforcement_actions_subject | false | (subject_id IS NOT NULL) | CREATE INDEX idx_enforcement_actions_subject ON trust.enforcement_actions USING btree (subject_domain, subject_type, subject_id, status) WHERE (subject_id IS NOT NULL) |
| idx_enforcement_actions_user_current | false | ((target_user_id IS NOT NULL) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'applied'::character varying])::text[]))) | CREATE INDEX idx_enforcement_actions_user_current ON trust.enforcement_actions USING btree (target_user_id, action_type, status) WHERE ((target_user_id IS NOT NULL) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'applied'::character varying])::text[]))) |

#### trust.moderation_cases

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| source_type | character varying(32) | false | — | — |
| report_id | uuid | true | — | — |
| subject_domain | character varying(32) | false | — | — |
| subject_type | character varying(32) | false | — | — |
| subject_id | uuid | false | — | — |
| priority | character varying(16) | false | 'normal'::character varying | — |
| status | character varying(24) | false | 'queued'::character varying | — |
| assigned_operator_id | uuid | true | — | — |
| cancellation_code | character varying(32) | true | — | — |
| review_started_at | timestamp with time zone | true | — | — |
| closed_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| moderation_cases_cancellation_check | c | CHECK (status::text = 'cancelled'::text AND cancellation_code IS NOT NULL OR status::text <> 'cancelled'::text AND cancellation_code IS NULL) |
| moderation_cases_cancellation_code_check | c | CHECK (cancellation_code IS NULL OR (cancellation_code::text = ANY (ARRAY['subject_unavailable'::character varying, 'superseded'::character varying, 'invalid_source'::character varying, 'duplicate'::character varying, 'other'::character varying]::text[]))) |
| moderation_cases_lifecycle_check | c | CHECK (status::text = 'queued'::text AND review_started_at IS NULL AND closed_at IS NULL OR status::text = 'in_review'::text AND review_started_at IS NOT NULL AND closed_at IS NULL OR status::text = 'resolved'::text AND review_started_at IS NOT NULL AND closed_at IS NOT NULL OR status::text = 'cancelled'::text AND closed_at IS NOT NULL) |
| moderation_cases_priority_check | c | CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'critical'::character varying]::text[])) |
| moderation_cases_report_source_check | c | CHECK (source_type::text = 'user_report'::text AND report_id IS NOT NULL OR source_type::text <> 'user_report'::text AND report_id IS NULL) |
| moderation_cases_source_type_check | c | CHECK (source_type::text = ANY (ARRAY['user_report'::character varying, 'pre_publish'::character varying, 'manual_review'::character varying, 'automated_detection'::character varying, 'system_rule'::character varying]::text[])) |
| moderation_cases_status_check | c | CHECK (status::text = ANY (ARRAY['queued'::character varying, 'in_review'::character varying, 'resolved'::character varying, 'cancelled'::character varying]::text[])) |
| moderation_cases_subject_domain_check | c | CHECK (subject_domain::text = ANY (ARRAY['identity'::character varying, 'social'::character varying, 'chat'::character varying, 'commerce'::character varying]::text[])) |
| moderation_cases_subject_type_check | c | CHECK (subject_type::text = ANY (ARRAY['user'::character varying, 'social_profile'::character varying, 'social_post'::character varying, 'social_post_image'::character varying, 'chat_message'::character varying, 'conversation'::character varying]::text[])) |
| moderation_cases_time_order_check | c | CHECK ((review_started_at IS NULL OR review_started_at >= created_at) AND (closed_at IS NULL OR closed_at >= created_at) AND (review_started_at IS NULL OR closed_at IS NULL OR closed_at >= review_started_at)) |
| moderation_cases_user_report_not_cancelled_check | c | CHECK (source_type::text <> 'user_report'::text OR status::text <> 'cancelled'::text) |
| moderation_cases_report_fk | f | FOREIGN KEY (report_id) REFERENCES trust.reports(id) ON DELETE RESTRICT |
| moderation_cases_created_at_not_null | n | NOT NULL created_at |
| moderation_cases_id_not_null | n | NOT NULL id |
| moderation_cases_priority_not_null | n | NOT NULL priority |
| moderation_cases_source_type_not_null | n | NOT NULL source_type |
| moderation_cases_status_not_null | n | NOT NULL status |
| moderation_cases_subject_domain_not_null | n | NOT NULL subject_domain |
| moderation_cases_subject_id_not_null | n | NOT NULL subject_id |
| moderation_cases_subject_type_not_null | n | NOT NULL subject_type |
| moderation_cases_updated_at_not_null | n | NOT NULL updated_at |
| moderation_cases_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_moderation_cases_operator | false | (assigned_operator_id IS NOT NULL) | CREATE INDEX idx_moderation_cases_operator ON trust.moderation_cases USING btree (assigned_operator_id, status, created_at) WHERE (assigned_operator_id IS NOT NULL) |
| idx_moderation_cases_queue | false | ((status)::text = 'queued'::text) | CREATE INDEX idx_moderation_cases_queue ON trust.moderation_cases USING btree (( CASE priority     WHEN 'critical'::text THEN 4     WHEN 'high'::text THEN 3     WHEN 'normal'::text THEN 2     WHEN 'low'::text THEN 1     ELSE NULL::integer END) DESC, created_at) WHERE ((status)::text = 'queued'::text) |
| idx_moderation_cases_subject | false | — | CREATE INDEX idx_moderation_cases_subject ON trust.moderation_cases USING btree (subject_domain, subject_type, subject_id, created_at DESC) |
| moderation_cases_pkey | true | — | CREATE UNIQUE INDEX moderation_cases_pkey ON trust.moderation_cases USING btree (id) |
| uq_moderation_cases_report | true | (report_id IS NOT NULL) | CREATE UNIQUE INDEX uq_moderation_cases_report ON trust.moderation_cases USING btree (report_id) WHERE (report_id IS NOT NULL) |

#### trust.moderation_decisions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| case_id | uuid | false | — | — |
| outcome | character varying(32) | false | — | — |
| violation_code | character varying(40) | true | — | — |
| severity | character varying(16) | false | 'none'::character varying | — |
| policy_code | character varying(64) | true | — | — |
| policy_version | character varying(32) | true | — | — |
| decision_method | character varying(16) | false | — | — |
| decided_by_operator_id | uuid | true | — | — |
| rationale | text | true | — | — |
| decided_at | timestamp with time zone | false | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| moderation_decisions_actor_check | c | CHECK (decision_method::text = 'automated'::text AND decided_by_operator_id IS NULL OR (decision_method::text = ANY (ARRAY['human'::character varying, 'hybrid'::character varying]::text[])) AND decided_by_operator_id IS NOT NULL) |
| moderation_decisions_method_check | c | CHECK (decision_method::text = ANY (ARRAY['human'::character varying, 'automated'::character varying, 'hybrid'::character varying]::text[])) |
| moderation_decisions_outcome_check | c | CHECK (outcome::text = ANY (ARRAY['no_violation'::character varying, 'violation'::character varying, 'insufficient_evidence'::character varying]::text[])) |
| moderation_decisions_policy_pair_check | c | CHECK (policy_code IS NULL AND policy_version IS NULL OR policy_code IS NOT NULL AND policy_version IS NOT NULL) |
| moderation_decisions_result_check | c | CHECK (outcome::text = 'violation'::text AND violation_code IS NOT NULL AND severity::text <> 'none'::text AND policy_code IS NOT NULL AND policy_version IS NOT NULL OR (outcome::text = ANY (ARRAY['no_violation'::character varying, 'insufficient_evidence'::character varying]::text[])) AND violation_code IS NULL AND severity::text = 'none'::text) |
| moderation_decisions_severity_check | c | CHECK (severity::text = ANY (ARRAY['none'::character varying, 'low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying]::text[])) |
| moderation_decisions_violation_code_check | c | CHECK (violation_code IS NULL OR (violation_code::text = ANY (ARRAY['spam'::character varying, 'harassment'::character varying, 'hate'::character varying, 'sexual_content'::character varying, 'violence'::character varying, 'fraud'::character varying, 'impersonation'::character varying, 'illegal_content'::character varying, 'privacy'::character varying, 'underage_safety'::character varying, 'other_policy_violation'::character varying]::text[]))) |
| moderation_decisions_case_fk | f | FOREIGN KEY (case_id) REFERENCES trust.moderation_cases(id) ON DELETE RESTRICT |
| moderation_decisions_case_id_not_null | n | NOT NULL case_id |
| moderation_decisions_decided_at_not_null | n | NOT NULL decided_at |
| moderation_decisions_decision_method_not_null | n | NOT NULL decision_method |
| moderation_decisions_id_not_null | n | NOT NULL id |
| moderation_decisions_outcome_not_null | n | NOT NULL outcome |
| moderation_decisions_severity_not_null | n | NOT NULL severity |
| moderation_decisions_pkey | p | PRIMARY KEY (id) |
| moderation_decisions_case_unique | u | UNIQUE (case_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_moderation_decisions_violation | false | ((outcome)::text = 'violation'::text) | CREATE INDEX idx_moderation_decisions_violation ON trust.moderation_decisions USING btree (violation_code, decided_at DESC) WHERE ((outcome)::text = 'violation'::text) |
| moderation_decisions_case_unique | true | — | CREATE UNIQUE INDEX moderation_decisions_case_unique ON trust.moderation_decisions USING btree (case_id) |
| moderation_decisions_pkey | true | — | CREATE UNIQUE INDEX moderation_decisions_pkey ON trust.moderation_decisions USING btree (id) |

#### trust.moderation_evidence

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| case_id | uuid | false | — | — |
| appeal_id | uuid | true | — | — |
| evidence_type | character varying(32) | false | — | — |
| source_type | character varying(24) | false | — | — |
| content_text | text | true | — | — |
| asset_id | uuid | true | — | — |
| reference_domain | character varying(32) | true | — | — |
| reference_type | character varying(32) | true | — | — |
| reference_id | uuid | true | — | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| content_sha256 | character varying(64) | true | — | — |
| captured_at | timestamp with time zone | false | — | — |
| submitted_by_user_id | uuid | true | — | — |
| added_by_operator_id | uuid | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| moderation_evidence_actor_check | c | CHECK ((source_type::text = ANY (ARRAY['reporter'::character varying, 'appellant'::character varying]::text[])) AND submitted_by_user_id IS NOT NULL AND added_by_operator_id IS NULL OR source_type::text = 'moderator'::text AND submitted_by_user_id IS NULL AND added_by_operator_id IS NOT NULL OR (source_type::text = ANY (ARRAY['system'::character varying, 'domain_snapshot'::character varying]::text[])) AND submitted_by_user_id IS NULL AND added_by_operator_id IS NULL) |
| moderation_evidence_content_sha256_check | c | CHECK (content_sha256 IS NULL OR content_sha256::text ~ '^[0-9a-f]{64}$'::text) |
| moderation_evidence_evidence_type_check | c | CHECK (evidence_type::text = ANY (ARRAY['text_snapshot'::character varying, 'media_snapshot'::character varying, 'object_reference'::character varying, 'metadata_snapshot'::character varying]::text[])) |
| moderation_evidence_metadata_check | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| moderation_evidence_payload_check | c | CHECK (evidence_type::text = 'text_snapshot'::text AND content_text IS NOT NULL AND asset_id IS NULL AND reference_id IS NULL AND content_sha256 IS NOT NULL OR evidence_type::text = 'media_snapshot'::text AND content_text IS NULL AND asset_id IS NOT NULL AND reference_id IS NULL AND content_sha256 IS NOT NULL OR evidence_type::text = 'object_reference'::text AND content_text IS NULL AND asset_id IS NULL AND reference_domain IS NOT NULL AND reference_type IS NOT NULL AND reference_id IS NOT NULL OR evidence_type::text = 'metadata_snapshot'::text AND content_text IS NULL AND asset_id IS NULL AND reference_id IS NULL AND metadata <> '{}'::jsonb) |
| moderation_evidence_reference_domain_check | c | CHECK (reference_domain IS NULL OR (reference_domain::text = ANY (ARRAY['identity'::character varying, 'social'::character varying, 'chat'::character varying, 'commerce'::character varying]::text[]))) |
| moderation_evidence_reference_pair_check | c | CHECK (reference_domain IS NULL AND reference_type IS NULL AND reference_id IS NULL OR reference_domain IS NOT NULL AND reference_type IS NOT NULL AND reference_id IS NOT NULL) |
| moderation_evidence_reference_type_check | c | CHECK (reference_type IS NULL OR (reference_type::text = ANY (ARRAY['user'::character varying, 'social_profile'::character varying, 'social_post'::character varying, 'social_post_image'::character varying, 'chat_message'::character varying, 'conversation'::character varying]::text[]))) |
| moderation_evidence_source_type_check | c | CHECK (source_type::text = ANY (ARRAY['system'::character varying, 'domain_snapshot'::character varying, 'reporter'::character varying, 'appellant'::character varying, 'moderator'::character varying]::text[])) |
| moderation_evidence_appeal_id_fkey | f | FOREIGN KEY (appeal_id) REFERENCES trust.appeals(id) ON DELETE RESTRICT |
| moderation_evidence_case_id_fkey | f | FOREIGN KEY (case_id) REFERENCES trust.moderation_cases(id) ON DELETE RESTRICT |
| moderation_evidence_captured_at_not_null | n | NOT NULL captured_at |
| moderation_evidence_case_id_not_null | n | NOT NULL case_id |
| moderation_evidence_created_at_not_null | n | NOT NULL created_at |
| moderation_evidence_evidence_type_not_null | n | NOT NULL evidence_type |
| moderation_evidence_id_not_null | n | NOT NULL id |
| moderation_evidence_metadata_not_null | n | NOT NULL metadata |
| moderation_evidence_source_type_not_null | n | NOT NULL source_type |
| moderation_evidence_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_moderation_evidence_appeal | false | (appeal_id IS NOT NULL) | CREATE INDEX idx_moderation_evidence_appeal ON trust.moderation_evidence USING btree (appeal_id, captured_at) WHERE (appeal_id IS NOT NULL) |
| idx_moderation_evidence_asset | false | (asset_id IS NOT NULL) | CREATE INDEX idx_moderation_evidence_asset ON trust.moderation_evidence USING btree (asset_id, captured_at) WHERE (asset_id IS NOT NULL) |
| idx_moderation_evidence_case | false | — | CREATE INDEX idx_moderation_evidence_case ON trust.moderation_evidence USING btree (case_id, captured_at) |
| idx_moderation_evidence_reference | false | (reference_id IS NOT NULL) | CREATE INDEX idx_moderation_evidence_reference ON trust.moderation_evidence USING btree (reference_domain, reference_type, reference_id) WHERE (reference_id IS NOT NULL) |
| moderation_evidence_pkey | true | — | CREATE UNIQUE INDEX moderation_evidence_pkey ON trust.moderation_evidence USING btree (id) |

#### trust.reports

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| reporter_user_id | uuid | false | — | — |
| subject_domain | character varying(32) | false | — | — |
| subject_type | character varying(32) | false | — | — |
| subject_id | uuid | false | — | — |
| reason_code | character varying(32) | false | — | — |
| description | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| reports_reason_code_check | c | CHECK (reason_code::text = ANY (ARRAY['spam'::character varying, 'harassment'::character varying, 'hate'::character varying, 'sexual_content'::character varying, 'violence'::character varying, 'fraud'::character varying, 'impersonation'::character varying, 'illegal_content'::character varying, 'privacy'::character varying, 'underage'::character varying, 'other'::character varying]::text[])) |
| reports_subject_domain_check | c | CHECK (subject_domain::text = ANY (ARRAY['identity'::character varying, 'social'::character varying, 'chat'::character varying, 'commerce'::character varying]::text[])) |
| reports_subject_type_check | c | CHECK (subject_type::text = ANY (ARRAY['user'::character varying, 'social_profile'::character varying, 'social_post'::character varying, 'social_post_image'::character varying, 'chat_message'::character varying, 'conversation'::character varying]::text[])) |
| reports_created_at_not_null | n | NOT NULL created_at |
| reports_id_not_null | n | NOT NULL id |
| reports_reason_code_not_null | n | NOT NULL reason_code |
| reports_reporter_user_id_not_null | n | NOT NULL reporter_user_id |
| reports_subject_domain_not_null | n | NOT NULL subject_domain |
| reports_subject_id_not_null | n | NOT NULL subject_id |
| reports_subject_type_not_null | n | NOT NULL subject_type |
| reports_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_reports_reporter_created | false | — | CREATE INDEX idx_reports_reporter_created ON trust.reports USING btree (reporter_user_id, created_at DESC) |
| idx_reports_subject_created | false | — | CREATE INDEX idx_reports_subject_created ON trust.reports USING btree (subject_domain, subject_type, subject_id, created_at DESC) |
| reports_pkey | true | — | CREATE UNIQUE INDEX reports_pkey ON trust.reports USING btree (id) |

### operations

#### operations.operator_audit_logs

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| operator_id | uuid | false | — | — |
| action_key | character varying(100) | false | — | — |
| target_domain | character varying(50) | true | — | — |
| target_type | character varying(50) | true | — | — |
| target_id | uuid | true | — | — |
| request_id | character varying(64) | true | — | — |
| ip_address | inet | true | — | — |
| details | jsonb | false | '{}'::jsonb | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_operator_audit_logs_action_key | c | CHECK (action_key::text ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'::text) |
| ck_operator_audit_logs_details_object | c | CHECK (jsonb_typeof(details) = 'object'::text) |
| ck_operator_audit_logs_request_id_not_blank | c | CHECK (request_id IS NULL OR btrim(request_id::text) <> ''::text) |
| ck_operator_audit_logs_target_domain | c | CHECK (target_domain IS NULL OR target_domain::text ~ '^[a-z][a-z0-9_]*$'::text) |
| ck_operator_audit_logs_target_reference | c | CHECK (target_domain IS NULL AND target_type IS NULL AND target_id IS NULL OR target_domain IS NOT NULL AND target_type IS NOT NULL) |
| ck_operator_audit_logs_target_type | c | CHECK (target_type IS NULL OR target_type::text ~ '^[a-z][a-z0-9_]*$'::text) |
| fk_operator_audit_logs_operator | f | FOREIGN KEY (operator_id) REFERENCES operations.operators(id) ON DELETE RESTRICT |
| operator_audit_logs_action_key_not_null | n | NOT NULL action_key |
| operator_audit_logs_created_at_not_null | n | NOT NULL created_at |
| operator_audit_logs_details_not_null | n | NOT NULL details |
| operator_audit_logs_id_not_null | n | NOT NULL id |
| operator_audit_logs_operator_id_not_null | n | NOT NULL operator_id |
| pk_operator_audit_logs | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_operator_audit_logs_created_at | false | — | CREATE INDEX idx_operator_audit_logs_created_at ON operations.operator_audit_logs USING btree (created_at DESC) |
| idx_operator_audit_logs_operator_created_at | false | — | CREATE INDEX idx_operator_audit_logs_operator_created_at ON operations.operator_audit_logs USING btree (operator_id, created_at DESC) |
| idx_operator_audit_logs_request_id | false | (request_id IS NOT NULL) | CREATE INDEX idx_operator_audit_logs_request_id ON operations.operator_audit_logs USING btree (request_id) WHERE (request_id IS NOT NULL) |
| idx_operator_audit_logs_target | false | (target_domain IS NOT NULL) | CREATE INDEX idx_operator_audit_logs_target ON operations.operator_audit_logs USING btree (target_domain, target_type, target_id, created_at DESC) WHERE (target_domain IS NOT NULL) |
| pk_operator_audit_logs | true | — | CREATE UNIQUE INDEX pk_operator_audit_logs ON operations.operator_audit_logs USING btree (id) |

#### operations.operator_roles

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| operator_id | uuid | false | — | — |
| role_id | uuid | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| fk_operator_roles_operator | f | FOREIGN KEY (operator_id) REFERENCES operations.operators(id) ON DELETE RESTRICT |
| fk_operator_roles_role | f | FOREIGN KEY (role_id) REFERENCES operations.roles(id) ON DELETE RESTRICT |
| operator_roles_created_at_not_null | n | NOT NULL created_at |
| operator_roles_operator_id_not_null | n | NOT NULL operator_id |
| operator_roles_role_id_not_null | n | NOT NULL role_id |
| pk_operator_roles | p | PRIMARY KEY (operator_id, role_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_operator_roles_role | false | — | CREATE INDEX idx_operator_roles_role ON operations.operator_roles USING btree (role_id, operator_id) |
| pk_operator_roles | true | — | CREATE UNIQUE INDEX pk_operator_roles ON operations.operator_roles USING btree (operator_id, role_id) |

#### operations.operators

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| auth_subject_id | uuid | false | — | — |
| display_name | character varying(100) | false | — | — |
| status | character varying(20) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_operators_display_name_not_blank | c | CHECK (btrim(display_name::text) <> ''::text) |
| ck_operators_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying]::text[])) |
| operators_auth_subject_id_not_null | n | NOT NULL auth_subject_id |
| operators_created_at_not_null | n | NOT NULL created_at |
| operators_display_name_not_null | n | NOT NULL display_name |
| operators_id_not_null | n | NOT NULL id |
| operators_status_not_null | n | NOT NULL status |
| operators_updated_at_not_null | n | NOT NULL updated_at |
| pk_operators | p | PRIMARY KEY (id) |
| uq_operators_auth_subject_id | u | UNIQUE (auth_subject_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| pk_operators | true | — | CREATE UNIQUE INDEX pk_operators ON operations.operators USING btree (id) |
| uq_operators_auth_subject_id | true | — | CREATE UNIQUE INDEX uq_operators_auth_subject_id ON operations.operators USING btree (auth_subject_id) |

#### operations.role_permissions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| role_id | uuid | false | — | — |
| permission_key | character varying(100) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_role_permissions_permission_key | c | CHECK (permission_key::text ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'::text) |
| fk_role_permissions_role | f | FOREIGN KEY (role_id) REFERENCES operations.roles(id) ON DELETE RESTRICT |
| role_permissions_created_at_not_null | n | NOT NULL created_at |
| role_permissions_permission_key_not_null | n | NOT NULL permission_key |
| role_permissions_role_id_not_null | n | NOT NULL role_id |
| pk_role_permissions | p | PRIMARY KEY (role_id, permission_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| pk_role_permissions | true | — | CREATE UNIQUE INDEX pk_role_permissions ON operations.role_permissions USING btree (role_id, permission_key) |

#### operations.roles

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| code | character varying(50) | false | — | — |
| name | character varying(100) | false | — | — |
| description | character varying(500) | true | — | — |
| status | character varying(20) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_roles_code | c | CHECK (code::text ~ '^[a-z][a-z0-9_]*$'::text) |
| ck_roles_description_not_blank | c | CHECK (description IS NULL OR btrim(description::text) <> ''::text) |
| ck_roles_name_not_blank | c | CHECK (btrim(name::text) <> ''::text) |
| ck_roles_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying]::text[])) |
| roles_code_not_null | n | NOT NULL code |
| roles_created_at_not_null | n | NOT NULL created_at |
| roles_id_not_null | n | NOT NULL id |
| roles_name_not_null | n | NOT NULL name |
| roles_status_not_null | n | NOT NULL status |
| roles_updated_at_not_null | n | NOT NULL updated_at |
| pk_roles | p | PRIMARY KEY (id) |
| uq_roles_code | u | UNIQUE (code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| pk_roles | true | — | CREATE UNIQUE INDEX pk_roles ON operations.roles USING btree (id) |
| uq_roles_code | true | — | CREATE UNIQUE INDEX uq_roles_code ON operations.roles USING btree (code) |

### platform

#### platform.announcements

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| public_id | uuid | false | gen_random_uuid() | — |
| title | character varying(200) | false | — | — |
| content | text | false | — | — |
| region_id | bigint | true | — | — |
| client_platform | character varying(16) | true | — | — |
| status | character varying(16) | false | 'draft'::character varying | — |
| starts_at | timestamp with time zone | true | — | — |
| ends_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_announcements_client_platform | c | CHECK (client_platform IS NULL OR (client_platform::text = ANY (ARRAY['android'::character varying, 'ios'::character varying]::text[]))) |
| ck_announcements_content_not_blank | c | CHECK (btrim(content) <> ''::text) |
| ck_announcements_published_start | c | CHECK (status::text <> 'published'::text OR starts_at IS NOT NULL) |
| ck_announcements_status | c | CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'retired'::character varying]::text[])) |
| ck_announcements_time_window | c | CHECK (ends_at IS NULL OR starts_at IS NOT NULL AND ends_at > starts_at) |
| ck_announcements_title_not_blank | c | CHECK (btrim(title::text) <> ''::text) |
| fk_announcements_region | f | FOREIGN KEY (region_id) REFERENCES platform.regions(id) ON DELETE RESTRICT |
| announcements_content_not_null | n | NOT NULL content |
| announcements_created_at_not_null | n | NOT NULL created_at |
| announcements_id_not_null | n | NOT NULL id |
| announcements_public_id_not_null | n | NOT NULL public_id |
| announcements_status_not_null | n | NOT NULL status |
| announcements_title_not_null | n | NOT NULL title |
| announcements_updated_at_not_null | n | NOT NULL updated_at |
| announcements_pkey | p | PRIMARY KEY (id) |
| uq_announcements_public_id | u | UNIQUE (public_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| announcements_pkey | true | — | CREATE UNIQUE INDEX announcements_pkey ON platform.announcements USING btree (id) |
| idx_announcements_published_starts_at | false | ((status)::text = 'published'::text) | CREATE INDEX idx_announcements_published_starts_at ON platform.announcements USING btree (starts_at DESC) WHERE ((status)::text = 'published'::text) |
| idx_announcements_region_id | false | (region_id IS NOT NULL) | CREATE INDEX idx_announcements_region_id ON platform.announcements USING btree (region_id) WHERE (region_id IS NOT NULL) |
| uq_announcements_public_id | true | — | CREATE UNIQUE INDEX uq_announcements_public_id ON platform.announcements USING btree (public_id) |

#### platform.app_versions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| client_platform | character varying(16) | false | — | — |
| version | character varying(32) | false | — | — |
| build_number | bigint | false | — | — |
| status | character varying(16) | false | 'draft'::character varying | — |
| update_policy | character varying(16) | false | 'none'::character varying | — |
| release_notes | text | true | — | — |
| released_at | timestamp with time zone | true | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_app_versions_build_number | c | CHECK (build_number > 0) |
| ck_app_versions_client_platform | c | CHECK (client_platform::text = ANY (ARRAY['android'::character varying, 'ios'::character varying]::text[])) |
| ck_app_versions_released_at | c | CHECK (status::text = 'draft'::text AND released_at IS NULL OR status::text <> 'draft'::text AND released_at IS NOT NULL) |
| ck_app_versions_status | c | CHECK (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'deprecated'::character varying, 'blocked'::character varying]::text[])) |
| ck_app_versions_status_policy | c | CHECK (status::text = 'draft'::text AND update_policy::text = 'none'::text OR status::text = 'active'::text AND (update_policy::text = ANY (ARRAY['none'::character varying, 'optional'::character varying]::text[])) OR status::text = 'deprecated'::text AND update_policy::text = 'optional'::text OR status::text = 'blocked'::text AND update_policy::text = 'required'::text) |
| ck_app_versions_update_policy | c | CHECK (update_policy::text = ANY (ARRAY['none'::character varying, 'optional'::character varying, 'required'::character varying]::text[])) |
| ck_app_versions_version_not_blank | c | CHECK (btrim(version::text) <> ''::text) |
| app_versions_build_number_not_null | n | NOT NULL build_number |
| app_versions_client_platform_not_null | n | NOT NULL client_platform |
| app_versions_created_at_not_null | n | NOT NULL created_at |
| app_versions_id_not_null | n | NOT NULL id |
| app_versions_status_not_null | n | NOT NULL status |
| app_versions_update_policy_not_null | n | NOT NULL update_policy |
| app_versions_updated_at_not_null | n | NOT NULL updated_at |
| app_versions_version_not_null | n | NOT NULL version |
| app_versions_pkey | p | PRIMARY KEY (id) |
| uq_app_versions_platform_build | u | UNIQUE (client_platform, build_number) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| app_versions_pkey | true | — | CREATE UNIQUE INDEX app_versions_pkey ON platform.app_versions USING btree (id) |
| uq_app_versions_platform_build | true | — | CREATE UNIQUE INDEX uq_app_versions_platform_build ON platform.app_versions USING btree (client_platform, build_number) |

#### platform.feature_flag_overrides

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| feature_flag_id | bigint | false | — | — |
| region_id | bigint | true | — | — |
| client_platform | character varying(16) | true | — | — |
| enabled | boolean | false | — | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_feature_flag_overrides_client_platform | c | CHECK (client_platform IS NULL OR (client_platform::text = ANY (ARRAY['android'::character varying, 'ios'::character varying]::text[]))) |
| ck_feature_flag_overrides_scope | c | CHECK (region_id IS NOT NULL OR client_platform IS NOT NULL) |
| fk_feature_flag_overrides_flag | f | FOREIGN KEY (feature_flag_id) REFERENCES platform.feature_flags(id) ON DELETE RESTRICT |
| fk_feature_flag_overrides_region | f | FOREIGN KEY (region_id) REFERENCES platform.regions(id) ON DELETE RESTRICT |
| feature_flag_overrides_created_at_not_null | n | NOT NULL created_at |
| feature_flag_overrides_enabled_not_null | n | NOT NULL enabled |
| feature_flag_overrides_feature_flag_id_not_null | n | NOT NULL feature_flag_id |
| feature_flag_overrides_id_not_null | n | NOT NULL id |
| feature_flag_overrides_updated_at_not_null | n | NOT NULL updated_at |
| feature_flag_overrides_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| feature_flag_overrides_pkey | true | — | CREATE UNIQUE INDEX feature_flag_overrides_pkey ON platform.feature_flag_overrides USING btree (id) |
| idx_feature_flag_overrides_region_id | false | (region_id IS NOT NULL) | CREATE INDEX idx_feature_flag_overrides_region_id ON platform.feature_flag_overrides USING btree (region_id) WHERE (region_id IS NOT NULL) |
| uq_feature_flag_overrides_client | true | ((region_id IS NULL) AND (client_platform IS NOT NULL)) | CREATE UNIQUE INDEX uq_feature_flag_overrides_client ON platform.feature_flag_overrides USING btree (feature_flag_id, client_platform) WHERE ((region_id IS NULL) AND (client_platform IS NOT NULL)) |
| uq_feature_flag_overrides_region | true | ((region_id IS NOT NULL) AND (client_platform IS NULL)) | CREATE UNIQUE INDEX uq_feature_flag_overrides_region ON platform.feature_flag_overrides USING btree (feature_flag_id, region_id) WHERE ((region_id IS NOT NULL) AND (client_platform IS NULL)) |
| uq_feature_flag_overrides_region_client | true | ((region_id IS NOT NULL) AND (client_platform IS NOT NULL)) | CREATE UNIQUE INDEX uq_feature_flag_overrides_region_client ON platform.feature_flag_overrides USING btree (feature_flag_id, region_id, client_platform) WHERE ((region_id IS NOT NULL) AND (client_platform IS NOT NULL)) |

#### platform.feature_flags

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| key | character varying(100) | false | — | — |
| name | character varying(120) | false | — | — |
| description | text | true | — | — |
| default_enabled | boolean | false | false | — |
| status | character varying(16) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_feature_flags_key_format | c | CHECK (key::text ~ '^[a-z][a-z0-9_]{0,99}$'::text) |
| ck_feature_flags_name_not_blank | c | CHECK (btrim(name::text) <> ''::text) |
| ck_feature_flags_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'retired'::character varying]::text[])) |
| ck_feature_flags_status_default_enabled | c | CHECK (status::text = 'active'::text OR default_enabled = false) |
| feature_flags_created_at_not_null | n | NOT NULL created_at |
| feature_flags_default_enabled_not_null | n | NOT NULL default_enabled |
| feature_flags_id_not_null | n | NOT NULL id |
| feature_flags_key_not_null | n | NOT NULL key |
| feature_flags_name_not_null | n | NOT NULL name |
| feature_flags_status_not_null | n | NOT NULL status |
| feature_flags_updated_at_not_null | n | NOT NULL updated_at |
| feature_flags_pkey | p | PRIMARY KEY (id) |
| uq_feature_flags_key | u | UNIQUE (key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| feature_flags_pkey | true | — | CREATE UNIQUE INDEX feature_flags_pkey ON platform.feature_flags USING btree (id) |
| uq_feature_flags_key | true | — | CREATE UNIQUE INDEX uq_feature_flags_key ON platform.feature_flags USING btree (key) |

#### platform.menu_permissions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| menu_id | bigint | false | — | — |
| permission_key | character varying(100) | false | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_menu_permissions_permission_key | c | CHECK (permission_key::text ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'::text) |
| menu_permissions_menu_id_fkey | f | FOREIGN KEY (menu_id) REFERENCES platform.menus(id) ON DELETE RESTRICT |
| menu_permissions_created_at_not_null | n | NOT NULL created_at |
| menu_permissions_menu_id_not_null | n | NOT NULL menu_id |
| menu_permissions_permission_key_not_null | n | NOT NULL permission_key |
| pk_menu_permissions | p | PRIMARY KEY (menu_id, permission_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| pk_menu_permissions | true | — | CREATE UNIQUE INDEX pk_menu_permissions ON platform.menu_permissions USING btree (menu_id, permission_key) |

#### platform.menus

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| parent_id | bigint | true | — | — |
| label | character varying(120) | false | — | — |
| route_key | character varying(100) | true | — | — |
| icon | character varying(64) | true | — | — |
| sort_order | integer | false | 0 | — |
| status | character varying(16) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_menus_label_not_blank | c | CHECK (btrim(label::text) <> ''::text) |
| ck_menus_route_key_format | c | CHECK (route_key IS NULL OR route_key::text ~ '^[a-z][a-z0-9_.]*$'::text) |
| ck_menus_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying, 'removed'::character varying]::text[])) |
| menus_parent_id_fkey | f | FOREIGN KEY (parent_id) REFERENCES platform.menus(id) ON DELETE RESTRICT |
| menus_created_at_not_null | n | NOT NULL created_at |
| menus_id_not_null | n | NOT NULL id |
| menus_label_not_null | n | NOT NULL label |
| menus_sort_order_not_null | n | NOT NULL sort_order |
| menus_status_not_null | n | NOT NULL status |
| menus_updated_at_not_null | n | NOT NULL updated_at |
| menus_pkey | p | PRIMARY KEY (id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_menus_parent_order | false | — | CREATE INDEX idx_menus_parent_order ON platform.menus USING btree (parent_id, sort_order) |
| menus_pkey | true | — | CREATE UNIQUE INDEX menus_pkey ON platform.menus USING btree (id) |

#### platform.regions

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| code | character varying(8) | false | — | — |
| name | character varying(100) | false | — | — |
| default_locale | character varying(16) | false | — | — |
| timezone | character varying(64) | false | — | — |
| status | character varying(16) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_regions_code_format | c | CHECK (code::text ~ '^[A-Z][A-Z0-9_]{1,7}$'::text) |
| ck_regions_default_locale_not_blank | c | CHECK (btrim(default_locale::text) <> ''::text) |
| ck_regions_name_not_blank | c | CHECK (btrim(name::text) <> ''::text) |
| ck_regions_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'retired'::character varying]::text[])) |
| ck_regions_timezone_not_blank | c | CHECK (btrim(timezone::text) <> ''::text) |
| regions_code_not_null | n | NOT NULL code |
| regions_created_at_not_null | n | NOT NULL created_at |
| regions_default_locale_not_null | n | NOT NULL default_locale |
| regions_id_not_null | n | NOT NULL id |
| regions_name_not_null | n | NOT NULL name |
| regions_status_not_null | n | NOT NULL status |
| regions_timezone_not_null | n | NOT NULL timezone |
| regions_updated_at_not_null | n | NOT NULL updated_at |
| regions_pkey | p | PRIMARY KEY (id) |
| uq_regions_code | u | UNIQUE (code) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| regions_pkey | true | — | CREATE UNIQUE INDEX regions_pkey ON platform.regions USING btree (id) |
| uq_regions_code | true | — | CREATE UNIQUE INDEX uq_regions_code ON platform.regions USING btree (code) |

#### platform.runtime_configs

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | bigint | false | — | a |
| key | character varying(100) | false | — | — |
| value_type | character varying(16) | false | — | — |
| value | jsonb | false | — | — |
| description | text | true | — | — |
| status | character varying(16) | false | 'active'::character varying | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| ck_runtime_configs_key_format | c | CHECK (key::text ~ '^[a-z][a-z0-9_]{0,99}$'::text) |
| ck_runtime_configs_status | c | CHECK (status::text = ANY (ARRAY['active'::character varying, 'retired'::character varying]::text[])) |
| ck_runtime_configs_value_matches_type | c | CHECK (value_type::text = 'string'::text AND jsonb_typeof(value) = 'string'::text OR value_type::text = 'integer'::text AND jsonb_typeof(value) = 'number'::text AND (value #>> '{}'::text[]) ~ '^-?[0-9]+$'::text OR value_type::text = 'number'::text AND jsonb_typeof(value) = 'number'::text OR value_type::text = 'boolean'::text AND jsonb_typeof(value) = 'boolean'::text OR value_type::text = 'json'::text AND (jsonb_typeof(value) = ANY (ARRAY['object'::text, 'array'::text]))) |
| ck_runtime_configs_value_type | c | CHECK (value_type::text = ANY (ARRAY['string'::character varying, 'integer'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying]::text[])) |
| runtime_configs_created_at_not_null | n | NOT NULL created_at |
| runtime_configs_id_not_null | n | NOT NULL id |
| runtime_configs_key_not_null | n | NOT NULL key |
| runtime_configs_status_not_null | n | NOT NULL status |
| runtime_configs_updated_at_not_null | n | NOT NULL updated_at |
| runtime_configs_value_not_null | n | NOT NULL value |
| runtime_configs_value_type_not_null | n | NOT NULL value_type |
| runtime_configs_pkey | p | PRIMARY KEY (id) |
| uq_runtime_configs_key | u | UNIQUE (key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| runtime_configs_pkey | true | — | CREATE UNIQUE INDEX runtime_configs_pkey ON platform.runtime_configs USING btree (id) |
| uq_runtime_configs_key | true | — | CREATE UNIQUE INDEX uq_runtime_configs_key ON platform.runtime_configs USING btree (key) |

### infrastructure

#### infrastructure.assets

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| storage_provider | character varying(32) | false | — | — |
| storage_bucket | character varying(255) | false | — | — |
| storage_key | character varying(1024) | false | — | — |
| mime_type | character varying(255) | false | — | — |
| size_bytes | bigint | false | — | — |
| checksum_algorithm | character varying(32) | true | — | — |
| checksum | character varying(256) | true | — | — |
| status | character varying(16) | false | 'pending'::character varying | — |
| original_filename | character varying(512) | true | — | — |
| file_extension | character varying(32) | true | — | — |
| width | integer | true | — | — |
| height | integer | true | — | — |
| duration_ms | bigint | true | — | — |
| metadata | jsonb | false | '{}'::jsonb | — |
| created_at | timestamp with time zone | false | now() | — |
| updated_at | timestamp with time zone | false | now() | — |
| deleted_at | timestamp with time zone | true | — | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| assets_deleted_state_check | c | CHECK (status::text = 'deleted'::text AND deleted_at IS NOT NULL OR status::text <> 'deleted'::text AND deleted_at IS NULL) |
| assets_duration_ms_check | c | CHECK (duration_ms IS NULL OR duration_ms >= 0) |
| assets_height_check | c | CHECK (height IS NULL OR height > 0) |
| assets_metadata_check | c | CHECK (jsonb_typeof(metadata) = 'object'::text) |
| assets_size_bytes_check | c | CHECK (size_bytes >= 0) |
| assets_status_check | c | CHECK (status::text = ANY (ARRAY['pending'::character varying, 'ready'::character varying, 'deleted'::character varying, 'failed'::character varying]::text[])) |
| assets_width_check | c | CHECK (width IS NULL OR width > 0) |
| assets_created_at_not_null | n | NOT NULL created_at |
| assets_id_not_null | n | NOT NULL id |
| assets_metadata_not_null | n | NOT NULL metadata |
| assets_mime_type_not_null | n | NOT NULL mime_type |
| assets_size_bytes_not_null | n | NOT NULL size_bytes |
| assets_status_not_null | n | NOT NULL status |
| assets_storage_bucket_not_null | n | NOT NULL storage_bucket |
| assets_storage_key_not_null | n | NOT NULL storage_key |
| assets_storage_provider_not_null | n | NOT NULL storage_provider |
| assets_updated_at_not_null | n | NOT NULL updated_at |
| assets_pkey | p | PRIMARY KEY (id) |
| assets_storage_provider_storage_bucket_storage_key_key | u | UNIQUE (storage_provider, storage_bucket, storage_key) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| assets_pkey | true | — | CREATE UNIQUE INDEX assets_pkey ON infrastructure.assets USING btree (id) |
| assets_storage_provider_storage_bucket_storage_key_key | true | — | CREATE UNIQUE INDEX assets_storage_provider_storage_bucket_storage_key_key ON infrastructure.assets USING btree (storage_provider, storage_bucket, storage_key) |
| idx_assets_checksum | false | (checksum IS NOT NULL) | CREATE INDEX idx_assets_checksum ON infrastructure.assets USING btree (checksum_algorithm, checksum) WHERE (checksum IS NOT NULL) |
| idx_assets_status_created | false | — | CREATE INDEX idx_assets_status_created ON infrastructure.assets USING btree (status, created_at DESC) |

#### infrastructure.system_outbox_events

| Column | Type | Nullable | Default | Identity |
| --- | --- | --- | --- | --- |
| id | uuid | false | — | — |
| event_id | uuid | false | — | — |
| source_domain | character varying(32) | false | — | — |
| event_type | character varying(128) | false | — | — |
| aggregate_type | character varying(64) | false | — | — |
| aggregate_id | uuid | false | — | — |
| payload | jsonb | false | '{}'::jsonb | — |
| headers | jsonb | false | '{}'::jsonb | — |
| occurred_at | timestamp with time zone | false | — | — |
| available_at | timestamp with time zone | false | now() | — |
| published_at | timestamp with time zone | true | — | — |
| attempt_count | integer | false | 0 | — |
| last_error | text | true | — | — |
| created_at | timestamp with time zone | false | now() | — |

Constraints:

| Name | Type | Definition |
| --- | --- | --- |
| system_outbox_events_attempt_count_check | c | CHECK (attempt_count >= 0) |
| system_outbox_events_headers_check | c | CHECK (jsonb_typeof(headers) = 'object'::text) |
| system_outbox_events_payload_check | c | CHECK (jsonb_typeof(payload) = 'object'::text) |
| system_outbox_events_aggregate_id_not_null | n | NOT NULL aggregate_id |
| system_outbox_events_aggregate_type_not_null | n | NOT NULL aggregate_type |
| system_outbox_events_attempt_count_not_null | n | NOT NULL attempt_count |
| system_outbox_events_available_at_not_null | n | NOT NULL available_at |
| system_outbox_events_created_at_not_null | n | NOT NULL created_at |
| system_outbox_events_event_id_not_null | n | NOT NULL event_id |
| system_outbox_events_event_type_not_null | n | NOT NULL event_type |
| system_outbox_events_headers_not_null | n | NOT NULL headers |
| system_outbox_events_id_not_null | n | NOT NULL id |
| system_outbox_events_occurred_at_not_null | n | NOT NULL occurred_at |
| system_outbox_events_payload_not_null | n | NOT NULL payload |
| system_outbox_events_source_domain_not_null | n | NOT NULL source_domain |
| system_outbox_events_pkey | p | PRIMARY KEY (id) |
| system_outbox_events_event_id_key | u | UNIQUE (event_id) |

Indexes:

| Name | Unique | Predicate | Definition |
| --- | --- | --- | --- |
| idx_outbox_event_id | false | — | CREATE INDEX idx_outbox_event_id ON infrastructure.system_outbox_events USING btree (event_id) |
| idx_outbox_source_aggregate | false | — | CREATE INDEX idx_outbox_source_aggregate ON infrastructure.system_outbox_events USING btree (source_domain, aggregate_type, aggregate_id, created_at DESC) |
| idx_outbox_unpublished | false | (published_at IS NULL) | CREATE INDEX idx_outbox_unpublished ON infrastructure.system_outbox_events USING btree (available_at, created_at) WHERE (published_at IS NULL) |
| system_outbox_events_event_id_key | true | — | CREATE UNIQUE INDEX system_outbox_events_event_id_key ON infrastructure.system_outbox_events USING btree (event_id) |
| system_outbox_events_pkey | true | — | CREATE UNIQUE INDEX system_outbox_events_pkey ON infrastructure.system_outbox_events USING btree (id) |

