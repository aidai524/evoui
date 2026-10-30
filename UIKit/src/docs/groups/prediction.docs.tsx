import { useState } from 'react'
import { Alert, Grid, OutcomeButton, ProbabilityBar, Stack } from '../../nui3'
import type { ComponentDoc } from '../types'

function OutcomeDemo() {
  const [pick, setPick] = useState<'yes' | 'no' | null>('yes')
  const [multi, setMulti] = useState<string | null>(null)
  const candidates = [
    { id: 'a', label: 'Orchard v2 by Q2', p: 0.46 },
    { id: 'b', label: 'Orchard v2 by Q3', p: 0.31 },
    { id: 'c', label: 'Later', p: 0.23 },
  ]
  return (
    <Stack gap={6}>
      <Grid cols={2}>
        <OutcomeButton label="Yes" tone="positive" probability={0.62} selected={pick === 'yes'} onClick={() => setPick(pick === 'yes' ? null : 'yes')} />
        <OutcomeButton label="No" tone="negative" probability={0.38} selected={pick === 'no'} onClick={() => setPick(pick === 'no' ? null : 'no')} />
      </Grid>
      <Stack gap={2}>
        {candidates.map((c) => (
          <OutcomeButton key={c.id} label={c.label} probability={c.p} price={`${Math.round(c.p * 100)}%`} selected={multi === c.id} onClick={() => setMulti(c.id)} />
        ))}
      </Stack>
      <Grid cols={3}>
        <OutcomeButton label="Loading" tone="positive" probability={0.5} loading />
        <OutcomeButton label="Market closed" probability={0.7} disabled />
        <OutcomeButton label="Over limit" tone="negative" probability={0.2} invalid />
      </Grid>
      <Alert tone="warning" title="Losing outcomes settle at 0.">
        This market runs on a public external protocol. Your position, size and address are visible to anyone. Sample data.
      </Alert>
    </Stack>
  )
}

export const docs: ComponentDoc[] = [
  {
    name: 'OutcomeButton',
    group: 'prediction',
    className: 'nui-outcome',
    description: 'Outcome choice with a 10% probability fill and a tabular price. Selection uses aria-pressed; Yes is positive, No negative, multi-outcome neutral.',
    Demo: OutcomeDemo,
    usage: `<OutcomeButton label="Yes" tone="positive" probability={0.62} selected={side === 'yes'} onClick={() => setSide('yes')} />`,
    props: [
      ['label', 'ReactNode'],
      ['probability', 'number 0–1'],
      ['price', 'ReactNode — default "62¢"'],
      ['tone', "'positive' | 'negative' | 'neutral' = 'neutral'"],
      ['selected', 'boolean — aria-pressed'],
      ['loading', 'boolean — aria-busy + spinner, disabled'],
      ['invalid', 'boolean — aria-invalid'],
      ['disabled', 'boolean'],
    ],
  },
  {
    name: 'ProbabilityBar',
    group: 'prediction',
    className: 'nui-probbar',
    description: '8px segmented bar with a legend. role="img" with an aria-label summarising every outcome.',
    Demo: () => (
      <Stack gap={6}>
        <ProbabilityBar
          outcomes={[
            { label: 'Yes', probability: 0.62, tone: 'positive' },
            { label: 'No', probability: 0.38, tone: 'negative' },
          ]}
        />
        <ProbabilityBar
          outcomes={[
            { label: 'Q2', probability: 0.46 },
            { label: 'Q3', probability: 0.31 },
            { label: 'Q4', probability: 0.15 },
            { label: 'Later', probability: 0.08 },
          ]}
        />
        <ProbabilityBar legend={false} outcomes={[{ label: 'Yes', probability: 0.97, tone: 'positive' }, { label: 'No', probability: 0.03, tone: 'negative' }]} />
      </Stack>
    ),
    usage: `<ProbabilityBar outcomes={[{ label: 'Yes', probability: 0.62, tone: 'positive' }, { label: 'No', probability: 0.38, tone: 'negative' }]} />`,
    props: [
      ['outcomes', "{ label, probability (0–1), tone?: 'positive' | 'negative' | 'accent' | 'info' | 'neutral' }[]"],
      ['legend', 'boolean = true'],
    ],
  },
]
