import React from 'react';
import { useLocation, useOutletContext, useParams } from 'react-router';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../../state/atoms';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader, getUserID } from '../../../Auth';
import moment from 'moment';
import { handleAxiosError } from '../../../errorHandler';
import { MaterialTable } from '../../utils/tables/MaterialTable';
import { MaterialRequirementTable } from '../../utils/tables/MaterialRequirementTable';
import { TaskMaterialTable } from '../../utils/tables/TaskMaterialTable';
import { RestrictedComponent } from '../../utils/RestrictedComponent';

export const TaskMaterial = () => {
    const props = useOutletContext();
    const subTab = useLocation().pathname.split('/')[5];
    const setDialog = useSetAtom(dialogAtom);
    React.useEffect(() => {
        props(subTab);
    });

    const taskID = useParams().task;

    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const addMaterialRequirement = (props) => {
        axios
            .post(
                getBackendAddress(`/auth/materialRequirements`),
                {
                    Name: props.name,
                    Description: props.description,
                    Count: +props.count,
                    Price: +props.price,
                    NeededDate: props.date,
                    TargetUserID: +getUserID(),
                    TargetTaskID: +taskID,
                },
                getAuthHeader(),
            )
            .then(() => {
                setTick(moment());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleAddMaterialRequirement = () => {
        setDialog({
            type: 'AddMaterialRequirement',
            data: {
                handleSubmit: addMaterialRequirement,
                handleCancel: () => {},
            },
        });
    };
    return (
        <div className='content-2-column'>
            <div className='content-2-row'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <h1>Rezervovaný materiál</h1>
                        <TaskMaterialTable />
                    </div>
                </div>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>Dostupný materiál</h1>
                        </div>
                        <MaterialTable taskID={taskID} />
                    </div>
                </div>
            </div>
            <div className='content-box'>
                <div className='content-box_content'>
                    <div className='content-box_header'>
                        <h1>Požadavky na materiál</h1>
                        <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                            <button type='button' className='add-button' aria-label='Přidat požadavek na materiál' onClick={handleAddMaterialRequirement}>
                                +
                            </button>
                        </RestrictedComponent>
                    </div>
                    <MaterialRequirementTable taskID={taskID} />
                </div>
            </div>
        </div>
    );
};
