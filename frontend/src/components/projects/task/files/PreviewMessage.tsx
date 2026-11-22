import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

// Text in place of a preview (can't be shown, too big, failed)
export const PreviewMessage = ({ children }: { children: ReactNode }) => (
    <Box
        sx={{
            p: 3,
            textAlign: 'center',
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
        }}
    >
        {children}
    </Box>
);
