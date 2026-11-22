import Fab from '@mui/material/Fab';
import { PlusIcon } from './icons';
import type { MouseEventHandler, ReactNode } from 'react';

// The round red button right after a box's title (see StyledBoxHeader) that adds an item. label: what it does, for
// screen readers. Flat: no shadow.
export const StyledAddButton = ({
    label,
    onClick,
    children = <PlusIcon fontSize='large' />,
}: {
    label: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    children?: ReactNode;
}) => {
    return (
        <Fab
            color='primary'
            size='medium'
            aria-label={label}
            title={label}
            onClick={onClick}
            sx={{ flexShrink: 0, boxShadow: 'none', '&:hover, &:active, &:focus-visible': { boxShadow: 'none' } }}
        >
            {children}
        </Fab>
    );
};
