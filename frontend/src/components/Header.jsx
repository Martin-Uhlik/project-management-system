import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, showNavAtom, userAtom } from '../state/atoms';
import { useApi } from '../state/query';
import { Timer } from './Timer';
import axios from 'axios';
import { getAuthHeader, getUserID } from '../Auth';
import { getBackendAddress } from '../config';
import { StyledUserMenu } from './ui';
import { userRoleOptions } from './dialogs/AddUser';
import { ChatButton } from './chat/ChatButton';

export const Header = () => {
    const [user, setUser] = useAtom(userAtom);
    const [showNav, setShowNav] = useAtom(showNavAtom);
    const navigate = useNavigate();
    const setDialog = useSetAtom(dialogAtom);
    // reloaded when the user's account or timer changes elsewhere (another tab or device, an admin)
    const { data: me } = useApi(`/auth/users/${getUserID()}`, { topics: [`user:${getUserID()}`] });
    useEffect(() => {
        if (me) setUser(me);
    }, [me, setUser]);

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

    const roleLabel = userRoleOptions.find((option) => option.value === user?.UserType)?.label;

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
                <ChatButton />
                <StyledUserMenu
                    name={user ? `${user.FirstName} ${user.LastName}` : ''}
                    detail={[user?.UserName, roleLabel].filter(Boolean).join(' · ')}
                    settingsLink='/auth/settings'
                    onLogout={handleLogout}
                />
            </div>
        </div>
    );
};
