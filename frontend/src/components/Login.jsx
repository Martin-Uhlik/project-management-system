import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from '../config';
import { ButtonRow, FormStack, StyledAlert, StyledButton, StyledInput, StyledToggle } from './ui';

// the demo roles on their buttons (backend/src/sso.ts)
const ROLE_LABELS = { USER: 'Pracovník', MANAGER: 'Vedoucí' };

// the switch: 0 = the demo accounts, 1 = the password form
const DEMO = 0;

export const Login = () => {
    const navigate = useNavigate();
    // ?sso=failed: the sign-in link from martin-uhlik.cz didn't work (expired or already used, see backend/src/sso.ts)
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(() =>
        searchParams.get('sso') === 'failed' ? 'Přihlašovací odkaz vypršel nebo už byl použit. Otevřete demo znovu z martin-uhlik.cz.' : null,
    );
    const [submitting, setSubmitting] = useState(false);
    // The demo accounts, offered to a browser that came from martin-uhlik.cz (it holds a demo pass); null = none, so
    // only the password form shows. The switch picks between them and the password form (e.g. for the admin).
    const [demoAccounts, setDemoAccounts] = useState(null);
    const [mode, setMode] = useState(DEMO);

    useEffect(() => {
        axios
            .get(getBackendAddress('/demo-accounts'))
            .then((res) => setDemoAccounts(res.data.length ? res.data : null))
            .catch(() => setDemoAccounts(null));
    }, []);

    const signIn = (request) => {
        setError(null);
        setSubmitting(true);
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

    const handleLogin = (event) => {
        event.preventDefault();
        signIn(axios.post(getBackendAddress('/login'), { name: event.target.name.value, password: event.target.password.value }));
    };

    const showDemo = demoAccounts && mode === DEMO;

    return (
        <div className='login'>
            <div className='login_left'>
                <img className='login_logo' src='images/logo-adamdesign.svg' alt='ADAM DESIGN' />
                <div className='login_box'>
                    <FormStack>
                        {demoAccounts ? <StyledToggle options={['Demo účty', 'Heslo']} value={mode} onChange={setMode} /> : null}
                        {showDemo ? (
                            <FormStack>
                                {demoAccounts.map((account) => (
                                    <StyledButton
                                        key={account.role}
                                        disabled={submitting}
                                        onClick={() => signIn(axios.post(getBackendAddress('/demo-login'), { role: account.role }))}
                                    >
                                        {ROLE_LABELS[account.role] ?? account.role}: {account.name}
                                        {account.position ? ` (${account.position})` : ''}
                                    </StyledButton>
                                ))}
                                {error ? <StyledAlert>{error}</StyledAlert> : null}
                            </FormStack>
                        ) : (
                            <FormStack component='form' onSubmit={handleLogin}>
                                <StyledInput id='name' label='Uživatelské jméno' autoComplete='username' onDark />
                                <StyledInput id='password' label='Heslo' type='password' autoComplete='current-password' onDark />
                                {error ? <StyledAlert>{error}</StyledAlert> : null}
                                <ButtonRow>
                                    <StyledButton type='submit' disabled={submitting}>
                                        Přihlásit se
                                    </StyledButton>
                                </ButtonRow>
                            </FormStack>
                        )}
                    </FormStack>
                </div>
            </div>
            <div className='login_right content-wrap'></div>
        </div>
    );
};
