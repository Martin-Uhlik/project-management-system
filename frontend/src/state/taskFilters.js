import { taskStatus } from '../components/ui/taskStatus';
import { useListFilters } from './listFilters';

// Which tasks the overview's task lists show: finished ones and locked ones (waiting on unfinished prerequisites, see
// taskStatus). See listFilters.tasks.
export const useTaskFilters = () => useListFilters('tasks');

// which filter option shows the tasks of each status (todo tasks are always shown)
const optionOf = { finished: 'showFinished', blocked: 'showBlocked', inProgress: 'showInProgress' };

// The tasks the filters let through: a status whose option is switched off is hidden (a list without that option
// shows it)
export const filterTasks = (tasks, filters) => tasks.filter((task) => filters[optionOf[taskStatus(task)]] !== false);
