import React from 'react';
import { useModalDialog } from '../utils/useModalDialog';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../state/atoms';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader, getUserID } from '../../Auth';
import moment from 'moment';
import { handleAxiosError } from '../../errorHandler';

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
                setTick(moment());
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
                    TargetUserID: +getUserID(),
                    EventType: eventType,
                    TargetTaskID: +dialog.data.taskID || null,
                },
                getAuthHeader(),
            )
            .then(() => {
                setDialog(null);
                setTick(moment());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const dialogRef = useModalDialog(handleCancel);
    return (
        <div className='dialog-background'>
            <div className='dialog d-flex flex-column gap-3' role='dialog' aria-modal='true' aria-labelledby='dialog-title' ref={dialogRef}>
                <h1 id='dialog-title' className='dialog-h1'>
                    Upravit materiál
                </h1>
                <hr />
                <form className='d-flex flex-column gap-3'>
                    <div className='form-group'>
                        <label htmlFor='amount'>Počet:</label>
                        <input
                            className='form-control'
                            type='text'
                            id='amount'
                            name='amount'
                            placeholder='Zadejte počet kusů'
                            value={amount}
                            onChange={(event) => {
                                setAmount(event.target.value);
                            }}
                        />
                    </div>
                    <div className='d-flex gap-3 justify-content-center'>
                        <button className='btn btn-danger w-100' onClick={(event) => handleCreateMaterialEvent(event, 'REMOVE')}>
                            Odebrat
                        </button>
                        <button className='btn btn-dark w-100' onClick={(event) => handleCreateMaterialEvent(event, 'RESERVATION')}>
                            Zarezervovat
                        </button>
                        <button className='btn btn-success w-100' onClick={(event) => handleCreateMaterialEvent(event, 'ADD')}>
                            Přidat
                        </button>
                    </div>
                </form>
                <hr className='hline' />
                <form className='d-flex flex-column gap-3'>
                    <div className='form-group'>
                        <label htmlFor='name'>Název:</label>
                        <input
                            className='form-control'
                            type='text'
                            id='name'
                            name='name'
                            placeholder='Zadejte název'
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                            }}
                        />
                    </div>
                    <div className='d-flex gap-3 justify-content-end'>
                        <button className='btn btn-danger' onClick={handleCancel}>
                            Zrušit
                        </button>
                        <button className='btn btn-dark' onClick={handleSubmit}>
                            Změnit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
