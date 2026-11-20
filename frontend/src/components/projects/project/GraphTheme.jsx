import { useEffect } from 'react';
import { useSetSettings } from '@react-sigma/core';
import { drawDiscNodeLabel } from 'sigma/rendering';
import { useGraphColors } from '../../ui';

// sigma's own hover label (drawDiscNodeHover) always has a white box; this is the same drawing in the box colour we choose
const drawNodeHover = (background) => (context, data, settings) => {
    const size = settings.labelSize;
    context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
    context.fillStyle = background;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = '#000';
    const PADDING = 2;
    context.beginPath();
    if (typeof data.label === 'string') {
        const boxWidth = Math.round(context.measureText(data.label).width + 5);
        const boxHeight = Math.round(size + 2 * PADDING);
        const radius = Math.max(data.size, size / 2) + PADDING;
        const angle = Math.asin(boxHeight / 2 / radius);
        const xDelta = Math.sqrt(Math.abs(radius ** 2 - (boxHeight / 2) ** 2));
        context.moveTo(data.x + xDelta, data.y + boxHeight / 2);
        context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
        context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
        context.lineTo(data.x + xDelta, data.y - boxHeight / 2);
        context.arc(data.x, data.y, radius, angle, -angle);
    } else {
        context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
    }
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    drawDiscNodeLabel(context, data, settings);
};

// Gives the task graph the colours of the light or dark look, and switches them when the look changes
export const GraphTheme = () => {
    const setSettings = useSetSettings();
    const colors = useGraphColors();
    useEffect(() => {
        setSettings({
            labelColor: { color: colors.label },
            defaultEdgeColor: colors.edge,
            defaultDrawNodeHover: drawNodeHover(colors.labelBackground),
        });
    }, [setSettings, colors]);
    return null;
};
