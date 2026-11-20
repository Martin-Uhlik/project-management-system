import React, { useEffect } from 'react';
import axios from 'axios';
import { useAtom } from 'jotai';
import { dialogAtom, notificationsAtom } from '../../state/atoms';
import { getBackendAddress } from '../../config';
import { getAuthHeader, getUserID } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledSelect } from '../ui';

// no task: the time is only logged as work time
const NO_TASK = '';

// Starting the timer: which of my unfinished tasks I am going to work on (or none)
export const StartTimer = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [tasks, setTasks] = React.useState([]);
    const [taskID, setTaskID] = React.useState(NO_TASK);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/${getUserID()}/tasks`), getAuthHeader())
            .then((response) => {
                const open = response.data.map((row) => row.Task).filter((task) => !task.Finished);
                setTasks(open);
                if (open.length > 0) setTaskID(open[0].ID);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCancel = (event) => {
        event.preventDefault();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit(taskID === NO_TASK ? null : taskID);
        setDialog(null);
    };

    const options = [
        ...tasks.map((task) => ({ value: task.ID, label: task.Project?.Name ? `${task.Name} (${task.Project.Name})` : task.Name })),
        { value: NO_TASK, label: 'Bez úkolu' },
    ];

    return (
        <StyledDialog title='Spustit časovač' onClose={handleCancel}>
            <FormStack component='form' gap={4} onSubmit={handleSubmit}>
                <StyledSelect id='task' label='Úkol' options={options} value={taskID} onChange={(event) => setTaskID(event.target.value)} />
                <ButtonRow>
                    <StyledButton color='error' onClick={handleCancel}>
                        Zrušit
                    </StyledButton>
                    <StyledButton color='success' type='submit'>
                        Spustit
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
