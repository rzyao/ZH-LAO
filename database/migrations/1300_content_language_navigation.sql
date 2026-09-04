-- Register Chinese and Lao content workspaces as separate three-level admin navigation trees.
-- This is a forward-only correction to the seed in 1270_platform_menus.sql.

UPDATE platform.menus
SET status = 'disabled', updated_at = now()
WHERE id IN (70, 71, 72, 73)
  AND status <> 'removed';

INSERT INTO platform.menus (id, parent_id, label, route_key, icon, sort_order, status) OVERRIDING SYSTEM VALUE VALUES
    (7000, 7, '中文内容',   NULL, 'book_open', 0, 'active'),
    (7100, 7, '老挝语内容', NULL, 'book_open', 1, 'active'),
    (7001, 7000, '拼音管理',     'content.zh.pinyin',    'book_open', 0, 'active'),
    (7002, 7000, '中文音节管理', 'content.zh.syllables', 'book_open', 1, 'active'),
    (7003, 7000, '汉字管理',     'content.zh.hanzi',     'book_open', 2, 'active'),
    (7004, 7000, '词语管理',     'content.zh.words',     'book_open', 3, 'active'),
    (7005, 7000, '句子管理',     'content.zh.sentences', 'book_open', 4, 'active'),
    (7006, 7000, '审核与发布',   'content.zh.review',    'shield_check', 5, 'active'),
    (7101, 7100, '字母管理',     'content.lo.letters',   'book_open', 0, 'active'),
    (7102, 7100, '音节管理',     'content.lo.syllables', 'book_open', 1, 'active'),
    (7103, 7100, '词语管理',     'content.lo.words',     'book_open', 2, 'active'),
    (7104, 7100, '句子管理',     'content.lo.sentences', 'book_open', 3, 'active'),
    (7105, 7100, '审核与发布',   'content.lo.review',    'shield_check', 4, 'active');

SELECT setval('platform.menus_id_seq', (SELECT max(id) FROM platform.menus));
