import { useColorScheme } from '@mui/material/styles';

// The colour mode: mode is what the user chose ('light', 'dark' or 'system'), scheme is what is shown now ('light' or 'dark')
export const useColorMode = () => {
    const { mode, setMode, colorScheme, systemMode } = useColorScheme();
    const scheme = colorScheme ?? (mode === 'system' ? systemMode : mode) ?? 'light';
    return { mode: mode ?? 'system', setMode, scheme };
};
