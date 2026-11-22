import { useSyncExternalStore } from 'react';
import { taskStatus } from '../components/ui/taskStatus';

// Which tasks the overview's task lists show: finished ones and locked ones (waiting on unfinished prerequisites, see
// taskStatus). Both are shown until the user hides them; the choice is kept in this browser (localStorage 'task-filters').
const STORAGE_KEY = 'task-filters';
const defaults = { showFinished: true, showBlocked: true };

const read = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return { ...defaults, ...(stored && typeof stored === 'object' ? stored : {}) };
    } catch {
        return defaults;
    }
};

let current = read();
const listeners = new Set();
const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const setTaskFilters = (changes) => {
    current = { ...current, ...changes };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
        // private mode / storage blocked: the choice still applies until the page is reloaded
    }
    listeners.forEach((listener) => listener());
};

// filters: { showFinished, showBlocked }; hiding: true when either kind is hidden
export const useTaskFilters = () => {
    const filters = useSyncExternalStore(subscribe, () => current);
    return { filters, setTaskFilters, hiding: !filters.showFinished || !filters.showBlocked };
};

// The tasks the filters let through
export const filterTasks = (tasks, filters) =>
    tasks.filter((task) => {
        const status = taskStatus(task);
        if (status === 'finished') return filters.showFinished;
        if (status === 'blocked') return filters.showBlocked;
        return true;
    });
