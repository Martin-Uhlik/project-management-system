import Button from '@mui/material/Button';

// Every button in the app. color: 'dark' (default), 'error', 'success', 'secondary' or 'primary';
// variant: 'contained' (default) or 'outlined'. Anything else goes straight to MUI's Button.
export const StyledButton = ({ color = 'dark', variant = 'contained', ...props }) => {
    return <Button color={color} variant={variant} {...props} />;
};
