import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import dayjs from '../../dayjs';
import { ButtonRow, FormStack, StyledButton, StyledDialog } from '../ui';
import { MaterialRequirementFields } from './MaterialRequirementFields';
import { useSend } from '../inventory/useSend';

// A new request for material (admins, managers). data.taskID: for that task; data.initial: { name, price, materialID }
// when it restocks an existing item
export const AddMaterialRequirement = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const send = useSend();
    const initial = dialog.data.initial ?? {};
    const [name, setName] = React.useState(initial.name ?? '');
    const [description, setDescription] = React.useState('');
    const [stopDateTime, setStopDateTime] = React.useState(dayjs().add(7, 'day').hour(12).minute(0));
    const [price, setPrice] = useState(initial.price ?? '');
    const [count, setCount] = useState('');

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel?.();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        send(
            'post',
            '/auth/materialRequirements',
            {
                Name: name,
                Description: description,
                Count: +count,
                Price: +price,
                NeededDate: stopDateTime,
                TargetTaskID: dialog.data.taskID ? +dialog.data.taskID : null,
                MaterialID: initial.materialID ?? null,
            },
            'Požadavek přidán.',
        );
        setDialog(null);
    };

    return (
        <StyledDialog title={initial.materialID ? 'Doobjednat materiál' : 'Přidat požadavek na materiál'} onClose={handleCancel}>
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
