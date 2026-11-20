import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import { UserSettings } from './users/UserSettings';
import { UserActivity } from './users/UserActivity';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { StyledToggle, StyledAddButton } from '../ui';
import { UserTable } from '../utils/tables/UserTable';
import { RestrictedComponent } from '../utils/RestrictedComponent';

export const Users = () => {
    const setTab = useSetAtom(selectedTabAtom);
    const setDialog = useSetAtom(dialogAtom);
    React.useEffect(() => {
        setTab('Pracovníci');
    });
    const [selectedButton, setSelectedButton] = React.useState(0);
    const [tick, setTick] = useAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [users, setUsers] = React.useState([]);
    const [selectedUser, setSelectedUser] = React.useState(null);

    useEffect(() => {
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
    }, [tick]);

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

    return (
        <div className='content-wrap_inner'>
            <div className='content-2-column'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>Pracovníci</h1>
                            <RestrictedComponent types={['ADMIN']}>
                                <StyledAddButton label='Přidat pracovníka' onClick={handleAddUser} />
                            </RestrictedComponent>
                        </div>
                        <UserTable users={users} setSelectedUser={setSelectedUser} />
                    </div>
                </div>

                <div className='content-box'>
                    <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                        <StyledToggle options={['Aktivita pracovníka', 'Nastavení pracovníka']} value={selectedButton} onChange={setSelectedButton} />
                    </RestrictedComponent>
                    <div className='content-box_content'>
                        {selectedButton === 0 ? <UserActivity user={selectedUser} /> : <UserSettings user={selectedUser} users={users} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
