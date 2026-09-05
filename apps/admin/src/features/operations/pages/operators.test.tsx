import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as QueriesModule from '../queries'
import { CreateOperatorDialog } from './operators'

const createOperator = vi.fn()

vi.mock('../queries', async (importOriginal) => ({
  ...(await importOriginal<typeof QueriesModule>()),
  useCreateOperator: () => ({ mutateAsync: createOperator, isPending: false }),
}))

function DialogHarness() {
  const [open, setOpen] = React.useState(true)
  return <><button onClick={() => setOpen(true)}>重新打开</button><CreateOperatorDialog open={open} onOpenChange={setOpen} onSuccess={() => undefined} onError={() => undefined} /></>
}

describe('CreateOperatorDialog', () => {
  it('shows the generated password only in the current dialog session and clears it when reopened', async () => {
    createOperator.mockResolvedValueOnce({ operator: {}, initial_password: 'GeneratedPassword123' })
    render(<DialogHarness />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('后台登录用户名'), 'operator_zhang')
    await user.type(screen.getByLabelText('显示名称'), '张三')
    await user.click(screen.getByRole('button', { name: '确认创建' }))

    expect(await screen.findByText('GeneratedPassword123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '复制密码' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认创建' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '取消' }))
    await user.click(screen.getByRole('button', { name: '重新打开' }))
    await waitFor(() => expect(screen.queryByText('GeneratedPassword123')).not.toBeInTheDocument())
  })
})
