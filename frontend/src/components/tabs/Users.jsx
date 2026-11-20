import React, { useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Navigate } from 'react-router';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom, userAtom } from '../../state/atoms';
import { useLive } from '../../state/live';
import { UserSettings } from './users/UserSettings';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { StyledAddButton } from '../ui';
import { UserTable } from '../utils/tables/UserTable';

// Managing the workers' accounts: admins only (the backend allows the changes to admins only too). The workers' work time
// and tasks are in Statistiky.
export const Users = () => {
    const me = useAtomValue(userAtom);
    const setTab = useSetAtom(selectedTabAtom);
    const setDialog = useSetAtom(dialogAtom);
    React.useEffect(() => {
        setTab('Pracovníci');
    });
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive('users');
    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [users, setUsers] = React.useState([]);
    const [selectedUser, setSelectedUser] = React.useState(null);

    const isAdmin = me?.UserType === 'ADMIN';
    useEffect(() => {
        if (!isAdmin) return;
        axios
            .get(getBackendAddress(`/auth/users`), getAuthHeader())
            .then((response) => {
                setUsers(response.data);
                if (!selectedUser) {
                    setSelectedUser(response.data[0]);
                }
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, isAdmin]);

    const addUser = (user) => {
        axios
            .post(getBackendAddress(`/auth/users`), { user }, getAuthHeader())
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleAddUser = () => {
        setDialog({
            type: 'AddUser',
            data: {
                users,
                handleSubmit: addUser,
                handleCancel: () => {},
            },
        });
    };

    // the signed-in user loads with the header; anyone but an admin is sent to the overview
    if (me && !isAdmin) return <Navigate to='/auth/overview' replace />;
    if (!me) return null;

    return (
        <div className='content-wrap_inner'>
            <div className='content-2-column'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>Pracovníci</h1>
                            <StyledAddButton label='Přidat pracovníka' onClick={handleAddUser} />
                        </div>
                        <UserTable users={users} setSelectedUser={setSelectedUser} />
                    </div>
                </div>

                <div className='content-box'>
                    <div className='content-box_content'>
                        <UserSettings user={selectedUser} users={users} />
                    </div>
                </div>
            </div>
        </div>
    );
};
