import { useState } from 'react';
import { Link } from 'react-router';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { AccountIcon, ChevronDownIcon, CogIcon, LogoutIcon } from './icons';
import { StyledThemeSelect } from './StyledThemeSelect';

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');

// The signed-in user in the header: an icon and their name; a click opens a menu with who they are, the look
// (light / dark / as the system), a link to the settings and signing out.
// name: shown on the button and in the menu, detail: the smaller line under it (e.g. 'admin · Administrátor')
export const StyledUserMenu = ({ name, detail, settingsLink, onLogout }: { name: string; detail?: string; settingsLink?: string; onLogout: () => void }) => {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => setAnchor(null);

    return (
        <>
            <Button
                color='inherit'
                onClick={(event) => setAnchor(event.currentTarget)}
                aria-haspopup='menu'
                aria-expanded={Boolean(anchor)}
                aria-controls={anchor ? 'user-menu' : undefined}
                aria-label={`Uživatel ${name}`}
                startIcon={<AccountIcon sx={{ fontSize: '2rem !important' }} />}
                endIcon={<ChevronDownIcon sx={{ transition: 'transform 0.2s', transform: anchor ? 'rotate(180deg)' : 'none' }} />}
                sx={{
                    color: 'var(--icons-primary)',
                    borderRadius: '0.5rem',
                    px: { xs: 0.5, md: 1.5 },
                    minWidth: 0,
                    // on a phone only the icon shows (no name, no arrow), leaving room for the timer and the chat icon
                    '& .MuiButton-endIcon': { display: { xs: 'none', md: 'inherit' } },
                    '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 } },
                    backgroundColor: anchor ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
                }}
            >
                {/* on a phone only the icon shows */}
                <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}>
                    {name}
                </Box>
            </Button>
            <Menu
                id='user-menu'
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { width: '21rem', maxWidth: 'calc(100vw - 2rem)', mt: 1, borderRadius: '8px' } }, list: { sx: { py: 0 } } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, p: 2.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 'bold', width: 48, height: 48 }}>{initials(name)}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '1.05rem' }} noWrap>
                            {name}
                        </Typography>
                        {detail ? (
                            <Typography variant='body2' color='text.secondary' noWrap>
                                {detail}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
                <Divider />
                <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Typography variant='overline' color='text.secondary' sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                        Vzhled
                    </Typography>
                    <StyledThemeSelect />
                </Box>
                <Divider />
                <Box sx={{ p: 1 }}>
                    {settingsLink ? (
                        <MenuItem component={Link} to={settingsLink} onClick={close} sx={{ borderRadius: '6px', py: 1.25 }}>
                            <ListItemIcon>
                                <CogIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText>Nastavení účtu</ListItemText>
                        </MenuItem>
                    ) : null}
                    <MenuItem
                        onClick={() => {
                            close();
                            onLogout();
                        }}
                        sx={{ borderRadius: '6px', py: 1.25, color: 'primary.main', fontWeight: 'bold' }}
                    >
                        <ListItemIcon sx={{ color: 'inherit' }}>
                            <LogoutIcon fontSize='small' />
                        </ListItemIcon>
                        <ListItemText slotProps={{ primary: { sx: { fontWeight: 'bold' } } }}>Odhlásit se</ListItemText>
                    </MenuItem>
                </Box>
            </Menu>
        </>
    );
};
