import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';
import { useColorMode } from './useColorMode';

export const themeOptions = [
    { mode: 'light', label: 'Světlý', Icon: SunIcon },
    { mode: 'dark', label: 'Tmavý', Icon: MoonIcon },
    { mode: 'system', label: 'Podle systému', Icon: MonitorIcon },
];

// Choosing the look: light, dark, or as the computer / phone is set. A red outlined strip; the chosen option is
// filled red with its icon (and label) in the background colour, the others are red. Hovering any option fills it
// with the darker red (the same for the chosen one and the others).
// showLabels: the option's name next to its icon (Settings); without it icons only (the user menu)
export const StyledThemeSelect = ({ showLabels = false, sx }) => {
    const { mode, setMode } = useColorMode();
    return (
        <ToggleButtonGroup
            exclusive
            fullWidth
            value={mode}
            onChange={(_, value) => value && setMode(value)}
            aria-label='Vzhled'
            sx={[
                {
                    // every option has its own red frame; neighbours overlap by the frame's width, so a hovered
                    // option (lifted above its neighbours) shows its whole frame in the darker red
                    '& .MuiToggleButtonGroup-grouped': {
                        border: 2,
                        borderColor: 'primary.main',
                        borderRadius: 0,
                        py: 0.5,
                        gap: 1,
                        fontSize: '0.95rem',
                        color: 'primary.main',
                        '&:not(:first-of-type)': { marginLeft: '-2px', borderLeft: 2, borderLeftColor: 'primary.main' },
                        '&:first-of-type': { borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' },
                        '&:last-of-type': { borderTopRightRadius: '10px', borderBottomRightRadius: '10px' },
                        '&.Mui-selected': { backgroundColor: 'primary.main', color: 'background.paper' },
                        '&:hover, &.Mui-selected:hover': {
                            backgroundColor: 'primary.dark',
                            borderColor: 'primary.dark',
                            color: 'background.paper',
                            zIndex: 1,
                        },
                    },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {themeOptions.map(({ mode: value, label, Icon }) => (
                <ToggleButton key={value} value={value} aria-label={showLabels ? undefined : label} title={showLabels ? undefined : label}>
                    <Icon fontSize='small' />
                    {showLabels ? label : null}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
};
