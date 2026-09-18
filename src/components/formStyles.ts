export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match'

export const inputClass =
  'w-full rounded-xl border border-line bg-field px-3.5 py-3 text-sm text-ink placeholder:text-ink-muted transition focus:border-brand focus:shadow-[inset_0_0_8px_rgba(124,58,237,0.1)] focus:outline-none'

export const smallLabelClass = 'text-[11px] leading-4 font-semibold tracking-[0.04em] uppercase text-ink-muted'

export const primaryButtonClass = `flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand to-match py-3.5 text-sm font-semibold text-ink shadow-glow-brand transition hover:brightness-110 ${focusRing} disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100`

export const textButtonClass = `inline-flex cursor-pointer items-center gap-1.5 rounded-lg py-1 text-sm text-ink-muted transition hover:text-ink ${focusRing}`

export const gradientTextClass = 'bg-linear-to-r from-brand to-match bg-clip-text text-transparent'

export const errorBannerClass = 'rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger'

export function optionClass(selected: boolean) {
  return `cursor-pointer rounded-xl border text-left transition ${focusRing} ${
    selected ? 'border-brand bg-brand/15 text-ink' : 'border-line bg-field text-ink-muted hover:border-line-strong'
  }`
}
