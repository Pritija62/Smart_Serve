const APP_TIME_ZONE = import.meta.env.VITE_TIME_ZONE || 'Asia/Kathmandu'

const normalizeTimestampInput = (value) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }

  // Backend sends naive UTC timestamps (e.g. 2026-04-09T05:49:00.123456).
  // Add Z so browsers parse them as UTC instead of local time.
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)
  return hasTimezone ? trimmed : `${trimmed}Z`
}

export const formatTimeInAppZone = (value, options = {}) => {
  if (!value) {
    return 'N/A'
  }

  const normalizedValue = normalizeTimestampInput(value)
  const date = value instanceof Date ? value : new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return date.toLocaleTimeString('en-NP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: APP_TIME_ZONE,
    ...options,
  })
}

export const getAppTimeZone = () => APP_TIME_ZONE
