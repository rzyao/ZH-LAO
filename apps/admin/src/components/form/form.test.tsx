import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  name: z.string().min(2, '名称至少 2 个字符'),
})

type Values = z.infer<typeof schema>

function DemoForm({ onSubmit }: { onSubmit?: (values: Values) => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit ?? (() => {}))} noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">提交</Button>
      </form>
    </Form>
  )
}

describe('Form foundation', () => {
  it('associates the label with the input', () => {
    render(<DemoForm />)
    const input = screen.getByLabelText('名称')
    expect(input).toBeInTheDocument()
  })

  it('shows a validation message for invalid submit and does not call onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<DemoForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: '提交' }))
    expect(await screen.findByText('名称至少 2 个字符')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<DemoForm onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('名称'), 'zh-lao')
    await user.click(screen.getByRole('button', { name: '提交' }))
    expect(onSubmit.mock.calls[0][0]).toEqual(expect.objectContaining({ name: 'zh-lao' }))
  })
})
