import IconButton from '@mui/material/IconButton';

// A square button with only an icon. label: what it does, shown as a tooltip and read by screen readers;
// active: highlights it (e.g. a settings button while some of its settings differ from the defaults)
export const StyledIconButton = ({ label, active = false, children, sx, ...props }) => (
    <IconButton aria-label={label} title={label} color={active ? 'primary' : 'default'} sx={{ borderRadius: '0.5rem', flexShrink: 0, ...sx }} {...props}>
        {children}
    </IconButton>
);
