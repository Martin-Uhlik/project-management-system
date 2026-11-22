import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { StyledSubTab, StyledSubTabs } from '../ui';

const noMachines = [];

export const Machines = () => {
    const navigate = useNavigate();
    const setDialog = useSetAtom(dialogAtom);
    const setTab = useSetAtom(selectedTabAtom);
    const [selectedMachine, setSelectedMachine] = React.useState(null);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: machines = noMachines } = useApi('/auth/machines', { topics: ['machines'] });
    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    React.useEffect(() => {
        setTab('Stroje');
    }, [setTab]);

    // no machine chosen in the address: open the first one
    const opened = useParams().machine;
    useEffect(() => {
        if (!opened && machines.length > 0) navigate(machines[0].ID.toString());
    }, [opened, machines, navigate]);

    const addMachine = (name) => {
        axios
            .post(getBackendAddress(`/auth/machines`), { Name: name }, getAuthHeader())
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleAddMachine = () => {
        setDialog({
            type: 'AddMachineDialog',
            data: {
                handleSubmit: addMachine,
                handleCancel: () => {},
            },
        });
    };

    return (
        <>
            <StyledSubTabs>
                {machines.map((machine) => {
                    return (
                        <StyledSubTab key={machine.ID} component={Link} to={machine.ID.toString()} active={selectedMachine === machine.ID.toString()}>
                            {machine.Name}
                        </StyledSubTab>
                    );
                })}
                <RestrictedComponent types={['ADMIN']}>
                    <StyledSubTab aria-label='Přidat stroj' onClick={handleAddMachine}>
                        +
                    </StyledSubTab>
                </RestrictedComponent>
            </StyledSubTabs>
            <div className='content-wrap_inner'>
                <Outlet context={setSelectedMachine} />
            </div>
        </>
    );
};
