import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

// Switches between views across the top of a box; the chosen one is red. options: the labels, value: chosen index
export const StyledToggle = ({ options, value, onChange }) => {
    return (
        <ButtonGroup fullWidth disableElevation variant='contained' sx={{ '& .MuiButton-root': { borderRadius: 0 } }}>
            {options.map((label, index) => (
                <Button key={label} color={value === index ? 'error' : 'dark'} aria-pressed={value === index} onClick={() => onChange(index)}>
                    {label}
                </Button>
            ))}
        </ButtonGroup>
    );
};
