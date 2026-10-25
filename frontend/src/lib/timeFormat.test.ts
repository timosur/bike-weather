import { describe, expect, it } from 'vitest'
import { formatHour, formatTime, uses12h } from './timeFormat'

// Intl may use a narrow no-break space before AM/PM; normalise for comparison
const norm = (s: string) => s.replace(/\s/g, ' ')

describe('timeFormat', () => {
  it('detects the hour cycle per locale', () => {
    expect(uses12h('en-US')).toBe(true)
    expect(uses12h('de-DE')).toBe(false)
  })

  it('formats HH:MM in the locale hour cycle', () => {
    expect(norm(formatTime('17:05', 'en-US'))).toBe('5:05 PM')
    expect(norm(formatTime('00:30', 'en-US'))).toBe('12:30 AM')
    expect(formatTime('17:05', 'de-DE')).toBe('17:05')
    expect(formatTime('09:00', 'de-DE')).toBe('09:00')
  })

  it('returns invalid input unchanged', () => {
    expect(formatTime('', 'en-US')).toBe('')
    expect(formatTime('soon', 'en-US')).toBe('soon')
  })

  it('formats whole hours and wraps past midnight', () => {
    expect(norm(formatHour(15, 'en-US'))).toBe('3:00 PM')
    expect(formatHour(25, 'de-DE')).toBe('01:00')
  })
})
