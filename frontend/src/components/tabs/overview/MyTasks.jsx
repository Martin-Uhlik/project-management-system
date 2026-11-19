import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../../state/atoms';
import { MyTask } from '../../utils/MyTask';
import axios from 'axios';
import { handleAxiosError } from '../../../errorHandler';
import { getBackendAddress } from '../../../config';
import { getAuthHeader, getUserID } from '../../../Auth';
import moment from 'moment';

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
                setTick(moment());
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
                setTick(moment());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    return (
        <>
            <div className='content-box_header'>
                <h1>Moje úkoly</h1>
                <div className='content-box_subheader'>
                    <button className='btn btn-outline-dark' onClick={handleRemoveFinishedTasks}>
                        Smazat dokončené
                    </button>
                    <button type='button' className='add-button' aria-label='Přidat vlastní úkol' onClick={handleAddMyTask}>
                        +
                    </button>
                </div>
            </div>
            <table className='w-100'>
                <thead>
                    <tr>
                        <th>Název</th>
                        <th>Dokončení</th>
                        <th>Popis</th>
                    </tr>
                </thead>
                <tbody className='w-100 '>
                    {tasks
                        .sort((a, b) => (a.Finished > b.Finished ? 1 : -1))
                        .map((task) => (
                            <MyTask key={task.ID} task={task} />
                        ))}
                </tbody>
            </table>
        </>
    );
};
