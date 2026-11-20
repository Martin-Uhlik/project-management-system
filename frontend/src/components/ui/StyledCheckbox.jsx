import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

// A checkbox; with a label it shows the text next to it, without one pass aria-label for screen readers
export const StyledCheckbox = ({ label, id, name, checked, defaultChecked, onChange, disabled, ...props }) => {
    const checkbox = (
        <Checkbox
            id={id}
            name={name ?? id}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            disabled={disabled}
            slotProps={{ input: { 'aria-label': props['aria-label'] } }}
        />
    );
    return label ? <FormControlLabel control={checkbox} label={label} disabled={disabled} /> : checkbox;
};
