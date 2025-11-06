"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.MutableRefObject<HTMLElement | null>
  titleId?: string
  descriptionId?: string
  setTitleId: (id?: string) => void
  setDescriptionId: (id?: string) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext(component: string): DialogContextValue {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error(`${component} must be used within a <Dialog> component`)
  }
  return context
}

export function Dialog({ open: openProp, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next)
      }
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )
  const [titleId, setTitleId] = React.useState<string | undefined>()
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>()

  const value = React.useMemo<DialogContextValue>(
    () => ({ open, setOpen, triggerRef, titleId, descriptionId, setTitleId, setDescriptionId }),
    [open, setOpen, titleId, descriptionId],
  )

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

interface DialogTriggerProps {
  children: React.ReactElement
}

function assignRef(ref: React.Ref<HTMLElement> | undefined, value: HTMLElement | null) {
  if (!ref) return
  if (typeof ref === "function") {
    ref(value)
  } else {
    ;(ref as React.MutableRefObject<HTMLElement | null>).current = value
  }
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  const context = useDialogContext("DialogTrigger")
  const childRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref

  return React.cloneElement(children, {
    "aria-haspopup": "dialog",
    "aria-expanded": context.open,
    "data-testid": children.props?.["data-testid"] ?? "dialog-trigger",
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      children.props?.onClick?.(event)
      if (!event.defaultPrevented) {
        context.setOpen(true)
      }
    },
    ref: (node: HTMLElement | null) => {
      context.triggerRef.current = node
      assignRef(childRef, node)
    },
  })
}

function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",")

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DialogContent({ children, className, ...props }: DialogContentProps) {
  const context = useDialogContext("DialogContent")
  const contentRef = React.useRef<HTMLDivElement>(null)
  const mounted = useMounted()

  React.useEffect(() => {
    if (!context.open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [context.open])

  React.useEffect(() => {
    if (!context.open) return
    const content = contentRef.current
    if (!content) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusable = Array.from(content.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) => !element.hasAttribute("data-dialog-ignore-focus"),
    )
    const target = focusable[0] ?? content
    window.requestAnimationFrame(() => {
      target.focus({ preventScroll: true })
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        context.setOpen(false)
      }
      if (event.key === "Tab") {
        const elements = Array.from(content.querySelectorAll<HTMLElement>(focusableSelector)).filter(
          (element) => !element.hasAttribute("data-dialog-ignore-focus"),
        )
        if (elements.length === 0) {
          event.preventDefault()
          return
        }
        const first = elements[0]
        const last = elements[elements.length - 1]
        if (event.shiftKey) {
          if (document.activeElement === first || document.activeElement === content) {
            event.preventDefault()
            last.focus()
          }
        } else if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    content.addEventListener("keydown", handleKeyDown)
    return () => {
      content.removeEventListener("keydown", handleKeyDown)
      if (previouslyFocused) {
        previouslyFocused.focus({ preventScroll: true })
      } else if (context.triggerRef.current) {
        context.triggerRef.current.focus({ preventScroll: true })
      }
    }
  }, [context.open, context.setOpen])

  if (!mounted || !context.open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => context.setOpen(false)}
        data-testid="dialog-backdrop"
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={context.titleId}
        aria-describedby={context.descriptionId}
        tabIndex={-1}
        className={cn(
          "relative z-10 mx-4 w-full max-w-2xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl outline-none",
          className,
        )}
        data-testid="dialog"
        onMouseDown={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} data-testid="dialog-header" {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} data-testid="dialog-footer" {...props} />
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const context = useDialogContext("DialogTitle")
  const id = React.useId()
  React.useEffect(() => {
    context.setTitleId(id)
    return () => context.setTitleId(undefined)
  }, [context, id])

  return (
    <h2
      id={id}
      className={cn("text-lg font-semibold text-[hsl(var(--foreground))]", className)}
      data-testid="dialog-title"
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const context = useDialogContext("DialogDescription")
  const id = React.useId()
  React.useEffect(() => {
    context.setDescriptionId(id)
    return () => context.setDescriptionId(undefined)
  }, [context, id])

  return (
    <p
      id={id}
      className={cn("text-sm text-[hsl(var(--muted-foreground))]", className)}
      data-testid="dialog-description"
      {...props}
    />
  )
}

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  nuraAction?: string
}

export function DialogClose({ className, children, onClick, nuraAction = "cancel", ...props }: DialogCloseProps) {
  const context = useDialogContext("DialogClose")
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-transparent bg-[hsl(var(--muted))] px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2",
        className,
      )}
      data-testid={props["data-testid"] ?? "dialog-close"}
      data-nura-action={nuraAction}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          context.setOpen(false)
        }
      }}
      {...props}
    >
      {children ?? "Close"}
    </button>
  )
}
