import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { AssignedTasks } from '../../tabs/overview/AssignedTasks';
import { RemoveButton } from '../../utils/RemoveButton';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../../state/atoms';
import { UserMultiSelect } from '../../utils/UserMultiSelect';
import { UserSingleSelect } from '../../utils/UserSingleSelect';
import dayjs from '../../../dayjs';
import Divider from '@mui/material/Divider';
import { ButtonRow, FormStack, StyledCheckbox, StyledDateTimePicker, StyledInput, StyledAddButton } from '../../ui';
import { EditButtons } from '../../utils/EditButtons';
import { RestrictedComponent } from '../../utils/RestrictedComponent';

export const TaskOverview = () => {
    const navigate = useNavigate();
    const props = useOutletContext();
    const subTab = useLocation().pathname.split('/')[5];
    const setDialog = useSetAtom(dialogAtom);
    React.useEffect(() => {
        props(subTab);
    });
    const [disabled, setDisabled] = useState(true);
    const [tick, setTick] = useAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const projectID = useParams().project;
    const taskID = useParams().task;
    const [task, setTask] = useState(null);
    const [users, setUsers] = React.useState([]);
    const [finishDate, setFinishDate] = useState(null);
    const [finished, setFinished] = useState(false);

    const [selectedUsers, setSelectedUsers] = React.useState([]);
    const [descriptionValue, setDescriptionValue] = useState('');

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`), getAuthHeader())
            .then((response) => {
                setTask(response.data);
                setFinishDate(response.data.FinishDate);
                setFinished(response.data.Finished);
                setSelectedUsers(response.data.User_Task.map((user) => user.User.ID));
                setDescriptionValue(response.data.Description);
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

    const handleSubmit = (event) => {
        event.preventDefault();
        axios
            .patch(
                getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
                {
                    Name: event.target.name.value,
                    Description: descriptionValue,
                    FinishDate: finishDate,
                    OwnerID: +event.target.owner.value,
                    Members: selectedUsers.map((user) => {
                        return { UserID: user };
                    }),
                    DurationHours: +event.target.hod.value,
                    DurationMinutes: +event.target.min.value,
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

    const handleFinish = (event) => {
        event.preventDefault();
        axios
            .patch(
                getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
                {
                    Finished: !finished,
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

    const removeTask = () => {
        axios
            .delete(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`), getAuthHeader())
            .then(() => {
                navigate(`/auth/projects/${projectID}`);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const addDependency = (id, dependencyType) => {
        axios
            .post(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}/${dependencyType}`), { id: +id }, getAuthHeader())
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };
    const handleAddDependency = (dependencyType) => {
        setDialog({
            type: 'SelectDependency',
            data: {
                dependencyType: dependencyType,
                handleSubmit: addDependency,
                handleCancel: () => {},
            },
        });
    };

    const removeDependency = (id, dependencyType) => {
        axios
            .delete(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}/${dependencyType}`), { ...getAuthHeader(), data: { id: +id } })
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleRemoveDependency = (dependencyType, nodes) => {
        setDialog({
            type: 'RemoveDependency',
            data: {
                dependencyType: dependencyType,
                nodes: nodes,
                handleSubmit: removeDependency,
                handleCancel: () => {},
            },
        });
    };

    return (
        <div className='content-2-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <FormStack component='form' sx={{ height: '100%' }} onSubmit={handleSubmit}>
                        <div className='content-box_header'>
                            <h1>{task?.Name}</h1>
                            <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                <ButtonRow className='content-box_subheader'>
                                    {disabled ? <RemoveButton handleSuccess={removeTask} /> : null}
                                    <EditButtons editing={!disabled} setEditing={(editing) => setDisabled(!editing)} />
                                </ButtonRow>
                            </RestrictedComponent>
                        </div>
                        <Divider />
                        <StyledInput id='name' label='Název úkolu' defaultValue={task?.Name} disabled={disabled} />
                        <StyledDateTimePicker value={finishDate} onChange={setFinishDate} disabled={disabled} />
                        <ButtonRow justify='stretch'>
                            <StyledInput id='hod' label='Odhad – hodiny' unit='hod' type='number' defaultValue={task?.DurationHours} disabled={disabled} />
                            <StyledInput id='min' label='Odhad – minuty' unit='min' type='number' defaultValue={task?.DurationMinutes} disabled={disabled} />
                        </ButtonRow>
                        <RestrictedComponent types={['ADMIN', 'MANAGER']} ids={selectedUsers}>
                            <StyledCheckbox id='finished' label='Úkol dokončen' checked={finished} onChange={handleFinish} />
                        </RestrictedComponent>
                        <Divider />
                        <UserSingleSelect disabled={disabled} users={users} owner={task?.OwnerID} />
                        <UserMultiSelect disabled={disabled} users={users} task={task} selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
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
            <div className='content-2-row'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>Předchozí úkoly</h1>
                            <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                <div className='content-box_header'>
                                    <StyledAddButton
                                        label='Odebrat předchozí úkol'
                                        onClick={() =>
                                            handleRemoveDependency(
                                                'predecessor',
                                                task?.Successors?.map((task) => task.Predecessor),
                                            )
                                        }
                                    >
                                        -
                                    </StyledAddButton>
                                    <StyledAddButton label='Přidat předchozí úkol' onClick={() => handleAddDependency('predecessor')} />
                                </div>
                            </RestrictedComponent>
                        </div>
                        <div className='content-box_chart-wrapper-outer'>
                            <div className='content-box_chart-wrapper-inner'>
                                <AssignedTasks machineTasks={task?.Successors?.map((task) => task.Predecessor)} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>Následující úkoly</h1>
                            <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                <div className='content-box_header'>
                                    <StyledAddButton
                                        label='Odebrat navazující úkol'
                                        onClick={() =>
                                            handleRemoveDependency(
                                                'successor',
                                                task?.Predecessors?.map((task) => task.Successor),
                                            )
                                        }
                                    >
                                        -
                                    </StyledAddButton>
                                    <StyledAddButton label='Přidat navazující úkol' onClick={() => handleAddDependency('successor')} />
                                </div>
                            </RestrictedComponent>
                        </div>
                        <div className='content-box_chart-wrapper-outer'>
                            <div className='content-box_chart-wrapper-inner'>
                                <AssignedTasks machineTasks={task?.Predecessors?.map((task) => task.Successor)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
