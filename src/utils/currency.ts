/**
 * Convert dollars to cents for storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as USD currency string
 */
export function formatCurrency(cents: number): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Parse a currency input string to cents
 */
export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const dollars = parseFloat(cleaned) || 0;
  return dollarsToCents(dollars);
}
