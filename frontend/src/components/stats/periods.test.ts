import dayjs from '../../dayjs';
import { minutesByDay as machineMinutesByDay } from '../machines/MachineTasks';
import { fullName, minutesByDay, plural, statsPeriod } from './PersonStats';

test('statsPeriod: a week has 7 days, a month as many as it has', () => {
    const week = statsPeriod('week', dayjs('2026-11-16'));
    expect(week.days).toBe(7);
    expect(week.end.format('YYYY-MM-DD')).toBe('2026-11-23');
    expect(week.inThis).toBe('v tomto týdnu');
    expect(statsPeriod('month', dayjs('2026-02-01')).days).toBe(28);
    expect(statsPeriod('month', dayjs('2026-11-01')).inThis).toBe('v tomto měsíci');
});

test('plural uses the Czech forms for 1, 2-4 and 5+', () => {
    expect(plural(1, 'úkol', 'úkoly', 'úkolů')).toBe('1 úkol');
    expect(plural(3, 'úkol', 'úkoly', 'úkolů')).toBe('3 úkoly');
    expect(plural(5, 'úkol', 'úkoly', 'úkolů')).toBe('5 úkolů');
    expect(plural(0, 'úkol', 'úkoly', 'úkolů')).toBe('0 úkolů');
    expect(fullName({ FirstName: 'Jan', LastName: 'Novák' })).toBe('Jan Novák');
    expect(fullName(null)).toBe('');
});

const local = (text: string) => dayjs(text).toISOString();

test("a person's minutes per day split a shift over midnight", () => {
    const period = statsPeriod('week', dayjs('2026-11-16'));
    const days = minutesByDay(
        [
            { StartTime: local('2026-11-16T08:00'), StopTime: local('2026-11-16T12:30') },
            { StartTime: local('2026-11-17T22:00'), StopTime: local('2026-11-18T02:00') },
            // outside the week: ignored
            { StartTime: local('2026-11-25T08:00'), StopTime: local('2026-11-25T09:00') },
        ],
        period,
    );
    expect(days).toEqual([270, 120, 120, 0, 0, 0, 0]);
});

test("a machine's minutes per day count running sessions until now and split at midnight", () => {
    const week = dayjs('2026-11-16');
    const days = machineMinutesByDay(
        [
            { StartTime: local('2026-11-16T23:00'), StopTime: local('2026-11-17T01:00') },
            { StartTime: local('2026-11-20T10:00'), StopTime: local('2026-11-20T10:45') },
        ],
        week,
    );
    expect(days).toEqual([60, 60, 0, 0, 45, 0, 0]);
    expect(machineMinutesByDay(null, week)).toEqual([0, 0, 0, 0, 0, 0, 0]);
});
