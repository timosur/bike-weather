/**
 * Display formatting for clock times. Uses the browser locale (not the app
 * language) so displayed times match native <input type="time"> fields.
 * Values stay HH:MM (24 h) everywhere else.
 */

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(locale?: string): Intl.DateTimeFormat {
  const key = locale ?? ''
  let f = formatters.get(key)
  if (!f) {
    const hour12 = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12
    // 24 h locales pad the hour (09:00) like native time inputs; 12 h reads naturally unpadded (9:00 AM)
    f = new Intl.DateTimeFormat(locale, { hour: hour12 ? 'numeric' : '2-digit', minute: '2-digit' })
    formatters.set(key, f)
  }
  return f
}

/** True when the (browser) locale shows times with AM/PM. */
export function uses12h(locale?: string): boolean {
  return formatter(locale).resolvedOptions().hour12 ?? false
}

/** '17:05' → '5:05 PM' (en-US) or '17:05' (de-DE). Invalid input is returned unchanged. */
export function formatTime(hhmm: string, locale?: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return hhmm
  return formatter(locale).format(new Date(2000, 0, 1, Number(m[1]) % 24, Number(m[2])))
}

/** Whole hour (may exceed 23 on charts crossing midnight) → formatted time. */
export function formatHour(hour: number, locale?: string): string {
  return formatTime(`${((hour % 24) + 24) % 24}:00`, locale)
}
