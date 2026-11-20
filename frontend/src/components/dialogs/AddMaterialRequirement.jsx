import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import dayjs from '../../dayjs';
import { ButtonRow, FormStack, StyledButton, StyledDialog } from '../ui';
import { MaterialRequirementFields } from './MaterialRequirementFields';

export const AddMaterialRequirement = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [stopDateTime, setStopDateTime] = React.useState(dayjs());
    const [price, setPrice] = useState('');
    const [count, setCount] = useState('');

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit({ name: name, description: description, price: price, count: count, date: stopDateTime });
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat požadavek na materiál' onClose={handleCancel}>
            <FormStack component='form' onSubmit={handleSubmit}>
                <MaterialRequirementFields
                    values={{ name, count, price, description, date: stopDateTime }}
                    setters={{ name: setName, count: setCount, price: setPrice, description: setDescription, date: setStopDateTime }}
                />
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
