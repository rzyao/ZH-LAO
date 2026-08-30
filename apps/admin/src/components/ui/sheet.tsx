import * as React from 'react'
import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

type SheetSide = 'top' | 'right' | 'bottom' | 'left'

const Sheet = BaseDrawer.Root
const SheetTrigger = BaseDrawer.Trigger
const SheetClose = BaseDrawer.Close
const SheetPortal = BaseDrawer.Portal

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof BaseDrawer.Backdrop>,
  React.ComponentPropsWithoutRef<typeof BaseDrawer.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDrawer.Backdrop
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/50', className)}
    {...props}
  />
))
SheetOverlay.displayName = 'SheetOverlay'

const sheetVariants: Record<SheetSide, string> = {
  top: 'inset-x-0 top-0 border-b',
  right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
  bottom: 'inset-x-0 bottom-0 border-t',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof BaseDrawer.Popup>,
  React.ComponentPropsWithoutRef<typeof BaseDrawer.Popup> & { side?: SheetSide }
>(({ side = 'right', className, children, ...props }, ref) => (
  <BaseDrawer.Portal>
    <SheetOverlay />
    <BaseDrawer.Popup
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col gap-4 bg-background p-5 shadow-lg transition-transform data-[open]:translate-x-0 data-[closed]:translate-x-full',
        sheetVariants[side],
        className,
      )}
      {...props}
    >
      {children}
      <BaseDrawer.Close
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-3"
            aria-label="关闭"
          />
        }
      >
        <X aria-hidden className="size-4" />
      </BaseDrawer.Close>
    </BaseDrawer.Popup>
  </BaseDrawer.Portal>
))
SheetContent.displayName = 'SheetContent'

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof BaseDrawer.Title>,
  React.ComponentPropsWithoutRef<typeof BaseDrawer.Title>
>(({ className, ...props }, ref) => (
  <BaseDrawer.Title ref={ref} className={cn('text-base font-semibold', className)} {...props} />
))
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof BaseDrawer.Description>,
  React.ComponentPropsWithoutRef<typeof BaseDrawer.Description>
>(({ className, ...props }, ref) => (
  <BaseDrawer.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
SheetDescription.displayName = 'SheetDescription'

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
