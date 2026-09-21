export function redirectRecoveryLinkToResetPage(): void {
  const { hash, pathname } = window.location
  if (pathname === '/reset-password') return
  if (!/(?:^#|&)type=recovery(?:&|$)/.test(hash)) return
  window.history.replaceState(null, '', `/reset-password${hash}`)
}
