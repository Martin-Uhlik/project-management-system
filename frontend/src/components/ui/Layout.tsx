import Stack, { type StackProps } from '@mui/material/Stack';
import type { ElementType } from 'react';

type LayoutProps = Omit<StackProps, 'spacing' | 'gap'> & { component?: ElementType; gap?: number; noValidate?: boolean };

// Fields one under another, with the same gap everywhere; component='form' makes it the form itself
export const FormStack = ({ children, gap = 2, sx, ...props }: LayoutProps) => {
    return (
        <Stack spacing={gap} useFlexGap sx={sx} {...props}>
            {children}
        </Stack>
    );
};

// Buttons side by side, at the right end unless justify says otherwise ('space-between', 'flex-start', 'center', 'stretch')
export const ButtonRow = ({ children, justify = 'flex-end', wrap = true, sx, ...props }: LayoutProps & { justify?: string; wrap?: boolean }) => {
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
                ...(sx as object),
            }}
            {...props}
        >
            {children}
        </Stack>
    );
};
