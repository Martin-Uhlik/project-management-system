import { useState } from 'react';
import Typography from '@mui/material/Typography';
import dayjs from '../../dayjs';
import { useApi } from '../../state/query';
import { WorkPlanChart } from '../utils/WorkPlanChart';
import { WorkTimeChart, weekLabels } from '../utils/WorkTimeChart';
import { AssignedTasks } from '../tabs/overview/AssignedTasks';
import { StyledWeekPicker, formatMinutes } from '../ui';

// minutes worked on the machine on each day of the week (Monday first); a session over midnight counts on both days
const minutesByDay = (sessions, week) =>
    Array.from({ length: 7 }, (_, index) => {
        const dayStart = week.add(index, 'day');
        const dayEnd = dayStart.add(1, 'day');
        return (sessions ?? []).reduce((total, session) => {
            const start = dayjs.max(dayjs(session.StartTime), dayStart);
            const stop = dayjs.min(dayjs(session.StopTime), dayEnd);
            return stop.isAfter(start) ? total + stop.diff(start, 'minute', true) : total;
        }, 0);
    });

// A machine's "Úkoly" tab: the tasks queued on it, their production plan and the time worked on it per day (the days
// it stood still show as gaps)
export const MachineTasks = ({ machine }) => {
    const [planWeek, setPlanWeek] = useState(() => dayjs().startOf('isoWeek'));
    const [workWeek, setWorkWeek] = useState(() => dayjs().startOf('isoWeek'));
    const { data: sessions } = useApi(`/auth/machines/${machine.ID}/work`, {
        params: { from: workWeek.toISOString(), to: workWeek.add(1, 'week').toISOString() },
        topics: ['machines', 'users'],
    });
    const minutes = minutesByDay(sessions, workWeek);
    const total = minutes.reduce((sum, value) => sum + value, 0);
    // working days (Monday to Friday) of the week that are over, with no time on the machine
    const idleDays = minutes.filter((value, index) => index < 5 && value === 0 && workWeek.add(index + 1, 'day').isBefore(dayjs())).length;

    return (
        <div className='content-2-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <div className='content-box_header'>
                        <h1>Fronta výroby</h1>
                    </div>
                    <AssignedTasks showHeader={false} machineTasks={machine.Task} />
                </div>
            </div>
            <div className='content-2-row'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>Harmonogram výroby</h1>
                            <StyledWeekPicker value={planWeek} onChange={setPlanWeek} />
                        </div>
                        <div className='content-box_chart-wrapper-outer'>
                            <div className='content-box_chart-wrapper-inner'>
                                <WorkPlanChart tasks={machine.Task} week={planWeek} labels={weekLabels(planWeek)} />
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
                        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            Celkem {formatMinutes(total)}
                            {idleDays > 0
                                ? ` · ${idleDays} ${idleDays === 1 ? 'pracovní den' : idleDays < 5 ? 'pracovní dny' : 'pracovních dní'} bez práce`
                                : ''}
                        </Typography>
                        <div className='content-box_chart-wrapper-outer'>
                            <div className='content-box_chart-wrapper-inner'>
                                <WorkTimeChart minutes={minutes} labels={weekLabels(workWeek)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
