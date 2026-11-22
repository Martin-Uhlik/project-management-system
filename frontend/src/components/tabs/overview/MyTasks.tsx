import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../../state/atoms';
import { useApi } from '../../../state/query';
import { MyTask } from '../../utils/MyTask';
import axios from 'axios';
import { handleAxiosError } from '../../../errorHandler';
import { getBackendAddress } from '../../../config';
import { getAuthHeader, getUserID } from '../../../Auth';
import dayjs from '../../../dayjs';
import { filterTasks, useTaskFilters } from '../../../state/taskFilters';
import { ListFiltersButton } from '../../utils/ListFiltersButton';
import { FormStack, StyledButton, StyledAddButton, StyledBoxHeader, StyledTable, useSearch } from '../../ui';
import type { PrivateTask } from '../../../types';

const noTasks: PrivateTask[] = [];

export const MyTasks = () => {
    const setDialog = useSetAtom(dialogAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: tasks = noTasks } = useApi<PrivateTask[]>(`/auth/${getUserID()}/personal-tasks`, { topics: [`personal-tasks:${getUserID()}`] });
    const setTick = useSetAtom(tickAtom);

    const createTask = (task: Partial<PrivateTask>) => {
        axios
            .post(getBackendAddress(`/auth/${getUserID()}/personal-tasks`), { task }, getAuthHeader())
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleAddMyTask = () => {
        setDialog({
            type: 'AddMyTask',
            data: {
                handleSubmit: createTask,
                handleCancel: () => {},
            },
        });
    };

    const handleRemoveFinishedTasks = () => {
        axios
            .delete(getBackendAddress(`/auth/${getUserID()}/personal-tasks`), getAuthHeader())
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const { filters } = useTaskFilters();
    const shown = React.useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
    const search = useSearch(shown, (task) => [task.Name, task.Description, dayjs(task.FinishDate).format('L')]);

    return (
        <FormStack>
            <StyledBoxHeader
                title='Moje úkoly'
                add={<StyledAddButton label='Přidat vlastní úkol' onClick={handleAddMyTask} />}
                settings={<ListFiltersButton list='tasks' />}
            >
                <StyledButton variant='outlined' onClick={handleRemoveFinishedTasks}>
                    Smazat dokončené
                </StyledButton>
            </StyledBoxHeader>
            <StyledTable columns={[{ label: 'Název' }, { label: 'Dokončení' }, { label: 'Popis' }]} search={search}>
                {[...search.results]
                    .sort((a, b) => (a.Finished > b.Finished ? 1 : -1))
                    .map((task) => (
                        <MyTask key={task.ID} task={task} />
                    ))}
            </StyledTable>
        </FormStack>
    );
};
