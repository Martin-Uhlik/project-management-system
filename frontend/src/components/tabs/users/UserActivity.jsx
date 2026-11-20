import { useEffect, useState } from 'react';
import { AssignedTasks } from '../overview/AssignedTasks';
import { WorkPlanChart } from '../../utils/WorkPlanChart';
import dayjs from '../../../dayjs';
import { getAuthHeader } from '../../../Auth';
import { useAtom, useAtomValue } from 'jotai';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { handleAxiosError } from '../../../errorHandler';
import Divider from '@mui/material/Divider';
import { FormStack, StyledInput } from '../../ui';

export const UserActivity = (props) => {
    const selectedUser = props.user;

    const tick = useAtomValue(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (selectedUser) {
            axios
                .get(getBackendAddress(`/auth/users/${selectedUser.ID}`), getAuthHeader())
                .then((response) => {
                    setUser(response.data);
                })
                .catch((error) => {
                    handleAxiosError(error, [notifications, setNotifications]);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, selectedUser]);

    return (
        <>
            <h1>{`${user?.FirstName} ${user?.LastName}`}</h1>
            <h2>Aktuální práce:</h2>
            <FormStack>
                <StyledInput id='workStart' label='Začátek práce' value={user?.WorkStartTime ? dayjs(user.WorkStartTime).format('LLL') : ''} disabled />
                <StyledInput id='currentTask' label='Aktuální úkol' value={user?.CurrentTaskID?.toString() ?? ''} disabled />
            </FormStack>
            <Divider />
            <h2>Plán práce:</h2>
            <div className='min-vh-25'>
                <div className='content-box_chart-wrapper-outer'>
                    <div className='content-box_chart-wrapper-inner'>
                        <WorkPlanChart tasks={user?.User_Task?.map((task) => task.Task)} />
                    </div>
                </div>
            </div>
            <Divider />
            <h2>Přířazené úkoly:</h2>
            <AssignedTasks showHeader={false} userID={user?.ID} />
        </>
    );
};
