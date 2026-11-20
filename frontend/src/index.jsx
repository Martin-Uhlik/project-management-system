import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import Cookies from 'js-cookie';
import { App } from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

const documentHeight = () => {
    const doc = document.documentElement;
    doc.style.setProperty('--doc-height', `${window.innerHeight}px`);
};
window.addEventListener('resize', documentHeight);
documentHeight();

// send the session cookie to the backend
axios.defaults.withCredentials = true;
// the session expired or was ended (sign-out elsewhere, password change, blocked account): back to the sign-in page
axios.interceptors.response.use(undefined, (error) => {
    if (error?.response?.status === 401 && !error.config?.url?.endsWith('/login') && window.location.pathname !== '/') {
        Cookies.remove('user_id', { path: '/' });
        window.location.assign('/');
    }
    return Promise.reject(error);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
