import Stack from '@mui/material/Stack';

// Fields one under another, with the same gap everywhere; component='form' makes it the form itself
export const FormStack = ({ children, gap = 2, sx, ...props }) => {
    return (
        <Stack spacing={gap} useFlexGap sx={sx} {...props}>
            {children}
        </Stack>
    );
};

// Buttons side by side, at the right end unless justify says otherwise ('space-between', 'flex-start', 'center', 'stretch')
export const ButtonRow = ({ children, justify = 'flex-end', wrap = true, sx, ...props }) => {
    const stretch = justify === 'stretch';
    return (
        <Stack
            direction='row'
            spacing={2}
            useFlexGap
            sx={{
                justifyContent: stretch ? 'center' : justify,
                alignItems: 'center',
                flexWrap: wrap ? 'wrap' : 'nowrap',
                ...(stretch ? { '& > *': { flex: 1 } } : {}),
                ...sx,
            }}
            {...props}
        >
            {children}
        </Stack>
    );
};
