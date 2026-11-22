import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import axios from 'axios';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import { getBackendAddress } from '../config';
import {
    ButtonRow,
    CogIcon,
    FormStack,
    StyledAlert,
    StyledButton,
    StyledDialog,
    StyledFontSizeSelect,
    StyledInput,
    StyledSelect,
    StyledThemeSelect,
} from './ui';

// the demo roles in the list (backend/src/sso.ts)
const ROLE_LABELS = { USER: 'Pracovník', MANAGER: 'Vedoucí' };

// a solid field that stays readable on the red sign-in box, like StyledInput's onDark
const onDarkSelect = {
    variant: 'filled',
    sx: { '& .MuiFilledInput-root, & .MuiFilledInput-root:hover, & .MuiFilledInput-root.Mui-focused': { backgroundColor: 'background.paper' } },
};

// The look before signing in (the same choices as in Settings, kept in this browser)
const LookDialog = ({ onClose }) => (
    <StyledDialog title='Vzhled' onClose={onClose}>
        <FormStack>
            <h2 className='settings_subtitle'>Barevný režim</h2>
            <StyledThemeSelect showLabels />
            <h2 className='settings_subtitle'>Velikost písma</h2>
            <StyledFontSizeSelect showLabels />
            <ButtonRow>
                <StyledButton onClick={onClose}>Zavřít</StyledButton>
            </ButtonRow>
        </FormStack>
    </StyledDialog>
);

export const Login = () => {
    const navigate = useNavigate();
    // ?sso=failed: the sign-in link from martin-uhlik.cz didn't work (expired or already used, see backend/src/sso.ts)
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(() =>
        searchParams.get('sso') === 'failed' ? 'Přihlašovací odkaz vypršel nebo už byl použit. Otevřete demo znovu z martin-uhlik.cz.' : null,
    );
    const [submitting, setSubmitting] = useState(false);
    // the form shows once we know nobody is signed in (a signed-in browser goes straight to the app)
    const [checked, setChecked] = useState(false);
    // The demo accounts, offered to a browser that came from martin-uhlik.cz (it holds a demo pass); null = none, so
    // only the name and password show. The "Demo účty" switch picks between a demo account and name and password.
    const [demoAccounts, setDemoAccounts] = useState(null);
    const [demoOn, setDemoOn] = useState(true);
    const [demoRole, setDemoRole] = useState('');
    const [lookOpen, setLookOpen] = useState(false);

    useEffect(() => {
        let active = true;
        axios
            .get(getBackendAddress('/auth/me'))
            .then(() => active && navigate('/auth/overview', { replace: true }))
            .catch(() => active && setChecked(true));
        axios
            .get(getBackendAddress('/demo-accounts'))
            .then((res) => {
                if (!active || !res.data.length) return;
                setDemoAccounts(res.data);
                setDemoRole(res.data[0].role);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [navigate]);

    const showDemo = !!demoAccounts && demoOn;

    const handleLogin = (event) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        const request = showDemo
            ? axios.post(getBackendAddress('/demo-login'), { role: demoRole })
            : axios.post(getBackendAddress('/login'), { name: event.target.name.value, password: event.target.password.value });
        request
            .then(() => {
                // the backend has set the session cookies
                navigate('/auth/overview');
            })
            .catch((err) => {
                // the backend explains what went wrong (wrong name or password, blocked user, too many attempts,
                // the demo pass ran out)
                setError(err.response?.data?.errorMessage ?? 'Nepodařilo se spojit se serverem. Zkuste to znovu.');
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <div className='login'>
            <IconButton className='login_look' aria-label='Vzhled' title='Vzhled' onClick={() => setLookOpen(true)}>
                <CogIcon />
            </IconButton>
            <div className='login_left'>
                <img className='login_logo' src='images/logo-adamdesign.svg' alt='ADAM DESIGN' />
                <div className='login_box'>
                    {checked ? (
                        <FormStack component='form' onSubmit={handleLogin}>
                            {showDemo ? (
                                <StyledSelect
                                    id='demoRole'
                                    label='Demo účet'
                                    value={demoRole}
                                    onChange={(event) => setDemoRole(event.target.value)}
                                    options={demoAccounts.map((account) => ({
                                        value: account.role,
                                        label: `${ROLE_LABELS[account.role] ?? account.role}: ${account.name}${account.position ? ` (${account.position})` : ''}`,
                                    }))}
                                    {...onDarkSelect}
                                />
                            ) : (
                                <>
                                    <StyledInput id='name' label='Uživatelské jméno' autoComplete='username' onDark />
                                    <StyledInput id='password' label='Heslo' type='password' autoComplete='current-password' onDark />
                                </>
                            )}
                            {error ? <StyledAlert>{error}</StyledAlert> : null}
                            <ButtonRow justify={demoAccounts ? 'space-between' : 'flex-end'}>
                                {demoAccounts ? (
                                    <FormControlLabel
                                        label='Demo účty'
                                        control={
                                            <Switch
                                                checked={demoOn}
                                                onChange={(event) => setDemoOn(event.target.checked)}
                                                // white when on, so it reads on the red box
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#fff', opacity: 0.6 },
                                                }}
                                            />
                                        }
                                        sx={{ color: '#fff', ml: 0 }}
                                    />
                                ) : null}
                                <StyledButton type='submit' disabled={submitting}>
                                    Přihlásit se
                                </StyledButton>
                            </ButtonRow>
                        </FormStack>
                    ) : null}
                </div>
            </div>
            <div className='login_right content-wrap'></div>
            {lookOpen ? <LookDialog onClose={() => setLookOpen(false)} /> : null}
        </div>
    );
};
