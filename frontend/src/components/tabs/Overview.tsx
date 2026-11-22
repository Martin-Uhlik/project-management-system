import React, { useState } from 'react';
import { AssignedTasks } from './overview/AssignedTasks';
import { MyTasks } from './overview/MyTasks';
import { useSetAtom } from 'jotai';
import { selectedTabAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { WorkTimeChart, weekLabels } from '../utils/WorkTimeChart';
import { WorkPlanChart } from '../utils/WorkPlanChart';
import { getUserID } from '../../Auth';
import dayjs from '../../dayjs';
import { StyledToggle, StyledWeekPicker } from '../ui';
import { filterTasks, useTaskFilters } from '../../state/taskFilters';
import type { AssignedTaskRow, PrivateTask, UserWithWeek } from '../../types';

export const Overview = () => {
    const [selectedButton, setSelectedButton] = React.useState(0);
    const setTab = useSetAtom(selectedTabAtom);

    React.useEffect(() => {
        setTab('Přehled');
    });

    // the weeks the two charts show (their Mondays); each has its own picker
    const [planWeek, setPlanWeek] = useState(() => dayjs().startOf('isoWeek'));
    const [workWeek, setWorkWeek] = useState(() => dayjs().startOf('isoWeek'));

    // reloaded when someone changes this data (live updates) or after a change made here
    const userID = getUserID();
    const user = useApi<UserWithWeek>(`/auth/users/${userID}`, {
        params: { weekStart: workWeek.toISOString() },
        topics: [`user:${userID}`, `personal-tasks:${userID}`],
    }).data;

    // how many tasks each toggle button's list shows (after the task filters), shown on the button; the same lists as
    // the tables below, so they are loaded once
    const { filters } = useTaskFilters();
    const assigned = useApi<AssignedTaskRow[]>(`/auth/${userID}/tasks`, { topics: [`user:${userID}`] }).data;
    const personal = useApi<PrivateTask[]>(`/auth/${userID}/personal-tasks`, { topics: [`personal-tasks:${userID}`] }).data;
    const taskCounts =
        assigned && personal
            ? [assigned.map((item) => item.Task), personal].map((tasks) => filterTasks<{ Finished: boolean }>(tasks, filters).length)
            : [null, null];

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
                        {selectedButton === 0 ? <AssignedTasks showHeader={true} filterList='tasks' userID={getUserID()} /> : <MyTasks />}
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
