import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useSetAtom } from 'jotai';
import { selectedTabAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { GraphEvents } from './project/GraphEvents';
import { ControlsContainer, FullScreenControl, SigmaContainer, ZoomControl } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { LoadGraph } from './project/LoadGraph';
import { GraphTheme } from './project/GraphTheme';
import { TaskSearch } from './project/TaskSearch';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { ProjectStats } from './project/ProjectStats';
import { ProjectTaskList } from './project/ProjectTaskList';
import { ProjectFiles } from './project/ProjectFiles';
import { ProjectSettings } from './project/ProjectSettings';
import dayjs from '../../dayjs';
import { reloadChatOverview, useChatUnread } from '../../state/chat';
import { ChatConversation } from '../chat/ChatConversation';
import type { ProjectDetail, ProjectFileEntry } from '../../types';
import {
    AccountIcon,
    BriefcaseIcon,
    CalendarIcon,
    FullscreenExitIcon,
    FullscreenIcon,
    StyledButton,
    StyledPageHeader,
    StyledPageHeaderFact,
    projectStatus,
    projectStatusLabels,
    useElapsed,
    ZoomInIcon,
    ZoomOutIcon,
    ZoomResetIcon,
} from '../ui';

const tabs = [
    { label: 'Graf úkolů', value: 'graph' },
    { label: 'Seznam úkolů', value: 'tasks' },
    { label: 'Soubory', value: 'files' },
    { label: 'Statistiky', value: 'stats' },
    { label: 'Chat', value: 'chat' },
    { label: 'Nastavení', value: 'settings' },
] as const;
type TabValue = (typeof tabs)[number]['value'];
const noFiles: ProjectFileEntry[] = [];

export const Project = () => {
    const setTab = useSetAtom(selectedTabAtom);
    React.useEffect(() => {
        setTab('Projekty');
    });

    const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
    const selectNode = (node: string | null) => {
        setSelectedNode(node);
    };
    const navigate = useNavigate();
    const handleNavigate = () => {
        if (selectedNode !== null) navigate(selectedNode);
    };

    const [addNode, setAddNode] = useState(false);

    const projectID = useParams().project;
    // the open tab lives in the address (?tab=tasks, ?tab=stats), so it survives a reload and can be linked to
    const [searchParams, setSearchParams] = useSearchParams();
    const tab: TabValue = tabs.find((item) => item.value === searchParams.get('tab'))?.value ?? 'graph';
    const selectTab = (value: TabValue) => setSearchParams(value === 'graph' ? {} : { tab: value }, { replace: true });
    // reloaded on tick too, so the status follows timers started and stopped in this browser
    // reloaded when someone changes this data (live updates) or after a change made here
    const project = useApi<ProjectDetail>(`/auth/projects/${projectID}`, { topics: ['projects', `project:${projectID}`] }).data ?? null;

    // finished green, orange with how long work has been running while someone works on one of its tasks, otherwise blue
    const status = project ? projectStatus(project) : null;
    const elapsed = useElapsed(project?.WorkingSince ?? null);
    const statusLabel = status === 'inProgress' ? `${projectStatusLabels.inProgress} ${elapsed}` : status ? projectStatusLabels[status] : undefined;
    const deadline = project?.FinishDate ? dayjs(project.FinishDate) : null;
    const overdue = deadline && !project?.Finished && deadline.isBefore(dayjs());
    // the project's group chat (the "Chat" tab), with its unread messages on the tab
    const chatUnread = useChatUnread('project', projectID);
    // all files of the project's tasks (the "Soubory" tab, their number on it)
    const files = useApi<ProjectFileEntry[]>(`/auth/projects/${projectID}/files`, { topics: [`project:${projectID}`] }).data;

    return (
        <>
            <StyledPageHeader
                breadcrumbs={[{ label: 'Projekty', to: '/auth/projects' }]}
                back={{ to: '/auth/projects', label: 'Zpět na projekty' }}
                title={project?.Name ?? null}
                status={status}
                statusLabel={statusLabel}
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
                tabs={tabs.map((item) =>
                    item.value === 'chat' ? { ...item, count: chatUnread } : item.value === 'files' ? { ...item, total: files?.length } : item,
                )}
                active={tab}
                onSelect={selectTab}
            />
            {tab === 'chat' ? (
                // the project's group chat in a box on the page, like the other tabs (it scrolls inside)
                <div className='content-wrap_inner'>
                    <Box className='content-box' sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <ChatConversation key={projectID} conversation={{ kind: 'project', id: Number(projectID) }} onRead={reloadChatOverview} />
                    </Box>
                </div>
            ) : (
                <div className='content-wrap_inner'>
                    {tab === 'settings' ? (
                        project ? (
                            <ProjectSettings project={project} />
                        ) : null
                    ) : tab === 'files' ? (
                        <ProjectFiles files={files ?? noFiles} />
                    ) : tab === 'stats' ? (
                        <ProjectStats />
                    ) : tab === 'tasks' ? (
                        <ProjectTaskList />
                    ) : (
                        <div className='content-box'>
                            <div className='content-box_content'>
                                <SigmaContainer>
                                    <ControlsContainer position='top-left'>
                                        <FullScreenControl labels={{ enter: 'Celá obrazovka', exit: 'Zavřít celou obrazovku' }}>
                                            <FullscreenIcon />
                                            <FullscreenExitIcon />
                                        </FullScreenControl>
                                        <ZoomControl labels={{ zoomIn: 'Přiblížit', zoomOut: 'Oddálit', reset: 'Zobrazit celý graf' }}>
                                            <ZoomInIcon />
                                            <ZoomOutIcon />
                                            <ZoomResetIcon />
                                        </ZoomControl>
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
            )}
        </>
    );
};
