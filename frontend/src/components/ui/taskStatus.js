import { taskStatusColors, userStatusColors } from './theme';
import { useColorMode } from './useColorMode';

// The status of a task: 'finished', 'blocked' (not finished, and some of its prerequisites are not finished yet),
// 'inProgress' (not finished, and someone has the timer running on it or has already logged time on it) or 'todo'.
// The backend sends these counts in _count (taskProgressCount; _count.Successors = unfinished prerequisites).
// Personal tasks are finished or todo.
export const taskStatus = (task) => {
    if (task.Finished) return 'finished';
    if (task._count?.Successors) return 'blocked';
    if (task._count?.WorkingUsers || task._count?.UserTaskTime) return 'inProgress';
    return 'todo';
};

// The status of a project: 'finished', 'inProgress' while someone has the timer running on one of its tasks (the
// backend sends WorkingSince, when the earliest of those timers started) or 'todo' (not finished, nobody working on it).
// Projects are never 'blocked'.
export const projectStatus = (project) => {
    if (project.Finished) return 'finished';
    if (project.WorkingSince) return 'inProgress';
    return 'todo';
};

// What a project's status is called (its colours and icons are the task ones)
export const projectStatusLabels = {
    finished: 'Dokončen',
    inProgress: 'Pracuje se',
    todo: 'Nikdo nepracuje',
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
    blocked: 'Čeká na předchozí úkoly',
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
