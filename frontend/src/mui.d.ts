// The app's own colour 'dark' (components/ui/theme.tsx) for MUI's components
import '@mui/material/styles';
import '@mui/material/Button';
import '@mui/material/ButtonGroup';
import '@mui/material/IconButton';

declare module '@mui/material/styles' {
    interface Palette {
        dark: Palette['primary'];
    }
    interface PaletteOptions {
        dark?: PaletteOptions['primary'];
    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        dark: true;
    }
}

declare module '@mui/material/ButtonGroup' {
    interface ButtonGroupPropsColorOverrides {
        dark: true;
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        dark: true;
    }
}
