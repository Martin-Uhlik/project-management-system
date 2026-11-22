import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from './config';
import Navigation from './components/Navigation';
import { Header } from './components/Header';
import { Provider } from 'jotai';
import { Notifications } from './components/Notifications';
import { Dialogs } from './components/Dialogs';
import Cookies from 'js-cookie';
import { LiveUpdates } from './state/live';
import { SettleFields } from './components/ui';
import { clearCache, prefetchStart } from './state/query';

// The session lives in an httpOnly cookie that the backend sets on sign-in and the browser sends with every request
// (axios.defaults.withCredentials, see index.jsx); scripts on the page can't read it.
export const getAuthHeader = () => {
    return { withCredentials: true };
};

// Who is signed in: a plain cookie the backend sets next to the session cookie (for display only, never trusted)
export const getUserID = () => {
    return Cookies.get('user_id');
};

// The cached data (state/query.js) belongs to one signed-in user. This check runs again on every page change, so the
// cache starts only when someone else signed in: it's emptied (nobody sees the previous user's data in this tab) and
// the data most pages show starts loading, once.
let cacheUserID = null;
const startCache = (userID) => {
    if (userID === cacheUserID) return;
    cacheUserID = userID;
    clearCache();
    prefetchStart(userID);
};

// Everything under /auth is for signed-in users only: nothing of it shows until the backend confirms the session.
// Without one (or when the server can't be reached) the browser goes to the sign-in page.
const useSession = () => {
    const navigate = useNavigate();
    const [signedIn, setSignedIn] = useState(false);
    useEffect(() => {
        let active = true;
        axios
            .get(getBackendAddress('/auth/me'))
            .then(() => {
                if (!active) return;
                startCache(getUserID());
                setSignedIn(true);
            })
            .catch(() => active && navigate('/', { replace: true }));
        return () => {
            active = false;
        };
    }, [navigate]);
    return signedIn;
};

export const Auth = () => {
    const signedIn = useSession();
    if (!signedIn) return null;
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
