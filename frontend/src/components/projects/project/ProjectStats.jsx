import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAtom } from 'jotai';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';
import { PlannedActualChart } from '../../utils/PlannedActualChart';
import {
    StyledStatTile,
    StyledStatus,
    StyledTable,
    StyledTableCell,
    StyledTableRow,
    formatMinutes,
    taskStatus,
    useChartColors,
    useStatusColors,
} from '../../ui';

const percent = (actual, planned) => (planned > 0 ? Math.round((actual / planned) * 100) : null);

// actual - planned, signed, red when over the plan
const Difference = ({ planned, actual }) => {
    const difference = actual - planned;
    if (!planned && !actual) return '–';
    return (
        <Typography component='span' variant='inherit' sx={{ color: difference > 0 ? 'error.main' : 'text.secondary', fontWeight: difference > 0 ? 600 : 400 }}>
            {difference > 0 ? '+' : ''}
            {formatMinutes(difference)}
        </Typography>
    );
};

const Usage = ({ planned, actual }) => {
    const value = percent(actual, planned);
    if (value === null) return '–';
    return (
        <Typography component='span' variant='inherit' sx={{ color: value > 100 ? 'error.main' : 'text.primary', fontWeight: 600 }}>
            {value} %
        </Typography>
    );
};

const Section = ({ title, caption, children }) => (
    <div className='content-box' style={{ height: 'auto', flexBasis: 'auto', flexGrow: 0 }}>
        <div className='content-box_content' style={{ overflow: 'visible' }}>
            <div>
                <h2 style={{ margin: 0 }}>{title}</h2>
                {caption ? (
                    <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {caption}
                    </Typography>
                ) : null}
            </div>
            {children}
        </div>
    </div>
);

