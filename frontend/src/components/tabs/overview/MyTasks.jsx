import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../../state/atoms';
import { MyTask } from '../../utils/MyTask';
import axios from 'axios';
import { handleAxiosError } from '../../../errorHandler';
import { getBackendAddress } from '../../../config';
import { getAuthHeader, getUserID } from '../../../Auth';
import dayjs from '../../../dayjs';
import { FormStack, StyledButton, StyledAddButton, StyledSearchInput, useSearch } from '../../ui';

export const MyTasks = () => {
    const setDialog = useSetAtom(dialogAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [tasks, setTasks] = React.useState([]);
    const [tick, setTick] = useAtom(tickAtom);

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

    const search = useSearch(tasks, (task) => [task.Name, task.Description, dayjs(task.FinishDate).format('L')]);

    return (
        <FormStack>
            <div className='content-box_header'>
                <h1>Moje úkoly</h1>
                <div className='content-box_subheader'>
                    <StyledButton variant='outlined' onClick={handleRemoveFinishedTasks}>
                        Smazat dokončené
                    </StyledButton>
                    <StyledAddButton label='Přidat vlastní úkol' onClick={handleAddMyTask} />
                </div>
            </div>
            <StyledSearchInput value={search.query} onChange={search.setQuery} />
            <table className='task-list'>
                <thead>
                    <tr>
                        <th>Název</th>
                        <th>Dokončení</th>
                        <th>Popis</th>
                    </tr>
                </thead>
                <tbody>
                    {[...search.results]
                        .sort((a, b) => (a.Finished > b.Finished ? 1 : -1))
                        .map((task) => (
                            <MyTask key={task.ID} task={task} />
                        ))}
                </tbody>
            </table>
        </FormStack>
    );
};
