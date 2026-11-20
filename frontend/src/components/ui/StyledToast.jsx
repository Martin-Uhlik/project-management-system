import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

// The corner where messages pop up (bottom right, newest at the bottom), above the page
export const StyledToastStack = ({ children }) => {
    return (
        <Stack
            spacing={1.5}
            aria-live='polite'
            sx={{
                position: 'fixed',
                right: '1.5rem',
                bottom: '1.5rem',
                zIndex: (theme) => theme.zIndex.snackbar,
                width: 'min(26rem, calc(100vw - 2rem))',
                pointerEvents: 'none',
                '@media (max-width: 600px)': { right: '1rem', bottom: '1rem' },
            }}
        >
            {children}
        </Stack>
    );
};

// One message in the corner: a filled, sharp-cornered MUI alert with its time above the text and a close button.
// severity: 'success', 'error', 'warning' or 'info'
export const StyledToast = ({ severity = 'info', time, onClose, children }) => {
    return (
        <Alert
            variant='filled'
            severity={severity}
            onClose={onClose}
            role={severity === 'error' ? 'alert' : 'status'}
            sx={{
                pointerEvents: 'auto',
                borderRadius: 0,
                boxShadow: 'var(--shadow-normal)',
                fontSize: '1rem',
                py: 1.25,
                px: 2,
                alignItems: 'center',
                '& .MuiAlert-icon': { fontSize: '1.6rem', py: 0, mr: 1.5, alignSelf: 'center' },
                '& .MuiAlert-action': { pt: 0, alignSelf: 'center' },
                '& .MuiAlert-message': { overflowWrap: 'anywhere' },
                '@keyframes toast-in': { from: { opacity: 0, transform: 'translateY(0.75rem)' }, to: { opacity: 1, transform: 'none' } },
                animation: 'toast-in 200ms ease-out',
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        >
            {time ? <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.15rem' }}>{time}</div> : null}
            {children}
        </Alert>
    );
};