// The project's statistics (useProjectStats loads them, also for the task list): planned time (the tasks' estimates) against the time the workers logged on its tasks,
// for the whole project, per worker and per task
export const useProjectStats = () => {
    const projectID = useParams().project;
    const [stats, setStats] = useState(null);
    const [tick] = useAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${projectID}/stats`), getAuthHeader())
            .then((response) => setStats(response.data))
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectID, tick]);

    return stats;
};

export const ProjectStats = () => {
    const projectID = useParams().project;
    const navigate = useNavigate();
    const stats = useProjectStats();
    const statusColors = useStatusColors();
    const chartColors = useChartColors();

    const summary = useMemo(() => {
        if (!stats) return null;
        const statuses = stats.Tasks.map(taskStatus);
        const assignedPlan = stats.Workers.reduce((sum, worker) => sum + worker.PlannedMinutes, 0);
        return {
            finished: statuses.filter((status) => status === 'finished').length,
            inProgress: statuses.filter((status) => status === 'inProgress').length,
            unassigned: Math.max(0, stats.PlannedMinutes - assignedPlan),
            withoutEstimate: stats.Tasks.filter((task) => !task.PlannedMinutes).length,
        };
    }, [stats]);

    if (!stats) return null;

    const usage = percent(stats.ActualMinutes, stats.PlannedMinutes);
    const remaining = stats.PlannedMinutes - stats.ActualMinutes;
    const workerName = (user) => `${user.FirstName} ${user.LastName}`;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '75rem', mx: 'auto' }}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))' }}>
                <StyledStatTile
                    label='Plánovaný čas'
                    value={formatMinutes(stats.PlannedMinutes)}
                    accent={chartColors.plannedTime}
                    caption={summary.withoutEstimate ? `${summary.withoutEstimate} úkolů bez odhadu` : 'součet odhadů úkolů'}
                />
                <StyledStatTile
                    label='Odpracovaný čas'
                    value={formatMinutes(stats.ActualMinutes)}
                    accent={chartColors.actualTime}
                    caption={`${stats.Workers.filter((worker) => worker.ActualMinutes > 0).length} pracovníků zapsalo čas`}
                />
                <StyledStatTile
                    label='Čerpání plánu'
                    value={usage === null ? '–' : `${usage} %`}
                    tone={usage > 100 ? 'error' : undefined}
                    caption={
                        stats.PlannedMinutes
                            ? remaining >= 0
                                ? `zbývá ${formatMinutes(remaining)}`
                                : `překročeno o ${formatMinutes(-remaining)}`
                            : 'bez odhadu'
                    }
                />
                <StyledStatTile
                    label='Dokončené úkoly'
                    value={`${summary.finished} / ${stats.Tasks.length}`}
                    accent={statusColors.finished}
                    caption={`${summary.inProgress} rozpracováno`}
                />
            </Box>

            <Section
                title='Pracovníci'
                caption={`Plán úkolu se dělí rovným dílem mezi přiřazené pracovníky.${
                    summary.unassigned ? ` Nepřiřazeno: ${formatMinutes(summary.unassigned)}.` : ''
                }`}
            >
                {stats.Workers.length === 0 ? (
                    <Typography sx={{ color: 'text.secondary' }}>Na projektu zatím nikdo nepracuje.</Typography>
                ) : (
                    <>
                        <Box sx={{ position: 'relative', height: `calc(${Math.max(stats.Workers.length, 2) * 3}rem + 4rem)` }}>
                            <PlannedActualChart
                                rows={stats.Workers.map((worker) => ({
                                    label: workerName(worker.User),
                                    planned: worker.PlannedMinutes,
                                    actual: worker.ActualMinutes,
                                }))}
                            />
                        </Box>
                        <StyledTable
                            columns={[
                                { label: 'Pracovník' },
                                { label: 'Úkoly', align: 'right' },
                                { label: 'Plánováno', align: 'right' },
                                { label: 'Odpracováno', align: 'right' },
                                { label: 'Rozdíl', align: 'right' },
                                { label: 'Čerpání', align: 'right' },
                            ]}
                        >
                            {stats.Workers.map((worker) => (
                                <StyledTableRow key={worker.User.ID} disabled={!worker.User.Enabled}>
                                    <StyledTableCell>{workerName(worker.User)}</StyledTableCell>
                                    <StyledTableCell align='right'>{worker.TaskCount}</StyledTableCell>
                                    <StyledTableCell align='right'>{formatMinutes(worker.PlannedMinutes)}</StyledTableCell>
                                    <StyledTableCell align='right'>{formatMinutes(worker.ActualMinutes)}</StyledTableCell>
                                    <StyledTableCell align='right'>
                                        <Difference planned={worker.PlannedMinutes} actual={worker.ActualMinutes} />
                                    </StyledTableCell>
                                    <StyledTableCell align='right'>
                                        <Usage planned={worker.PlannedMinutes} actual={worker.ActualMinutes} />
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))}
                        </StyledTable>
                    </>
                )}
            </Section>

            <Section title='Úkoly'>
                <StyledTable
                    columns={[
                        { label: 'Úkol' },
                        { label: 'Plánováno', align: 'right' },
                        { label: 'Odpracováno', align: 'right' },
                        { label: 'Rozdíl', align: 'right' },
                        { label: 'Čerpání', align: 'right' },
                    ]}
                >
                    {stats.Tasks.map((task) => {
                        const status = taskStatus(task);
                        return (
                            <StyledTableRow key={task.ID} status={status} onClick={() => navigate(`/auth/projects/${projectID}/${task.ID}`)}>
                                <StyledTableCell>
                                    <StyledStatus status={status}>{task.Name}</StyledStatus>
                                </StyledTableCell>
                                <StyledTableCell align='right'>{task.PlannedMinutes ? formatMinutes(task.PlannedMinutes) : '–'}</StyledTableCell>
                                <StyledTableCell align='right'>{formatMinutes(task.ActualMinutes)}</StyledTableCell>
                                <StyledTableCell align='right'>
                                    <Difference planned={task.PlannedMinutes} actual={task.ActualMinutes} />
                                </StyledTableCell>
                                <StyledTableCell align='right'>
                                    <Usage planned={task.PlannedMinutes} actual={task.ActualMinutes} />
                                </StyledTableCell>
                            </StyledTableRow>
                        );
                    })}
                </StyledTable>
            </Section>
        </Box>
    );
};
