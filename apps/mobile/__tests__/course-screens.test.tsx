import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { createInMemoryPreferencesStorage } from '../src/storage/preferencesStorage';
import { CourseCatalogScreen } from '../src/features/courses/screens/CourseCatalogScreen';
import { CourseStructureScreen } from '../src/features/courses/screens/CourseStructureScreen';
import { LessonContentScreen } from '../src/features/courses/screens/LessonContentScreen';
import { courseApi } from '../src/features/courses/api/courseApi';

jest.mock('../src/features/courses/api/courseApi', () => ({
  courseApi: { getCatalog: jest.fn(), getStructure: jest.fn(), getLessonContent: jest.fn() },
}));

const api = courseApi as jest.Mocked<typeof courseApi>;
const wrap = (node: React.ReactElement) => <ThemeProvider storage={createInMemoryPreferencesStorage()} initialThemeId={null}>{node}</ThemeProvider>;

describe('published curriculum mobile screens', () => {
  it('opens only a published catalog entry using its UUID', async () => {
    api.getCatalog.mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000001', revisionId: '00000000-0000-4000-8000-000000000002', title: '公开课程', subtitle: null, sortOrder: 1 }]);
    const navigate = jest.fn();
    const view = await render(wrap(<CourseCatalogScreen navigation={{ navigate } as never} route={{} as never} />));
    expect(await view.findByText('公开课程')).toBeOnTheScreen();
    fireEvent.press(view.getByText('查看课程'));
    expect(navigate).toHaveBeenCalledWith('CourseStructure', { courseId: '00000000-0000-4000-8000-000000000001' });
  });

  it('renders published structure and pinned lesson content without internal IDs', async () => {
    api.getStructure.mockResolvedValue({ course: { id: '00000000-0000-4000-8000-000000000001', revisionId: '00000000-0000-4000-8000-000000000002', title: '课程' }, units: [{ title: '单元', description: null, position: 1, lessons: [{ id: '00000000-0000-4000-8000-000000000003', revisionId: '00000000-0000-4000-8000-000000000004', title: '课节', position: 1, status: 'published' }] }] });
    api.getLessonContent.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000003', revisionId: '00000000-0000-4000-8000-000000000004', sections: [{ type: 'knowledge', title: '知识', description: null, position: 1, items: [{ type: 'content', entityId: '00000000-0000-4000-8000-000000000005', revisionId: '00000000-0000-4000-8000-000000000006', position: 1 }] }] });
    const navigate = jest.fn();
    const first = await render(wrap(<CourseStructureScreen navigation={{ navigate } as never} route={{ params: { courseId: '00000000-0000-4000-8000-000000000001' } } as never} />));
    expect(await first.findByText('1. 课节')).toBeOnTheScreen();
    fireEvent.press(first.getByText('1. 课节'));
    expect(navigate).toHaveBeenCalledWith('LessonContent', { lessonId: '00000000-0000-4000-8000-000000000003' });
    await first.unmount();
    const second = await render(wrap(<LessonContentScreen navigation={{} as never} route={{ params: { lessonId: '00000000-0000-4000-8000-000000000003' } } as never} />));
    expect(await second.findByText('知识')).toBeOnTheScreen();
    expect(second.queryByText(/\bid\b/i)).toBeNull();
  });
});
