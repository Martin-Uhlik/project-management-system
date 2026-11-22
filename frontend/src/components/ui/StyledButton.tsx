import Button, { type ButtonProps } from '@mui/material/Button';
import type { ElementType } from 'react';

// MUI's Button props, also those of the element it renders as (component='label', component={Link} to=...)
export type StyledButtonProps<C extends ElementType = 'button'> = ButtonProps<C, { component?: C }>;

// Every button in the app. color: 'dark' (default), 'error', 'success', 'secondary' or 'primary';
// variant: 'contained' (default) or 'outlined'. Anything else goes straight to MUI's Button.
export const StyledButton = <C extends ElementType = 'button'>({ color = 'dark', variant = 'contained', ...props }: StyledButtonProps<C>) => {
    return <Button color={color} variant={variant} {...(props as ButtonProps)} />;
};
