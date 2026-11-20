import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from '../../dayjs';
import { ChevronRightIcon } from './icons';

// Picks a calendar month with arrows on either side of its name ("listopad 2026"). value: a dayjs of any day in the
// month; onChange gets the first day of the new month. Months after `max` (default: this month) can't be picked.
export const StyledMonthPicker = ({ value, onChange, max = dayjs() }) => {
    const month = value.startOf('month');
    const atMax = !month.isBefore(max.startOf('month'));
    const label = month.format('MMMM YYYY');
    return (
        <Stack direction='row' sx={{ alignItems: 'center', border: 1, borderColor: 'divider', backgroundColor: 'var(--content-box-background)' }}>
            <IconButton aria-label='Předchozí měsíc' title='Předchozí měsíc' onClick={() => onChange(month.subtract(1, 'month'))} sx={{ borderRadius: 0 }}>
                <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
            </IconButton>
            <Typography aria-live='polite' sx={{ minWidth: '9.5rem', textAlign: 'center', fontWeight: 600, '&::first-letter': { textTransform: 'uppercase' } }}>
                {label}
            </Typography>
            <IconButton aria-label='Další měsíc' title='Další měsíc' disabled={atMax} onClick={() => onChange(month.add(1, 'month'))} sx={{ borderRadius: 0 }}>
                <ChevronRightIcon />
            </IconButton>
        </Stack>
    );
};
