import { StyledChip } from './StyledChip';
import { TimerIcon } from './icons';
import { useElapsed } from './useElapsed';

// A green label with a running timer: how long someone has been working since `since`
export const StyledElapsed = ({ since }) => {
    const elapsed = useElapsed(since);
    return <StyledChip label={elapsed} color='success' icon={<TimerIcon />} sx={{ fontVariantNumeric: 'tabular-nums' }} />;
};
