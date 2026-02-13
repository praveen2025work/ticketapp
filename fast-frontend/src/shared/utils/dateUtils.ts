/**
 * Format a Date as YYYY-MM-DD for HTML date inputs.
 */
export function formatDateForInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Subtract business days from a date (excludes Saturday and Sunday).
 */
export function subtractBusinessDays(date: Date, businessDays: number): Date {
  const result = new Date(date);
  let remaining = businessDays;
  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const day = result.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }
  return result;
}

const DEFAULT_DAYS_BACK = 45;

/**
 * Default ticket list date range: from 45 days ago to today.
 */
export function getDefaultTicketDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - DEFAULT_DAYS_BACK);
  return {
    fromDate: formatDateForInput(from),
    toDate: formatDateForInput(today),
  };
}
