import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { WorkPlanChart } from '../utils/WorkPlanChart';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import { useAtom, useSetAtom } from 'jotai';
import { notificationsAtom, tickAtom } from '../../state/atoms';
import { useLive } from '../../state/live';
import { pushNotification } from '../Notifications';
import dayjs from '../../dayjs';
import { AssignedTasks } from '../tabs/overview/AssignedTasks';
import { RemoveButton } from '../utils/RemoveButton';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { EditButtons } from '../utils/EditButtons';
import { ButtonRow, FormStack, StyledInput } from '../ui';

export const Machine = () => {
    const navigate = useNavigate();
    const props = useOutletContext();
    const { machine } = useParams();
    React.useEffect(() => {
        props(machine);
    });
    const [disabled, setDisabled] = useState(true);

    const [notifications, setNotifications] = useAtom(notificationsAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive('machines');
    const setTick = useSetAtom(tickAtom);

    const [currentMachine, setCurrentMachine] = useState(null);
    const [description, setDescription] = useState(null);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/machines/${machine}`), getAuthHeader())
            .then((response) => {
                setCurrentMachine(response.data);
                if (disabled) {
                    setDescription(response.data.Description);
                }
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, machine]);

    const updateMachine = (event) => {
        event.preventDefault();
        axios
            .patch(
                getBackendAddress(`/auth/machines/${machine}`),
                {
                    Description: event.target.description.value,
                },
                getAuthHeader(),
            )
            .then(() => {
                pushNotification({
                    notification: { text: 'Nastavení úspěšně změněno.', type: 'notification__success' },
                    notifications: notifications,
                    setNotifications: setNotifications,
                });
                setDisabled(true);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const removeMachine = () => {
        axios
            .delete(getBackendAddress(`/auth/machines/${machine}`), getAuthHeader())
            .then(() => {
                pushNotification({
                    notification: { text: 'Nastavení úspěšně změněno.', type: 'notification__success' },
                    notifications: notifications,
                    setNotifications: setNotifications,
                });
                setTick(dayjs());
                navigate('/auth/machines');
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    return (
        <div className='content-2-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <div className='content-box_header'>
                        <h1>Fronta výroby</h1>
                        <RestrictedComponent types={['ADMIN']}>
                            <RemoveButton handleSuccess={removeMachine} />
                        </RestrictedComponent>
                    </div>
                    <AssignedTasks showHeader={false} machineTasks={currentMachine?.Task} />
                </div>
            </div>
            <div className='content-2-row'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <h1>Harmonogram výroby</h1>
                        <div className='content-box_chart-wrapper-outer'>
                            <div className='content-box_chart-wrapper-inner'>
                                <WorkPlanChart tasks={currentMachine?.Task} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <FormStack component='form' sx={{ height: '100%' }} onSubmit={updateMachine}>
                            <div className='content-box_header'>
                                <h1>Popis</h1>
                                <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                    <ButtonRow className='content-box_subheader'>
                                        <EditButtons editing={!disabled} setEditing={(editing) => setDisabled(!editing)} />
                                    </ButtonRow>
                                </RestrictedComponent>
                            </div>
                            <StyledInput
                                id='description'
                                label='Popis'
                                multiline
                                minRows={8}
                                value={description || ''}
                                onChange={(event) => setDescription(event.target.value)}
                                disabled={disabled}
                            />
                        </FormStack>
                    </div>
                </div>
            </div>
        </div>
    );
};
