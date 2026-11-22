import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import type { ReactNode } from 'react';

type Value = string | number;

// Several choices from a list, with a checkbox per item. options: [{ value, label }], value: the chosen values
export const StyledMultiSelect = <V extends Value>({
    id,
    label,
    options,
    value,
    onChange,
    disabled,
}: {
    id: string;
    label: ReactNode;
    options: { value: V; label: string }[];
    value: V[];
    onChange: (value: V[]) => void;
    disabled?: boolean;
}) => {
    const labelOf = (selected: V) => options.find((option) => option.value === selected)?.label ?? '';
    return (
        <FormControl fullWidth disabled={disabled}>
            <InputLabel id={`${id}-label`}>{label}</InputLabel>
            <Select
                labelId={`${id}-label`}
                id={id}
                name={id}
                multiple
                value={value}
                onChange={(event) => onChange(event.target.value as V[])}
                input={<OutlinedInput label={label} />}
                renderValue={(selected) => selected.map(labelOf).join(', ')}
                MenuProps={{ slotProps: { paper: { style: { maxHeight: '15rem' } } } }}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        <Checkbox checked={value.includes(option.value)} />
                        <ListItemText primary={option.label} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
