import React from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledInput } from '../ui';

export const AddMachineDialog = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [name, setName] = React.useState('');

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
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
