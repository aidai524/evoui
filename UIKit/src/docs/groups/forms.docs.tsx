import { useState } from 'react'
import {
  Button,
  Checkbox,
  Eyebrow,
  Field,
  FileDrop,
  Grid,
  Input,
  InputGroup,
  SearchInput,
  Select,
  Slider,
  Stack,
  Switch,
  Textarea,
  isValidAddress,
} from '../../nui3'
import { ADDR } from '../sample'
import type { ComponentDoc } from '../types'

function FieldDemo() {
  const [addr, setAddr] = useState('u1notanaddress')
  const valid = isValidAddress(addr)
  return (
    <Grid cols={2}>
      <Field label="Recipient" hint="Unified, Sapling or transparent address." error={addr && !valid ? 'Invalid address' : undefined}>
        <Input mono value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="u1…" />
      </Field>
      <Field label="Amount" labelAside="Balance 2.5 ZEC" hint="Up to 8 decimals.">
        <Input inputMode="decimal" placeholder="0.00" />
      </Field>
      <Field label="Search" hideLabel>
        <Input placeholder="Visually hidden label (still announced)" />
      </Field>
      <Field label="Network" disabled>
        <Select options={['Mainnet', 'Testnet']} />
      </Field>
    </Grid>
  )
}

function InputDemo() {
  return (
    <Grid cols={2}>
      <Field label="Name">
        <Input placeholder="Placeholder" />
      </Field>
      <Field label="Address (mono)">
        <Input mono defaultValue={ADDR.sapling} />
      </Field>
      <Field label="Invalid" error="Invalid amount">
        <Input defaultValue="1.2.3" />
      </Field>
      <Field label="Disabled">
        <Input disabled defaultValue="Read only while signing" />
      </Field>
      <Field label="Memo" hint="Encrypted, shielded recipients only.">
        <Textarea placeholder="Optional encrypted memo" />
      </Field>
      <Field label="Pool">
        <Select defaultValue="orchard">
          <option value="orchard">Orchard</option>
          <option value="sapling">Sapling</option>
          <option value="transparent">Transparent</option>
        </Select>
      </Field>
    </Grid>
  )
}

function InputGroupDemo() {
  const [v, setV] = useState('')
  return (
    <Grid cols={2}>
      <Field label="Supply" labelAside="Balance 18.4 nZEC">
        <InputGroup
          end={
            <>
              <Button size="sm" variant="underline" onClick={() => setV('18.4')}>
                Max
              </Button>
              nZEC
            </>
          }
        >
          <Input inputMode="decimal" placeholder="0.00" value={v} onChange={(e) => setV(e.target.value)} />
        </InputGroup>
      </Field>
      <Field label="Transfer fee">
        <InputGroup end="%">
          <Input inputMode="decimal" defaultValue="0.3" />
        </InputGroup>
      </Field>
      <Field label="Price" error="Invalid amount">
        <InputGroup start="$">
          <Input defaultValue="-4" />
        </InputGroup>
      </Field>
      <Field label="Disabled">
        <InputGroup start="ZEC">
          <Input disabled defaultValue="1.00" />
        </InputGroup>
      </Field>
    </Grid>
  )
}

function SearchDemo() {
  const [q, setQ] = useState('')
  const apps = ['Wallet', 'Bridge', 'Swap', 'Lending', 'Perps', 'Prediction', 'LaunchPad', 'Explorer']
  const hits = apps.filter((a) => a.toLowerCase().includes(q.toLowerCase()))
  return (
    <Stack gap={4} style={{ maxWidth: 420 }}>
      <SearchInput label="Search apps" placeholder="Search apps" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />
      <p className="nui-text-small nui-text-secondary">{hits.length ? hits.join(' · ') : 'No results'}</p>
      <p className="nui-text-small nui-text-muted">Press / anywhere to focus, Esc to clear.</p>
      <SearchInput label="Search (disabled)" placeholder="Disabled" shortcut={false} disabled />
    </Stack>
  )
}

function SwitchDemo() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <Stack gap={4}>
      <Switch label="Hide balances" checked={a} onChange={setA} />
      <Switch label="Auto-shield transparent funds" checked={b} onChange={setB} />
      <Switch label="Disabled (on)" checked disabled />
      <Switch label="Disabled (off)" disabled />
    </Stack>
  )
}

function CheckboxDemo() {
  const [ok, setOk] = useState(false)
  return (
    <Stack gap={3}>
      <Checkbox label="I understand the contract is unaudited and I can lose my entire contribution." checked={ok} onChange={(e) => setOk(e.target.checked)} />
      <Checkbox label="Remember this device" defaultChecked />
      <Field label="Terms" hideLabel error={ok ? undefined : 'Required before you continue'}>
        <Checkbox label="Accept the sample-data terms" />
      </Field>
      <Checkbox label="Disabled" disabled />
    </Stack>
  )
}

