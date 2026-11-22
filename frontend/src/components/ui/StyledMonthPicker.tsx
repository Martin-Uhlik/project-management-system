import { useState } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from '../../dayjs';
import type { Dayjs } from 'dayjs';
import { ChevronRightIcon } from './icons';

// Picks a calendar month with arrows on either side of its name ("listopad 2026"); a click on the name opens MUI's
// month and year picker. value: a dayjs of any day in the month; onChange gets the first day of the new month. Months
// after `max` (default: this month) can't be picked.
export const StyledMonthPicker = ({ value, onChange, max = dayjs() }: { value: Dayjs; onChange: (month: Dayjs) => void; max?: Dayjs }) => {
    const month = value.startOf('month');
    const atMax = !month.isBefore(max.startOf('month'));
    const label = month.format('MMMM YYYY');
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    return (
        <>
            <Stack
                direction='row'
                sx={{
                    alignItems: 'stretch',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: 'var(--content-box-background)',
                }}
            >
                <IconButton aria-label='Předchozí měsíc' title='Předchozí měsíc' onClick={() => onChange(month.subtract(1, 'month'))} sx={{ borderRadius: 0 }}>
                    <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                <ButtonBase
                    aria-haspopup='dialog'
                    aria-label={`${label}, vybrat měsíc v kalendáři`}
                    title='Vybrat měsíc v kalendáři'
                    onClick={(event) => setAnchor(event.currentTarget)}
                    sx={{ minWidth: '9.5rem', px: 1, '&:hover': { bgcolor: 'action.hover' } }}
                >
                    <Typography aria-live='polite' sx={{ fontWeight: 600, '&::first-letter': { textTransform: 'uppercase' } }}>
                        {label}
                    </Typography>
                </ButtonBase>
                <IconButton
                    aria-label='Další měsíc'
                    title='Další měsíc'
                    disabled={atMax}
                    onClick={() => onChange(month.add(1, 'month'))}
                    sx={{ borderRadius: 0 }}
                >
                    <ChevronRightIcon />
                </IconButton>
            </Stack>
            <Popover
                open={anchor !== null}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                slotProps={{ paper: { sx: { borderRadius: 1, mt: 0.5 } } }}
            >
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='cs'>
                    <DateCalendar
                        value={month}
                        views={['year', 'month']}
                        openTo='month'
                        maxDate={max.endOf('month')}
                        onChange={(day, state) => {
                            // picking a year only switches to its months; picking a month chooses it
                            if (!day || state !== 'finish') return;
                            onChange(day.startOf('month'));
                            setAnchor(null);
                        }}
                    />
                </LocalizationProvider>
            </Popover>
        </>
    );
};
