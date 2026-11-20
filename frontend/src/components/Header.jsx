import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, showNavAtom, userAtom } from '../state/atoms';
import { Timer } from './Timer';
import axios from 'axios';
import { getAuthHeader, getUserID } from '../Auth';
import { getBackendAddress } from '../config';
import { handleAxiosError } from '../errorHandler';

export const Header = () => {
    const [user, setUser] = useAtom(userAtom);
    const [showNav, setShowNav] = useAtom(showNavAtom);
    const navigate = useNavigate();
    const setDialog = useSetAtom(dialogAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/users/${getUserID()}`), getAuthHeader())
            .then((response) => {
                setUser(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const logout = () => {
        axios.post(getBackendAddress('/auth/logout'), {}, getAuthHeader()).then(() => {
            // the backend has cleared the session cookies
            navigate('/');
        });
    };

    const handleLogout = () => {
        if (user.WorkStartTime) {
            setDialog({
                type: 'ConfirmDialog',
                data: {
                    title: 'Časovač stále spuštěn!',
                    description: 'Chcete se odhlásit i přes to, že je časovač stále spuštěn?',
                    handleSuccess: logout,
                    handleCancel: () => {},
                },
            });
        } else {
            logout();
        }
    };

    const handleShowMenu = () => {
        setShowNav(!showNav);
    };

    return (
        <div className='header'>
            <button
                type='button'
                className='header_show-menu'
                onClick={handleShowMenu}
                aria-label='Menu'
                aria-expanded={showNav}
                aria-controls='main-navigation'
            >
                <img className='logo-a' src='/images/logo-a.svg' alt='' />
            </button>
            <Timer />
            <div className='logout'>
                <span className='menu-text menu-text-md'>{`${user?.FirstName} ${user?.LastName}`}</span>
                <button type='button' onClick={handleLogout}>
                    <img className='menu-icon' src='/icons/logout.svg' alt='Odhlásit se' />
                </button>
            </div>
        </div>
    );
};
