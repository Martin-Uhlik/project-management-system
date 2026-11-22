import { Fragment } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { StyledSubTab, StyledSubTabs } from './StyledSubTabs';
import { ChevronRightIcon } from './icons';
import { StyledChip } from './StyledChip';
import { taskStatusColors } from './theme';
import { statusLabels } from './taskStatus';

// text colours on the header's dark background (the same in light and dark mode, like the top bar)
const onDark = {
    secondary: 'rgba(255, 255, 255, 0.7)',
    quiet: 'rgba(255, 255, 255, 0.5)',
    skeleton: 'rgba(255, 255, 255, 0.12)',
    error: '#ff8787',
};

// The top of a detail page (a project, a task): where it sits (breadcrumbs back up), its title with a status, a line of
// facts about it (StyledPageHeaderFact), buttons on the right, and the page's tabs along the bottom edge.
// breadcrumbs: [{ label, to }] (links, relative to the page); title: null while loading shows a placeholder;
// tabs may carry a count (e.g. unread chat messages), shown as a small red number after the label;
// status: a task status ('finished', 'inProgress', 'todo', 'blocked') shown as a label next to the title, statusLabel: its text if not
// the usual one; tabs: [{ label, to, value }] (links) with active = the open tab's value; or tabs: [{ label, value }] with onSelect(value)
export const StyledPageHeader = ({ breadcrumbs = [], title, status, statusLabel, facts, actions, tabs, active, onSelect }) => {
    return (
        <Box
            component='header'
            sx={{
                flexShrink: 0,
                // the dark of the top bar, so the header reads as its continuation
                backgroundColor: 'var(--background-primary)',
                color: '#ffffff',
                boxShadow: 'var(--shadow-small)',
                position: 'relative',
                zIndex: 1,
            }}
        >
            <Stack spacing={1} sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: tabs ? 0.5 : 2 }}>
                {breadcrumbs.length > 0 ? (
                    <Stack component='nav' aria-label='Drobečková navigace' direction='row' sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                        {breadcrumbs.map((crumb, index) => (
                            <Fragment key={`${crumb.label}-${index}`}>
                                {index > 0 ? <ChevronRightIcon sx={{ fontSize: '1rem', color: onDark.quiet }} /> : null}
                                <Typography
                                    component={Link}
                                    to={crumb.to}
                                    relative='path'
                                    variant='body2'
                                    sx={{
                                        color: onDark.secondary,
                                        textDecoration: 'none',
                                        '&:hover': { color: '#ffffff', textDecoration: 'underline' },
                                    }}
                                >
                                    {crumb.label ?? <Skeleton width='5rem' sx={{ display: 'inline-block', borderRadius: 0, bgcolor: onDark.skeleton }} />}
                                </Typography>
                            </Fragment>
                        ))}
                    </Stack>
                ) : null}
                <Stack direction='row' sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Stack direction='row' sx={{ alignItems: 'center', gap: 1.5, minWidth: 0, flex: '1 1 auto' }}>
                        <Typography component='h1' sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2, m: 0, overflowWrap: 'anywhere' }}>
                            {title ?? <Skeleton width='12rem' sx={{ borderRadius: 0, bgcolor: onDark.skeleton }} />}
                        </Typography>
                        {status ? (
                            <StyledChip
                                label={statusLabel ?? statusLabels[status]}
                                variant='outlined'
                                // the dark-mode status colours: made for dark backgrounds like this one
                                sx={{ color: taskStatusColors.dark[status], borderColor: taskStatusColors.dark[status] }}
                            />
                        ) : null}
                    </Stack>
                    {actions ? (
                        <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {actions}
                        </Stack>
                    ) : null}
                </Stack>
                {facts ? (
                    <Stack direction='row' sx={{ columnGap: 3, rowGap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {facts}
                    </Stack>
                ) : title === null || title === undefined ? (
                    // still loading: a placeholder line as tall as the facts, so the header doesn't grow when they arrive
                    <Typography variant='body2'>
                        <Skeleton width='20rem' sx={{ maxWidth: '100%', borderRadius: 0, bgcolor: onDark.skeleton }} />
                    </Typography>
                ) : null}
            </Stack>
            {tabs ? (
                <StyledSubTabs sx={{ px: { xs: 0.5, md: 1.5 }, backgroundColor: 'transparent' }}>
                    {tabs.map((tab) =>
                        tab.to !== undefined ? (
                            <StyledSubTab key={tab.value} component={Link} to={tab.to} active={active === tab.value} count={tab.count}>
                                {tab.label}
                            </StyledSubTab>
                        ) : (
                            <StyledSubTab key={tab.value} active={active === tab.value} count={tab.count} onClick={() => onSelect(tab.value)}>
                                {tab.label}
                            </StyledSubTab>
                        ),
                    )}
                </StyledSubTabs>
            ) : null}
        </Box>
    );
};

// One fact in the page header: an icon, a quiet label and its value, e.g. "Termín 12. 12. 2026". color: 'error' for a
// value that needs attention, e.g. a missed deadline
export const StyledPageHeaderFact = ({ icon: Icon, label, children, color }) => {
    if (children === null || children === undefined || children === '') return null;
    return (
        <Stack direction='row' sx={{ alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            {Icon ? <Icon sx={{ fontSize: '1.1rem', color: onDark.quiet }} /> : null}
            <Typography variant='body2' sx={{ color: onDark.secondary }}>
                {label}
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 600, color: color ? onDark[color] : '#ffffff' }}>
                {children}
            </Typography>
        </Stack>
    );
};
