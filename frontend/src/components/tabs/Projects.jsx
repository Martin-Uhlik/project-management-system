import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom, userAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { ArrowRightIcon, StyledAddButton, StyledBoxHeader, StyledChip, StyledIconButton, StyledStatus, projectStatus, projectStatusLabels } from '../ui';
import { ProjectTable } from '../utils/tables/ProjectTable';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { ListFiltersButton } from '../utils/ListFiltersButton';
import { useListFilters } from '../../state/listFilters';
import { ProjectPreviewStats } from '../projects/project/ProjectPreviewStats';

const none = [];
const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : null);

// One fact of the selected project: a quiet label over its value ('–' when it has none)
const Fact = ({ label, children }) => (
    <Stack sx={{ gap: 0.5 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {label}
        </Typography>
        <Box sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children || children === 0 ? children : '–'}</Box>
    </Stack>
);

export const Projects = () => {
    const setTab = useSetAtom(selectedTabAtom);
    const setDialog = useSetAtom(dialogAtom);
    useEffect(() => {
        setTab('Projekty');
    });

    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const me = useAtomValue(userAtom);
    const setTick = useSetAtom(tickAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: projects = none } = useApi('/auth/projects', { topics: ['projects', 'users'] });
    // the gear picks whether finished projects and projects the user isn't part of (Mine) are listed
    const { filters } = useListFilters('projects');
    const shownProjects = React.useMemo(
        () => projects.filter((project) => (filters.showFinished || !project.Finished) && (filters.showOthers || project.Mine)),
        [projects, filters],
    );
    // the project clicked in the list, else the first one listed
    const [chosenProject, setSelectedProject] = useState(null);
    const selectedProject = chosenProject ?? shownProjects[0]?.ID ?? null;
    const project =
        useApi(`/auth/projects/${selectedProject}`, { topics: ['projects', 'users', `project:${selectedProject}`], enabled: !!selectedProject }).data ?? null;

    const addProject = (data) => {
        axios
            .post(getBackendAddress(`/auth/projects`), { ...data }, getAuthHeader())
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleAddProject = () => {
        setDialog({
            type: 'AddProject',
            data: {
                handleSubmit: addProject,
                handleCancel: () => {},
            },
        });
    };

    // the project's details are only shown here; they are edited (and the project deleted) on its "Nastavení" tab
    const status = project ? projectStatus(project) : null;
    const deadline = project?.FinishDate ? dayjs(project.FinishDate) : null;
    const overdue = deadline && !project.Finished && deadline.isBefore(dayjs());
    const people = project ? [project.OwnerID, ...project.Member.map((member) => member.User.ID)] : none;
    // the numbers need access to the project (the same people who can open it)
    const canOpen = me && (me.UserType === 'ADMIN' || me.UserType === 'MANAGER' || people.includes(me.ID));

    return (
        <div className='content-wrap_inner'>
            <div className='content-2-column'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <StyledBoxHeader
                            title='Projekty'
                            add={
                                <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                    <StyledAddButton label='Přidat projekt' onClick={handleAddProject} />
                                </RestrictedComponent>
                            }
                            settings={<ListFiltersButton list='projects' />}
                        />
                        <ProjectTable projects={shownProjects} selectedProject={selectedProject} setSelectedProject={setSelectedProject} />
                    </div>
                </div>
                <div className='content-box'>
                    {project ? (
                        <div className='content-box_content'>
                            <div className='content-box_header'>
                                <Stack direction='row' sx={{ alignItems: 'center', gap: 1, minWidth: 0 }}>
                                    <StyledStatus status={status} label={projectStatusLabels[status]} />
                                    <h1>{project.Name}</h1>
                                </Stack>
                                <RestrictedComponent types={['ADMIN', 'MANAGER']} ids={people}>
                                    <StyledIconButton
                                        label='Přejít na projekt'
                                        component={Link}
                                        to={`/auth/projects/${project.ID}`}
                                        sx={{ bgcolor: 'primary.main', color: '#ffffff', p: 1, '&:hover': { bgcolor: 'primary.dark' } }}
                                    >
                                        <ArrowRightIcon sx={{ fontSize: '2rem' }} />
                                    </StyledIconButton>
                                </RestrictedComponent>
                            </div>
                            <Divider />
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                <Fact label='Zákazník'>{project.Customer}</Fact>
                                <Fact label='Termín'>
                                    {deadline ? (
                                        <Box component='span' sx={overdue ? { color: 'error.main' } : undefined}>
                                            {deadline.format('LL')}
                                        </Box>
                                    ) : null}
                                </Fact>
                                <Fact label='Stav'>{projectStatusLabels[status]}</Fact>
                                <Fact label='Zodpovědný pracovník'>{fullName(project.Owner)}</Fact>
                            </Box>
                            <Fact label='Členové'>
                                {project.Member.length ? (
                                    <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 1 }}>
                                        {project.Member.map((member) => (
                                            <StyledChip key={member.User.ID} label={fullName(member.User)} />
                                        ))}
                                    </Stack>
                                ) : null}
                            </Fact>
                            {canOpen ? (
                                <>
                                    <Divider />
                                    <ProjectPreviewStats key={project.ID} project={project} />
                                </>
                            ) : null}
                            <Divider />
                            <Fact label='Popis'>{project.Description}</Fact>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
