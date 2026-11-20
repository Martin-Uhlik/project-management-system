import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import dayjs from '../../dayjs';
import { ButtonRow, FormStack, StyledButton, StyledDateTimePicker, StyledDialog, StyledInput, StyledSelect } from '../ui';

export const taskSizeOptions = [
    { value: 10, label: 'XS' },
    { value: 20, label: 'S' },
    { value: 30, label: 'M' },
    { value: 40, label: 'L' },
    { value: 50, label: 'XL' },
];

export const AddTask = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [name, setName] = React.useState('');
    const [size, setSize] = React.useState(30);
    const [finishDate, setFinishDate] = useState(dayjs());

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit(dialog.data.event, name, size, event.target.description.value, finishDate);
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
