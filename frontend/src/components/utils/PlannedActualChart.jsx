import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { chartTooltip, formatMinutes, useChartColors } from '../ui';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Planned against actual time, one pair of bars per row (e.g. per worker). rows: [{ label, planned, actual }] in minutes
export const PlannedActualChart = ({ rows }) => {
    const colors = useChartColors();
    const hours = (minutes) => Math.round((minutes / 60) * 10) / 10;

    const options = {
        maintainAspectRatio: false,
        responsive: true,
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true,
                ticks: { color: colors.text, callback: (value) => `${value} h` },
                grid: { color: colors.grid },
                border: { display: false },
            },
            y: {
                ticks: { color: colors.text },
                grid: { display: false },
            },
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'start',
                labels: { color: colors.text, boxWidth: 12, boxHeight: 12, padding: 16 },
            },
            tooltip: {
                ...chartTooltip(colors),
                displayColors: true,
                callbacks: {
                    label: (context) => {
                        const row = rows[context.dataIndex];
                        return `${context.dataset.label}: ${formatMinutes(context.datasetIndex === 0 ? row.planned : row.actual)}`;
                    },
                },
            },
        },
        datasets: { bar: { barPercentage: 0.85, categoryPercentage: 0.7, borderRadius: 0, maxBarThickness: 18 } },
    };
    const data = {
        labels: rows.map((row) => row.label),
        datasets: [
            { label: 'Plánováno', data: rows.map((row) => hours(row.planned)), backgroundColor: colors.plannedTime },
            { label: 'Odpracováno', data: rows.map((row) => hours(row.actual)), backgroundColor: colors.actualTime },
        ],
    };

    return <Bar options={options} data={data} />;
};
