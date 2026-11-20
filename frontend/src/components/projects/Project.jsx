import { useNavigate, useParams, useSearchParams } from 'react-router';
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
import { GraphTheme } from './project/GraphTheme';
import { TaskSearch } from './project/TaskSearch';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { ProjectStats } from './project/ProjectStats';
import { ProjectTaskList } from './project/ProjectTaskList';
import dayjs from '../../dayjs';
import { AccountIcon, BriefcaseIcon, CalendarIcon, StyledButton, StyledPageHeader, StyledPageHeaderFact } from '../ui';

const tabs = [
    { label: 'Graf úkolů', value: 'graph' },
    { label: 'Seznam úkolů', value: 'tasks' },
    { label: 'Statistiky', value: 'stats' },
];

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
    const [project, setProject] = useState(null);
    // the open tab lives in the address (?tab=tasks, ?tab=stats), so it survives a reload and can be linked to
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = tabs.some((item) => item.value === searchParams.get('tab')) ? searchParams.get('tab') : 'graph';
    const selectTab = (value) => setSearchParams(value === 'graph' ? {} : { tab: value }, { replace: true });
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    React.useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${projectID}`), getAuthHeader())
            .then((response) => {
                setProject(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectID]);

    const status = project ? (project.Finished ? 'finished' : 'inProgress') : null;
    const deadline = project?.FinishDate ? dayjs(project.FinishDate) : null;
    const overdue = deadline && !project.Finished && deadline.isBefore(dayjs());

    return (
        <>
            <StyledPageHeader
                breadcrumbs={[{ label: 'Projekty', to: '/auth/projects' }]}
                title={project?.Name ?? null}
                status={status}
                statusLabel={project && !project.Finished ? 'Probíhá' : undefined}
                facts={
                    project ? (
                        <>
                            <StyledPageHeaderFact icon={BriefcaseIcon} label='Zákazník'>
                                {project.Customer}
                            </StyledPageHeaderFact>
                            <StyledPageHeaderFact icon={CalendarIcon} label='Termín' color={overdue ? 'error' : undefined}>
                                {deadline?.format('LL')}
                            </StyledPageHeaderFact>
                            <StyledPageHeaderFact icon={AccountIcon} label='Zodpovědný pracovník'>
                                {project.Owner ? `${project.Owner.FirstName} ${project.Owner.LastName}` : null}
                            </StyledPageHeaderFact>
                        </>
                    ) : null
                }
                tabs={tabs}
                active={tab}
                onSelect={selectTab}
            />
            <div className='content-wrap_inner'>
                {tab === 'stats' ? (
                    <ProjectStats />
                ) : tab === 'tasks' ? (
                    <ProjectTaskList />
                ) : (
                    <div className='content-box'>
                        <div className='content-box_content'>
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
                                <GraphTheme />
                                <LoadGraph />
                                <GraphEvents selectNode={selectNode} addNode={{ addNode, setAddNode }} />
                            </SigmaContainer>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
