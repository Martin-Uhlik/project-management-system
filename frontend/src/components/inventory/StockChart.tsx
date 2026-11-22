import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import dayjs from '../../dayjs';
import { chartTooltip, useChartColors } from '../ui';
import { formatAmount } from './format';
import type { ChartOptions } from 'chart.js';
import type { MaterialEvent } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// The stock after each movement, oldest first: in stock and available (in stock minus the open reservations; taking
// items out for a task uses up its reservation, giving it back releases it)
export const stockHistory = (events: MaterialEvent[]) => {
    let count = 0;
    const tasks = new Map<number, { reserved: number; used: number }>();
    return [...events].reverse().map((event) => {
        const key = event.TargetTaskID ?? 0;
        const task = tasks.get(key) ?? { reserved: 0, used: 0 };
        if (event.EventType === 'ADD') count += event.Count;
        if (event.EventType === 'REMOVE') {
            count -= event.Count;
            task.used += event.Count;
        }
        if (event.EventType === 'RESERVATION') task.reserved += event.Count;
        if (event.EventType === 'RELEASE') task.used += event.Count;
        tasks.set(key, task);
        const reserved = [...tasks.values()].reduce((total, item) => total + Math.max(0, item.reserved - item.used), 0);
        return { at: dayjs(event.CreatedAt), count, available: count - reserved };
    });
};

// How the stock of an item went over time, a step after each movement; the item's minimum as a dashed line
export const StockChart = ({ material }: { material: { Events: MaterialEvent[]; MinCount: number; Unit: string } }) => {
    const colors = useChartColors();
    const points = stockHistory(material.Events);
    const unit = material.Unit;
    const data = {
        labels: points.map((point) => point.at.format('D. M.')),
        datasets: [
            {
                label: 'Na skladě',
                data: points.map((point) => point.count),
                borderColor: colors.plannedTime,
                backgroundColor: colors.plannedTime,
                stepped: true,
            },
            {
                label: 'Dostupné',
                data: points.map((point) => point.available),
                borderColor: colors.actualTime,
                backgroundColor: colors.actualTime,
                stepped: true,
            },
            ...(material.MinCount
                ? [
                      {
                          label: 'Minimum',
                          data: points.map(() => material.MinCount),
                          borderColor: colors.text,
                          borderDash: [6, 4],
                          pointRadius: 0,
                          borderWidth: 1,
                      },
                  ]
                : []),
        ],
    };
    const options: ChartOptions<'line'> = {
        maintainAspectRatio: false,
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { grid: { display: false }, ticks: { color: colors.text } },
            y: { beginAtZero: true, ticks: { color: colors.text, precision: 0 }, grid: { color: colors.grid }, border: { display: false } },
        },
        plugins: {
            legend: { display: true, labels: { color: colors.text, boxWidth: 12 } },
            tooltip: {
                ...chartTooltip(colors),
                callbacks: {
                    title: (items) => points[items[0].dataIndex].at.format('L LT'),
                    label: (context) => `${context.dataset.label}: ${formatAmount(context.parsed.y, unit)}`,
                },
            },
        },
    };
    return <Line options={options} data={data} />;
};
