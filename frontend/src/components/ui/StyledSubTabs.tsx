import Box from '@mui/material/Box';
import Button, { type ButtonProps } from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ElementType, ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import { StyledCount } from './StyledCount';

// A row of tabs on the dark strip that continues the app's top bar (page headers, machines): light text, the open tab
// white and bold with a red line under it. Scrolls sideways when the tabs don't fit.
export const StyledSubTabs = ({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) => {
    return (
        <Stack
            direction='row'
            role='tablist'
            sx={{
                minHeight: '3rem',
                overflowX: 'auto',
                overflowY: 'hidden',
                flexShrink: 0,
                scrollbarWidth: 'thin',
                backgroundColor: 'var(--background-primary)',
                ...(sx as object),
            }}
        >
            {children}
        </Stack>
    );
};

const activeLine = 'inset 0 -3px 0 var(--mui-palette-primary-main)';

// One tab: a link (component={Link} to=...) or a button. active: the tab that is open. count: a small red number
// after the label (e.g. unread messages), hidden when 0; total: a quiet count after the label (how many items the tab
// holds, shown even when 0)
// back: the red "back" block (an arrow) in front of the tabs; its arrow is white, black in dark mode
type StyledSubTabProps<C extends ElementType> = ButtonProps<C, { component?: C }> & {
    active?: boolean;
    back?: boolean;
    count?: number;
    total?: number | null;
};

export const StyledSubTab = <C extends ElementType = 'button'>({ active, back, count, total, children, sx, ...props }: StyledSubTabProps<C>) => {
    // the label in bold, invisible and zero-height under the label itself, keeps every tab as wide as when it's open (bold
    // text is wider), also with a count after the label
    const label =
        typeof children === 'string' ? (
            <Box
                component='span'
                data-label={children}
                sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    '&::after': {
                        content: 'attr(data-label)',
                        fontWeight: 700,
                        height: 0,
                        visibility: 'hidden',
                        overflow: 'hidden',
                        userSelect: 'none',
                        pointerEvents: 'none',
                    },
                }}
            >
                {children}
            </Box>
        ) : (
            children
        );
    return (
        <Button
            color='inherit'
            role='tab'
            aria-selected={active ? 'true' : 'false'}
            aria-current={active ? 'page' : undefined}
            sx={{
                minWidth: 0,
                px: 2,
                borderRadius: 0,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                flexDirection: 'column',
                justifyContent: 'center',
                color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: active ? 700 : 400,
                boxShadow: active ? activeLine : 'none',
                transition: 'color 150ms, box-shadow 150ms, background-color 150ms',
                '&:hover': {
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    boxShadow: active ? activeLine : 'inset 0 -3px 0 rgba(255, 255, 255, 0.3)',
                },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-2px' },
                ...(back && {
                    px: 1.5,
                    backgroundColor: 'primary.main',
                    color: '#ffffff',
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: 'primary.dark', color: '#ffffff', boxShadow: 'none' },
                    '[data-theme="dark"] &, [data-theme="dark"] &:hover': { color: '#000000' },
                }),
                ...(sx as object),
            }}
            {...(props as ButtonProps)}
        >
            {count ? (
                <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {label}
                    <Box
                        component='span'
                        aria-label={`nepřečtené: ${count}`}
                        sx={{
                            ml: 1,
                            minWidth: '1.25rem',
                            px: 0.5,
                            lineHeight: '1.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            borderRadius: '999px',
                            bgcolor: 'primary.main',
                            color: '#ffffff',
                        }}
                    >
                        {count > 99 ? '99+' : count}
                    </Box>
                </Box>
            ) : total != null ? (
                <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {label}
                    <StyledCount total={total} />
                </Box>
            ) : (
                label
            )}
        </Button>
    );
};
