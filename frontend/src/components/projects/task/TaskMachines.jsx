import React, { useState } from 'react';
import { useLocation, useOutletContext, useParams } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';
import { useAtom, useSetAtom } from 'jotai';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import { useApi } from '../../../state/query';
import dayjs from '../../../dayjs';
import { RestrictedComponent } from '../../utils/RestrictedComponent';
import { ButtonRow, FormStack, StyledButton, StyledSelect } from '../../ui';

const noMachines = [];

export const TaskMachines = () => {
    const props = useOutletContext();
    const subTab = useLocation().pathname.split('/')[5];
    React.useEffect(() => {
        props(subTab);
    });

    const projectID = useParams().project;
    const taskID = useParams().task;
    // reloaded when someone changes this data (live updates) or after a change made here
    const task = useApi(`/auth/projects/${projectID}/tasks/${taskID}`, { topics: [`project:${projectID}`] }).data;
    const { data: machines = noMachines } = useApi('/auth/machines', { topics: ['machines'] });
    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [selectedMachine, setSelectedMachine] = useState(null);

    // the choice follows the task's machine whenever the task is loaded
    const [formTask, setFormTask] = useState(null);
    if (task && task !== formTask) {
        setFormTask(task);
        setSelectedMachine(task.MachineID);
    }

    const setMachine = (event) => {
        event.preventDefault();
        axios
            .patch(
                getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
                {
                    MachineID: +selectedMachine,
                },
                getAuthHeader(),
            )
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    return (
        <div className='content-1-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <div className='content-box_header'>
                        <h1>Stroje</h1>
                    </div>
                    <FormStack component='form' onSubmit={setMachine}>
                        <StyledSelect
                            id='machine'
                            label='Přiřazený stroj'
                            value={machines.some((machine) => machine.ID === +selectedMachine) ? +selectedMachine : ''}
                            onChange={(event) => setSelectedMachine(event.target.value)}
                            options={machines.map((machine) => ({ value: machine.ID, label: machine.Name }))}
                        />
                        <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                            <ButtonRow>
                                <StyledButton type='submit'>Použít</StyledButton>
                            </ButtonRow>
                        </RestrictedComponent>
                    </FormStack>
                </div>
            </div>
        </div>
    );
};
