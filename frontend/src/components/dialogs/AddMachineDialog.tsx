import React from 'react';
import { useDialog } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledInput } from '../ui';
import type { SyntheticEvent } from 'react';

interface AddMachineData {
    handleCancel: () => void;
    handleSubmit: (name: string) => void;
}

export const AddMachineDialog = () => {
    const [dialog, setDialog] = useDialog<AddMachineData>();
    const [name, setName] = React.useState('');

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleSubmit(name);
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat stroj' onClose={handleCancel}>
            <FormStack component='form' gap={4} onSubmit={handleSubmit}>
                <StyledInput id='name' label='Název stroje' value={name} onChange={(event) => setName(event.target.value)} />
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
