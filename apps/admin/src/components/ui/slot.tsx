import * as React from 'react'

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

/**
 * Minimal clone-element helper (shadcn-style `Slot`). Used by FormControl to
 * inject `id` / `aria-*` props into the child input without a headless
 * dependency.
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) {
      return null
    }
    const child = children as React.ReactElement<Record<string, unknown>>
    return React.cloneElement(child, {
      ...props,
      ...child.props,
      ref,
    })
  },
)
Slot.displayName = 'Slot'
