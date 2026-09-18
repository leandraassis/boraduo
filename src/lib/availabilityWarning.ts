const SEEN_KEY = 'seen_availability_warning'

export function hasSeenAvailabilityWarning(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markAvailabilityWarningSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    return
  }
}
