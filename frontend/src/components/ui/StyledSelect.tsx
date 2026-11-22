import MenuItem from '@mui/material/MenuItem';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

export interface SelectOption {
    value: string | number;
    label: string;
}

// A single choice from a list. options: [{ value, label }]
export const StyledSelect = ({ id, name, options, ...props }: TextFieldProps & { options: SelectOption[] }) => {
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
