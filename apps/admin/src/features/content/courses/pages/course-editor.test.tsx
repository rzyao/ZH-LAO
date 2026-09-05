import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CourseEditorPage } from './course-editor'

const mutateAsync = vi.fn().mockResolvedValue({ courseId: '10000000-0000-4000-0000-000000000001' })
const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('../queries', () => ({ useCreateCourse: () => ({ mutateAsync, isPending: false }) }))

describe('CourseEditorPage', () => {
  it('creates a draft with the selected language and opens its detail page', async () => {
    render(<CourseEditorPage />)
    fireEvent.change(screen.getByLabelText(/课程名称/), { target: { value: ' 中文入门 ' } })
    fireEvent.change(screen.getByLabelText(/学习语言/), { target: { value: 'lo' } })
    fireEvent.click(screen.getByRole('button', { name: '创建草稿' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ learningLanguage: 'lo', snapshot: { title: '中文入门', sortOrder: 0, units: [] } }))
    expect(navigate).toHaveBeenCalledWith({ to: '/content/courses/$courseId', params: { courseId: '10000000-0000-4000-0000-000000000001' } })
  })
})
