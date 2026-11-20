import { createTheme } from '@mui/material/styles';
import { csCZ } from '@mui/material/locale';
import { csCZ as pickersCsCZ } from '@mui/x-date-pickers/locales';

// The app's colours in one place (they match the CSS variables in styles.css)
const base = createTheme({
    palette: {
        primary: { main: '#dc3545' },
        error: { main: '#dc3545' },
        success: { main: '#198754' },
        secondary: { main: '#6c757d' },
    },
});

export const theme = createTheme(
    {
        palette: {
            ...base.palette,
            // near-black, used for the menu, the header and most neutral buttons: <StyledButton color='dark'>
            dark: base.palette.augmentColor({ color: { main: '#212529' }, name: 'dark' }),
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
