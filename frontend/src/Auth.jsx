import { Outlet } from 'react-router';
import Navigation from './components/Navigation';
import { Header } from './components/Header';
import { Provider } from 'jotai';
import { Notifications } from './components/Notifications';
import { Dialogs } from './components/Dialogs';
import Cookies from 'js-cookie';
import { LiveUpdates } from './state/live';
import { SettleFields } from './components/ui';

// The session lives in an httpOnly cookie that the backend sets on sign-in and the browser sends with every request
// (axios.defaults.withCredentials, see index.jsx); scripts on the page can't read it.
export const getAuthHeader = () => {
    return { withCredentials: true };
};

// Who is signed in: a plain cookie the backend sets next to the session cookie (for display only, never trusted)
export const getUserID = () => {
    return Cookies.get('user_id');
};

export const Auth = () => {
    return (
        <Provider>
            <div className='wrapper'>
                <Header />
                <div className='main'>
                    <Navigation />
                    <div className='content-wrap'>
                        <Outlet />
                        <Notifications />
                    </div>
                </div>
            </div>
            <Dialogs />
            <LiveUpdates />
            <SettleFields />
        </Provider>
    );
};
