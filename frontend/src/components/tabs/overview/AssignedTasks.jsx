import { AssignedTask } from '../../utils/AssignedTask';
import { useMemo } from 'react';
import { useApi } from '../../../state/query';
import { FormStack, StyledTable, useSearch } from '../../ui';
import dayjs from '../../../dayjs';
import { filterTasks, useTaskFilters } from '../../../state/taskFilters';
import { TaskFiltersButton } from '../../utils/TaskFiltersButton';

// searchable: false hides the search field, for short lists such as a task's dependencies; filterable: a gear next
// to the title picks whether finished and locked tasks are shown (the overview)
export const AssignedTasks = ({ showHeader, userID, machineTasks = [], searchable = true, filterable = false }) => {
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data } = useApi(`/auth/${userID}/tasks`, { topics: [`user:${userID}`], enabled: !!userID });
    const tasks = useMemo(() => (data ?? []).map((task) => task.Task), [data]);

    const { filters } = useTaskFilters();
    const allTasks = userID ? tasks : machineTasks;
    const shown = useMemo(() => (filterable ? filterTasks(allTasks, filters) : allTasks), [allTasks, filterable, filters]);
    const search = useSearch(shown, (task) => [task.Name, task.Project?.Name, task.Owner?.FirstName, task.Owner?.LastName, dayjs(task.FinishDate).format('L')]);

    return (
        <FormStack>
            {showHeader &&
                (filterable ? (
                    <div className='content-box_header'>
                        <h1>Moje úkoly</h1>
                        <TaskFiltersButton />
                    </div>
                ) : (
                    <h1>Moje úkoly</h1>
                ))}
            <StyledTable
                columns={[{ label: 'Název' }, { label: 'Projekt' }, { label: 'Autor' }, { label: 'Dokončení' }]}
                search={searchable ? search : undefined}
            >
                {search.results.map((task) => (
                    <AssignedTask key={task.ID} task={task} />
                ))}
            </StyledTable>
        </FormStack>
    );
};
