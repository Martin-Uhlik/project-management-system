import React, { useEffect, useState } from 'react';
import { AssignedTasks } from './overview/AssignedTasks';
import { MyTasks } from './overview/MyTasks';
import { useAtom, useSetAtom } from 'jotai';
import { notificationsAtom, selectedTabAtom } from '../../state/atoms';
import { useLive } from '../../state/live';
import { WorkTimeChart } from '../utils/WorkTimeChart';
import { WorkPlanChart } from '../utils/WorkPlanChart';
import { getAuthHeader, getUserID } from '../../Auth';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { StyledToggle, StyledWeekPicker } from '../ui';
import { filterTasks, useTaskFilters } from '../../state/taskFilters';

const weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
// the rows / bars of a week chart: the weekday and its date ("Po 16. 11.")
const weekLabels = (week) => weekdays.map((day, index) => `${day} ${week.add(index, 'day').format('D. M.')}`);

export const Overview = () => {
    const [selectedButton, setSelectedButton] = React.useState(0);
    const setTab = useSetAtom(selectedTabAtom);

    React.useEffect(() => {
        setTab('Přehled');
    });

    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive(`user:${getUserID()}`, `personal-tasks:${getUserID()}`);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [user, setUser] = useState(null);
    // the weeks the two charts show (their Mondays); each has its own picker
    const [planWeek, setPlanWeek] = useState(() => dayjs().startOf('isoWeek'));
    const [workWeek, setWorkWeek] = useState(() => dayjs().startOf('isoWeek'));

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/users/${getUserID()}`), { ...getAuthHeader(), params: { weekStart: workWeek.toISOString() } })
            .then((response) => {
                setUser(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, workWeek]);

    // how many tasks each toggle button's list shows (after the task filters), shown on the button
    const { filters } = useTaskFilters();
    const [taskLists, setTaskLists] = useState(null);
    useEffect(() => {
        const userID = getUserID();
        Promise.all([
            axios.get(getBackendAddress(`/auth/${userID}/tasks`), getAuthHeader()),
            axios.get(getBackendAddress(`/auth/${userID}/personal-tasks`), getAuthHeader()),
        ])
            .then(([assigned, personal]) => setTaskLists([assigned.data.map((item) => item.Task), personal.data]))
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const taskCounts = taskLists ? taskLists.map((tasks) => filterTasks(tasks, filters).length) : [null, null];

    // minutes worked on each day of the chosen week (Monday first)
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
                    <div className='content-box_content'>
                        {selectedButton === 0 ? <AssignedTasks showHeader={true} filterable userID={getUserID()} /> : <MyTasks />}
                    </div>
                </div>
                <div className='content-2-row'>
                    <div className='content-box'>
                        <div className='content-box_content'>
                            <div className='content-box_header'>
                                <h1>Můj harmonogram</h1>
                                <StyledWeekPicker value={planWeek} onChange={setPlanWeek} />
                            </div>
                            <div className='content-box_chart-wrapper-outer'>
                                <div className='content-box_chart-wrapper-inner'>
                                    <WorkPlanChart tasks={user?.User_Task?.map((task) => task.Task)} week={planWeek} labels={weekLabels(planWeek)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='content-box'>
                        <div className='content-box_content'>
                            <div className='content-box_header'>
                                <h1>Odpracovaný čas</h1>
                                <StyledWeekPicker value={workWeek} onChange={setWorkWeek} />
                            </div>
                            <div className='content-box_chart-wrapper-outer'>
                                <div className='content-box_chart-wrapper-inner'>
                                    <WorkTimeChart minutes={workTimeMinutes} labels={weekLabels(workWeek)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
