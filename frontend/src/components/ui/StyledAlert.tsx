import Alert, { type AlertProps } from '@mui/material/Alert';

// A message inside a page or form. severity: 'error' (default), 'warning', 'info' or 'success'
export const StyledAlert = ({ severity = 'error', ...props }: AlertProps) => {
    return <Alert severity={severity} {...props} />;
};
