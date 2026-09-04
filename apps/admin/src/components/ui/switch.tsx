import * as React from 'react'
import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends React.ComponentProps<typeof BaseSwitch.Root> {
  className?: string
}

const Switch = React.forwardRef<
  React.ComponentRef<typeof BaseSwitch.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <BaseSwitch.Root
    ref={ref}
    className={cn(
      'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-input',
      className,
    )}
    {...props}
  >
    <BaseSwitch.Thumb
      className={cn(
        'pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform data-[checked]:translate-x-4 data-[unchecked]:translate-x-0',
      )}
    />
  </BaseSwitch.Root>
))
Switch.displayName = 'Switch'

export { Switch }
