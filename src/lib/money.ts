// Money is always an integer of US cents, like the website: 2599 → "$25.99", 2500 → "$25".
export function fmtMoney(cents: number): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100).toLocaleString('en-US');
  const frac = abs % 100;
  return `${neg ? '-' : ''}$${whole}${frac ? '.' + String(frac).padStart(2, '0') : ''}`;
}

/** Always two decimals — for totals. */
export function fmtMoney2(cents: number): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  return `${neg ? '-' : ''}$${Math.floor(abs / 100).toLocaleString('en-US')}.${String(abs % 100).padStart(2, '0')}`;
}
