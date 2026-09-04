import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] active:scale-[0.98] active:bg-[var(--primary-active)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-[#b91c1c] active:scale-[0.98]',
        outline:
          'border border-input bg-transparent hover:bg-secondary hover:text-secondary-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-border',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-9 px-4 py-2',
        sm: 'min-h-9 px-3 text-sm',
        lg: 'min-h-10 px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows an inline spinner and disables the button. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
