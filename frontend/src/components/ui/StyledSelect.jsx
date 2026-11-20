import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

// A single choice from a list. options: [{ value, label }]
export const StyledSelect = ({ id, name, options, ...props }) => {
    return (
        <TextField id={id} name={name ?? id} select {...props}>
            {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    );
};
