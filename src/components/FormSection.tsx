import type { ReactNode } from 'react'
import { smallLabelClass } from './formStyles'

export function FormSection({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base leading-[22px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {aside && <span className={smallLabelClass}>{aside}</span>}
      </div>
      {children}
    </section>
  )
}
