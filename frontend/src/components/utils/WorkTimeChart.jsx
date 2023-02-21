import {Bar} from "react-chartjs-2";
import React from "react";
import {BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip} from "chart.js";

export const WorkTimeChart = (props) => {
    const borderColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--work-time-chart-border");
    const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--work-time-chart-backround");

    ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Tooltip
    );

    const options = {
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false
                }
            }
        },
        indexAxis: "x",
        elements: {
            bar: {
                borderWidth: 2
            }
        },
        responsive: true

    };
    const data = {
        labels: ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"],
        datasets: [
            {
                data: props.dataset,
                borderColor: borderColor,
                backgroundColor: backgroundColor
            }
        ]
    };

    return (
        <Bar options={options} data={data}/>
    );
};