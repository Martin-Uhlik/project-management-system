import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import { useLive } from '../../state/live';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { RemoveButton } from '../utils/RemoveButton';
import { UserMultiSelect } from '../utils/UserMultiSelect';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { pushNotification } from '../Notifications';
import { UserSingleSelect } from '../utils/UserSingleSelect';
import Divider from '@mui/material/Divider';
import { ButtonRow, FormStack, StyledButton, StyledCheckbox, StyledDateTimePicker, StyledInput, StyledAddButton } from '../ui';
import { ProjectTable } from '../utils/tables/ProjectTable';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { EditButtons } from '../utils/EditButtons';

export const Projects = () => {
    const setTab = useSetAtom(selectedTabAtom);
    const setDialog = useSetAtom(dialogAtom);
    useEffect(() => {
        setTab('Projekty');
    });

    const [disabled, setDisabled] = useState(true);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive('projects', 'users');
    const setTick = useSetAtom(tickAtom);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [project, setProject] = useState(null);
    const [users, setUsers] = React.useState([]);
    const [selectedUsers, setSelectedUsers] = React.useState([]);
    const [finishDate, setFinishDate] = useState(null);
    const [descriptionValue, setDescriptionValue] = useState('');
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects`), getAuthHeader())
            .then((response) => {
                setProjects(response.data);
                if (!selectedProject && response.data.length > 0) {
                    setSelectedProject(response.data[0].ID);
                }
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });

        axios
            .get(getBackendAddress(`/auth/users`), getAuthHeader())
            .then((response) => {
                setUsers(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    useEffect(() => {
        if (selectedProject && disabled) {
            axios
                .get(getBackendAddress(`/auth/projects/${selectedProject}`), getAuthHeader())
                .then((response) => {
                    setProject(response.data);
                    setFinishDate(response.data.FinishDate);
                    setSelectedUsers(response.data.Member.map((user) => user.User.ID));
                    setDescriptionValue(response.data.Description);
                    setFinished(response.data.Finished);
                })
                .catch((error) => {
                    handleAxiosError(error, [notifications, setNotifications]);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, selectedProject]);

    const handleUpdateProject = (event) => {
        event.preventDefault();
        axios
            .patch(
                getBackendAddress(`/auth/projects/${project?.ID}`),
                {
                    Name: event.target.name.value,
                    Description: descriptionValue,
                    Customer: event.target.customer.value,
                    FinishDate: finishDate,
                    Finished: finished,
                    OwnerID: +event.target.owner.value,
                    Members: selectedUsers.map((user) => {
                        return { UserID: user };
                    }),
                },
                getAuthHeader(),
            )
            .then(() => {
                setDisabled(true);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleRemoveProject = () => {
        axios
            .delete(getBackendAddress(`/auth/projects/${selectedProject}`), getAuthHeader())
            .then(() => {
                pushNotification({
                    notification: { text: 'Projekt úspěšně odstraněn.', type: 'notification__success' },
                    notifications: notifications,
                    setNotifications: setNotifications,
                });
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const addProject = (data) => {
        axios
            .post(
                getBackendAddress(`/auth/projects`),
                {
                    ...data,
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

    const handleAddProject = () => {
        setDialog({
            type: 'AddProject',
            data: {
                handleSubmit: addProject,
                handleCancel: () => {},
            },
        });
    };

    return (
        <div className='content-wrap_inner'>
            <div className='content-2-column'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>Projekty</h1>
                            <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                <StyledAddButton label='Přidat projekt' onClick={handleAddProject} />
                            </RestrictedComponent>
                        </div>
                        <ProjectTable projects={projects} setSelectedProject={setSelectedProject} />
                    </div>
                </div>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <FormStack component='form' sx={{ height: '100%' }} onSubmit={handleUpdateProject}>
                            <div className='content-box_header'>
                                <h1>{project?.Name}</h1>
                                <ButtonRow className='content-box_subheader'>
                                    {disabled ? (
                                        <RestrictedComponent types={['ADMIN']}>
                                            <RemoveButton handleSuccess={handleRemoveProject} />
                                        </RestrictedComponent>
                                    ) : null}
                                    <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                        <EditButtons editing={!disabled} setEditing={(editing) => setDisabled(!editing)} />
                                    </RestrictedComponent>
                                    {disabled ? (
                                        <RestrictedComponent types={['ADMIN']} ids={selectedUsers}>
                                            <StyledButton component={Link} to={project?.ID.toString() || '#'}>
                                                Přejít na projekt
                                            </StyledButton>
                                        </RestrictedComponent>
                                    ) : null}
                                </ButtonRow>
                            </div>
                            <StyledInput id='name' label='Název projektu' defaultValue={project?.Name} disabled={disabled} />
                            <StyledInput id='customer' label='Zákazník' defaultValue={project?.Customer} disabled={disabled} />
                            <StyledDateTimePicker value={finishDate} onChange={setFinishDate} disabled={disabled} />
                            <StyledCheckbox
                                id='finished'
                                label='Projekt dokončen'
                                checked={finished}
                                onChange={() => setFinished(!finished)}
                                disabled={disabled}
                            />
                            <Divider />
                            <UserSingleSelect disabled={disabled} users={users} owner={project?.OwnerID} />
                            <UserMultiSelect disabled={disabled} users={users} selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
                            <Divider />
                            <StyledInput
                                id='description'
                                label='Popis'
                                multiline
                                minRows={8}
                                value={descriptionValue ?? ''}
                                onChange={(event) => setDescriptionValue(event.target.value)}
                                disabled={disabled}
                            />
                        </FormStack>
                    </div>
                </div>
            </div>
        </div>
    );
};
