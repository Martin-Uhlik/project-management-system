import { act, renderHook } from '@testing-library/react';
import { useListFilters } from './listFilters';
import { filterTasks } from './taskFilters';

const tasks = [
    { Name: 'todo', Finished: false },
    { Name: 'finished', Finished: true },
    { Name: 'blocked', Finished: false, _count: { Successors: 1 } },
    { Name: 'inProgress', Finished: false, _count: { WorkingUsers: 1 } },
];
const names = (list: { Name: string }[]) => list.map((task) => task.Name);

test('filterTasks hides the statuses whose option is off, todo tasks always stay', () => {
    expect(names(filterTasks(tasks, {}))).toEqual(['todo', 'finished', 'blocked', 'inProgress']);
    expect(names(filterTasks(tasks, { showFinished: false, showBlocked: false }))).toEqual(['todo', 'inProgress']);
    expect(names(filterTasks(tasks, { showInProgress: false, showFinished: true }))).toEqual(['todo', 'finished', 'blocked']);
});

test('list filters start from their defaults and remember a change in this browser', () => {
    const { result } = renderHook(() => useListFilters('projects'));
    expect(result.current.filters).toEqual({ showFinished: false, showOthers: false });
    expect(result.current.hiding).toBe(true);

    act(() => result.current.setFilters({ showFinished: true, showOthers: true }));
    expect(result.current.filters).toEqual({ showFinished: true, showOthers: true });
    expect(result.current.hiding).toBe(false);
    expect(JSON.parse(localStorage.getItem('project-filters')!)).toEqual({ showFinished: true, showOthers: true });
});

test('a filter changed in one list is seen by every component that shows it', () => {
    const first = renderHook(() => useListFilters('users'));
    const second = renderHook(() => useListFilters('users'));
    act(() => first.result.current.setFilters({ showDisabled: true }));
    expect(second.result.current.filters.showDisabled).toBe(true);
});
