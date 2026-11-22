import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../../state/atoms';
import { useLive } from '../../../state/live';
import { MyTask } from '../../utils/MyTask';
import axios from 'axios';
import { handleAxiosError } from '../../../errorHandler';
import { getBackendAddress } from '../../../config';
import { getAuthHeader, getUserID } from '../../../Auth';
import dayjs from '../../../dayjs';
import { filterTasks, useTaskFilters } from '../../../state/taskFilters';
import { TaskFiltersButton } from '../../utils/TaskFiltersButton';
import { FormStack, StyledButton, StyledAddButton, StyledTable, useSearch } from '../../ui';

export const MyTasks = () => {
    const setDialog = useSetAtom(dialogAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [tasks, setTasks] = React.useState([]);
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive(`personal-tasks:${getUserID()}`);
    const setTick = useSetAtom(tickAtom);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/${getUserID()}/personal-tasks`), getAuthHeader())
            .then((response) => {
                setTasks(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const createTask = (task) => {
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
            <div className='content-box_header'>
                <h1>Moje úkoly</h1>
                <div className='content-box_subheader'>
                    <StyledButton variant='outlined' onClick={handleRemoveFinishedTasks}>
                        Smazat dokončené
                    </StyledButton>
                    <StyledAddButton label='Přidat vlastní úkol' onClick={handleAddMyTask} />
                    <TaskFiltersButton />
                </div>
            </div>
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
