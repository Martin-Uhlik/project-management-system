import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import axios from 'axios';
import Divider from '@mui/material/Divider';
import { dialogAtom, notificationsAtom, tickAtom, userAtom } from '../../../state/atoms';
import { useApi } from '../../../state/query';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';
import dayjs from '../../../dayjs';
import { pushNotification } from '../../Notifications';
import { UserSingleSelect } from '../../utils/UserSingleSelect';
import { UserMultiSelect } from '../../utils/UserMultiSelect';
import { ButtonRow, FormStack, StyledButton, StyledCheckbox, StyledDateTimePicker, StyledInput, StyledSection, TrashIcon } from '../../ui';
import { fieldValue } from '../../../form';
import type { Dayjs } from 'dayjs';
import type { FormEvent } from 'react';
import type { ProjectDetail, User } from '../../../types';

const noUsers: User[] = [];

// The project's "Nastavení" tab: its details (name, customer, deadline, finished, owner, members, description),
// editable only by the project's owner and admins (read-only for everyone else), and for them also deleting the project.
export const ProjectSettings = ({ project }: { project: ProjectDetail }) => {
    const me = useAtomValue(userAtom);
    const canEdit = me?.UserType === 'ADMIN' || me?.ID === project.OwnerID;
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setDialog = useSetAtom(dialogAtom);
    const setTick = useSetAtom(tickAtom);
    const navigate = useNavigate();
    const { data: users = noUsers } = useApi<User[]>('/auth/users', { topics: ['users'] });

    // the form follows the loaded project until something in it is changed here
    const [dirty, setDirty] = useState(false);
    const [formProject, setFormProject] = useState<ProjectDetail | null>(null);
    // remounts the owner select (it keeps its own choice) when the form is filled again
    const [formKey, setFormKey] = useState(0);
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [finishDate, setFinishDate] = useState<Dayjs | string | null>(null);
    const [finished, setFinished] = useState(false);
    const [members, setMembers] = useState<number[]>([]);
    const [description, setDescription] = useState('');
    if (!dirty && project !== formProject) {
        setFormProject(project);
        setFormKey(formKey + 1);
        setName(project.Name ?? '');
        setCustomer(project.Customer ?? '');
        setFinishDate(project.FinishDate ?? null);
        setFinished(project.Finished);
        setMembers(project.Member.map((member) => member.User.ID));
        setDescription(project.Description ?? '');
    }
    const change =
        <T,>(setter: (value: T) => void) =>
        (value: T) => {
            setDirty(true);
            setter(value);
        };

    const handleSave = (event: FormEvent) => {
        event.preventDefault();
        axios
            .patch(
                getBackendAddress(`/auth/projects/${project.ID}`),
                {
                    Name: name,
                    Description: description,
                    Customer: customer,
                    FinishDate: finishDate,
                    Finished: finished,
                    OwnerID: +fieldValue(event, 'owner'),
                    Members: members.map((UserID) => ({ UserID })),
                },
                getAuthHeader(),
            )
            .then(() => {
                setDirty(false);
                setTick(dayjs());
                pushNotification({
                    notification: { text: 'Změny projektu uloženy.', type: 'notification__success' },
                    notifications,
                    setNotifications,
                });
            })
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
    };

    const handleReset = () => {
        setDirty(false);
        setFormProject(null);
    };

    const handleDelete = () => {
        setDialog({
            type: 'ConfirmDialog',
            data: {
                title: 'Odstranit projekt',
                description: `Opravdu chcete odstranit projekt „${project.Name}“?`,
                handleCancel: () => {},
                handleSuccess: () => {
                    axios
                        .delete(getBackendAddress(`/auth/projects/${project.ID}`), getAuthHeader())
                        .then(() => {
                            pushNotification({
                                notification: { text: 'Projekt úspěšně odstraněn.', type: 'notification__success' },
                                notifications,
                                setNotifications,
                            });
                            setTick(dayjs());
                            navigate('/auth/projects');
                        })
                        .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
                },
            },
        });
    };

    return (
        <FormStack sx={{ width: 'min(50rem, 100%)', mx: 'auto' }}>
            <StyledSection title='Údaje projektu' caption={canEdit ? undefined : 'Upravit je může jen zodpovědný pracovník projektu nebo administrátor.'}>
                <FormStack component='form' onSubmit={handleSave} sx={{ mt: 2 }}>
                    <StyledInput id='name' label='Název projektu' value={name} onChange={(event) => change(setName)(event.target.value)} disabled={!canEdit} />
                    <StyledInput
                        id='customer'
                        label='Zákazník'
                        value={customer}
                        onChange={(event) => change(setCustomer)(event.target.value)}
                        disabled={!canEdit}
                    />
                    <StyledDateTimePicker value={finishDate} onChange={change(setFinishDate)} disabled={!canEdit} />
                    <StyledCheckbox
                        id='finished'
                        label='Projekt dokončen'
                        checked={finished}
                        onChange={() => change(setFinished)(!finished)}
                        disabled={!canEdit}
                    />
                    <Divider />
                    <UserSingleSelect key={formKey} disabled={!canEdit} users={users} owner={project.OwnerID} onChange={() => setDirty(true)} />
                    <UserMultiSelect disabled={!canEdit} users={users} selectedUsers={members} setSelectedUsers={change(setMembers)} />
                    <Divider />
                    <StyledInput
                        id='description'
                        label='Popis'
                        multiline
                        minRows={8}
                        value={description}
                        onChange={(event) => change(setDescription)(event.target.value)}
                        disabled={!canEdit}
                    />
                    {canEdit ? (
                        <ButtonRow>
                            <StyledButton color='dark' onClick={handleReset} disabled={!dirty}>
                                Zrušit změny
                            </StyledButton>
                            <StyledButton type='submit' color='success' disabled={!dirty}>
                                Uložit
                            </StyledButton>
                        </ButtonRow>
                    ) : null}
                </FormStack>
            </StyledSection>
            {canEdit ? (
                <StyledSection title='Odstranění projektu' caption='Projekt zmizí ze seznamu projektů i se svými úkoly. Tuto akci nelze vrátit zpět.'>
                    <ButtonRow sx={{ mt: 2 }}>
                        <StyledButton color='error' startIcon={<TrashIcon />} onClick={handleDelete}>
                            Odstranit projekt
                        </StyledButton>
                    </ButtonRow>
                </StyledSection>
            ) : null}
        </FormStack>
    );
};
