import React from 'react';
import { useLocation, useOutletContext, useParams } from 'react-router';
import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../../state/atoms';
import { MaterialTable } from '../../utils/tables/MaterialTable';
import { MaterialRequirementTable } from '../../utils/tables/MaterialRequirementTable';
import { TaskMaterialTable } from '../../utils/tables/TaskMaterialTable';
import { RestrictedComponent } from '../../utils/RestrictedComponent';
import { StyledAddButton, StyledBoxHeader } from '../../ui';

export const TaskMaterial = () => {
    const props = useOutletContext();
    const subTab = useLocation().pathname.split('/')[5];
    const setDialog = useSetAtom(dialogAtom);
    React.useEffect(() => {
        props(subTab);
    });

    const taskID = useParams().task;

    const handleAddMaterialRequirement = () => {
        setDialog({
            type: 'AddMaterialRequirement',
            data: {
                taskID,
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
                    <StyledBoxHeader
                        title='Požadavky na materiál'
                        add={
                            <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                <StyledAddButton label='Přidat požadavek na materiál' onClick={handleAddMaterialRequirement} />
                            </RestrictedComponent>
                        }
                    />
                    <MaterialRequirementTable taskID={taskID} />
                </div>
            </div>
        </div>
    );
};
