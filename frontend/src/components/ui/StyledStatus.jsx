import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { AccountCancelIcon, CheckCircleIcon, CircleOutlineIcon, ClockOutlineIcon, TimerIcon } from './icons';
import { statusLabels, useStatusColors } from './taskStatus';

const icons = {
    finished: CheckCircleIcon,
    inProgress: ClockOutlineIcon,
    todo: CircleOutlineIcon,
    working: TimerIcon,
    disabled: AccountCancelIcon,
};

// The icon of a status in its colour, with the status as its tooltip: a task's ('finished', 'inProgress', 'todo' - see
// taskStatus) or a worker's ('working', 'disabled' - see userStatus). Children (e.g. the name) follow the icon.
export const StyledStatus = ({ status, children }) => {
    const colors = useStatusColors();
    const Icon = icons[status];
    if (!Icon) return children ?? null;
    const icon = (
        <Tooltip title={statusLabels[status]}>
            <span role='img' aria-label={statusLabels[status]} style={{ display: 'inline-flex' }}>
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
