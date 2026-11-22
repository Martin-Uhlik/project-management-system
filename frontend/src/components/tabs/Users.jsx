import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Navigate } from 'react-router';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom, userAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { UserSettings } from './users/UserSettings';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { StyledAddButton, StyledBoxHeader } from '../ui';
import { UserTable } from '../utils/tables/UserTable';
import { ListFiltersButton } from '../utils/ListFiltersButton';
import { useListFilters } from '../../state/listFilters';

const noUsers = [];

// Managing the workers' accounts: admins only (the backend allows the changes to admins only too). The workers' work time
// and tasks are in Statistiky.
export const Users = () => {
    const me = useAtomValue(userAtom);
    const setTab = useSetAtom(selectedTabAtom);
    const setDialog = useSetAtom(dialogAtom);
    React.useEffect(() => {
        setTab('Pracovníci');
    });
    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const isAdmin = me?.UserType === 'ADMIN';
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: users = noUsers } = useApi('/auth/users', { topics: ['users'], enabled: isAdmin });
    // the gear picks whether deactivated accounts are listed
    const { filters } = useListFilters('users');
    const shownUsers = React.useMemo(() => (filters.showDisabled ? users : users.filter((user) => user.Enabled)), [users, filters]);
    // the user clicked in the list, else the first one listed
    const [chosenUser, setSelectedUser] = React.useState(null);
    const selectedUser = chosenUser ?? shownUsers[0] ?? null;

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
                        <StyledBoxHeader
                            title='Pracovníci'
                            add={<StyledAddButton label='Přidat pracovníka' onClick={handleAddUser} />}
                            settings={<ListFiltersButton list='users' />}
                        />
                        <UserTable users={shownUsers} allUsers={users} setSelectedUser={setSelectedUser} />
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
