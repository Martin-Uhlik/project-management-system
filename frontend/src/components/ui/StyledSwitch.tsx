import FormControlLabel from '@mui/material/FormControlLabel';
import Switch, { type SwitchProps } from '@mui/material/Switch';
import type { ReactNode } from 'react';

type StyledSwitchProps = Pick<SwitchProps, 'id' | 'name' | 'checked' | 'onChange' | 'disabled'> & { label?: ReactNode; 'aria-label'?: string };

// An on/off toggle switch for a setting; with a label it shows the text next to it, without one pass aria-label
export const StyledSwitch = ({ label, id, name, checked, onChange, disabled, ...props }: StyledSwitchProps) => {
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
