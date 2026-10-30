import { useRef, useState } from 'react'
import { Button, Cluster, Dialog, Drawer, Field, Input, Popover, Stack, Switch, ToastProvider, useToast } from '../../nui3'
import type { ComponentDoc } from '../types'

function DialogDemo() {
  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [signing, setSigning] = useState(false)
  const sign = () => {
    setSigning(true)
    setTimeout(() => {
      setSigning(false)
      setOpen(false)
    }, 1800)
  }
  return (
    <Stack gap={4}>
      <Cluster gap={5}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Review transfer
        </Button>
        <Button
          variant="subtle"
          onClick={() => {
            setLocked(true)
            setOpen(true)
          }}
        >
          Open non-dismissible
        </Button>
      </Cluster>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          setLocked(false)
        }}
        title="Confirm transfer"
        dismissible={!signing && !locked}
        footer={
          <>
            <Button
              size="sm"
              disabled={signing}
              onClick={() => {
                setOpen(false)
                setLocked(false)
              }}
            >
              Cancel
            </Button>
            <Button variant="solid" size="sm" loading={signing} onClick={sign}>
              Sign &amp; send
            </Button>
          </>
        }
      >
        <Stack gap={4}>
          <p className="nui-text-secondary">Send 1.2500 ZEC to a shielded Unified address. While signing, Esc and backdrop clicks are ignored and the close button disappears.</p>
          <Field label="Memo" hint="Encrypted, visible to the recipient only.">
            <Input placeholder="Optional encrypted memo" />
          </Field>
          {locked && <p className="nui-text-small nui-text-muted">This dialog has dismissible=false: use Cancel to close it.</p>}
        </Stack>
      </Dialog>
    </Stack>
  )
}

function DrawerDemo() {
  const [side, setSide] = useState<'right' | 'left' | null>(null)
  return (
    <>
      <Cluster gap={5}>
        <Button variant="outline" onClick={() => setSide('right')}>
          Order details
        </Button>
        <Button variant="subtle" onClick={() => setSide('left')}>
          Open left
        </Button>
      </Cluster>
      <Drawer
        open={side !== null}
        side={side ?? 'right'}
        onClose={() => setSide(null)}
        title="Order details"
        footer={
          <Button variant="outline" size="sm" onClick={() => setSide(null)}>
            Done
          </Button>
        }
      >
        <Stack gap={4}>
          <p className="nui-text-secondary">Limit buy · 4.0000 ZEC at 47.10 USDC. Sample data.</p>
          <Switch label="Post only" defaultChecked />
          <Switch label="Reduce only" />
        </Stack>
      </Drawer>
    </>
  )
}

function ToastButtons() {
  const { toast, dismiss } = useToast()
  const [last, setLast] = useState<string | null>(null)
  return (
    <Cluster gap={5}>
      <Button
        variant="outline"
        onClick={() => setLast(toast({ title: 'Transfer confirmed', description: '1.2500 ZEC sent to u1q8…k3v9a2.', tone: 'positive' }))}
      >
        Positive
      </Button>
      <Button variant="outline" onClick={() => setLast(toast({ title: 'Transaction failed', description: 'The node rejected the proof. Nothing was sent.', tone: 'negative' }))}>
        Negative
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          setLast(
            toast({
              title: 'Syncing wallet',
              description: 'Scanning blocks. This stays until dismissed.',
              duration: 0,
              action: (
                <Button variant="underline" size="sm">
                  View progress
                </Button>
              ),
            }),
          )
        }
      >
        Sticky with action
      </Button>
      <Button variant="subtle" disabled={!last} onClick={() => last && dismiss(last)}>
        Dismiss last
      </Button>
    </Cluster>
  )
}

