import { afterEach, beforeEach, vi } from 'vitest';
import dayjs from '../../dayjs';
import { dayLabel, fullName, listTime } from './chatTime';

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(dayjs('2026-11-22T15:00').toDate());
});
afterEach(() => {
    vi.useRealTimers();
});

test('listTime: the time today, the day this week, the date earlier', () => {
    expect(listTime(dayjs('2026-11-22T09:05').toDate())).toBe('9:05');
    expect(listTime(dayjs('2026-11-19T09:05').toDate())).toBe(dayjs('2026-11-19').format('dd'));
    expect(listTime(dayjs('2026-10-02T09:05').toDate())).toBe('2. 10.');
    expect(listTime(dayjs('2025-10-02T09:05').toDate())).toBe('2. 10. 2025');
});

test('dayLabel names today and yesterday', () => {
    expect(dayLabel(dayjs('2026-11-22T08:00').toDate())).toBe('Dnes');
    expect(dayLabel(dayjs('2026-11-21T08:00').toDate())).toBe('Včera');
    expect(dayLabel(dayjs('2026-11-02T08:00').toDate())).toBe('pondělí 2. listopadu');
    expect(fullName(null)).toBe('Smazaný uživatel');
});

test('a month after a day is in the genitive, on its own in the nominative', () => {
    expect(dayjs('2026-11-02').format('LL')).toBe('2. listopadu 2026');
    expect(dayjs('2026-03-15').format('D. MMMM')).toBe('15. března');
    expect(dayjs('2026-11-02').format('MMMM YYYY')).toBe('listopad 2026');
});
