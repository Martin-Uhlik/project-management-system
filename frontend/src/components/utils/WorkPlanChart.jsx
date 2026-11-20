import { Bar } from 'react-chartjs-2';
import { useRef } from 'react';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import dayjs from '../../dayjs';
import { useChartColors } from '../ui';

export const WorkPlanChart = (props) => {
    const colors = useChartColors();

    ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

    const chartRef = useRef();

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
        events: [],
    };

    const currentWeekTasks = props.tasks?.filter(
        (task) => dayjs(task.FinishDate).isAfter(dayjs().startOf('isoWeek')) && dayjs(task.FinishDate).isBefore(dayjs().endOf('isoWeek')),
    );
    const dataset = currentWeekTasks?.map((task) => {
        const data = [null, null, null, null, null, null, null];
        const finishDate = dayjs(task.FinishDate);
        const startDay = finishDate.startOf('day');
        const hour = finishDate.diff(startDay, 'hour', true);
        data[finishDate.isoWeekday() - 1] = [hour - task.DurationHours - task.DurationMinutes / 60, hour];
        return { data: data };
    });

    const data = {
        labels: ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'],
        datasets: dataset || [],
    };

    return <Bar ref={chartRef} options={options} data={data} />;
};
