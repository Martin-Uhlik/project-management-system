import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// A choice of a few options side by side in a red outlined strip (the look and the font size in Settings and the
// user menu). The chosen option is filled red with its icon and label in the background colour, the others are red;
// a hovered option, chosen or not, is filled and framed with the darker red.
// options: [{ value, label, icon }] (icon: an element), showLabels: the label next to the icon, else icons only
// (then the label is the tooltip and the name for screen readers), label: the name of the whole choice
export const StyledSegmentedSelect = ({ options, value, onChange, label, showLabels = false, sx }) => {
    return (
        <ToggleButtonGroup
            exclusive
            fullWidth
            value={value}
            onChange={(_, newValue) => newValue && onChange(newValue)}
            aria-label={label}
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
            {options.map((option) => (
                <ToggleButton
                    key={option.value}
                    value={option.value}
                    aria-label={showLabels ? undefined : option.label}
                    title={showLabels ? undefined : option.label}
                >
                    {option.icon}
                    {showLabels ? option.label : null}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
};
