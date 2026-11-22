import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { StyledCount } from './StyledCount';

// Switches between views across the top of a box; the chosen one is red. options: the labels, value: chosen index,
// counts (optional): a number shown in a badge on each button, e.g. how many items the view holds (null hides it)
export const StyledToggle = ({
    options,
    value,
    onChange,
    counts,
}: {
    options: string[];
    value: number;
    onChange: (index: number) => void;
    counts?: (number | null | undefined)[];
}) => {
    return (
        <ButtonGroup fullWidth disableElevation variant='contained' sx={{ '& .MuiButton-root': { borderRadius: 0 } }}>
            {options.map((label, index) => (
                <Button key={label} color={value === index ? 'error' : 'dark'} aria-pressed={value === index} onClick={() => onChange(index)}>
                    {label}
                    {counts?.[index] != null && <StyledCount total={counts[index]!} />}
                </Button>
            ))}
        </ButtonGroup>
    );
};
