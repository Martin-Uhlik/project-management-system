import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { AccountCancelIcon, CheckCircleIcon, CircleOutlineIcon, ClockOutlineIcon, LockIcon, TimerIcon } from './icons';
import { statusLabels, useStatusColors, type Status } from './taskStatus';
import type { ReactNode } from 'react';

const icons = {
    finished: CheckCircleIcon,
    inProgress: ClockOutlineIcon,
    todo: CircleOutlineIcon,
    blocked: LockIcon,
    working: TimerIcon,
    disabled: AccountCancelIcon,
};

// The icon of a status in its colour, with the status as its tooltip: a task's ('finished', 'inProgress', 'todo', 'blocked' - see
// taskStatus) or a worker's ('working', 'disabled' - see userStatus). Children (e.g. the name) follow the icon.
// label: the tooltip if not the status's usual name (e.g. projectStatusLabels)
export const StyledStatus = ({ status, label, children }: { status: Status | null | undefined; label?: string; children?: ReactNode }) => {
    const colors = useStatusColors();
    if (!status) return children ?? null;
    const Icon = icons[status];
    const title = label ?? statusLabels[status];
    const icon = (
        <Tooltip title={title}>
            <span role='img' aria-label={title} style={{ display: 'inline-flex' }}>
                <Icon fontSize='small' sx={{ color: colors[status] }} />
            </span>
        </Tooltip>
    );
    if (children === undefined) return icon;
    return (
        <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, verticalAlign: 'middle' }}>
            {icon}
            <span className='status-text'>{children}</span>
        </Box>
    );
};
