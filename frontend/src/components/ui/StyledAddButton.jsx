import Fab from '@mui/material/Fab';

// The round red button next to a box's title that adds (or with '-', removes) an item. label: what it does, for screen readers
export const StyledAddButton = ({ label, onClick, children = '+' }) => {
    return (
        <Fab color='primary' size='medium' aria-label={label} onClick={onClick} sx={{ fontSize: '2rem', flexShrink: 0, boxShadow: 'var(--shadow-small)' }}>
            {children}
        </Fab>
    );
};
