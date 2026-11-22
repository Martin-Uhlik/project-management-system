import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import type { ElementType } from 'react';

export type StyledIconButtonProps<C extends ElementType = 'button'> = IconButtonProps<C, { component?: C }> & {
    label: string;
    active?: boolean;
};

// A square button with only an icon. label: what it does, shown as a tooltip and read by screen readers;
// active: highlights it (e.g. a settings button while some of its settings differ from the defaults)
export const StyledIconButton = <C extends ElementType = 'button'>({ label, active = false, children, sx, ...props }: StyledIconButtonProps<C>) => (
    <IconButton
        aria-label={label}
        title={label}
        color={active ? 'primary' : 'default'}
        sx={[{ borderRadius: '0.5rem', flexShrink: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...(props as IconButtonProps)}
    >
        {children}
    </IconButton>
);
