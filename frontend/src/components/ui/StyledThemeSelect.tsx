import type React from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';
import { StyledSegmentedSelect } from './StyledSegmentedSelect';
import { useColorMode } from './useColorMode';
import type { SxProps, Theme } from '@mui/material/styles';

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Světlý', icon: <SunIcon fontSize='small' /> },
    { value: 'dark', label: 'Tmavý', icon: <MoonIcon fontSize='small' /> },
    { value: 'system', label: 'Podle systému', icon: <MonitorIcon fontSize='small' /> },
];

// Choosing the look: light, dark, or as the computer / phone is set. showLabels: names next to the icons
export const StyledThemeSelect = ({ showLabels, sx }: { showLabels?: boolean; sx?: SxProps<Theme> }) => {
    const { mode, setMode } = useColorMode();
    return <StyledSegmentedSelect label='Vzhled' options={themeOptions} value={mode} onChange={setMode} showLabels={showLabels} sx={sx} />;
};
