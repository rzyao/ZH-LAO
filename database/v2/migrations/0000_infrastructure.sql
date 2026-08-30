CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA identity;
CREATE SCHEMA content;
CREATE SCHEMA learning;
CREATE SCHEMA social;
CREATE SCHEMA chat;
CREATE SCHEMA audio;
CREATE SCHEMA commerce;
CREATE SCHEMA rewards;
CREATE SCHEMA trust;
CREATE SCHEMA operations;
CREATE SCHEMA platform;

COMMENT ON SCHEMA identity IS 'Accounts, authentication identities, profiles, devices, and sessions.';
COMMENT ON SCHEMA content IS 'Canonical learning content: what users learn.';
COMMENT ON SCHEMA learning IS 'User-specific learning state and facts: how users are learning.';
COMMENT ON SCHEMA social IS 'Profiles, discovery, relationships, posts, and social interaction facts.';
COMMENT ON SCHEMA chat IS 'Conversation and message facts.';
COMMENT ON SCHEMA audio IS 'Audio production workflow, versions, review, and publication facts.';
COMMENT ON SCHEMA commerce IS 'Catalog, orders, payments, wallets, gifting, and refunds.';
COMMENT ON SCHEMA rewards IS 'Reward programs, rules, events, grants, and delivery orchestration.';
COMMENT ON SCHEMA trust IS 'Canonical reports, moderation, enforcement, and appeals.';
COMMENT ON SCHEMA operations IS 'Backoffice operators, RBAC, and operator audit history.';
COMMENT ON SCHEMA platform IS 'Product runtime control plane.';
