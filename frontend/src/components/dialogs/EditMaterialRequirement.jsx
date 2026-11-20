import React, { useState } from 'react';
import { useModalDialog } from '../utils/useModalDialog';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../state/atoms';
import { CustomizedDateTimePicker } from '../utils/CustomizedDateTimePicker';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import moment from 'moment';
import { handleAxiosError } from '../../errorHandler';

export const EditMaterialRequirement = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);

    const requirement = dialog.data.material;

    const [name, setName] = React.useState(requirement.Name);
    const [count, setCount] = React.useState(requirement.Count);
    const [description, setDescription] = React.useState(requirement.Description || '');
    const [stopDateTime, setStopDateTime] = React.useState(moment(requirement.NeededDate));
    const [price, setPrice] = useState(requirement.Price);

    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const patchRequirement = (data) => {
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
                setTick(moment());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };
    const handleSubmit = (event) => {
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
                setTick(moment());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleAddMaterial = () => {
        axios
            .post(
                getBackendAddress(`/auth/material`),
                {
                    Name: requirement.Name,
                    Count: +requirement.Count,
                },
                getAuthHeader(),
            )
            .then(() => {
                removeRequirement();
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
                    Upravit požadavek na materiál
                </h1>
                <hr />
                <div className='d-flex gap-3 justify-content-center'>
                    <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                        {requirement.AcceptedByID ? (
                            <button className='btn btn-success w-100' onClick={handleAddMaterial}>
                                Přidat na sklad
                            </button>
                        ) : (
                            <button className='btn btn-dark w-100' onClick={acceptRequirement}>
                                Schválit
                            </button>
                        )}
                    </RestrictedComponent>
                    <RestrictedComponent types={['ADMIN', 'MANAGER']} ids={[requirement.TargetUserID]}>
                        <button className='btn btn-danger w-100' onClick={removeRequirement}>
                            Odebrat
                        </button>
                    </RestrictedComponent>
                </div>
                <hr className='hline' />
                <form className='d-flex flex-column gap-3'>
                    <div className='form-group w-100'>
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
                    <div className='form-group'>
                        <label htmlFor='amount'>Počet:</label>
                        <input
                            className='form-control'
                            type='text'
                            id='amount'
                            name='amount'
                            placeholder='Zadejte počet kusů'
                            value={count}
                            onChange={(event) => {
                                setCount(event.target.value);
                            }}
                        />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='price'>Cena za kus (s DPH):</label>
                        <input
                            className='form-control'
                            type='text'
                            id='price'
                            name='price'
                            placeholder='Zadejte cenu s DPH'
                            value={price}
                            onChange={(event) => {
                                setPrice(event.target.value);
                            }}
                        />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='description'>Popis:</label>
                        <textarea
                            className='form-control'
                            id='description'
                            rows='3'
                            value={description ?? ''}
                            onChange={(event) => {
                                setDescription(event.target.value);
                            }}
                        ></textarea>
                    </div>
                    <div className='form-group d-flex flex-column'>
                        <CustomizedDateTimePicker label='Datum, kdy je materiál potřeba' finishDate={stopDateTime} setFinishDate={setStopDateTime} />
                    </div>
                    <div className='d-flex gap-3 justify-content-end'>
                        <button className='btn btn-danger' type='reset' onClick={handleCancel}>
                            Zrušit
                        </button>
                        <button className='btn btn-dark' type='submit' onClick={handleSubmit}>
                            Změnit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
