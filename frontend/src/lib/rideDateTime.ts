const pad = (n: number) => String(n).padStart(2, '0')

/** Current local date (YYYY-MM-DD) and time (HH:MM) */
export function nowDateTime(): { startDate: string; startTime: string } {
  const d = new Date()
  return {
    startDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    startTime: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/** True if the local date/time lies before now */
export function isPastDateTime(startDate: string, startTime: string): boolean {
  return new Date(`${startDate}T${startTime}`) < new Date()
}
