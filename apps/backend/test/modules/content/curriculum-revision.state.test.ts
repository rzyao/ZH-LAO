import { describe, expect, it } from 'vitest';
import {
  assertPublishedRevisionReferences,
  CurriculumRevision,
} from '../../../src/modules/content/domain/curriculum-revision.js';

const revision = () => new CurriculumRevision(
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  1,
  { title: '课程', sortOrder: 0, units: [] },
  'draft',
  0,
);

describe('Curriculum revision lifecycle', () => {
  it('requires review before publish and detects stale transitions', () => {
    const item = revision();
    expect(() => item.publish(0)).toThrow('不能从 draft 转换为 published');
    item.submit(0);
    expect(() => item.approve(0)).toThrow('版本已被其他操作更新');
    item.approve(1);
    item.publish(2);
    expect(item.status).toBe('published');
  });

  it('only accepts published UUID revision pins', () => {
    expect(() => assertPublishedRevisionReferences([{
      entityId: '00000000-0000-4000-8000-000000000003',
      revisionId: '00000000-0000-4000-8000-000000000004',
      status: 'draft',
    }])).toThrow('引用版本尚未发布');
    expect(() => assertPublishedRevisionReferences([{
      entityId: '00000000-0000-4000-8000-000000000003',
      revisionId: '00000000-0000-4000-8000-000000000004',
      status: 'published',
    }])).not.toThrow();
  });
});
