/**
 * NAMORA Timezone Normalization Engine
 * Standardizes all date boundaries to India Standard Time (IST, UTC+05:30).
 * Prevents UTC boundary drift where orders placed in the morning in India
 * would erroneously be assigned to the previous calendar day.
 */

import { AnalyticsTimeframe, DateRangeIST } from './types';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

/**
 * Returns current Date in IST representation
 */
export function getISTNow(): Date {
  const nowUtc = new Date();
  return new Date(nowUtc.getTime() + IST_OFFSET_MS);
}

/**
 * Given an IST year, month (0-indexed), and date,
 * returns the UTC Date corresponding to midnight (00:00:00.000) in IST.
 */
function istMidnightToUtc(year: number, month: number, day: number): Date {
  // Construct UTC timestamp representing the moment it is midnight in IST
  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  return new Date(utcDate.getTime() - IST_OFFSET_MS);
}

/**
 * Given an IST year, month (0-indexed), and date,
 * returns the UTC Date corresponding to end of day (23:59:59.999) in IST.
 */
function istEndOfDayToUtc(year: number, month: number, day: number): Date {
  const utcDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  return new Date(utcDate.getTime() - IST_OFFSET_MS);
}

/**
 * Computes exact UTC ISO strings for a named business timeframe in IST.
 */
export function getISTDateRange(
  timeframe: AnalyticsTimeframe = 'all',
  customStart?: string,
  customEnd?: string
): DateRangeIST {
  const istNow = getISTNow();
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const date = istNow.getUTCDate();

  let startUtc: Date;
  let endUtc: Date;
  let label = 'All Time';

  switch (timeframe) {
    case 'today': {
      startUtc = istMidnightToUtc(year, month, date);
      endUtc = istEndOfDayToUtc(year, month, date);
      label = `Today (${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')} IST)`;
      break;
    }

    case 'yesterday': {
      const yesterdayDate = new Date(Date.UTC(year, month, date - 1));
      const yYear = yesterdayDate.getUTCFullYear();
      const yMonth = yesterdayDate.getUTCMonth();
      const yDay = yesterdayDate.getUTCDate();

      startUtc = istMidnightToUtc(yYear, yMonth, yDay);
      endUtc = istEndOfDayToUtc(yYear, yMonth, yDay);
      label = `Yesterday (${yYear}-${String(yMonth + 1).padStart(2, '0')}-${String(yDay).padStart(2, '0')} IST)`;
      break;
    }

    case '7d':
    case 'last_7_days': {
      // 7 calendar days ending today in IST
      const past7 = new Date(Date.UTC(year, month, date - 6));
      startUtc = istMidnightToUtc(past7.getUTCFullYear(), past7.getUTCMonth(), past7.getUTCDate());
      endUtc = istEndOfDayToUtc(year, month, date);
      label = 'Last 7 Days (IST)';
      break;
    }

    case '30d':
    case 'last_30_days': {
      // 30 calendar days ending today in IST
      const past30 = new Date(Date.UTC(year, month, date - 29));
      startUtc = istMidnightToUtc(past30.getUTCFullYear(), past30.getUTCMonth(), past30.getUTCDate());
      endUtc = istEndOfDayToUtc(year, month, date);
      label = 'Last 30 Days (IST)';
      break;
    }

    case 'this_month': {
      // 1st of this month to today
      startUtc = istMidnightToUtc(year, month, 1);
      endUtc = istEndOfDayToUtc(year, month, date);
      label = `This Month (${year}-${String(month + 1).padStart(2, '0')} IST)`;
      break;
    }

    case 'previous_month': {
      // 1st of last month to last day of last month
      const lastMonthYear = month === 0 ? year - 1 : year;
      const lastMonth = month === 0 ? 11 : month - 1;
      // Day 0 of current month is the last day of previous month
      const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

      startUtc = istMidnightToUtc(lastMonthYear, lastMonth, 1);
      endUtc = istEndOfDayToUtc(lastMonthYear, lastMonth, lastDayOfPrevMonth);
      label = `Previous Month (${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')} IST)`;
      break;
    }

    case 'custom': {
      if (customStart && customEnd) {
        const [sY, sM, sD] = customStart.split('-').map((v) => parseInt(v, 10));
        const [eY, eM, eD] = customEnd.split('-').map((v) => parseInt(v, 10));

        if (!isNaN(sY) && !isNaN(sM) && !isNaN(sD) && !isNaN(eY) && !isNaN(eM) && !isNaN(eD)) {
          startUtc = istMidnightToUtc(sY, sM - 1, sD);
          endUtc = istEndOfDayToUtc(eY, eM - 1, eD);
          label = `Custom Range: ${customStart} to ${customEnd} (IST)`;
          break;
        }
      }
      // Fallback if invalid
      startUtc = new Date(0);
      endUtc = new Date('2099-12-31T23:59:59.999Z');
      label = 'All Time';
      break;
    }

    case 'all':
    default: {
      startUtc = new Date(0);
      endUtc = new Date('2099-12-31T23:59:59.999Z');
      label = 'All Time';
      break;
    }
  }

  return {
    startDateUtc: startUtc.toISOString(),
    endDateUtc: endUtc.toISOString(),
    startDisplayIST: `${formatUtcToISTString(startUtc)} IST`,
    endDisplayIST: `${formatUtcToISTString(endUtc)} IST`,
    label,
    timezone: 'Asia/Kolkata',
  };
}

/**
 * Formats a UTC timestamp into human-readable YYYY-MM-DD HH:mm:ss IST string.
 */
export function formatUtcToISTString(date: Date): string {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istDate.getUTCDate()).padStart(2, '0');
  const hh = String(istDate.getUTCHours()).padStart(2, '0');
  const mm = String(istDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(istDate.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
