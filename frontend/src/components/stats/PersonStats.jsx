import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useApi } from '../../state/query';
import dayjs from '../../dayjs';
import { WorkTimeChart } from '../utils/WorkTimeChart';
import { PlannedActualChart } from '../utils/PlannedActualChart';
import {
    StyledSection,
    StyledStatTile,
    StyledStatus,
    StyledTable,
    StyledTableCell,
    StyledTableRow,
    StyledTimeDifference,
    StyledTimeUsage,
    formatMinutes,
    taskStatus,
    timeUsage,
    useChartColors,
    useStatusColors,
} from '../ui';

export const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : '');

// Czech plural: 1 den, 2–4 dny, 5 dní
export const plural = (count, one, few, many) => `${count} ${count === 1 ? one : count >= 2 && count <= 4 ? few : many}`;

// A stretch of time the statistics cover: a week (from its Monday) or a calendar month (from its first day).
// start/end: dayjs (end exclusive); unit: 'week' or 'month'; the words for it in the texts ("v tomto týdnu")
export const statsPeriod = (unit, start) => {
    const end = start.add(1, unit === 'week' ? 'week' : 'month');
    return { unit, start, end, days: end.diff(start, 'day'), inThis: unit === 'week' ? 'v tomto týdnu' : 'v tomto měsíci' };
};

// Minutes worked on each day of the period (local time; a period over midnight counts on both days)
const minutesByDay = (workTime, period) => {
    const days = Array(period.days).fill(0);
    for (const worked of workTime ?? []) {
        let start = dayjs(worked.StartTime);
        const stop = dayjs(worked.StopTime);
        while (start.isBefore(stop)) {
            const dayEnd = start.add(1, 'day').startOf('day');
            const end = stop.isBefore(dayEnd) ? stop : dayEnd;
            const index = start.startOf('day').diff(period.start, 'day');
            if (index >= 0 && index < days.length) days[index] += end.diff(start, 'minute', true);
            start = end;
        }
    }
    return days;
};

