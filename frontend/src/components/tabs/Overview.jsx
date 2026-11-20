import React, { useEffect, useState } from 'react';
import { AssignedTasks } from './overview/AssignedTasks';
import { MyTasks } from './overview/MyTasks';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import { WorkTimeChart } from '../utils/WorkTimeChart';
import { WorkPlanChart } from '../utils/WorkPlanChart';
import { getAuthHeader, getUserID } from '../../Auth';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { StyledToggle } from '../ui';

export const Overview = () => {
    const [selectedButton, setSelectedButton] = React.useState(0);
    const setTab = useSetAtom(selectedTabAtom);

    React.useEffect(() => {
        setTab('Přehled');
    });

    const tick = useAtomValue(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [user, setUser] = useState(null);

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
    }, [tick]);

    // how many tasks each toggle button's list holds, shown on the button
    const [taskCounts, setTaskCounts] = useState([null, null]);
    useEffect(() => {
        const userID = getUserID();
        Promise.all([
            axios.get(getBackendAddress(`/auth/${userID}/tasks`), getAuthHeader()),
            axios.get(getBackendAddress(`/auth/${userID}/personal-tasks`), getAuthHeader()),
        ])
            .then(([assigned, personal]) => setTaskCounts([assigned.data.length, personal.data.length]))
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    // minutes worked on each day of this week (Monday first)
    const workTimeMinutes = [0, 0, 0, 0, 0, 0, 0];
    user?.WorkTime.forEach((time) => {
        const startTime = dayjs(time.StartTime);
        workTimeMinutes[startTime.isoWeekday() - 1] += dayjs(time.StopTime ?? undefined).diff(startTime, 'minute', true);
    });

    return (
        <div className='content-wrap_inner'>
            <div className='content-2-column'>
                <div className='content-box'>
                    <StyledToggle options={['Přidělené úkoly', 'Vlastní úkoly']} value={selectedButton} onChange={setSelectedButton} counts={taskCounts} />
                    <div className='content-box_content'>{selectedButton === 0 ? <AssignedTasks showHeader={true} userID={getUserID()} /> : <MyTasks />}</div>
                </div>
                <div className='content-2-row'>
                    <div className='content-box'>
                        <div className='content-box_content'>
                            <h1>Můj harmonogram</h1>
                            <div className='content-box_chart-wrapper-outer'>
                                <div className='content-box_chart-wrapper-inner'>
                                    <WorkPlanChart tasks={user?.User_Task?.map((task) => task.Task)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='content-box'>
                        <div className='content-box_content'>
                            <h1>Odpracovaný čas</h1>
                            <div className='content-box_chart-wrapper-outer'>
                                <div className='content-box_chart-wrapper-inner'>
                                    <WorkTimeChart minutes={workTimeMinutes} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
