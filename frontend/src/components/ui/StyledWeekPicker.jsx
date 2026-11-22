import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from '../../dayjs';
import { ChevronRightIcon, RefreshIcon } from './icons';

// Picks a week (Monday to Sunday) with arrows on either side of its dates ("16. 11. – 22. 11. 2026"); while another
// week is shown, a refresh icon on its left goes back to this week. value: a dayjs of any day in the week; onChange gets the Monday of the new week.
export const StyledWeekPicker = ({ value, onChange }) => {
    const week = value.startOf('isoWeek');
    const end = week.endOf('isoWeek');
    const thisWeek = dayjs().startOf('isoWeek');
    const isThisWeek = week.isSame(thisWeek, 'day');
    const label =
        week.year() === end.year() ? `${week.format('D. M.')} – ${end.format('D. M. YYYY')}` : `${week.format('D. M. YYYY')} – ${end.format('D. M. YYYY')}`;
    return (
        <Stack direction='row' spacing={0.5} useFlexGap sx={{ alignItems: 'center' }}>
            {!isThisWeek && (
                <IconButton aria-label='Zpět na tento týden' title='Zpět na tento týden' onClick={() => onChange(thisWeek)} sx={{ borderRadius: 0 }}>
                    <RefreshIcon />
                </IconButton>
            )}
            <Stack direction='row' sx={{ alignItems: 'center', border: 1, borderColor: 'divider', backgroundColor: 'var(--content-box-background)' }}>
                <IconButton aria-label='Předchozí týden' title='Předchozí týden' onClick={() => onChange(week.subtract(1, 'week'))} sx={{ borderRadius: 0 }}>
                    <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                <Typography aria-live='polite' title={`${week.isoWeek()}. týden`} sx={{ minWidth: '11rem', textAlign: 'center', fontWeight: 600 }}>
                    {label}
                </Typography>
                <IconButton aria-label='Další týden' title='Další týden' onClick={() => onChange(week.add(1, 'week'))} sx={{ borderRadius: 0 }}>
                    <ChevronRightIcon />
                </IconButton>
            </Stack>
        </Stack>
    );
};
