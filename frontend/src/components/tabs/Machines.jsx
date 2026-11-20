import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import { useLive } from '../../state/live';
import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { StyledSubTab, StyledSubTabs } from '../ui';

export const Machines = () => {
    const navigate = useNavigate();
    const setDialog = useSetAtom(dialogAtom);
    const setTab = useSetAtom(selectedTabAtom);
    const [selectedMachine, setSelectedMachine] = React.useState(null);
    const [machines, setMachines] = React.useState([]);
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive('machines');
    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    React.useEffect(() => {
        setTab('Stroje');
    }, [setTab]);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/machines`), getAuthHeader())
            .then((response) => {
                setMachines(response.data);
                if (!selectedMachine) {
                    if (response.data.length > 0) {
                        navigate(response.data[0].ID.toString());
                    }
                }
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

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
