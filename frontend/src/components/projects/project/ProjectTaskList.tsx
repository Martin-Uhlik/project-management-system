import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import Typography from '@mui/material/Typography';
import dayjs from '../../../dayjs';
import { useProjectStats } from './ProjectStats';
import { StyledStatus, StyledTable, StyledTableCell, StyledTableRow, formatMinutes, taskStatus, useSearch } from '../../ui';
import type { PublicUser } from '../../../types';

const workerNames = (task: { Workers: PublicUser[] }) => task.Workers.map((worker) => `${worker.FirstName} ${worker.LastName}`).join(', ');

// The project's tasks as a list (the other view of the task graph): status, deadline, workers and time, sorted by
// deadline; a row opens the task
export const ProjectTaskList = () => {
    const projectID = useParams().project;
    const navigate = useNavigate();
    const stats = useProjectStats();
    const tasks = useMemo(() => [...(stats?.Tasks ?? [])].sort((a, b) => dayjs(a.FinishDate).diff(dayjs(b.FinishDate))), [stats]);
    const search = useSearch(tasks, (task) => [task.Name, workerNames(task), dayjs(task.FinishDate).format('L')]);

    if (!stats) return null;

    return (
        <div className='content-box' style={{ height: 'auto', flexBasis: 'auto', flexGrow: 0, maxWidth: '75rem', margin: '0 auto' }}>
            <div className='content-box_content' style={{ overflow: 'visible' }}>
                <StyledTable
                    search={search}
                    columns={[
                        { label: 'Úkol' },
                        { label: 'Termín' },
                        { label: 'Pracovníci' },
                        { label: 'Plánováno', align: 'right' },
                        { label: 'Odpracováno', align: 'right' },
                    ]}
                >
                    {search.results.map((task) => {
                        const status = taskStatus(task);
                        const deadline = dayjs(task.FinishDate);
                        const overdue = status !== 'finished' && deadline.isBefore(dayjs());
                        const over = task.PlannedMinutes > 0 && task.ActualMinutes > task.PlannedMinutes;
                        return (
                            <StyledTableRow key={task.ID} status={status} onClick={() => navigate(`/auth/projects/${projectID}/${task.ID}`)}>
                                <StyledTableCell>
                                    <StyledStatus status={status}>{task.Name}</StyledStatus>
                                </StyledTableCell>
                                <StyledTableCell sx={overdue ? { color: 'error.main', fontWeight: 600 } : undefined}>{deadline.format('L')}</StyledTableCell>
                                <StyledTableCell>
                                    {task.Workers.length ? (
                                        workerNames(task)
                                    ) : (
                                        <Typography component='span' variant='inherit' sx={{ color: 'text.secondary' }}>
                                            nepřiřazeno
                                        </Typography>
                                    )}
                                </StyledTableCell>
                                <StyledTableCell align='right'>{task.PlannedMinutes ? formatMinutes(task.PlannedMinutes) : '–'}</StyledTableCell>
                                <StyledTableCell align='right' sx={over ? { color: 'error.main', fontWeight: 600 } : undefined}>
                                    {formatMinutes(task.ActualMinutes)}
                                </StyledTableCell>
                            </StyledTableRow>
                        );
                    })}
                </StyledTable>
                {tasks.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Projekt zatím nemá žádné úkoly.</Typography> : null}
            </div>
        </div>
    );
};