// One worker's week or month (userID, period: see statsPeriod): worked time with a per-day chart, the tasks they logged
// time on and planned against actual time (the backend decides who may see whom)
export const PersonStats = ({ userID, period }) => {
    const navigate = useNavigate();
    const chartColors = useChartColors();
    const statusColors = useStatusColors();
    const from = period.start.toISOString();
    const to = period.end.toISOString();
    // reloaded when someone changes this data (live updates) or after a change made here
    const stats = useApi(`/auth/stats/users/${userID}`, { params: { from, to }, topics: ['users', 'user:*'], enabled: !!userID }).data;

    const shown = stats?.User.ID === userID ? stats : null;
    const days = useMemo(() => minutesByDay(shown?.WorkTime, period), [shown, period]);
    const summary = useMemo(() => {
        if (!shown) return null;
        const planned = shown.Tasks.filter((task) => task.PlannedMinutes !== null);
        return {
            taskMinutes: shown.Tasks.reduce((sum, task) => sum + task.PeriodMinutes, 0),
            finished: shown.Tasks.filter((task) => task.Finished).length,
            plannedMinutes: planned.reduce((sum, task) => sum + task.PlannedMinutes, 0),
            actualMinutes: planned.reduce((sum, task) => sum + task.TotalMinutes, 0),
            withPlan: planned,
            daysWorked: days.filter((minutes) => minutes > 0).length,
        };
    }, [shown, days]);
    const usage = summary ? timeUsage(summary.actualMinutes, summary.plannedMinutes) : null;

    return (
        <>
            {summary ? (
                <>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))' }}>
                        <StyledStatTile
                            label='Odpracovaný čas'
                            value={formatMinutes(shown.WorkedMinutes)}
                            accent={chartColors.actualTime}
                            caption={summary.daysWorked ? `${plural(summary.daysWorked, 'den', 'dny', 'dní')} s prací` : `${period.inThis} nic`}
                        />
                        <StyledStatTile
                            label='Čas na úkolech'
                            value={formatMinutes(summary.taskMinutes)}
                            caption={
                                shown.WorkedMinutes > 0
                                    ? `${Math.min(100, Math.round((summary.taskMinutes / shown.WorkedMinutes) * 100))} % odpracovaného času`
                                    : 'zapsáno k úkolům'
                            }
                        />
                        <StyledStatTile
                            label={`Úkoly ${period.inThis}`}
                            value={shown.Tasks.length}
                            accent={statusColors.finished}
                            caption={`${summary.finished} z nich dokončeno`}
                        />
                        <StyledStatTile
                            label='Skutečnost proti plánu'
                            value={usage === null ? '–' : `${usage} %`}
                            tone={usage > 100 ? 'error' : undefined}
                            accent={chartColors.plannedTime}
                            caption={
                                usage === null
                                    ? 'úkoly bez odhadu'
                                    : `${formatMinutes(summary.actualMinutes)} z plánovaných ${formatMinutes(summary.plannedMinutes)}`
                            }
                        />
                    </Box>

                    <StyledSection title='Odpracovaný čas po dnech'>
                        <Box sx={{ position: 'relative', height: '16rem' }}>
                            <WorkTimeChart
                                minutes={days}
                                labels={days.map((_, index) => (period.unit === 'week' ? period.start.add(index, 'day').format('dd D. M.') : index + 1))}
                                titles={days.map((_, index) => period.start.add(index, 'day').format('dddd D. M.'))}
                            />
                        </Box>
                    </StyledSection>

                    <StyledSection
                        title={`Úkoly ${period.inThis}`}
                        caption={`Úkoly, na kterých pracovník ${period.inThis} zapsal čas. Plán je jeho díl z odhadu úkolu (odhad se dělí rovným dílem mezi přiřazené pracovníky), skutečnost je všechen jeho čas na úkolu.`}
                    >
                        {shown.Tasks.length === 0 ? (
                            <Typography sx={{ color: 'text.secondary' }}>
                                {period.unit === 'week' ? 'V tomto týdnu' : 'V tomto měsíci'} žádný zapsaný čas na úkolech.
                            </Typography>
                        ) : (
                            <>
                                {summary.withPlan.length > 0 ? (
                                    <Box sx={{ position: 'relative', height: `calc(${Math.max(summary.withPlan.length, 2) * 3}rem + 4rem)` }}>
                                        <PlannedActualChart
                                            rows={summary.withPlan.map((task) => ({
                                                label: task.Name,
                                                planned: task.PlannedMinutes,
                                                actual: task.TotalMinutes,
                                            }))}
                                        />
                                    </Box>
                                ) : null}
                                <StyledTable
                                    columns={[
                                        { label: 'Úkol' },
                                        { label: 'Projekt' },
                                        { label: 'Plánováno', align: 'right' },
                                        { label: period.unit === 'week' ? 'Tento týden' : 'Tento měsíc', align: 'right' },
                                        { label: 'Celkem', align: 'right' },
                                        { label: 'Rozdíl', align: 'right' },
                                        { label: 'Čerpání', align: 'right' },
                                    ]}
                                >
                                    {shown.Tasks.map((task) => {
                                        const status = taskStatus(task);
                                        return (
                                            <StyledTableRow
                                                key={task.ID}
                                                status={status}
                                                onClick={() => navigate(`/auth/projects/${task.Project.ID}/${task.ID}`)}
                                            >
                                                <StyledTableCell>
                                                    <StyledStatus status={status}>{task.Name}</StyledStatus>
                                                </StyledTableCell>
                                                <StyledTableCell>{task.Project.Name}</StyledTableCell>
                                                <StyledTableCell align='right'>
                                                    {task.PlannedMinutes ? formatMinutes(task.PlannedMinutes) : '–'}
                                                </StyledTableCell>
                                                <StyledTableCell align='right'>{formatMinutes(task.PeriodMinutes)}</StyledTableCell>
                                                <StyledTableCell align='right'>{formatMinutes(task.TotalMinutes)}</StyledTableCell>
                                                <StyledTableCell align='right'>
                                                    {task.PlannedMinutes ? (
                                                        <StyledTimeDifference planned={task.PlannedMinutes} actual={task.TotalMinutes} />
                                                    ) : (
                                                        '–'
                                                    )}
                                                </StyledTableCell>
                                                <StyledTableCell align='right'>
                                                    <StyledTimeUsage planned={task.PlannedMinutes} actual={task.TotalMinutes} />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        );
                                    })}
                                </StyledTable>
                            </>
                        )}
                    </StyledSection>
                </>
            ) : null}
        </>
    );
};
