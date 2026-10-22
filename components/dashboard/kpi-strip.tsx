type Kpi = {
  caption: string
  value: string
  unit?: string
  hint?: string
  accent?: boolean
}

type KpiStripProps = {
  items: Kpi[]
}

export function KpiStrip({ items }: KpiStripProps) {
  return (
    <section className="grid shrink-0 grid-cols-2 divide-y divide-foreground/10 border-y border-foreground/15 bg-background/60 md:grid-cols-4 md:divide-x md:divide-y-0">
      {items.map((item, index) => (
        <KpiCell key={item.caption} item={item} index={index} />
      ))}
    </section>
  )
}

function KpiCell({ item, index }: { item: Kpi; index: number }) {
  return (
    <div className="group relative px-4 py-2.5">
      <span className="absolute right-3 top-3 font-mono-data text-[10px] tracking-widest text-foreground/30">
        0{index + 1}
      </span>

      <div className="space-y-1">
        <span className={item.accent ? 'label-caps-brand' : 'label-caps'}>{item.caption}</span>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-display text-[28px] leading-none tracking-tight md:text-[32px] ${
              item.accent ? 'text-brand-deep' : 'text-foreground'
            }`}
          >
            {item.value}
          </span>
          {item.unit ? (
            <span className="font-mono-data text-xs uppercase tracking-wider text-muted-foreground">
              {item.unit}
            </span>
          ) : null}
        </div>
        {item.hint ? (
          <p className="font-sans text-[11px] leading-snug text-muted-foreground">{item.hint}</p>
        ) : null}
      </div>

      <span
        className="absolute bottom-0 left-0 h-px w-0 bg-brand transition-all duration-500 group-hover:w-full"
        aria-hidden="true"
      />
    </div>
  )
}
