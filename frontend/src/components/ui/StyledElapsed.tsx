import { StyledChip } from './StyledChip';
import { TimerIcon } from './icons';
import { useElapsed } from './useElapsed';
import { useStatusColors, type Status } from './taskStatus';

// A label with a running timer: how long someone has been working since `since`. Green (a working worker) by default;
// status: outlined in a status colour instead, e.g. 'inProgress' (orange) for a project someone works on
export const StyledElapsed = ({ since, status }: { since: string | Date | null | undefined; status?: Status }) => {
    const elapsed = useElapsed(since);
    const colors = useStatusColors();
    if (status) {
        return (
            <StyledChip
                label={elapsed}
                variant='outlined'
                icon={<TimerIcon />}
                sx={{ fontVariantNumeric: 'tabular-nums', color: colors[status], borderColor: colors[status], '& .MuiChip-icon': { color: 'inherit' } }}
            />
        );
    }
    return <StyledChip label={elapsed} color='success' icon={<TimerIcon />} sx={{ fontVariantNumeric: 'tabular-nums' }} />;
};
