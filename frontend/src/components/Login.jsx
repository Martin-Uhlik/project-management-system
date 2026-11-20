import { useNavigate } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from '../config';

export const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (event) => {
        event.preventDefault();
        axios
            .post(getBackendAddress('/login'), {
                name: event.target.name.value,
                password: event.target.password.value,
            })
            .then(() => {
                // the backend has set the session cookies
                navigate('/auth/overview');
            });
    };

    return (
        <div className='login'>
            <div className='login_left'>
                <img className='login_logo' src='images/logo-adamdesign.svg' alt='ADAM DESIGN' />
                <div className='login_box'>
                    <form className='login-form text-white' onSubmit={handleLogin}>
                        <div className='form-group'>
                            <label htmlFor='name'> Uživatelské jméno:</label>
                            <input className='form-control' type='text' id='name' name='name' placeholder='Zadejte jméno' />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='password'> Heslo:</label>
                            <input className='form-control' type='password' id='password' name='password' placeholder='Zadejte heslo' />
                        </div>
                        <div className='d-flex justify-content-end'>
                            <button className='btn btn-danger login_button' type='submit'>
                                Přihlásit se
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className='login_right content-wrap'></div>
        </div>
    );
};
