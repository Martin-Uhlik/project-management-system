import React from 'react';
import { Link } from 'react-router';
import Typography from '@mui/material/Typography';
import { useDialog } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledInput } from '../ui';
import { formatAmount } from '../inventory/format';
import { useSend } from '../inventory/useSend';
import type { SyntheticEvent } from 'react';
import type { EventType, Material } from '../../types';

interface EditMaterialData {
    material: Material;
    taskID?: number | string;
    handleCancel?: () => void;
}

// Moves a stock item for a task (opened from the task's Materiál tab): reserve it for the task, take it out of stock
// for the task (which uses the reservation up), give the reservation back, or put more in stock
export const EditMaterial = () => {
    const [dialog, setDialog] = useDialog<EditMaterialData>();
    const send = useSend();
    const { material, taskID } = dialog.data;
    const [amount, setAmount] = React.useState('');
    const count = Number(amount);
    const valid = Number.isInteger(count) && count > 0;

    const handleCancel = (event: SyntheticEvent) => {
        event?.preventDefault();
        dialog.data.handleCancel?.();
        setDialog(null);
    };

    const move = (EventType: EventType, text: string) => {
        send('post', `/auth/material/${material.ID}/event`, { Count: count, EventType, TargetTaskID: Number(taskID) || null }, text);
        setDialog(null);
    };

    return (
        <StyledDialog title={material.Name} onClose={handleCancel}>
            <FormStack component='form' onSubmit={(event) => event.preventDefault()}>
                <Typography sx={{ color: 'text.secondary' }}>
                    Na skladě {formatAmount(material.Count, material.Unit)}, rezervováno {formatAmount(material.Reserved, material.Unit)}, dostupné{' '}
                    {formatAmount(material.Available, material.Unit)}.{' '}
                    <Typography component={Link} to={`/auth/inventory/${material.ID}`} onClick={() => setDialog(null)} sx={{ color: 'inherit' }}>
                        Otevřít materiál
                    </Typography>
                </Typography>
                <StyledInput
                    id='amount'
                    label={`Počet (${material.Unit || 'ks'})`}
                    type='number'
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                />
                <ButtonRow justify='stretch'>
                    <StyledButton disabled={!valid} onClick={() => move('RESERVATION', 'Materiál zarezervován.')}>
                        Zarezervovat
                    </StyledButton>
                    <StyledButton color='error' disabled={!valid} onClick={() => move('REMOVE', 'Materiál vydán ze skladu.')}>
                        Vydat ze skladu
                    </StyledButton>
                </ButtonRow>
                <ButtonRow justify='stretch'>
                    {taskID ? (
                        <StyledButton variant='outlined' disabled={!valid} onClick={() => move('RELEASE', 'Rezervace zrušena.')}>
                            Zrušit rezervaci
                        </StyledButton>
                    ) : null}
                    <StyledButton color='success' disabled={!valid} onClick={() => move('ADD', 'Materiál naskladněn.')}>
                        Naskladnit
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
