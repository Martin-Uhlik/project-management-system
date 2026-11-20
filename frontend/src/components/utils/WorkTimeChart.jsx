import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useChartColors } from '../ui';

export const WorkTimeChart = (props) => {
    const colors = useChartColors();

    ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

    const options = {
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: { color: colors.text },
            },
            y: {
                ticks: { color: colors.text },
                grid: { color: colors.grid },
            },
        },
        indexAxis: 'x',
        elements: {
            bar: {
                borderWidth: 2,
            },
        },
        responsive: true,
    };
    const data = {
        labels: ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'],
        datasets: [
            {
                data: props.dataset,
                borderColor: colors.workTime.border,
                backgroundColor: colors.workTime.background,
            },
        ],
    };

    return <Bar options={options} data={data} />;
};
