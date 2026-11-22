import Fab from '@mui/material/Fab';

// The round red button right after a box's title (see StyledBoxHeader) that adds an item. label: what it does, for
// screen readers. Flat: no shadow.
export const StyledAddButton = ({ label, onClick, children = '+' }) => {
    return (
        <Fab
            color='primary'
            size='medium'
            aria-label={label}
            title={label}
            onClick={onClick}
            sx={{ fontSize: '2rem', flexShrink: 0, boxShadow: 'none', '&:hover, &:active, &:focus-visible': { boxShadow: 'none' } }}
        >
            {children}
        </Fab>
    );
};
