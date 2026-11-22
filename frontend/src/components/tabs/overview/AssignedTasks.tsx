import { AssignedTask } from '../../utils/AssignedTask';
import { useMemo } from 'react';
import { useApi } from '../../../state/query';
import { FormStack, StyledBoxHeader, StyledTable, useSearch } from '../../ui';
import dayjs from '../../../dayjs';
import { filterTasks } from '../../../state/taskFilters';
import { useListFilters } from '../../../state/listFilters';
import { ListFiltersButton } from '../../utils/ListFiltersButton';
import type { AssignedTaskRow, TaskWithProgress } from '../../../types';
import type { RowAction } from '../../ui/StyledTable';
import type { ListName } from '../../../state/listFilters';

// searchable: false hides the search field, for short lists such as a task's dependencies; filterList: the tasks are
// filtered by status with that list's filters (see listFilters; 'tasks' on the overview also puts its gear next to the
// title); rowActions(task): hover buttons on each row (see StyledTableRow)
export const AssignedTasks = ({
    showHeader,
    userID,
    machineTasks = [],
    searchable = true,
    filterList,
    rowActions,
}: {
    showHeader?: boolean;
    userID?: number | string;
    machineTasks?: TaskWithProgress[];
    searchable?: boolean;
    filterList?: ListName;
    rowActions?: (task: TaskWithProgress) => RowAction[];
}) => {
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data } = useApi<AssignedTaskRow[]>(`/auth/${userID}/tasks`, { topics: [`user:${userID}`], enabled: !!userID });
    const tasks = useMemo(() => (data ?? []).map((task) => task.Task), [data]);

    // (a list without filters reads the overview's, and ignores them)
    const { filters } = useListFilters(filterList ?? 'tasks');
    const allTasks = userID ? tasks : machineTasks;
    const shown = useMemo(() => (filterList ? filterTasks(allTasks, filters) : allTasks), [allTasks, filterList, filters]);
    const search = useSearch(shown, (task) => [task.Name, task.Project?.Name, task.Owner?.FirstName, task.Owner?.LastName, dayjs(task.FinishDate).format('L')]);

    return (
        <FormStack>
            {showHeader && (filterList ? <StyledBoxHeader title='Moje úkoly' settings={<ListFiltersButton list={filterList} />} /> : <h1>Moje úkoly</h1>)}
            <StyledTable
                columns={[{ label: 'Název' }, { label: 'Projekt' }, { label: 'Autor' }, { label: 'Dokončení' }]}
                search={searchable ? search : undefined}
            >
                {search.results.map((task) => (
                    <AssignedTask key={task.ID} task={task} actions={rowActions?.(task)} />
                ))}
            </StyledTable>
        </FormStack>
    );
};
