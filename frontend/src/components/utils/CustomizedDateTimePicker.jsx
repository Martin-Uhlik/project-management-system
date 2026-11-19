import dayjs from 'dayjs';
import moment from 'moment';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { csCZ } from '@mui/x-date-pickers/locales';

// Czech texts for the picker's buttons and screen reader labels, matching the rest of the app
const czechLocaleText = csCZ.components.MuiLocalizationProvider.defaultProps.localeText;

// The app keeps dates as moment objects, the picker needs dayjs ones: convert on the way in and out
const toDayjs = (value) => (value ? dayjs(moment.isMoment(value) ? value.toDate() : value) : null);

export const CustomizedDateTimePicker = ({ finishDate, setFinishDate, minDateTime, maxDateTime, disabled, label = 'Datum dokončení' }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} localeText={czechLocaleText}>
            <DateTimePicker
                label={label}
                value={toDayjs(finishDate)}
                minDateTime={toDayjs(minDateTime) ?? undefined}
                maxDateTime={toDayjs(maxDateTime) ?? undefined}
                disabled={disabled}
                ampm={false}
                onChange={(newValue) => {
                    setFinishDate(newValue && newValue.isValid() ? moment(newValue.toDate()) : null);
                }}
            />
        </LocalizationProvider>
    );
};
