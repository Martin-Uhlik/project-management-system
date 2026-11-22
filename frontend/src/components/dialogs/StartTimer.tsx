import React, { useMemo } from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { getUserID } from '../../Auth';
import { useApi } from '../../state/query';
import type { AssignedTaskRow } from '../../types';
import type { SyntheticEvent } from 'react';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledSelect } from '../ui';

// no task: the time is only logged as work time
const NO_TASK = '';

// Starting the timer: which of my unfinished tasks I am going to work on (or none)
export const StartTimer = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [chosenTask, setTaskID] = React.useState<number | '' | null>(null);

    // the same list as the overview's assigned tasks, usually loaded already
    const { data } = useApi<AssignedTaskRow[]>(`/auth/${getUserID()}/tasks`, { topics: [`user:${getUserID()}`] });
    const tasks = useMemo(() => (data ?? []).map((row) => row.Task).filter((task) => !task.Finished), [data]);
    // the task picked, else the first open one
    const taskID = chosenTask ?? tasks[0]?.ID ?? NO_TASK;

    const dialogData = dialog?.data as { handleSubmit: (taskID: number | null) => void };

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        setDialog(null);
    };

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        dialogData.handleSubmit(taskID === NO_TASK ? null : taskID);
        setDialog(null);
    };

    const options: { value: number | ''; label: string }[] = [
        ...tasks.map((task) => ({ value: task.ID, label: task.Project?.Name ? `${task.Name} (${task.Project.Name})` : task.Name })),
        { value: NO_TASK, label: 'Bez úkolu' },
    ];

    return (
        <StyledDialog title='Spustit časovač' onClose={handleCancel}>
            <FormStack component='form' gap={4} onSubmit={handleSubmit}>
                <StyledSelect
                    id='task'
                    label='Úkol'
                    options={options}
                    value={taskID}
                    onChange={(event) => setTaskID(event.target.value === NO_TASK ? NO_TASK : Number(event.target.value))}
                />
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
