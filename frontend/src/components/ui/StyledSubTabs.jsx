import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

// The black strip of tabs above a page (task sections, machines)
export const StyledSubTabs = ({ children }) => {
    return (
        <Stack direction='row' sx={{ height: '5rem', backgroundColor: 'black', overflowX: 'auto', overflowY: 'hidden', flexShrink: 0 }}>
            {children}
        </Stack>
    );
};

// One tab: a link (component={Link} to=...) or a button. active: the page that is open; back: the red "Zpět" tab
export const StyledSubTab = ({ active, back, ...props }) => {
    if (back) {
        return <Button color='primary' variant='contained' sx={{ minWidth: '9.5rem', borderRadius: 0 }} {...props} />;
    }
    return (
        <Button
            color='inherit'
            variant={active ? 'contained' : 'text'}
            aria-current={active ? 'page' : undefined}
            sx={{
                minWidth: '9.5rem',
                borderRadius: 0,
                whiteSpace: 'nowrap',
                borderRight: '1px solid rgba(255, 255, 255, 0.5)',
                // the open tab takes the colour of the page under it (white, or dark grey in the dark look)
                color: active ? 'text.primary' : 'white',
                backgroundColor: active ? 'var(--content-box-background)' : 'transparent',
                '&:hover': { backgroundColor: active ? 'var(--subtab-active-hover)' : 'rgba(255, 255, 255, 0.15)' },
            }}
            {...props}
        />
    );
};
