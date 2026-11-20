import { taskStatusColors, userStatusColors } from './theme';
import { useColorMode } from './useColorMode';

// The status of a task: 'finished', 'inProgress' (not finished, and someone has the timer running on it or has
// already logged time on it - the backend sends these counts in _count) or 'todo'. Personal tasks are finished or todo.
export const taskStatus = (task) => {
    if (task.Finished) return 'finished';
    if (task._count?.WorkingUsers || task._count?.UserTaskTime) return 'inProgress';
    return 'todo';
};

// The state of a worker: 'disabled' (account switched off), 'working' (timer running) or null
export const userStatus = (user) => {
    if (!user.Enabled) return 'disabled';
    if (user.WorkStartTime) return 'working';
    return null;
};

// What each status (of a task or a worker) is called, for tooltips and screen readers
export const statusLabels = {
    finished: 'Dokončeno',
    inProgress: 'Rozpracováno',
    todo: 'Nezahájeno',
    working: 'Pracuje',
    disabled: 'Zakázán',
};
export const taskStatusLabels = statusLabels;

// The status colours of the colour mode shown now (see taskStatusColors and userStatusColors in theme.js)
export const useStatusColors = () => {
    const { scheme } = useColorMode();
    return { ...taskStatusColors[scheme], ...userStatusColors[scheme] };
};
