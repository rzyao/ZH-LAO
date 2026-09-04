-- D-164：登记中老语言类别级精确权限；角色保持自定义。
-- 仅既有 super_admin 默认获得全部新权限。

DELETE FROM operations.role_permissions
WHERE permission_key IN (
    'content.letters.write',
    'content.letters.review',
    'content.letters.publish'
);

INSERT INTO operations.role_permissions (role_id, permission_key)
SELECT id, permission_key
FROM operations.roles
CROSS JOIN (
    VALUES
        ('content.zh_pinyin_elements.read'), ('content.zh_pinyin_elements.write'), ('content.zh_pinyin_elements.review'), ('content.zh_pinyin_elements.publish'),
        ('content.zh_syllables.read'), ('content.zh_syllables.write'), ('content.zh_syllables.review'), ('content.zh_syllables.publish'),
        ('content.zh_hanzi.read'), ('content.zh_hanzi.write'), ('content.zh_hanzi.review'), ('content.zh_hanzi.publish'),
        ('content.zh_words.read'), ('content.zh_words.write'), ('content.zh_words.review'), ('content.zh_words.publish'),
        ('content.zh_sentences.read'), ('content.zh_sentences.write'), ('content.zh_sentences.review'), ('content.zh_sentences.publish'),
        ('content.lo_letters.read'), ('content.lo_letters.write'), ('content.lo_letters.review'), ('content.lo_letters.publish'),
        ('content.lo_syllables.read'), ('content.lo_syllables.write'), ('content.lo_syllables.review'), ('content.lo_syllables.publish'),
        ('content.lo_words.read'), ('content.lo_words.write'), ('content.lo_words.review'), ('content.lo_words.publish'),
        ('content.lo_sentences.read'), ('content.lo_sentences.write'), ('content.lo_sentences.review'), ('content.lo_sentences.publish')
) AS permissions(permission_key)
WHERE code = 'super_admin'
ON CONFLICT (role_id, permission_key) DO NOTHING;

INSERT INTO platform.menu_permissions (menu_id, permission_key) VALUES
    (7001, 'content.zh_pinyin_elements.read'),
    (7002, 'content.zh_syllables.read'),
    (7003, 'content.zh_hanzi.read'),
    (7004, 'content.zh_words.read'),
    (7005, 'content.zh_sentences.read'),
    (7006, 'content.zh_pinyin_elements.review'),
    (7006, 'content.zh_syllables.review'),
    (7006, 'content.zh_hanzi.review'),
    (7006, 'content.zh_words.review'),
    (7006, 'content.zh_sentences.review'),
    (7101, 'content.lo_letters.read'),
    (7102, 'content.lo_syllables.read'),
    (7103, 'content.lo_words.read'),
    (7104, 'content.lo_sentences.read'),
    (7105, 'content.lo_letters.review'),
    (7105, 'content.lo_syllables.review'),
    (7105, 'content.lo_words.review'),
    (7105, 'content.lo_sentences.review')
ON CONFLICT (menu_id, permission_key) DO NOTHING;
