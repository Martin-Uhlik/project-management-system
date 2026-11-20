import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// One headline number (statistics): a quiet label, the value large, and a line under it that explains it.
// accent: a colour (CSS) for the stripe on the left, e.g. a status colour; tone: an MUI colour for the value ('error')
export const StyledStatTile = ({ label, value, caption, accent, tone }) => {
    return (
        <Box
            sx={{
                p: 2,
                minWidth: 0,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: accent ? `inset 4px 0 0 ${accent}` : 'none',
                backgroundColor: 'var(--content-box-background)',
            }}
        >
            <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, color: tone ? `${tone}.main` : 'text.primary' }}>{value}</Typography>
            {caption ? (
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {caption}
                </Typography>
            ) : null}
        </Box>
    );
};
