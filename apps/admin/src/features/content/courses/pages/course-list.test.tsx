import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CourseListPage } from './course-list'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#course">{children}</a>,
  useNavigate: () => navigate,
}))
vi.mock('../queries', () => ({ useCourseList: () => ({ data: [{ id: 'course-1', learningLanguage: 'zh', title: '中文入门', status: 'draft', sortOrder: 1, publishedRevisionId: null, workingRevisionId: 'revision-1', workingRevisionStatus: 'draft' }], isPending: false, error: null, refetch: vi.fn() }) }))

describe('CourseListPage', () => {
  it('shows the course state and opens the draft-creation entry point', () => {
    render(<CourseListPage />)
    expect(screen.getByText('中文入门')).toBeInTheDocument()
    expect(screen.getAllByText('草稿').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: '创建课程' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/content/courses/new' })
  })
})
