export type DateFormat =
  | 'date'
  | 'date-long'
  | 'date-short'
  | 'datetime'
  | 'datetime-long'
  | 'datetime-short'
  | 'time'
  | 'time-seconds'
  | 'year'
  | 'month'
  | 'month-short'
  | 'year-month'
  | 'year-month-day'
  | 'month-day'
  | 'full'

export function formatDate(
    value: string | Date | null | undefined,
    format: DateFormat = 'date',
    locale = 'en-PH'
): string {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return '-'
    }

    const options: Record<DateFormat, Intl.DateTimeFormatOptions> = {
        // August 22, 2026
        date: {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },

        // August 22, 2026
        'date-long': {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },

        // Aug 22, 2026
        'date-short': {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        },

        // Aug 22, 2026, 02:30 PM
        datetime: {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        },

        // August 22, 2026, 02:30 PM
        'datetime-long': {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        },

        // 08/22/2026, 02:30 PM
        'datetime-short': {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        },

        // 02:30 PM
        time: {
            hour: '2-digit',
            minute: '2-digit'
        },

        // 02:30:45 PM
        'time-seconds': {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        },

        // 2026
        year: {
            year: 'numeric'
        },

        // August
        month: {
            month: 'long'
        },

        // Aug
        'month-short': {
            month: 'short'
        },

        // August 2026
        'year-month': {
            year: 'numeric',
            month: 'long'
        },

        // 08/22/2026
        'year-month-day': {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        },

        // Aug 22
        'month-day': {
            month: 'short',
            day: 'numeric'
        },

        // Saturday, August 22, 2026, 02:30 PM
        full: {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    }

    return new Intl.DateTimeFormat(
        locale,
        options[format]
    ).format(date)
}