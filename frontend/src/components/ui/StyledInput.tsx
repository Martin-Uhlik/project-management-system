import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

// A solid field (white, dark grey in the dark look) that stays readable on a coloured background (the sign-in box)
const onDarkProps: Partial<TextFieldProps> = {
    variant: 'filled',
    sx: { '& .MuiFilledInput-root, & .MuiFilledInput-root:hover, & .MuiFilledInput-root.Mui-focused': { backgroundColor: 'background.paper' } },
};

// Every text, number and password field (multiline for longer text). Full width and small by default (see theme.js).
// unit: a short text shown at the end of the field, e.g. 'hod'. onDark: for fields on a coloured background.
export const StyledInput = ({ id, name, unit, onDark, ...props }: TextFieldProps & { unit?: string; onDark?: boolean }) => {
    const slotProps = {
        // a starting value that arrives after the first render (loaded data) must not end up under the label
        ...(props.defaultValue !== undefined ? { inputLabel: { shrink: true } } : {}),
        ...(unit ? { input: { endAdornment: <InputAdornment position='end'>{unit}</InputAdornment> } } : {}),
    };
    return <TextField id={id} name={name ?? id} slotProps={slotProps} {...(onDark ? onDarkProps : {})} {...props} />;
};
