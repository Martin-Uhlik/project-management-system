import { createTheme } from '@mui/material/styles';
import { csCZ } from '@mui/material/locale';
import { csCZ as pickersCsCZ } from '@mui/x-date-pickers/locales';

// The app's colours in one place (the page surfaces - menu, boxes, cards - are CSS variables in styles.css,
// with their dark values under :root[data-theme='dark'])
const { augmentColor } = createTheme().palette;

const shared = {
    // dark: the hover colour of red buttons (--active-primary-hover in styles.css)
    primary: { main: '#dc3545', dark: '#bb2d3b' },
    error: { main: '#dc3545' },
    success: { main: '#198754' },
    secondary: { main: '#6c757d' },
};

export const theme = createTheme(
    {
        // light and dark: MUI picks the OS setting until the user chooses one (useColorScheme), remembers the choice
        // in localStorage ('mui-mode') and marks it on <html data-theme='light|dark'> for styles.css
        cssVariables: { colorSchemeSelector: 'data-theme' },
        colorSchemes: {
            light: {
                palette: {
                    ...shared,
                    // near-black, used for most neutral buttons: <StyledButton color='dark'>
                    dark: augmentColor({ color: { main: '#212529' }, name: 'dark' }),
                },
            },
            dark: {
                palette: {
                    ...shared,
                    // on dark backgrounds the neutral buttons are a lighter grey so they still stand out
                    dark: augmentColor({ color: { main: '#495057', contrastText: '#fff' }, name: 'dark' }),
                    background: { default: '#121417', paper: '#1e2125' },
                },
            },
        },
        typography: {
            fontFamily: 'Arial, Helvetica, sans-serif',
            button: { textTransform: 'none', fontSize: '1rem' },
        },
        components: {
            MuiButton: { defaultProps: { disableElevation: true } },
            MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
            MuiFormControl: { defaultProps: { size: 'small' } },
        },
    },
    csCZ,
    pickersCsCZ,
);

// The colour of each task status (see taskStatus.js): finished green, in progress orange, todo blue; lighter on dark backgrounds
export const taskStatusColors = {
    light: { finished: '#198754', inProgress: '#e8590c', todo: '#1c7ed6' },
    dark: { finished: '#51cf66', inProgress: '#ff922b', todo: '#4dabf7' },
};

// The colour of a worker's state in the workers table: working green (with the running timer), disabled grey
export const userStatusColors = {
    light: { working: '#198754', disabled: '#adb5bd' },
    dark: { working: '#51cf66', disabled: '#6c757d' },
};

// '#rrggbb' at the given opacity, for the canvas charts
const withAlpha = (hex, alpha) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// a bar in the work plan chart for every task status
const statusBars = (colors, background, hover) =>
    Object.fromEntries(
        Object.entries(colors).map(([status, color]) => [status, { border: color, background: withAlpha(color, background), hover: withAlpha(color, hover) }]),
    );

// Colours for the charts (chart.js draws on a canvas, so it needs real colours, not CSS variables): see useChartColors
export const chartColors = {
    light: {
        text: '#666666',
        grid: 'rgba(0, 0, 0, 0.1)',
        workTime: { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.5)' },
        workPlan: statusBars(taskStatusColors.light, 0.5, 0.8),
        // project statistics: planned time against time actually spent (checked for colour blindness and contrast)
        plannedTime: '#1098ad',
        actualTime: '#7048e8',
        tooltip: { background: '#ffffff', title: '#212529', body: '#495057', border: 'rgba(0, 0, 0, 0.15)' },
    },
    dark: {
        text: '#adb5bd',
        grid: 'rgba(255, 255, 255, 0.12)',
        workTime: { border: 'rgb(255, 120, 150)', background: 'rgba(255, 99, 132, 0.45)' },
        workPlan: statusBars(taskStatusColors.dark, 0.45, 0.75),
        plannedTime: '#1098ad',
        actualTime: '#845ef7',
        tooltip: { background: '#2b3035', title: '#f1f3f5', body: '#ced4da', border: 'rgba(255, 255, 255, 0.15)' },
    },
};

// Colours for the task graph (sigma, also a canvas)
export const graphColors = {
    light: { label: '#000000', labelBackground: '#ffffff', edge: '#cccccc', task: taskStatusColors.light },
    dark: { label: '#f1f3f5', labelBackground: '#2b3035', edge: '#6c757d', task: taskStatusColors.dark },
};

// The look of a chart.js tooltip in the given chart colours (useChartColors), so every chart's tooltip matches the theme
export const chartTooltip = (colors) => ({
    backgroundColor: colors.tooltip.background,
    titleColor: colors.tooltip.title,
    bodyColor: colors.tooltip.body,
    borderColor: colors.tooltip.border,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 6,
    displayColors: false,
    titleFont: { size: 14, weight: 'bold' },
    bodyFont: { size: 13 },
    bodySpacing: 4,
});
