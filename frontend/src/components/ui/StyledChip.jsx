import Chip from '@mui/material/Chip';

// A small sharp-cornered label for a state shown in a table, e.g. 'Pracuje'. color: an MUI palette colour ('success', 'default'…);
// icon: an icon from icons.jsx
export const StyledChip = ({ label, color = 'default', icon, variant = 'filled', sx }) => {
    return <Chip size='small' label={label} color={color} icon={icon} variant={variant} sx={{ fontWeight: 500, borderRadius: 0, ...sx }} />;
};
