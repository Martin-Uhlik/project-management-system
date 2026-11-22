import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// One fact of a preview (the selected project, machine, item...): a quiet label over its value ('–' when it has none).
// tone: an MUI colour for the value ('error', 'warning')
export const StyledFact = ({ label, tone, children }) => (
    <Stack sx={{ gap: 0.5, minWidth: 0 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {label}
        </Typography>
        <Box sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: tone ? `${tone}.main` : undefined }}>
            {children || children === 0 ? children : '–'}
        </Box>
    </Stack>
);

// The facts of a preview in two columns (one on a phone)
export const StyledFacts = ({ children }) => <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>{children}</Box>;
