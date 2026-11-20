import Chip from '@mui/material/Chip';

// A small count badge, e.g. how many tasks a list holds. It takes its colour from the text around it (a see-through
// tint of it), so it fits on red and grey buttons and in light and dark mode alike.
export const StyledCount = ({ total, label }) => (
    <Chip
        size='small'
        label={total}
        aria-label={label ? `${label}: ${total}` : undefined}
        sx={{
            ml: 1,
            height: '1.5em',
            minWidth: '1.75em',
            fontSize: '0.85em',
            fontWeight: 'bold',
            color: 'inherit',
            bgcolor: 'rgba(255, 255, 255, 0.22)',
            pointerEvents: 'none',
            '& .MuiChip-label': { px: '0.5em' },
        }}
    />
);
