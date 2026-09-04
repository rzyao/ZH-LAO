import { describe, expect, it } from 'vitest';
import {
  CONTENT_CATEGORY_DEFINITIONS,
  validateComposition,
  validateRevisionTransition,
} from '../../../src/modules/content/domain/language-structure.js';

describe('中老内容类别定义', () => {
  it('为中文和老挝语提供完全分离的内容类型与组成链路', () => {
    expect(CONTENT_CATEGORY_DEFINITIONS.zh.map((item) => item.contentType)).toEqual([
      'zh_pinyin_element',
      'zh_syllable',
      'zh_hanzi',
      'zh_word',
      'zh_sentence',
    ]);
    expect(CONTENT_CATEGORY_DEFINITIONS.lo.map((item) => item.contentType)).toEqual([
      'lo_letter',
      'lo_syllable',
      'lo_word',
      'lo_sentence',
    ]);

    expect(CONTENT_CATEGORY_DEFINITIONS.zh[1]?.childContentType).toBe('zh_pinyin_element');
    expect(CONTENT_CATEGORY_DEFINITIONS.lo[1]?.childContentType).toBe('lo_letter');
  });
});

describe('内容组成校验', () => {
  it('允许草稿暂时没有组成项，但提交审核时必须非空', () => {
    expect(() => validateComposition({
      parentContentType: 'zh_syllable',
      stage: 'draft',
      items: [],
    })).not.toThrow();

    expect(() => validateComposition({
      parentContentType: 'zh_syllable',
      stage: 'submit',
      items: [],
    })).toThrow('组成项不能为空');
  });

  it('拒绝跨语言或跨层级引用', () => {
    expect(() => validateComposition({
      parentContentType: 'zh_syllable',
      stage: 'submit',
      items: [{
        contentId: 'lo-letter-1',
        contentType: 'lo_letter',
        position: 1,
        publishedRevisionId: 'revision-1',
      }],
    })).toThrow('只能引用中文拼音元素');
  });

  it('提交审核和发布时要求位置从 1 开始且连续', () => {
    expect(() => validateComposition({
      parentContentType: 'lo_word',
      stage: 'submit',
      items: [
        { contentId: 'syllable-1', contentType: 'lo_syllable', position: 1, publishedRevisionId: 'revision-1' },
        { contentId: 'syllable-2', contentType: 'lo_syllable', position: 3, publishedRevisionId: 'revision-2' },
      ],
    })).toThrow('组成位置必须从 1 开始连续排列');
  });

  it('发布时返回全部未发布依赖，不产生部分发布', () => {
    expect(() => validateComposition({
      parentContentType: 'zh_sentence',
      stage: 'publish',
      items: [
        { contentId: 'word-1', contentType: 'zh_word', position: 1, publishedRevisionId: null },
        { contentId: 'word-2', contentType: 'zh_word', position: 2, publishedRevisionId: null },
      ],
    })).toThrow('word-1、word-2');
  });
});

describe('通用内容版本生命周期', () => {
  it('仅允许草稿依次进入待审核、已批准和已发布', () => {
    expect(validateRevisionTransition('draft', 'submit')).toBe('pending_review');
    expect(validateRevisionTransition('pending_review', 'approve')).toBe('approved');
    expect(validateRevisionTransition('approved', 'publish')).toBe('published');
    expect(() => validateRevisionTransition('draft', 'publish')).toThrow('不允许的版本状态变更');
  });
});