function PopoverDemo() {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  return (
    <div style={{ overflow: 'hidden', padding: 16, border: '1px dashed var(--nui-border)' }}>
      <Button ref={anchor} variant="outline" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Fee details
      </Button>
      <Popover open={open} onOpenChange={setOpen} anchor={anchor} label="Fee details" style={{ width: 260 }}>
        <Stack gap={3}>
          <strong>Network fee 0.0001 ZEC</strong>
          <p className="nui-text-secondary" style={{ margin: 0 }}>Rendered in a portal on &lt;body&gt;, so the dashed container&apos;s overflow:hidden does not clip it. Flips when there is no room below.</p>
        </Stack>
      </Popover>
    </div>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'Dialog',
    group: 'overlays',
    className: 'nui-dialog',
    description:
      'Native <dialog> + showModal(): focus moves in, Esc and backdrop close, focus returns to the trigger. dismissible={false} (signing / submitting) ignores Esc and backdrop and hides the close button.',
    Demo: DialogDemo,
    usage: `<Dialog open={open} onClose={() => setOpen(false)} title="Confirm transfer" dismissible={!signing}
  footer={<><Button size="sm" onClick={close}>Cancel</Button><Button variant="solid" size="sm" loading={signing}>Sign & send</Button></>}>
  …
</Dialog>`,
    props: [
      ['open', 'boolean'],
      ['onClose', '() => void'],
      ['title', 'ReactNode'],
      ['footer', 'ReactNode — right-aligned action row'],
      ['width', 'number | string — max width (default 480px)'],
      ['dismissible', 'boolean = true'],
    ],
  },
  {
    name: 'Drawer',
    group: 'overlays',
    className: 'nui-drawer',
    description: 'Full-height side sheet on native <dialog> (right by default, data-side="left" flips it); slides in 24px. Used for mobile nav, order details, faucet claims.',
    Demo: DrawerDemo,
    usage: `<Drawer open={open} onClose={() => setOpen(false)} title="Order details" side="right">…</Drawer>`,
    props: [
      ['open', 'boolean'],
      ['onClose', '() => void'],
      ['title', 'ReactNode'],
      ['side', "'right' | 'left' = 'right'"],
      ['footer', 'ReactNode'],
      ['dismissible', 'boolean = true'],
    ],
  },
  {
    name: 'Popover / FloatingPanel / Portal',
    group: 'overlays',
    className: 'nui-floating',
    description:
      'Shared floating layer used by Tooltip, Select, Menu and DatePicker: rendered in a theme-aware portal on <body> (never clipped by overflow), anchored with flip/shift, animated in and out via data-state.',
    Demo: PopoverDemo,
    usage: `const anchor = useRef<HTMLButtonElement>(null)
<Button ref={anchor} onClick={() => setOpen(!open)}>Fee details</Button>
<Popover open={open} onOpenChange={setOpen} anchor={anchor} label="Fee details">…</Popover>

// Lower level
<FloatingPanel open anchor={ref} placement="bottom-start" matchWidth onDismiss={close}>…</FloatingPanel>
const { mounted, state } = usePresence(open, ref) // keep mounted for the exit animation`,
    props: [
      ['open / onOpenChange', 'boolean / (open) => void'],
      ['anchor', 'RefObject<HTMLElement>'],
      ['placement', "Placement = 'bottom-start' (flips automatically)"],
      ['offset', 'number = 6'],
      ['matchWidth', "boolean | 'min'"],
      ['variant', "'surface' | 'inverse'"],
    ],
  },
  {
    name: 'ToastProvider / useToast',
    group: 'overlays',
    className: 'nui-toaster',
    description:
      'Transaction results go through toast, never inline notices. The toaster is a polite live region labelled Notifications; negative toasts use role=alert, others role=status.',
    Demo: () => (
      <ToastProvider>
        <ToastButtons />
      </ToastProvider>
    ),
    usage: `// App root
<ToastProvider><App /></ToastProvider>

// Anywhere below
const { toast, dismiss } = useToast()
const id = toast({ title: 'Transfer confirmed', description: '1.25 ZEC sent.', tone: 'positive' })`,
    props: [
      ['toast(opts)', '({ title, description?, tone?, duration?, action? }) => id'],
      ['tone', "'default' | 'positive' | 'negative'"],
      ['duration', 'number (ms) = 5000; 0 keeps it until dismissed'],
      ['dismiss(id)', '(id: string) => void'],
      ['ToastProvider limit', 'number = 4'],
    ],
  },
]
