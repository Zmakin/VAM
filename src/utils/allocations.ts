import { ScheduledAllocation, AllocationFrequency } from '../types';

/**
 * Check if an allocation should run on a specific date
 */
export function shouldRunAllocationOnDate(allocation: ScheduledAllocation, date: Date): boolean {
  if (!allocation.isActive) return false;

  // Normalize dates to midnight for comparison
  const startDate = new Date(allocation.startDate);
  startDate.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  // Check if date is before start date
  if (checkDate < startDate) return false;

  // Check if date is after end date
  if (allocation.endDate) {
    const endDate = new Date(allocation.endDate);
    endDate.setHours(0, 0, 0, 0);
    if (checkDate > endDate) return false;
  }

  // Check if already executed on this date
  if (allocation.lastExecutedAt) {
    const lastRun = new Date(allocation.lastExecutedAt);
    lastRun.setHours(0, 0, 0, 0);
    if (lastRun.getTime() === checkDate.getTime()) {
      return false;
    }
  }

  const dayOfWeek = checkDate.getDay(); // 0-6
  const dayOfMonth = checkDate.getDate(); // 1-31

  switch (allocation.frequency) {
    case 'DAILY':
      return true;

    case 'WEEKLY':
      return dayOfWeek === allocation.dayOfWeek;

    case 'BIWEEKLY': {
      if (dayOfWeek !== allocation.dayOfWeek) return false;
      // Check if in correct week (every other week from start date)
      const startTime = startDate.getTime();
      const checkTime = checkDate.getTime();
      const daysDiff = Math.floor((checkTime - startTime) / (24 * 60 * 60 * 1000));
      return (Math.floor(daysDiff / 7) % 2) === 0;
    }

    case 'MONTHLY_DATE':
      return dayOfMonth === allocation.dayOfMonth;

    case 'MONTHLY_FIRST_WEEKDAY':
    case 'MONTHLY_SECOND_WEEKDAY':
    case 'MONTHLY_THIRD_WEEKDAY':
    case 'MONTHLY_FOURTH_WEEKDAY':
    case 'MONTHLY_LAST_WEEKDAY': {
      if (dayOfWeek !== allocation.dayOfWeek) return false;
      const occurrence = getMonthlyWeekdayOccurrence(checkDate);
      return occurrence === getOccurrenceFromFrequency(allocation.frequency);
    }

    default:
      return false;
  }
}

/**
 * Get which occurrence (1st, 2nd, 3rd, 4th, or last) of a weekday falls on a given date
 */
function getMonthlyWeekdayOccurrence(date: Date): 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'LAST' {
  const dayOfMonth = date.getDate();
  const occurrence = Math.ceil(dayOfMonth / 7);

  // Check if this is the last occurrence of this weekday in the month
  const nextWeek = new Date(date);
  nextWeek.setDate(dayOfMonth + 7);
  if (nextWeek.getMonth() !== date.getMonth()) {
    return 'LAST';
  }

  if (occurrence === 1) return 'FIRST';
  if (occurrence === 2) return 'SECOND';
  if (occurrence === 3) return 'THIRD';
  if (occurrence === 4) return 'FOURTH';
  return 'LAST';
}

/**
 * Extract occurrence from frequency string
 */
function getOccurrenceFromFrequency(frequency: AllocationFrequency): 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'LAST' {
  const occurrenceMap: { [key: string]: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'LAST' } = {
    'MONTHLY_FIRST_WEEKDAY': 'FIRST',
    'MONTHLY_SECOND_WEEKDAY': 'SECOND',
    'MONTHLY_THIRD_WEEKDAY': 'THIRD',
    'MONTHLY_FOURTH_WEEKDAY': 'FOURTH',
    'MONTHLY_LAST_WEEKDAY': 'LAST',
  };
  return occurrenceMap[frequency] || 'FIRST';
}

/**
 * Get day name from day number
 */
export function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || '';
}

/**
 * Get frequency display text
 */
export function getFrequencyText(allocation: ScheduledAllocation): string {
  const dayName = allocation.dayOfWeek !== undefined ? getDayName(allocation.dayOfWeek) : '';

  switch (allocation.frequency) {
    case 'DAILY':
      return 'Every day';
    case 'WEEKLY':
      return `Every ${dayName}`;
    case 'BIWEEKLY':
      return `Every other ${dayName}`;
    case 'MONTHLY_DATE':
      return `Monthly on day ${allocation.dayOfMonth}`;
    case 'MONTHLY_FIRST_WEEKDAY':
      return `1st ${dayName} of month`;
    case 'MONTHLY_SECOND_WEEKDAY':
      return `2nd ${dayName} of month`;
    case 'MONTHLY_THIRD_WEEKDAY':
      return `3rd ${dayName} of month`;
    case 'MONTHLY_FOURTH_WEEKDAY':
      return `4th ${dayName} of month`;
    case 'MONTHLY_LAST_WEEKDAY':
      return `Last ${dayName} of month`;
    default:
      return allocation.frequency;
  }
}

/**
 * Get end date display text
 */
export function getEndDateText(endDate: string | null): string {
  if (!endDate) return 'Indefinite';
  const date = new Date(endDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Calculate next execution date for an allocation
 */
export function getNextExecutionDate(allocation: ScheduledAllocation): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 365); // Look ahead 1 year

  let current = new Date(today);
  while (current <= maxDate) {
    if (shouldRunAllocationOnDate(allocation, current)) {
      return current;
    }
    current.setDate(current.getDate() + 1);
  }
  return null;
}
