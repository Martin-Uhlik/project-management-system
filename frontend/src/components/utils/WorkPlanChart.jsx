import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useNavigate } from 'react-router';
import dayjs from '../../dayjs';
import { chartTooltip, useChartColors } from '../ui';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const taskAddress = (task) => `/auth/projects/${task.ProjectID}/${task.ID}`;

const formatDuration = (task) => {
    const parts = [];
    if (task.DurationHours) parts.push(`${task.DurationHours} h`);
    if (task.DurationMinutes) parts.push(`${task.DurationMinutes} min`);
    return parts.join(' ') || '0 min';
};

// This week's tasks as floating bars (one row per weekday, start to finish hour); hovering a bar shows the task's details,
// clicking it opens the task
export const WorkPlanChart = (props) => {
    const colors = useChartColors();
    const navigate = useNavigate();

    const currentWeekTasks = props.tasks?.filter(
        (task) => dayjs(task.FinishDate).isAfter(dayjs().startOf('isoWeek')) && dayjs(task.FinishDate).isBefore(dayjs().endOf('isoWeek')),
    );
    const datasets = (currentWeekTasks || []).map((task) => {
        const data = [null, null, null, null, null, null, null];
        const finishDate = dayjs(task.FinishDate);
        const hour = finishDate.diff(finishDate.startOf('day'), 'hour', true);
        data[finishDate.isoWeekday() - 1] = [hour - task.DurationHours - task.DurationMinutes / 60, hour];
        // the task travels with its bar, for the tooltip and the click
        return { data, task };
    });

    const taskAt = (item) => item && datasets[item.datasetIndex]?.task;

    const options = {
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: { color: colors.text },
                stacked: false,
                min: 0,
                max: 24,
            },
            y: {
                stacked: true,
                ticks: { color: colors.text },
                grid: { color: colors.grid },
            },
        },
        indexAxis: 'y',
        elements: {
            bar: {
                borderWidth: 2,
            },
        },
        responsive: true,
        animation: {
            duration: 0,
        },
        borderSkipped: false,
        borderColor: colors.workPlan.border,
        backgroundColor: colors.workPlan.background,
        hoverBackgroundColor: colors.workPlan.hover,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
            tooltip: {
                ...chartTooltip(colors),
                callbacks: {
                    title: (items) => taskAt(items[0])?.Name ?? '',
                    label: (item) => {
                        const task = taskAt(item);
                        if (!task) return '';
                        const finish = dayjs(task.FinishDate);
                        const start = finish.subtract(task.DurationHours, 'hour').subtract(task.DurationMinutes, 'minute');
                        return [
                            task.Project?.Name && `Projekt: ${task.Project.Name}`,
                            `Čas: ${start.format('dd D. M. HH:mm')} – ${finish.format('HH:mm')}`,
                            `Délka: ${formatDuration(task)}`,
                            `Stav: ${task.Finished ? 'Dokončeno' : 'Nedokončeno'}`,
                        ].filter(Boolean);
                    },
                    footer: () => 'Kliknutím otevřete úkol',
                },
                footerColor: colors.text,
                footerFont: { size: 12, weight: 'normal', style: 'italic' },
                footerMarginTop: 8,
            },
        },
        // a hand cursor over a bar shows it can be clicked
        onHover: (event, elements) => {
            event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
        },
        onClick: (event, elements) => {
            const task = taskAt(elements[0]);
            if (task) navigate(taskAddress(task));
        },
    };

    const data = {
        labels: ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'],
        datasets,
    };

    return <Bar options={options} data={data} />;
};
