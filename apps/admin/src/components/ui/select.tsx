import * as React from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Select = BaseSelect.Root
const SelectGroup = BaseSelect.Group
const SelectValue = BaseSelect.Value

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Trigger> & {
    className?: string
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Trigger
    ref={ref}
    className={cn(
      'flex min-h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60 data-[placeholder]:text-muted-foreground aria-invalid:border-destructive',
      className,
    )}
    {...props}
  >
    {children}
    <BaseSelect.Icon>
      <ChevronDown aria-hidden className="size-4 opacity-50" />
    </BaseSelect.Icon>
  </BaseSelect.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Popup>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Popup> & { className?: string }
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Portal>
    <BaseSelect.Positioner className="z-50">
      <BaseSelect.Popup
        ref={ref}
        className={cn(
          'max-h-72 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-sm',
          className,
        )}
        {...props}
      >
        <BaseSelect.List className="p-1">{children}</BaseSelect.List>
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  </BaseSelect.Portal>
))
SelectContent.displayName = 'SelectContent'

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Item>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Item> & { className?: string }
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Item
    ref={ref}
    className={cn(
      'relative flex min-h-9 w-full cursor-default select-none items-center rounded-sm py-2 pl-3 pr-8 text-sm outline-none data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <BaseSelect.ItemIndicator>
        <Check aria-hidden className="size-4" />
      </BaseSelect.ItemIndicator>
    </span>
    <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
  </BaseSelect.Item>
))
SelectItem.displayName = 'SelectItem'

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Label>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Label> & { className?: string }
>(({ className, ...props }, ref) => (
  <BaseSelect.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className)}
    {...props}
  />
))
SelectLabel.displayName = 'SelectLabel'

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectLabel }
