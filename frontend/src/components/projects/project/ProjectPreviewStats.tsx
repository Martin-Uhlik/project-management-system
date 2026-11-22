import { useMemo } from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import dayjs from '../../../dayjs';
import { useApi } from '../../../state/query';
import { formatMinutes, taskStatus, timeUsage, useChartColors, useStatusColors } from '../../ui';
import type { ReactNode } from 'react';
import type { Project, ProjectFileEntry, ProjectStatsData } from '../../../types';
import type { TaskStatus } from '../../ui/taskStatus';

// One number of the preview: a quiet label, the value, a line under it and optionally a bar (value 0-100) in a colour
const Stat = ({
    label,
    value,
    caption,
    bar,
    barColor,
    tone,
}: {
    label: string;
    value: ReactNode;
    caption?: ReactNode;
    bar?: number | null;
    barColor?: string;
    tone?: 'error';
}) => (
    <Box sx={{ p: 1.5, minWidth: 0, border: '1px solid', borderColor: 'divider', backgroundColor: 'var(--content-box-background)' }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.4, color: tone ? `${tone}.main` : 'text.primary' }}>{value}</Typography>
        {bar != null ? (
            <LinearProgress
                variant='determinate'
                value={Math.min(100, bar)}
                aria-hidden
                sx={{ my: 0.75, height: 6, borderRadius: 0, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: barColor } }}
            />
        ) : null}
        {caption ? (
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                {caption}
            </Typography>
        ) : null}
    </Box>
);

const plural = (count: number, one: string, few: string, many: string) => `${count} ${count === 1 ? one : count >= 2 && count <= 4 ? few : many}`;

// Headline numbers of a project in the Projekty preview: tasks done out of all, planned against worked time, the
// deadline, overdue tasks, workers and files (from the project's stats and files endpoints)
export const ProjectPreviewStats = ({ project }: { project: Pick<Project, 'ID' | 'FinishDate' | 'Finished'> }) => {
    const topics = [`project:${project.ID}`];
    const stats = useApi<ProjectStatsData>(`/auth/projects/${project.ID}/stats`, { topics, quiet: true }).data ?? null;
    const files = useApi<ProjectFileEntry[]>(`/auth/projects/${project.ID}/files`, { topics, quiet: true }).data ?? null;
    const statusColors = useStatusColors();
    const chartColors = useChartColors();

    const summary = useMemo(() => {
        if (!stats) return null;
        const statuses = stats.Tasks.map(taskStatus);
        const count = (status: TaskStatus) => statuses.filter((item) => item === status).length;
        const now = dayjs();
        return {
            total: stats.Tasks.length,
            finished: count('finished'),
            inProgress: count('inProgress'),
            blocked: count('blocked'),
            overdue: stats.Tasks.filter((task) => !task.Finished && dayjs(task.FinishDate).isBefore(now)).length,
            workers: stats.Workers.length,
            loggedWorkers: stats.Workers.filter((worker) => worker.ActualMinutes > 0).length,
        };
    }, [stats]);

    if (!stats || !summary) return null;

    const usage = timeUsage(stats.ActualMinutes, stats.PlannedMinutes);
    const remaining = stats.PlannedMinutes - stats.ActualMinutes;
    const deadline = project.FinishDate ? dayjs(project.FinishDate) : null;
    const daysLeft = deadline ? deadline.startOf('day').diff(dayjs().startOf('day'), 'day') : null;
    const inputFiles = files?.filter((file) => file.Kind === 'input').length ?? 0;

    return (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))' }}>
            <Stat
                label='Dokončené úkoly'
                value={summary.total ? `${summary.finished} / ${summary.total}` : '–'}
                bar={summary.total ? (summary.finished / summary.total) * 100 : null}
                barColor={statusColors.finished}
                caption={
                    summary.total
                        ? [
                              `${Math.round((summary.finished / summary.total) * 100)} %`,
                              summary.inProgress ? `${summary.inProgress} rozpracováno` : null,
                              summary.blocked ? `${summary.blocked} zamčeno` : null,
                          ]
                              .filter(Boolean)
                              .join(' · ')
                        : 'projekt nemá úkoly'
                }
            />
            <Stat
                label='Odpracováno / plán'
                value={`${formatMinutes(stats.ActualMinutes)} / ${stats.PlannedMinutes ? formatMinutes(stats.PlannedMinutes) : '–'}`}
                bar={usage}
                barColor={usage !== null && usage > 100 ? 'var(--mui-palette-error-main)' : chartColors.actualTime}
                tone={usage !== null && usage > 100 ? 'error' : undefined}
                caption={
                    usage === null
                        ? 'úkoly nemají odhad času'
                        : remaining >= 0
                          ? `${usage} % plánu, zbývá ${formatMinutes(remaining)}`
                          : `${usage} % plánu, překročeno o ${formatMinutes(-remaining)}`
                }
            />
            <Stat
                label='Termín'
                value={
                    project.Finished
                        ? 'Dokončen'
                        : daysLeft === null
                          ? '–'
                          : daysLeft >= 0
                            ? plural(daysLeft, 'den', 'dny', 'dní')
                            : `${plural(-daysLeft, 'den', 'dny', 'dní')} po`
                }
                tone={!project.Finished && daysLeft !== null && daysLeft < 0 ? 'error' : undefined}
                caption={
                    project.Finished
                        ? deadline?.format('LL')
                        : daysLeft === null
                          ? null
                          : daysLeft >= 0
                            ? `zbývá do ${deadline!.format('LL')}`
                            : `termín byl ${deadline!.format('LL')}`
                }
            />
            <Stat
                label='Úkoly po termínu'
                value={summary.overdue}
                tone={summary.overdue ? 'error' : undefined}
                caption={summary.overdue ? 'nedokončené s prošlým termínem' : 'vše v termínu'}
            />
            <Stat label='Pracovníci' value={summary.workers} caption={summary.workers ? `${summary.loggedWorkers} zapsalo čas` : 'nikdo není přiřazen'} />
            <Stat
                label='Soubory'
                value={files ? files.length : '–'}
                caption={files ? `${inputFiles} vstupních · ${files.length - inputFiles} výstupních` : null}
            />
        </Box>
    );
};
