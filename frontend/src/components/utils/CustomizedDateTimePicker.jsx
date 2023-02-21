import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import TextField from "@mui/material/TextField";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";

export const CustomizedDateTimePicker = ({finishDate, setFinishDate, minDateTime, maxDateTime, disabled}) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
                renderInput={(props) => <TextField {...props} />}
                value={finishDate}
                minDateTime={minDateTime}
                maxDateTime={maxDateTime}
                disabled={disabled}
                ampm={false}
                onChange={(newValue) => {
                    setFinishDate(newValue);
                }}
            />
        </LocalizationProvider>
    );
};