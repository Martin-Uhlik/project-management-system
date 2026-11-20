import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import axios from 'axios';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { notificationsAtom, selectedTabAtom, userAtom } from '../../state/atoms';
import { useLive } from '../../state/live';
import { getBackendAddress } from '../../config';
import { getAuthHeader, getUserID } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { WorkTimeChart } from '../utils/WorkTimeChart';
import { PlannedActualChart } from '../utils/PlannedActualChart';
import {
    StyledMonthPicker,
    StyledSection,
    StyledSelect,
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

const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : '');

// Czech plural: 1 den, 2–4 dny, 5 dní
const plural = (count, one, few, many) => `${count} ${count === 1 ? one : count >= 2 && count <= 4 ? few : many}`;

// Minutes worked on each day of the month (local time; a period over midnight counts on both days)
const minutesByDay = (workTime, month) => {
    const days = Array(month.daysInMonth()).fill(0);
    for (const period of workTime ?? []) {
        let start = dayjs(period.StartTime);
        const stop = dayjs(period.StopTime);
        while (start.isBefore(stop)) {
            const dayEnd = start.add(1, 'day').startOf('day');
            const end = stop.isBefore(dayEnd) ? stop : dayEnd;
            if (start.isSame(month, 'month')) days[start.date() - 1] += end.diff(start, 'minute', true);
            start = end;
        }
    }
    return days;
};

