import React from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledInput } from '../ui';

export const AddMaterial = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [name, setName] = React.useState('');
    const [amount, setAmount] = React.useState('');

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit({ name: name, count: amount });
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat materiál' onClose={handleCancel}>
            <FormStack component='form' onSubmit={handleSubmit}>
                <StyledInput id='name' label='Název' value={name} onChange={(event) => setName(event.target.value)} />
                <StyledInput id='amount' label='Počet kusů' type='number' value={amount} onChange={(event) => setAmount(event.target.value)} />
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
