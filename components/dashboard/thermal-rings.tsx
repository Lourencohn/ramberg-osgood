import type { TemperatureUsage } from '@/lib/dashboard-data'

type ThermalRingsProps = {
  data: TemperatureUsage[]
  totalRuns: number
}

const TEMPERATURE_COLOR_STOPS: Array<{ max: number; color: string }> = [
  { max: 195, color: 'var(--chart-1)' },
  { max: 205, color: 'var(--chart-2)' },
  { max: 215, color: 'var(--chart-3)' },
  { max: 225, color: 'var(--chart-4)' },
  { max: 999, color: 'var(--chart-5)' },
]

function temperatureColor(temperature: number) {
  return TEMPERATURE_COLOR_STOPS.find((stop) => temperature <= stop.max)?.color ?? 'var(--chart-5)'
}

export function ThermalRings({ data, totalRuns }: ThermalRingsProps) {
  const sorted = [...data].sort((a, b) => a.temperature - b.temperature)
  const maxTests = sorted.length ? Math.max(...sorted.map((d) => d.tests)) : 1

  return (
    <article className="corner-brackets relative flex h-full flex-col rounded-md border border-foreground/15 bg-card p-5">
      <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
        <span className="label-caps-copper">Figura 02</span>
        <span className="label-caps">Espectro térmico</span>
      </div>

      <div className="mt-3">
        <h3 className="font-display text-2xl leading-tight tracking-tight">
          Distribuição por <span className="italic">temperatura</span>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Quantidade de ensaios em cada bico térmico.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-8 text-sm italic text-muted-foreground">
          Sem dados.
        </div>
      ) : (
        <>
          {/* Concentric rings: each ring is a temperature, fill encodes test count */}
          <div className="mt-5 flex flex-1 items-center justify-center">
            <ThermalSvg data={sorted} totalRuns={totalRuns} />
          </div>

          {/* Table-style readout */}
          <div className="mt-4 space-y-1.5 border-t border-foreground/10 pt-3">
            {sorted.map((item) => {
              const share = totalRuns ? (item.tests / totalRuns) * 100 : 0
              const barWidth = (item.tests / maxTests) * 100
              return (
                <div key={item.temperature} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className="font-mono-data text-[11px] tabular-nums text-foreground">
                    {item.temperature}°C
                  </span>
                  <div className="relative h-[6px] overflow-hidden rounded-full bg-muted">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${barWidth}%`, backgroundColor: temperatureColor(item.temperature) }}
                    />
                  </div>
                  <span className="font-mono-data text-[11px] tabular-nums text-muted-foreground">
                    {item.tests.toString().padStart(2, '0')}
                    <span className="text-foreground/30"> · </span>
                    {share.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </article>
  )
}

function ThermalSvg({ data, totalRuns }: { data: TemperatureUsage[]; totalRuns: number }) {
  const SIZE = 180
  const CENTER = SIZE / 2
  const MAX_R = 78
  const MIN_R = 18

  if (!data.length) return null

  const ringCount = data.length
  const step = (MAX_R - MIN_R) / Math.max(ringCount - 1, 1)

  let cumulative = 0
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label="Anéis térmicos">
      <defs>
        <radialGradient id="thermal-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--copper-soft)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--copper-soft)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft thermal halo at the center */}
      <circle cx={CENTER} cy={CENTER} r={MAX_R + 6} fill="url(#thermal-center)" />

      {data.map((item, index) => {
        const r = MIN_R + index * step
        const share = totalRuns ? item.tests / totalRuns : 0
        const dash = 2 * Math.PI * r
        const visible = dash * share
        const hidden = dash - visible
        cumulative += share
        const color = temperatureColor(item.temperature)

        return (
          <g key={item.temperature} transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {/* Background track */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke="currentColor"
              className="text-foreground/8"
              strokeWidth="6"
            />
            {/* Filled arc */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${visible} ${hidden}`}
            />
          </g>
        )
      })}

      {/* Center counter */}
      <text
        x={CENTER}
        y={CENTER - 2}
        textAnchor="middle"
        className="fill-foreground font-display"
        style={{ fontSize: '24px' }}
      >
        {totalRuns}
      </text>
      <text
        x={CENTER}
        y={CENTER + 12}
        textAnchor="middle"
        className="fill-muted-foreground"
        style={{ fontSize: '8px', letterSpacing: '0.15em', fontFamily: 'var(--font-sans-app)' }}
      >
        ENSAIOS
      </text>
    </svg>
  )
}