// Worked time, the tasks worked on and planned against actual time for one month: your own, and for a manager also the
// people under them, for an admin everyone's (the backend decides who sees whom). ?month=2026-11&user=12 in the address.
export const Stats = () => {
    const setTab = useSetAtom(selectedTabAtom);
    useEffect(() => {
        setTab('Statistiky');
    });

    const navigate = useNavigate();
    const me = useAtomValue(userAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive('users', 'user:*');
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const chartColors = useChartColors();
    const statusColors = useStatusColors();

    const [searchParams, setSearchParams] = useSearchParams();
    const monthKey =
        /^\d{4}-\d{2}$/.test(searchParams.get('month') ?? '') && searchParams.get('month') <= dayjs().format('YYYY-MM')
            ? searchParams.get('month')
            : dayjs().format('YYYY-MM');
    const month = useMemo(() => dayjs(`${monthKey}-01`).startOf('month'), [monthKey]);
    const userID = Number(searchParams.get('user')) || Number(getUserID());
    const update = (changes) => {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) next.set(key, value);
        setSearchParams(next, { replace: true });
    };

    const from = month.toISOString();
    const to = month.add(1, 'month').toISOString();
    const [people, setPeople] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        axios
            .get(getBackendAddress('/auth/stats/people'), { ...getAuthHeader(), params: { from, to } })
            .then((response) => setPeople(response.data))
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, tick]);

    useEffect(() => {
        if (!userID) return;
        axios
            .get(getBackendAddress(`/auth/stats/users/${userID}`), { ...getAuthHeader(), params: { from, to } })
            .then((response) => setStats(response.data))
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, userID, tick]);

    const shown = stats?.User.ID === userID ? stats : null;
    const days = useMemo(() => minutesByDay(shown?.WorkTime, month), [shown, month]);
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

    const isMe = userID === Number(getUserID());
    const usage = summary ? timeUsage(summary.actualMinutes, summary.plannedMinutes) : null;
    const showTeam = people && people.length > 1;

    return (
        <div className='content-wrap_inner'>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '75rem', width: '100%', mx: 'auto' }}>
                <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                        <h1 style={{ margin: 0 }}>{isMe ? 'Moje statistiky' : `Statistiky: ${fullName(shown?.User)}`}</h1>
                        {!isMe && shown?.User.Position ? (
                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                {shown.User.Position}
                            </Typography>
                        ) : null}
                    </Box>
                    <Stack direction='row' sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {showTeam ? (
                            <StyledSelect
                                id='statsUser'
                                label='Pracovník'
                                size='small'
                                fullWidth={false}
                                sx={{ minWidth: '14rem' }}
                                value={people.some((person) => person.User.ID === userID) ? userID : ''}
                                onChange={(event) => update({ user: event.target.value })}
                                options={people.map((person) => ({
                                    value: person.User.ID,
                                    label: person.User.ID === me?.ID ? `${fullName(person.User)} (já)` : fullName(person.User),
                                }))}
                            />
                        ) : null}
                        <StyledMonthPicker value={month} onChange={(value) => update({ month: value.format('YYYY-MM') })} />
                    </Stack>
                </Stack>

                {summary ? (
                    <>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))' }}>
                            <StyledStatTile
                                label='Odpracovaný čas'
                                value={formatMinutes(shown.WorkedMinutes)}
                                accent={chartColors.actualTime}
                                caption={summary.daysWorked ? `${plural(summary.daysWorked, 'den', 'dny', 'dní')} s prací` : 'v tomto měsíci nic'}
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
                                label='Úkoly v tomto měsíci'
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
                                    labels={days.map((_, index) => index + 1)}
                                    titles={days.map((_, index) => month.date(index + 1).format('dddd D. M.'))}
                                />
                            </Box>
                        </StyledSection>

                        <StyledSection
                            title='Úkoly v tomto měsíci'
                            caption='Úkoly, na kterých pracovník v tomto měsíci zapsal čas. Plán je jeho díl z odhadu úkolu (odhad se dělí rovným dílem mezi přiřazené pracovníky), skutečnost je všechen jeho čas na úkolu.'
                        >
                            {shown.Tasks.length === 0 ? (
                                <Typography sx={{ color: 'text.secondary' }}>V tomto měsíci žádný zapsaný čas na úkolech.</Typography>
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
                                            { label: 'Tento měsíc', align: 'right' },
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

                {showTeam ? (
                    <StyledSection
                        title={me?.UserType === 'ADMIN' ? 'Všichni pracovníci' : 'Moji lidé'}
                        caption='Souhrn za vybraný měsíc. Kliknutím zobrazíte statistiky pracovníka.'
                    >
                        <StyledTable
                            columns={[
                                { label: 'Pracovník' },
                                { label: 'Vedoucí' },
                                { label: 'Odpracováno', align: 'right' },
                                { label: 'Úkoly', align: 'right' },
                                { label: 'Plánováno', align: 'right' },
                                { label: 'Skutečnost', align: 'right' },
                                { label: 'Čerpání', align: 'right' },
                            ]}
                        >
                            {people.map((person) => (
                                <StyledTableRow
                                    key={person.User.ID}
                                    selected={person.User.ID === userID}
                                    disabled={!person.User.Enabled}
                                    onClick={() => {
                                        update({ user: person.User.ID });
                                        document.querySelector('.content-wrap_inner')?.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    <StyledTableCell>{fullName(person.User)}</StyledTableCell>
                                    <StyledTableCell>{fullName(person.User.Manager)}</StyledTableCell>
                                    <StyledTableCell align='right'>{formatMinutes(person.WorkedMinutes)}</StyledTableCell>
                                    <StyledTableCell align='right'>
                                        {person.FinishedCount} / {person.TaskCount}
                                    </StyledTableCell>
                                    <StyledTableCell align='right'>{person.PlannedMinutes ? formatMinutes(person.PlannedMinutes) : '–'}</StyledTableCell>
                                    <StyledTableCell align='right'>{person.PlannedMinutes ? formatMinutes(person.ActualMinutes) : '–'}</StyledTableCell>
                                    <StyledTableCell align='right'>
                                        <StyledTimeUsage planned={person.PlannedMinutes} actual={person.ActualMinutes} />
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))}
                        </StyledTable>
                    </StyledSection>
                ) : null}
            </Box>
        </div>
    );
};
