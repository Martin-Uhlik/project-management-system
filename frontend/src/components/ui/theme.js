import { createTheme } from '@mui/material/styles';
import { csCZ } from '@mui/material/locale';
import { csCZ as pickersCsCZ } from '@mui/x-date-pickers/locales';

// The app's colours in one place (the page surfaces - menu, boxes, cards - are CSS variables in styles.css,
// with their dark values under :root[data-theme='dark'])
const { augmentColor } = createTheme().palette;

const shared = {
    primary: { main: '#dc3545' },
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

// Colours for the charts (chart.js draws on a canvas, so it needs real colours, not CSS variables): see useChartColors
export const chartColors = {
    light: {
        text: '#666666',
        grid: 'rgba(0, 0, 0, 0.1)',
        workTime: { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.5)' },
        workPlan: { border: 'rgb(53, 162, 235)', background: 'rgba(53, 162, 235, 0.5)' },
    },
    dark: {
        text: '#adb5bd',
        grid: 'rgba(255, 255, 255, 0.12)',
        workTime: { border: 'rgb(255, 120, 150)', background: 'rgba(255, 99, 132, 0.45)' },
        workPlan: { border: 'rgb(90, 180, 245)', background: 'rgba(53, 162, 235, 0.45)' },
    },
};

// Colours for the task graph (sigma, also a canvas)
export const graphColors = {
    light: { label: '#000000', labelBackground: '#ffffff', edge: '#cccccc' },
    dark: { label: '#f1f3f5', labelBackground: '#2b3035', edge: '#6c757d' },
};
