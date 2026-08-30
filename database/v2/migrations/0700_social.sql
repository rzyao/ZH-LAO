-- Sources: docs/docs/domains/social/{profile,discovery-and-relationships,community-content}.md

CREATE TABLE social.social_profiles (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id uuid NOT NULL UNIQUE,
    display_name varchar(50) NOT NULL,
    gender varchar(20) CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
    birth_date date,
    country_code char(2),
    region varchar(100),
    city varchar(100),
    occupation varchar(100),
    education_level varchar(30),
    bio varchar(1000),
    relationship_goal varchar(30) CHECK (relationship_goal IS NULL OR relationship_goal IN (
        'friendship', 'language_exchange', 'dating', 'serious_relationship', 'open_to_anything'
    )),
    profile_status varchar(20) NOT NULL DEFAULT 'draft' CHECK (profile_status IN ('draft', 'active', 'paused', 'closed')),
    moderation_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'restricted')),
    completeness_score smallint NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
    published_at timestamptz,
    last_active_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE social.social_profile_photos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    media_id uuid NOT NULL,
    position smallint NOT NULL CHECK (position BETWEEN 1 AND 6),
    moderation_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_social_profile_photos_active_position
    ON social.social_profile_photos(profile_id, position) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_social_profile_photos_active_media
    ON social.social_profile_photos(profile_id, media_id) WHERE deleted_at IS NULL;

CREATE TABLE social.social_interests (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code varchar(50) NOT NULL UNIQUE,
    name_zh varchar(50) NOT NULL,
    name_lo varchar(50),
    name_en varchar(50),
    category varchar(50),
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE social.social_profile_interests (
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    interest_id bigint NOT NULL REFERENCES social.social_interests(id) ON DELETE RESTRICT,
    sort_order smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, interest_id)
);

CREATE TABLE social.social_profile_languages (
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    language_code varchar(10) NOT NULL,
    proficiency_level varchar(20),
    is_native boolean NOT NULL DEFAULT false,
    is_learning boolean NOT NULL DEFAULT false,
    sort_order smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, language_code),
    CONSTRAINT social_profile_languages_level_check CHECK (
        (is_native AND proficiency_level IS NULL) OR
        (NOT is_native AND proficiency_level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'fluent'))
    ),
    CHECK (NOT (is_native AND is_learning))
);
CREATE UNIQUE INDEX uq_social_profile_languages_native
    ON social.social_profile_languages(profile_id) WHERE is_native;

CREATE TABLE social.social_prompt_templates (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code varchar(50) NOT NULL UNIQUE,
    question_zh varchar(200) NOT NULL,
    question_lo varchar(200),
    question_en varchar(200),
    category varchar(50),
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE social.social_profile_prompts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    prompt_template_id bigint NOT NULL REFERENCES social.social_prompt_templates(id) ON DELETE RESTRICT,
    answer varchar(500) NOT NULL,
    position smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
    moderation_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_social_profile_prompts_active_template
    ON social.social_profile_prompts(profile_id, prompt_template_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_social_profile_prompts_active_position
    ON social.social_profile_prompts(profile_id, position) WHERE deleted_at IS NULL;

CREATE TABLE social.social_preferences (
    profile_id bigint PRIMARY KEY REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    min_age smallint CHECK (min_age IS NULL OR min_age BETWEEN 18 AND 100),
    max_age smallint CHECK (max_age IS NULL OR max_age BETWEEN 18 AND 100),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (min_age IS NULL OR max_age IS NULL OR min_age <= max_age)
);

CREATE TABLE social.social_preference_genders (
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    gender varchar(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    PRIMARY KEY (profile_id, gender)
);

CREATE TABLE social.social_preference_countries (
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    country_code char(2) NOT NULL,
    PRIMARY KEY (profile_id, country_code)
);

CREATE TABLE social.social_preference_goals (
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    relationship_goal varchar(30) NOT NULL CHECK (relationship_goal IN (
        'friendship', 'language_exchange', 'dating', 'serious_relationship', 'open_to_anything'
    )),
    PRIMARY KEY (profile_id, relationship_goal)
);

CREATE TABLE social.social_discovery_exposures (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    viewer_profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    candidate_profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    source varchar(30) NOT NULL DEFAULT 'discovery',
    exposed_at timestamptz NOT NULL DEFAULT now(),
    CHECK (viewer_profile_id <> candidate_profile_id)
);
CREATE INDEX idx_social_exposures_viewer_time
    ON social.social_discovery_exposures(viewer_profile_id, exposed_at DESC);
CREATE INDEX idx_social_exposures_candidate_time
    ON social.social_discovery_exposures(candidate_profile_id, exposed_at DESC);
CREATE INDEX idx_social_exposures_pair_time
    ON social.social_discovery_exposures(viewer_profile_id, candidate_profile_id, exposed_at DESC);

CREATE TABLE social.social_follows (
    follower_profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    following_profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_profile_id, following_profile_id),
    CHECK (follower_profile_id <> following_profile_id)
);
CREATE INDEX idx_social_follows_following_time
    ON social.social_follows(following_profile_id, created_at DESC);

CREATE TABLE social.social_matches (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    profile_a_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    profile_b_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    matched_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (profile_a_id < profile_b_id),
    CHECK ((status = 'active' AND ended_at IS NULL) OR (status = 'ended' AND ended_at IS NOT NULL))
);
CREATE UNIQUE INDEX uq_social_matches_active_pair
    ON social.social_matches(profile_a_id, profile_b_id) WHERE status = 'active';

CREATE TABLE social.social_blocks (
    blocker_profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    blocked_profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_profile_id, blocked_profile_id),
    CHECK (blocker_profile_id <> blocked_profile_id)
);

CREATE TABLE social.social_posts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    content varchar(2000),
    visibility varchar(20) NOT NULL DEFAULT 'followers' CHECK (visibility IN ('public', 'followers')),
    moderation_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderated_at timestamptz,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX idx_social_posts_profile_feed ON social.social_posts(profile_id, published_at DESC)
    WHERE deleted_at IS NULL AND moderation_status = 'approved' AND published_at IS NOT NULL;

CREATE TABLE social.social_post_media (
    post_id bigint NOT NULL REFERENCES social.social_posts(id) ON DELETE RESTRICT,
    media_id uuid NOT NULL,
    position smallint NOT NULL CHECK (position BETWEEN 1 AND 9),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, media_id),
    UNIQUE (post_id, position)
);

CREATE TABLE social.social_post_likes (
    post_id bigint NOT NULL REFERENCES social.social_posts(id) ON DELETE RESTRICT,
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, profile_id)
);
CREATE INDEX idx_social_post_likes_profile_time
    ON social.social_post_likes(profile_id, created_at DESC);

CREATE TABLE social.social_post_comments (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    post_id bigint NOT NULL REFERENCES social.social_posts(id) ON DELETE RESTRICT,
    profile_id bigint NOT NULL REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    parent_comment_id bigint REFERENCES social.social_post_comments(id) ON DELETE RESTRICT,
    reply_to_profile_id bigint REFERENCES social.social_profiles(id) ON DELETE RESTRICT,
    content varchar(1000) NOT NULL,
    moderation_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX idx_social_post_comments_post_time
    ON social.social_post_comments(post_id, created_at);
CREATE INDEX idx_social_post_comments_parent_time
    ON social.social_post_comments(parent_comment_id, created_at) WHERE parent_comment_id IS NOT NULL;
