import { useNavigate, useParams } from 'react-router';
import { useAtom, useSetAtom } from 'jotai';
import axios from 'axios';
import { notificationsAtom, selectedTabAtom } from '../../state/atoms';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import React, { useState } from 'react';
import { GraphEvents } from './project/GraphEvents';
import { ControlsContainer, FullScreenControl, SigmaContainer, ZoomControl } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { LoadGraph } from './project/LoadGraph';
import { TaskSearch } from './project/TaskSearch';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { StyledButton } from '../ui';

export const Project = () => {
    const setTab = useSetAtom(selectedTabAtom);
    React.useEffect(() => {
        setTab('Projekty');
    });

    const [selectedNode, setSelectedNode] = React.useState(null);
    const selectNode = (node) => {
        setSelectedNode(node);
    };
    const navigate = useNavigate();
    const handleNavigate = () => {
        navigate(selectedNode);
    };

    const [addNode, setAddNode] = useState(false);

    const projectID = useParams().project;
    const [projectName, setProjectName] = useState('');
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    React.useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${projectID}`), getAuthHeader())
            .then((response) => {
                setProjectName(response.data.Name);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectID]);

    return (
        <div className='content-wrap_inner'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <h1>{projectName}</h1>
                    <SigmaContainer>
                        <ControlsContainer position='top-left'>
                            <FullScreenControl />
                            <ZoomControl />
                        </ControlsContainer>
                        <ControlsContainer position='top-right'>
                            <TaskSearch selectNode={selectNode} />
                        </ControlsContainer>
                        <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                            <ControlsContainer position='bottom-left'>
                                <StyledButton color={addNode ? 'error' : 'dark'} onClick={() => setAddNode(!addNode)}>
                                    {addNode ? 'Zrušit' : 'Přidat úkol'}
                                </StyledButton>
                            </ControlsContainer>
                        </RestrictedComponent>
                        {selectedNode !== null ? (
                            <ControlsContainer position='bottom-right'>
                                <StyledButton onClick={handleNavigate}>Přejít na úkol</StyledButton>
                            </ControlsContainer>
                        ) : null}
                        <LoadGraph />
                        <GraphEvents selectNode={selectNode} addNode={{ addNode, setAddNode }} />
                    </SigmaContainer>
                </div>
            </div>
        </div>
    );
};
