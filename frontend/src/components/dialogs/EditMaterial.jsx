import React from 'react';
import Divider from '@mui/material/Divider';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../state/atoms';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import dayjs from '../../dayjs';
import { handleAxiosError } from '../../errorHandler';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledInput } from '../ui';

export const EditMaterial = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [name, setName] = React.useState(dialog.data.material.Name);
    const [amount, setAmount] = React.useState('');

    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        axios
            .patch(
                getBackendAddress(`/auth/material/${dialog.data.material.ID}`),
                {
                    Name: name,
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
        setDialog(null);
    };

    const handleCreateMaterialEvent = (event, eventType) => {
        event.preventDefault();
        axios
            .post(
                getBackendAddress(`/auth/material/${dialog.data.material.ID}/event`),
                {
                    Count: +amount,
                    EventType: eventType,
                    TargetTaskID: +dialog.data.taskID || null,
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

    return (
        <StyledDialog title='Upravit materiál' onClose={handleCancel}>
            <FormStack gap={3}>
                <FormStack component='form' onSubmit={(event) => event.preventDefault()}>
                    <StyledInput id='amount' label='Počet kusů' type='number' value={amount} onChange={(event) => setAmount(event.target.value)} />
                    <ButtonRow justify='stretch'>
                        <StyledButton color='error' onClick={(event) => handleCreateMaterialEvent(event, 'REMOVE')}>
                            Odebrat
                        </StyledButton>
                        <StyledButton onClick={(event) => handleCreateMaterialEvent(event, 'RESERVATION')}>Zarezervovat</StyledButton>
                        <StyledButton color='success' onClick={(event) => handleCreateMaterialEvent(event, 'ADD')}>
                            Přidat
                        </StyledButton>
                    </ButtonRow>
                </FormStack>
                <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                    <Divider />
                    <FormStack component='form' onSubmit={handleSubmit}>
                        <StyledInput id='name' label='Název' value={name} onChange={(event) => setName(event.target.value)} />
                        <ButtonRow>
                            <StyledButton color='error' onClick={handleCancel}>
                                Zrušit
                            </StyledButton>
                            <StyledButton type='submit'>Změnit</StyledButton>
                        </ButtonRow>
                    </FormStack>
                </RestrictedComponent>
            </FormStack>
        </StyledDialog>
    );
};
