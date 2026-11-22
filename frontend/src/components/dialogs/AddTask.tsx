import React, { useState } from 'react';
import { useDialog } from '../../state/atoms';
import dayjs from '../../dayjs';
import { ButtonRow, FormStack, StyledButton, StyledDateTimePicker, StyledDialog, StyledInput, StyledSelect } from '../ui';
import { fieldValue } from '../../form';
import type { SyntheticEvent } from 'react';
import type { Dayjs } from 'dayjs';

interface AddTaskData {
    // where the task was asked for (the graph's click), passed back
    event?: unknown;
    handleCancel: () => void;
    handleSubmit: (event: unknown, name: string, size: number, description: string, finishDate: Dayjs | null) => void;
}

export const taskSizeOptions = [
    { value: 10, label: 'XS' },
    { value: 20, label: 'S' },
    { value: 30, label: 'M' },
    { value: 40, label: 'L' },
    { value: 50, label: 'XL' },
];

export const AddTask = () => {
    const [dialog, setDialog] = useDialog<AddTaskData>();
    const [name, setName] = React.useState('');
    const [size, setSize] = React.useState(30);
    const [finishDate, setFinishDate] = useState<Dayjs | null>(dayjs());

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleSubmit(dialog.data.event, name, size, fieldValue(event, 'description'), finishDate);
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat úkol' onClose={handleCancel}>
            <FormStack component='form' onSubmit={handleSubmit}>
                <StyledInput id='name' label='Název úkolu' value={name} onChange={(event) => setName(event.target.value)} />
                <StyledDateTimePicker value={finishDate} onChange={setFinishDate} />
                <StyledSelect id='size' label='Velikost' value={size} onChange={(event) => setSize(+event.target.value)} options={taskSizeOptions} />
                <StyledInput id='description' label='Popis' multiline rows={3} />
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
