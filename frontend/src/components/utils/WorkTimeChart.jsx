import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { chartTooltip, formatMinutes, useChartColors } from '../ui';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const weekdays = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

// the rows / bars of a week chart: the weekday and its date ("Po 16. 11."); week: its Monday (dayjs)
const shortWeekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
export const weekLabels = (week) => shortWeekdays.map((day, index) => `${day} ${week.add(index, 'day').format('D. M.')}`);

// Worked time as bars, e.g. per day of the week. minutes: one value per label, in minutes; shown as hours and minutes
// (the axis and the tooltips). titles: optional tooltip titles per bar (default: the label)
export const WorkTimeChart = ({ minutes, labels = weekdays, titles }) => {
    const colors = useChartColors();

    const options = {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: colors.text },
            },
            y: {
                beginAtZero: true,
                // the bars are in hours, the labels say "1 h 30 min" instead of 1.5
                ticks: { color: colors.text, callback: (value) => formatMinutes(value * 60) },
                grid: { color: colors.grid },
                border: { display: false },
            },
        },
        plugins: {
            // one series: no legend (another chart may have registered the Legend plugin)
            legend: { display: false },
            tooltip: {
                ...chartTooltip(colors),
                callbacks: {
                    title: (items) => (titles ? titles[items[0].dataIndex] : items[0].label),
                    label: (context) => formatMinutes(minutes[context.dataIndex]),
                },
            },
        },
        elements: { bar: { borderWidth: 2 } },
    };
    const data = {
        labels,
        datasets: [
            {
                data: (minutes ?? []).map((value) => value / 60),
                borderColor: colors.workTime.border,
                backgroundColor: colors.workTime.background,
            },
        ],
    };

    return <Bar options={options} data={data} />;
};
