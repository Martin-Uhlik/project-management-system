import { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from '../config';
import { ButtonRow, FormStack, StyledAlert, StyledButton, StyledInput } from './ui';

export const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = (event) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        axios
            .post(getBackendAddress('/login'), {
                name: event.target.name.value,
                password: event.target.password.value,
            })
            .then(() => {
                // the backend has set the session cookies
                navigate('/auth/overview');
            })
            .catch((err) => {
                // the backend explains what went wrong (wrong name or password, blocked user, too many attempts)
                setError(err.response?.data?.errorMessage ?? 'Nepodařilo se spojit se serverem. Zkuste to znovu.');
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <div className='login'>
            <div className='login_left'>
                <img className='login_logo' src='images/logo-adamdesign.svg' alt='ADAM DESIGN' />
                <div className='login_box'>
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
                </div>
            </div>
            <div className='login_right content-wrap'></div>
        </div>
    );
};
