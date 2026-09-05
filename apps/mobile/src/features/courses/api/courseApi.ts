import { httpClient } from '../../../api/client/httpClient';

export interface PublishedCourseCatalogItem {
  id: string;
  revisionId: string;
  title: string;
  subtitle: string | null;
  sortOrder: number;
}

export interface PublishedCourseStructure {
  course: { id: string; revisionId: string; title: string };
  units: Array<{
    title: string;
    description: string | null;
    position: number;
    lessons: Array<{ id: string; revisionId: string; title: string; position: number; status: 'published' }>;
  }>;
}

export interface PublishedLessonContent {
  id: string;
  revisionId: string;
  sections: Array<{
    type: 'introduction' | 'knowledge' | 'example' | 'practice' | 'summary' | 'custom';
    title: string | null;
    description: string | null;
    position: number;
    items: Array<{ type: 'content' | 'exercise'; entityId: string; revisionId: string; position: number }>;
  }>;
}

export const courseApi = {
  async getCatalog(learningLanguage?: 'zh' | 'lo'): Promise<PublishedCourseCatalogItem[]> {
    const response = await httpClient.get<{ items: PublishedCourseCatalogItem[] }>('/api/v1/content/courses', {
      query: learningLanguage ? { learningLanguage } : undefined,
    });
    return response.data.items;
  },

  async getStructure(courseId: string): Promise<PublishedCourseStructure> {
    const response = await httpClient.get<PublishedCourseStructure>(`/api/v1/content/courses/${courseId}/structure`);
    return response.data;
  },

  async getLessonContent(lessonId: string): Promise<PublishedLessonContent> {
    const response = await httpClient.get<PublishedLessonContent>(`/api/v1/content/lessons/${lessonId}/content`);
    return response.data;
  },
};
