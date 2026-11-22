import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useApi } from '../../../state/query';
import { PlannedActualChart } from '../../utils/PlannedActualChart';
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
} from '../../ui';

// The project's statistics (useProjectStats loads them, also for the task list): planned time (the tasks' estimates) against the time the workers logged on its tasks,
// for the whole project, per worker and per task
export const useProjectStats = (id) => {
    const routeProjectID = useParams().project;
    const projectID = id ?? routeProjectID;
    // reloaded when someone changes this data (live updates) or after a change made here
    return useApi(`/auth/projects/${projectID}/stats`, { topics: [`project:${projectID}`] }).data ?? null;
};

// projectID: the project to show (the one in the address by default)
export const ProjectStats = ({ projectID: id }) => {
    const routeProjectID = useParams().project;
    const projectID = id ?? routeProjectID;
    const navigate = useNavigate();
    const stats = useProjectStats(projectID);
    const statusColors = useStatusColors();
    const chartColors = useChartColors();

    const summary = useMemo(() => {
        if (!stats) return null;
        const statuses = stats.Tasks.map(taskStatus);
        const assignedPlan = stats.Workers.reduce((sum, worker) => sum + worker.PlannedMinutes, 0);
        return {
            finished: statuses.filter((status) => status === 'finished').length,
            inProgress: statuses.filter((status) => status === 'inProgress').length,
            blocked: statuses.filter((status) => status === 'blocked').length,
            unassigned: Math.max(0, stats.PlannedMinutes - assignedPlan),
            withoutEstimate: stats.Tasks.filter((task) => !task.PlannedMinutes).length,
        };
    }, [stats]);

    if (!stats) return null;

    const usage = timeUsage(stats.ActualMinutes, stats.PlannedMinutes);
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
                    caption={`${summary.inProgress} rozpracováno, ${summary.blocked} čeká na předchozí`}
                />
            </Box>

            <StyledSection
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
                                        <StyledTimeDifference planned={worker.PlannedMinutes} actual={worker.ActualMinutes} />
                                    </StyledTableCell>
                                    <StyledTableCell align='right'>
                                        <StyledTimeUsage planned={worker.PlannedMinutes} actual={worker.ActualMinutes} />
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))}
                        </StyledTable>
                    </>
                )}
            </StyledSection>

            <StyledSection title='Úkoly'>
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
                                    <StyledTimeDifference planned={task.PlannedMinutes} actual={task.ActualMinutes} />
                                </StyledTableCell>
                                <StyledTableCell align='right'>
                                    <StyledTimeUsage planned={task.PlannedMinutes} actual={task.ActualMinutes} />
                                </StyledTableCell>
                            </StyledTableRow>
                        );
                    })}
                </StyledTable>
            </StyledSection>
        </Box>
    );
};
