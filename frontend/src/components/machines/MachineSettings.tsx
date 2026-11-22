import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import axios from 'axios';
import { dialogAtom, notificationsAtom, tickAtom, userAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { pushNotification } from '../Notifications';
import { UserSingleSelect } from '../utils/UserSingleSelect';
import { ButtonRow, FormStack, StyledButton, StyledInput, StyledSection, TrashIcon } from '../ui';
import { fieldValue } from '../../form';
import type { ChangeEvent, FormEvent } from 'react';
import type { MachineDetail, User } from '../../types';

const noUsers: User[] = [];

// A machine's "Nastavení" tab: name, description and responsible person. Admins, managers and the responsible person
// edit it (only admins and managers choose the responsible person); admins also delete the machine.
export const MachineSettings = ({ machine, canEdit }: { machine: MachineDetail; canEdit: boolean }) => {
    const me = useAtomValue(userAtom);
    const isManager = me?.UserType === 'ADMIN' || me?.UserType === 'MANAGER';
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setDialog = useSetAtom(dialogAtom);
    const setTick = useSetAtom(tickAtom);
    const navigate = useNavigate();
    const { data: users = noUsers } = useApi<User[]>('/auth/users', { topics: ['users'] });
    const enabledUsers = users.filter((user) => user.Enabled !== false || user.ID === machine.ResponsibleID);

    // the form follows the loaded machine until something in it is changed here
    const [dirty, setDirty] = useState(false);
    const [formMachine, setFormMachine] = useState<MachineDetail | null>(null);
    const [formKey, setFormKey] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    if (!dirty && machine !== formMachine) {
        setFormMachine(machine);
        setFormKey(formKey + 1);
        setName(machine.Name ?? '');
        setDescription(machine.Description ?? '');
    }
    const change = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
        setDirty(true);
        setter(event.target.value);
    };

    const handleSave = (event: FormEvent) => {
        event.preventDefault();
        const owner = fieldValue(event, 'owner');
        axios
            .patch(
                getBackendAddress(`/auth/machines/${machine.ID}`),
                { Name: name, Description: description || null, ...(isManager ? { ResponsibleID: owner ? Number(owner) : null } : {}) },
                getAuthHeader(),
            )
            .then(() => {
                setDirty(false);
                setTick(dayjs());
                pushNotification({ notification: { text: 'Změny stroje uloženy.', type: 'notification__success' }, notifications, setNotifications });
            })
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
    };

    const handleDelete = () =>
        setDialog({
            type: 'ConfirmDialog',
            data: {
                title: 'Odstranit stroj',
                description: `Opravdu chcete odstranit stroj „${machine.Name}“?`,
                handleCancel: () => {},
                handleSuccess: () =>
                    axios
                        .delete(getBackendAddress(`/auth/machines/${machine.ID}`), getAuthHeader())
                        .then(() => {
                            pushNotification({ notification: { text: 'Stroj odstraněn.', type: 'notification__success' }, notifications, setNotifications });
                            setTick(dayjs());
                            navigate('/auth/machines');
                        })
                        .catch((error) => handleAxiosError(error, [notifications, setNotifications])),
            },
        });

    return (
        <FormStack sx={{ width: 'min(50rem, 100%)', mx: 'auto' }}>
            <StyledSection title='Údaje stroje' caption={canEdit ? undefined : 'Upravit je může zodpovědný pracovník, vedoucí nebo administrátor.'}>
                <FormStack component='form' onSubmit={handleSave} sx={{ mt: 2 }}>
                    <StyledInput id='name' label='Název stroje' value={name} onChange={change(setName)} disabled={!canEdit} />
                    <UserSingleSelect
                        key={formKey}
                        users={enabledUsers}
                        owner={machine.ResponsibleID ?? ''}
                        emptyLabel='nikdo'
                        disabled={!isManager}
                        onChange={() => setDirty(true)}
                    />
                    <StyledInput
                        id='description'
                        label='Popis'
                        multiline
                        minRows={8}
                        value={description}
                        onChange={change(setDescription)}
                        disabled={!canEdit}
                    />
                    {canEdit ? (
                        <ButtonRow>
                            <StyledButton
                                color='dark'
                                disabled={!dirty}
                                onClick={() => {
                                    setDirty(false);
                                    setFormMachine(null);
                                }}
                            >
                                Zrušit změny
                            </StyledButton>
                            <StyledButton type='submit' color='success' disabled={!dirty || !name.trim()}>
                                Uložit
                            </StyledButton>
                        </ButtonRow>
                    ) : null}
                </FormStack>
            </StyledSection>
            {me?.UserType === 'ADMIN' ? (
                <StyledSection title='Odstranění stroje' caption='Stroj zmizí ze seznamu strojů. Tuto akci nelze vrátit zpět.'>
                    <ButtonRow sx={{ mt: 2 }}>
                        <StyledButton color='error' startIcon={<TrashIcon />} onClick={handleDelete}>
                            Odstranit stroj
                        </StyledButton>
                    </ButtonRow>
                </StyledSection>
            ) : null}
        </FormStack>
    );
};
