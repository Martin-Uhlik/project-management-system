import { useState } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickerDay } from '@mui/x-date-pickers/PickerDay';
import dayjs from '../../dayjs';
import { ChevronRightIcon, RefreshIcon } from './icons';

// A day of the calendar below: the days of the chosen week (and of the week under the pointer) are joined into one
// band, MUI's week picker
const WeekDay = ({ day, selectedDay, hoveredDay, ...props }) => {
    const inWeek = (week) => week && day.isSame(week, 'isoWeek');
    const selected = inWeek(selectedDay);
    const hovered = !selected && inWeek(hoveredDay);
    const first = day.isoWeekday() === 1;
    const last = day.isoWeekday() === 7;
    return (
        <PickerDay
            {...props}
            day={day}
            selected={false}
            sx={{
                // no gaps between the days, so the week is one band
                mx: 0,
                width: 40,
                borderRadius: 0,
                ...(first && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }),
                ...(last && { borderTopRightRadius: 4, borderBottomRightRadius: 4 }),
                ...(selected && {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover, &:focus': { bgcolor: 'primary.main' },
                }),
                ...(hovered && {
                    bgcolor: 'action.hover',
                    '&:hover, &:focus': { bgcolor: 'action.hover' },
                }),
            }}
        />
    );
};

// Picks a week (Monday to Sunday): arrows on either side of its dates ("16. 11. – 22. 11. 2026"), and a click on the
// dates opens MUI's calendar to pick any week; while another week is shown, a refresh icon on its left goes back to
// this week. value: a dayjs of any day in the week; onChange gets the Monday of the new week. max: no week after the one
// holding this day can be picked (optional)
export const StyledWeekPicker = ({ value, onChange, max }) => {
    const week = value.startOf('isoWeek');
    const end = week.endOf('isoWeek');
    const thisWeek = dayjs().startOf('isoWeek');
    const isThisWeek = week.isSame(thisWeek, 'day');
    const atMax = max ? !week.isBefore(max.startOf('isoWeek')) : false;
    const label =
        week.year() === end.year() ? `${week.format('D. M.')} – ${end.format('D. M. YYYY')}` : `${week.format('D. M. YYYY')} – ${end.format('D. M. YYYY')}`;
    const [anchor, setAnchor] = useState(null);
    const [hoveredDay, setHoveredDay] = useState(null);
    return (
        <Stack direction='row' spacing={0.5} useFlexGap sx={{ alignItems: 'center' }}>
            {!isThisWeek && (
                <IconButton aria-label='Zpět na tento týden' title='Zpět na tento týden' onClick={() => onChange(thisWeek)} sx={{ borderRadius: '0.5rem' }}>
                    <RefreshIcon />
                </IconButton>
            )}
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
                <IconButton aria-label='Předchozí týden' title='Předchozí týden' onClick={() => onChange(week.subtract(1, 'week'))} sx={{ borderRadius: 0 }}>
                    <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                <ButtonBase
                    aria-haspopup='dialog'
                    aria-label={`${label}, vybrat týden v kalendáři`}
                    title={`${week.isoWeek()}. týden – vybrat v kalendáři`}
                    onClick={(event) => setAnchor(event.currentTarget)}
                    sx={{ minWidth: '11rem', px: 1, '&:hover': { bgcolor: 'action.hover' } }}
                >
                    <Typography aria-live='polite' sx={{ fontWeight: 600 }}>
                        {label}
                    </Typography>
                </ButtonBase>
                <IconButton
                    aria-label='Další týden'
                    title='Další týden'
                    disabled={atMax}
                    onClick={() => onChange(week.add(1, 'week'))}
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
                        value={week}
                        onChange={(day) => {
                            if (!day) return;
                            onChange(day.startOf('isoWeek'));
                            setAnchor(null);
                        }}
                        showDaysOutsideCurrentMonth
                        maxDate={max ? max.endOf('isoWeek') : undefined}
                        displayWeekNumber
                        slots={{ day: WeekDay }}
                        slotProps={{
                            day: (ownerState) => ({
                                selectedDay: week,
                                hoveredDay,
                                onPointerEnter: () => setHoveredDay(ownerState.day),
                                onPointerLeave: () => setHoveredDay(null),
                            }),
                        }}
                    />
                </LocalizationProvider>
            </Popover>
        </Stack>
    );
};
