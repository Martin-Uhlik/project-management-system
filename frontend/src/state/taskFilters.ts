import { taskStatus, type TaskProgress, type TaskStatus } from '../components/ui/taskStatus';
import type { Filters } from './listFilters';
import { useListFilters } from './listFilters';

// Which tasks the overview's task lists show: finished ones and locked ones (waiting on unfinished prerequisites, see
// taskStatus). See listFilters.tasks.
export const useTaskFilters = () => useListFilters('tasks');

// which filter option shows the tasks of each status (todo tasks are always shown)
const optionOf: Partial<Record<TaskStatus, string>> = { finished: 'showFinished', blocked: 'showBlocked', inProgress: 'showInProgress' };

// The tasks the filters let through: a status whose option is switched off is hidden (a list without that option
// shows it)
export const filterTasks = <T extends TaskProgress>(tasks: T[], filters: Filters) =>
    tasks.filter((task) => {
        const option = optionOf[taskStatus(task)];
        return !option || filters[option] !== false;
    });
