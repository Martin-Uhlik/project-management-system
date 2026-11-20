import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from '../../dayjs';

// Date and time picker. value and onChange use dayjs objects (null when the field is cleared)
export const StyledDateTimePicker = ({ value, onChange, label = 'Datum dokončení', minDateTime, maxDateTime, disabled }) => {
    const toDayjs = (date) => (date ? dayjs(date) : null);
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='cs'>
            <DateTimePicker
                label={label}
                value={toDayjs(value)}
                minDateTime={toDayjs(minDateTime) ?? undefined}
                maxDateTime={toDayjs(maxDateTime) ?? undefined}
                disabled={disabled}
                ampm={false}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                onChange={(newValue) => onChange(newValue && newValue.isValid() ? newValue : null)}
            />
        </LocalizationProvider>
    );
};
