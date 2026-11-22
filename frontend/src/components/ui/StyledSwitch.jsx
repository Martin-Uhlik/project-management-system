import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// An on/off toggle switch for a setting; with a label it shows the text next to it, without one pass aria-label
export const StyledSwitch = ({ label, id, name, checked, onChange, disabled, ...props }) => {
    const control = (
        <Switch
            id={id}
            name={name ?? id}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            slotProps={{ input: { 'aria-label': props['aria-label'] } }}
        />
    );
    return label ? <FormControlLabel control={control} label={label} disabled={disabled} /> : control;
};
