import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';

// The top line of a box: its title with the filters gear (settings: ListFiltersButton) right next to it on the left;
// other controls (children) and the add button (add: StyledAddButton) at the right end.
export const StyledBoxHeader = ({ title, add, settings, children }: { title: ReactNode; add?: ReactNode; settings?: ReactNode; children?: ReactNode }) => (
    <div className='content-box_header'>
        <Stack direction='row' sx={{ alignItems: 'center', gap: 1, minWidth: 0 }}>
            <h1>{title}</h1>
            {settings}
        </Stack>
        {children || add ? (
            <div className='content-box_subheader'>
                {children}
                {add}
            </div>
        ) : null}
    </div>
);
