import Typography from '@mui/material/Typography';
import { formatMinutes } from './formatMinutes';

// actual time as a share of the planned time, in % (null without a plan)
export const timeUsage = (actual: number, planned: number | null | undefined) => (planned && planned > 0 ? Math.round((actual / planned) * 100) : null);

// actual - planned, signed ("+1 h 20 min"), red and bold when over the plan; '–' when there is neither
export const StyledTimeDifference = ({ planned, actual }: { planned: number | null | undefined; actual: number }) => {
    if (!planned && !actual) return '–';
    const difference = actual - (planned ?? 0);
    return (
        <Typography component='span' variant='inherit' sx={{ color: difference > 0 ? 'error.main' : 'text.secondary', fontWeight: difference > 0 ? 600 : 400 }}>
            {difference > 0 ? '+' : ''}
            {formatMinutes(difference)}
        </Typography>
    );
};

// actual time as % of the plan, red over 100 %; '–' without a plan
export const StyledTimeUsage = ({ planned, actual }: { planned: number | null | undefined; actual: number }) => {
    const value = timeUsage(actual, planned);
    if (value === null) return '–';
    return (
        <Typography component='span' variant='inherit' sx={{ color: value > 100 ? 'error.main' : 'text.primary', fontWeight: 600 }}>
            {value} %
        </Typography>
    );
};
