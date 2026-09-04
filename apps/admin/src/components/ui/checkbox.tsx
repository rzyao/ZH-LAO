import * as React from 'react'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends React.ComponentProps<typeof BaseCheckbox.Root> {
  className?: string
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof BaseCheckbox.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <BaseCheckbox.Root
    ref={ref}
    className={cn(
      'group inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-primary data-[checked]:bg-primary',
      className,
    )}
    {...props}
  >
    <Check
      aria-hidden
      className="size-3.5 opacity-0 transition-opacity group-data-[checked]:opacity-100"
    />
  </BaseCheckbox.Root>
))
Checkbox.displayName = 'Checkbox'

export { Checkbox }
