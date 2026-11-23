import type { Lang } from './types';

const MONTHS: Record<Lang, string[]> = {
  so: ['Jan', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Lul', 'Ogo', 'Seb', 'Okt', 'Nof', 'Dis'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "23 Nov 2026" (and the time with `time`), in the phone's own time zone. */
export function fmtDate(iso: string | null, lang: Lang, time = false): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day = `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
  if (!time) return day;
  return `${day}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
