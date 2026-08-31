-- Sources: docs/docs/domains/learning/{progress,database}.md

CREATE TABLE learning.learning_activities (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL,
    activity_type varchar(32) NOT NULL CHECK (activity_type IN (
        'course_started', 'lesson_started', 'lesson_completed', 'content_viewed',
        'content_practiced', 'exercise_started', 'exercise_completed', 'review_completed'
    )),
    course_id uuid,
    lesson_id uuid,
    content_id uuid,
    exercise_id uuid,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object')
);
CREATE INDEX idx_learning_activities_user_time
    ON learning.learning_activities(user_id, occurred_at DESC);

CREATE TABLE learning.course_progress (
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at timestamptz,
    completed_at timestamptz,
    last_lesson_id uuid,
    progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id)
);

CREATE TABLE learning.lesson_progress (
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at timestamptz,
    completed_at timestamptz,
    last_section_id uuid,
    progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE learning.content_mastery (
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    mastery_status varchar(16) NOT NULL DEFAULT 'new' CHECK (mastery_status IN ('new', 'learning', 'familiar', 'mastered')),
    mastery_score numeric(5,2) CHECK (mastery_score IS NULL OR mastery_score BETWEEN 0 AND 100),
    correct_count integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    incorrect_count integer NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
    first_learned_at timestamptz,
    last_practiced_at timestamptz,
    mastered_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, content_id)
);

CREATE TABLE learning.content_reviews (
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    next_review_at timestamptz NOT NULL,
    priority smallint NOT NULL DEFAULT 0,
    review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    last_reviewed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, content_id)
);
CREATE INDEX idx_content_reviews_due
    ON learning.content_reviews(next_review_at, priority DESC);

CREATE TABLE learning.content_bookmarks (
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, content_id)
);

CREATE TABLE learning.exercise_attempts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL,
    exercise_id uuid NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    total_score numeric(10,2),
    earned_score numeric(10,2),
    score_percent numeric(5,2) CHECK (score_percent IS NULL OR score_percent BETWEEN 0 AND 100),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercise_attempts_user_time
    ON learning.exercise_attempts(user_id, started_at DESC);
CREATE INDEX idx_exercise_attempts_exercise_time
    ON learning.exercise_attempts(exercise_id, started_at DESC);

CREATE TABLE learning.question_attempts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exercise_attempt_id bigint NOT NULL REFERENCES learning.exercise_attempts(id) ON DELETE RESTRICT,
    question_id uuid NOT NULL,
    answer_data jsonb NOT NULL,
    is_correct boolean,
    earned_score numeric(10,2),
    answered_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (exercise_attempt_id, question_id)
);

CREATE TABLE learning.dictionary_search_history (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL,
    query_text varchar(256) NOT NULL,
    selected_content_id uuid,
    searched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dictionary_search_user_time
    ON learning.dictionary_search_history(user_id, searched_at DESC);

CREATE TABLE learning.translation_requests (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    source_language varchar(8) NOT NULL,
    target_language varchar(8) NOT NULL,
    source_text text NOT NULL,
    translated_text text,
    provider varchar(64),
    model varchar(128),
    status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
    error_code varchar(64),
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    CONSTRAINT translation_requests_language_pair_check CHECK (
        (source_language = 'zh' AND target_language = 'lo') OR
        (source_language = 'lo' AND target_language = 'zh')
    )
);
CREATE INDEX idx_translation_requests_user_time
    ON learning.translation_requests(user_id, created_at DESC) WHERE user_id IS NOT NULL;
