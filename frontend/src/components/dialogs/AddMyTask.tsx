import React from 'react';
import { useDialog } from '../../state/atoms';
import dayjs from '../../dayjs';
import { ButtonRow, FormStack, StyledButton, StyledDateTimePicker, StyledDialog, StyledInput } from '../ui';
import type { SyntheticEvent } from 'react';
import type { Dayjs } from 'dayjs';
import type { PrivateTask } from '../../types';

interface AddMyTaskData {
    task?: PrivateTask;
    handleCancel?: () => void;
    handleSubmit: (task: { Name: string; Description: string; FinishDate: Dayjs | null }) => void;
}

// Adds a personal task, or edits one: dialog.data.task holds the task to edit
export const AddMyTask = () => {
    const [dialog, setDialog] = useDialog<AddMyTaskData>();
    const task = dialog.data.task;
    const [name, setName] = React.useState(task?.Name ?? '');
    const [description, setDescription] = React.useState(task?.Description ?? '');
    const [stopDateTime, setStopDateTime] = React.useState<Dayjs | null>(task ? dayjs(task.FinishDate) : dayjs());

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleCancel?.();
        setDialog(null);
    };

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleSubmit({ Name: name, Description: description, FinishDate: stopDateTime });
        setDialog(null);
    };

    return (
        <StyledDialog title={task ? 'Upravit úkol' : 'Přidat úkol'} onClose={handleCancel}>
            <FormStack component='form' onSubmit={handleSubmit}>
                <StyledInput id='name' label='Název' value={name} onChange={(event) => setName(event.target.value)} />
                <StyledInput id='description' label='Popis' multiline rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
                <StyledDateTimePicker value={stopDateTime} onChange={setStopDateTime} />
                <ButtonRow>
                    <StyledButton color='error' onClick={handleCancel}>
                        Zrušit
                    </StyledButton>
                    <StyledButton color='success' type='submit'>
                        Ok
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
