import React, { useState } from 'react';
import Divider from '@mui/material/Divider';
import { useAtom, useSetAtom } from 'jotai';
import { useDialog, notificationsAtom, tickAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog } from '../ui';
import { MaterialRequirementFields } from './MaterialRequirementFields';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import type { Dayjs } from 'dayjs';
import dayjs from '../../dayjs';
import { handleAxiosError } from '../../errorHandler';
import type { SyntheticEvent } from 'react';
import type { MaterialRequest } from '../../types';

interface EditRequirementData {
    material: MaterialRequest;
    handleCancel: () => void;
}

export const EditMaterialRequirement = () => {
    const [dialog, setDialog] = useDialog<EditRequirementData>();

    const requirement = dialog.data.material;

    const [name, setName] = React.useState(requirement.Name);
    const [count, setCount] = React.useState<number | string>(requirement.Count);
    const [description, setDescription] = React.useState(requirement.Description || '');
    const [stopDateTime, setStopDateTime] = React.useState<Dayjs | null>(dayjs(requirement.NeededDate));
    const [price, setPrice] = useState<number | string>(requirement.Price);

    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const patchRequirement = (data: Record<string, unknown>) => {
        axios
            .patch(
                getBackendAddress(`/auth/materialRequirements/${requirement.ID}`),
                {
                    ...data,
                },
                getAuthHeader(),
            )
            .then(() => {
                setDialog(null);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };
    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        const data = {
            Name: name,
            Count: +count,
            Description: description,
            NeededDate: stopDateTime,
            Price: +price,
        };
        patchRequirement(data);
    };

    const acceptRequirement = () => {
        // the backend records who accepted it, and when
        const data = { Accepted: true };
        patchRequirement(data);
    };

    const removeRequirement = () => {
        axios
            .delete(getBackendAddress(`/auth/materialRequirements/${requirement.ID}`), getAuthHeader())
            .then(() => {
                setDialog(null);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    // the approved request has arrived: its items go into stock (reserved for its task, if any) and it goes away
    const handleAddMaterial = () => {
        axios
            .post(getBackendAddress(`/auth/materialRequirements/${requirement.ID}/stock`), {}, getAuthHeader())
            .then(() => {
                setDialog(null);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    return (
        <StyledDialog title='Upravit požadavek na materiál' onClose={handleCancel}>
            <FormStack gap={3}>
                <ButtonRow justify='stretch'>
                    <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                        {requirement.AcceptedByID ? (
                            <StyledButton color='success' onClick={handleAddMaterial}>
                                Naskladnit
                            </StyledButton>
                        ) : (
                            <StyledButton onClick={acceptRequirement}>Schválit</StyledButton>
                        )}
                    </RestrictedComponent>
                    <RestrictedComponent types={['ADMIN', 'MANAGER']} ids={[requirement.TargetUserID]}>
                        <StyledButton color='error' onClick={removeRequirement}>
                            Odebrat
                        </StyledButton>
                    </RestrictedComponent>
                </ButtonRow>
                <Divider />
                <FormStack component='form' onSubmit={handleSubmit}>
                    <MaterialRequirementFields
                        values={{ name, count, price, description, date: stopDateTime }}
                        setters={{ name: setName, count: setCount, price: setPrice, description: setDescription, date: setStopDateTime }}
                    />
                    <ButtonRow>
                        <StyledButton color='error' onClick={handleCancel}>
                            Zrušit
                        </StyledButton>
                        <StyledButton type='submit'>Změnit</StyledButton>
                    </ButtonRow>
                </FormStack>
            </FormStack>
        </StyledDialog>
    );
};