function SliderDemo() {
  const [lev, setLev] = useState(5)
  const [pct, setPct] = useState(50)
  const tone = lev >= 15 ? 'negative' : lev >= 10 ? 'warning' : 'accent'
  return (
    <Stack gap={8} style={{ maxWidth: 440 }}>
      <Field label="Leverage" labelAside={`${lev}×`}>
        <Slider value={lev} onChange={setLev} min={1} max={20} marks={[1, 5, 10, 15, 20]} format={(v) => `${v}×`} tone={tone} />
      </Field>
      <Field label="Repay share" labelAside={`${pct}%`}>
        <Slider value={pct} onChange={setPct} step={5} marks={[0, 25, 50, 75, 100]} format={(v) => `${v}%`} />
      </Field>
      <Field label="Disabled">
        <Slider value={30} onChange={() => {}} disabled />
      </Field>
    </Stack>
  )
}

function FileDropDemo() {
  const [files, setFiles] = useState<File[]>([])
  return (
    <Stack gap={5}>
      <FileDrop accept=".csv,text/csv" maxSize={64 * 1024} onFiles={setFiles} hint="CSV, up to 64 KB." />
      <p className="nui-text-small nui-text-muted">{files.length ? `Received: ${files.map((f) => f.name).join(', ')}` : 'No file yet.'}</p>
      <Eyebrow>Invalid / disabled</Eyebrow>
      <Grid cols={2}>
        <FileDrop label="Payroll CSV" onFiles={() => {}} error="No payment rows found" />
        <FileDrop label="Upload disabled" onFiles={() => {}} disabled />
      </Grid>
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'Field',
    group: 'forms',
    className: 'nui-field',
    description:
      'The only allowed input wrapper. Generates the control id, renders label / hint / error, and wires id, aria-describedby and aria-invalid into the child through context (useFieldControl).',
    Demo: FieldDemo,
    usage: `import { Field, Input, useFieldControl } from '@nui3/react'

<Field label="Recipient" hint="Unified or Sapling address." error={err}>
  <Input mono value={addr} onChange={…} />
</Field>

// Custom control joining a Field:
const f = useFieldControl({ id, invalid })
<input id={f.id} aria-describedby={f['aria-describedby']} aria-invalid={f['aria-invalid']} />`,
    props: [
      ['label', 'ReactNode (required)'],
      ['labelAside', 'ReactNode — right side of the label row'],
      ['hint', 'ReactNode — hidden while error is set'],
      ['error', 'ReactNode — role=alert, sets aria-invalid'],
      ['hideLabel', 'boolean — visually hidden, still announced'],
      ['id', 'string — control id (generated)'],
      ['disabled', 'boolean — passed to the control'],
      ['useFieldControl(own?)', '→ { id, aria-describedby, aria-invalid, labelId, invalid, disabled }'],
    ],
  },
  {
    name: 'Input',
    group: 'forms',
    className: 'nui-input',
    description:
      'Text input, Textarea and native Select share one look: 48px, 1px border, 15px; focus turns the border to border-focus plus a 2px accent underline. mono is for addresses and hashes.',
    Demo: InputDemo,
    usage: `<Field label="Address"><Input mono placeholder="u1…" /></Field>
<Field label="Memo"><Textarea /></Field>
<Field label="Pool"><Select options={['Orchard', 'Sapling']} /></Field>`,
    props: [
      ['mono', 'boolean (Input / Textarea) — IBM Plex Mono 14px'],
      ['invalid', 'boolean — aria-invalid without a Field error'],
      ['…rest', 'native input / textarea / select attributes'],
    ],
  },
  {
    name: 'Textarea',
    group: 'forms',
    className: 'nui-textarea',
    description: 'Multi-line input: min-height 104px, 12px vertical padding, line-height 1.6, vertical resize. Joins a Field automatically.',
    Demo: () => (
      <Grid cols={2}>
        <Field label="Notes" hint="Shown to you only.">
          <Textarea placeholder="Add a note" />
        </Field>
        <Field label="Raw memo" error="Memo over 512 bytes">
          <Textarea mono defaultValue={'x'.repeat(80)} />
        </Field>
      </Grid>
    ),
    usage: `<Field label="Notes"><Textarea rows={4} /></Field>`,
    props: [
      ['mono', 'boolean'],
      ['invalid', 'boolean'],
    ],
  },
  {
    name: 'Select',
    group: 'forms',
    className: 'nui-select',
    description: 'Native <select> with a two-line chevron (the only allowed gradient use). Pass options or <option> children.',
    Demo: () => (
      <Grid cols={3}>
        <Field label="Network">
          <Select options={['Mainnet', 'Testnet']} />
        </Field>
        <Field label="Currency" error="Pick a currency">
          <Select defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            <option>USD</option>
            <option>EUR</option>
          </Select>
        </Field>
        <Field label="Disabled">
          <Select options={['Orchard']} disabled />
        </Field>
      </Grid>
    ),
    usage: `<Field label="Network"><Select options={[{ value: 'main', label: 'Mainnet' }, 'Testnet']} /></Field>`,
    props: [
      ['options', "Array<string | { value, label?, disabled? }>"],
      ['invalid', 'boolean'],
    ],
  },
  {
    name: 'InputGroup',
    group: 'forms',
    className: 'nui-input-group',
    description: 'One bordered 48px row with start/end addons (unit, symbol, Max button) around an Input. Focus, invalid and disabled follow the inner input.',
    Demo: InputGroupDemo,
    usage: `<Field label="Supply">
  <InputGroup end="nZEC"><Input inputMode="decimal" /></InputGroup>
</Field>`,
    props: [
      ['start', 'ReactNode — leading addon'],
      ['end', 'ReactNode — trailing addon'],
      ['children', 'an Input (its own border is removed)'],
    ],
  },
  {
    name: 'SearchInput',
    group: 'forms',
    className: 'nui-search',
    description: 'Underline-only search field. / focuses it from anywhere (unless typing elsewhere); Esc clears and keeps focus. label is required.',
    Demo: SearchDemo,
    usage: `<SearchInput label="Search apps" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />`,
    props: [
      ['label', 'string (required) — aria-label'],
      ['shortcut', 'boolean = true — "/" focuses, shows the hint'],
      ['onClear', '() => void — called on Esc'],
      ['…rest', 'native input attributes'],
    ],
  },
  {
    name: 'Switch',
    group: 'forms',
    className: 'nui-switch',
    description: 'Binary setting: role=switch + aria-checked, 40×22 square track. On: accent track, knob moves 18px. label is required and rendered next to it.',
    Demo: SwitchDemo,
    usage: `<Switch label="Hide balances" checked={hidden} onChange={setHidden} />`,
    props: [
      ['label', 'ReactNode (required)'],
      ['checked / defaultChecked', 'boolean'],
      ['onChange', '(checked: boolean) => void'],
      ['hideLabel', 'boolean'],
      ['disabled', 'boolean'],
    ],
  },
  {
    name: 'Checkbox',
    group: 'forms',
    className: 'nui-check',
    description: 'Native 16×16 checkbox with accent-color and a 14px label; the label wraps the input so the whole line is clickable.',
    Demo: CheckboxDemo,
    usage: `<Checkbox label="I understand the risks" checked={ok} onChange={(e) => setOk(e.target.checked)} />`,
    props: [
      ['label', 'ReactNode (or children)'],
      ['invalid', 'boolean'],
      ['…rest', 'native checkbox attributes'],
    ],
  },
  {
    name: 'Slider',
    group: 'forms',
    className: 'nui-slider',
    description: 'Native range with a 4px filled track and 16px square thumb. aria-valuetext carries the formatted value; marks are clickable (tabIndex −1). tone switches to warning / negative.',
    Demo: SliderDemo,
    usage: `<Field label="Leverage" labelAside={\`\${lev}×\`}>
  <Slider value={lev} onChange={setLev} min={1} max={20} marks={[1, 5, 10, 20]} format={(v) => \`\${v}×\`} />
</Field>`,
    props: [
      ['value', 'number'],
      ['onChange', '(value: number) => void'],
      ['min / max / step', 'number = 0 / 100 / 1'],
      ['marks', 'number[] — clickable ticks'],
      ['format', '(value: number) => string — aria-valuetext + mark labels'],
      ['label', 'string — aria-label (optional inside a Field)'],
      ['tone', "'accent' | 'warning' | 'negative' = 'accent'"],
    ],
  },
  {
    name: 'FileDrop',
    group: 'forms',
    className: 'nui-filedrop',
    description: 'Dashed drop zone with a keyboard-reachable browse button. data-over tints it, data-invalid (oversize or error) turns it negative.',
    Demo: FileDropDemo,
    usage: `<FileDrop accept=".csv" maxSize={65536} onFiles={(files) => importCsv(files[0])} hint="CSV, up to 64 KB." />`,
    props: [
      ['onFiles', '(files: File[]) => void — accepted files only'],
      ['accept', 'string — input accept syntax'],
      ['maxSize', 'number (bytes) — larger files show fileTooLarge'],
      ['multiple', 'boolean'],
      ['label', 'ReactNode — optional title'],
      ['hint', 'ReactNode'],
      ['error', 'ReactNode — external error'],
      ['disabled', 'boolean'],
    ],
  },
]
