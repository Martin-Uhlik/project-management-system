import { useState } from 'react';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { pushNotification } from '../../Notifications';
import { handleAxiosError } from '../../../errorHandler';
import { useAtom, useSetAtom } from 'jotai';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import dayjs from '../../../dayjs';
import { RestrictedComponent } from '../../utils/RestrictedComponent';
import Divider from '@mui/material/Divider';
import { ButtonRow, FormStack, StyledButton, StyledInput, StyledSelect } from '../../ui';
import { userRoleOptions } from '../../dialogs/AddUser';

const enabledOptions = [
    { value: 'true', label: 'Povolen' },
    { value: 'false', label: 'Zakázán' },
];

export const UserSettings = (props) => {
    const user = props.user;
    const [disabled, setDisabled] = useState(true);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);
    const handleEdit = (event, data) => {
        event.preventDefault();

        axios
            .patch(
                getBackendAddress(`/auth/users/${user.ID}`),
                {
                    ...data,
                },
                getAuthHeader(),
            )
            .then(() => {
                pushNotification({
                    notification: { text: 'Nastavení úspěšně změněno.', type: 'notification__success' },
                    notifications: notifications,
                    setNotifications: setNotifications,
                });
                setDisabled(true);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handlePasswordChange = (event) => {
        event.preventDefault(event);
        axios
            .patch(
                getBackendAddress(`/auth/users/password/${user.ID}`),
                {
                    oldPassword: event.target.password.value.toString(),
                    newPassword: event.target.newPassword.value.toString(),
                },
                getAuthHeader(),
            )
            .then(() => {
                pushNotification({
                    notification: { text: 'Heslo úspěšně změněno.', type: 'notification__success' },
                    notifications: notifications,
                    setNotifications: setNotifications,
                });
                setDisabled(true);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    // key: a different user gets fresh fields (they start from the user's current values)
    return (
        <FormStack key={user?.ID ?? 'none'} gap={3}>
            <ButtonRow justify='space-between'>
                <h1>{`${user?.FirstName} ${user?.LastName}`}</h1>
                <RestrictedComponent types={['ADMIN']}>
                    {disabled ? (
                        <StyledButton variant='outlined' onClick={() => setDisabled(false)}>
                            Upravit
                        </StyledButton>
                    ) : (
                        <StyledButton color='error' onClick={() => setDisabled(true)}>
                            Zrušit
                        </StyledButton>
                    )}
                </RestrictedComponent>
            </ButtonRow>
            <h2>Status uživatele:</h2>
            <FormStack component='form' onSubmit={(e) => handleEdit(e, { Enabled: e.target.enabled.value === 'true' })}>
                <StyledSelect id='enabled' label='Status uživatele' defaultValue={user?.Enabled?.toString() ?? ''} options={enabledOptions} />
                <ButtonRow>
                    <StyledButton type='submit'>Použít</StyledButton>
                </ButtonRow>
            </FormStack>
            <Divider />
            <h2>Uživatelské informace:</h2>
            <FormStack
                component='form'
                onSubmit={(e) =>
                    handleEdit(e, {
                        UserName: e.target.uname.value,
                        FirstName: e.target.fname.value,
                        LastName: e.target.lname.value,
                        Position: e.target.position.value,
                    })
                }
            >
                <StyledInput id='uname' label='Uživatelské jméno' defaultValue={user?.UserName} disabled={disabled} />
                <StyledInput id='fname' label='Jméno' defaultValue={user?.FirstName} disabled={disabled} />
                <StyledInput id='lname' label='Příjmení' defaultValue={user?.LastName} disabled={disabled} />
                <StyledInput id='position' label='Pozice' defaultValue={user?.Position} disabled={disabled} />
                <ButtonRow>
                    <StyledButton type='submit' disabled={disabled}>
                        Použít
                    </StyledButton>
                </ButtonRow>
            </FormStack>
            <Divider />
            <h2>Heslo:</h2>
            <FormStack component='form' onSubmit={handlePasswordChange}>
                <StyledInput id='newPassword' label='Nové heslo' type='password' autoComplete='new-password' disabled={disabled} />
                <StyledInput id='rNewPassword' label='Potvrzení nového hesla' type='password' autoComplete='new-password' disabled={disabled} />
                <ButtonRow>
                    <StyledButton type='submit' disabled={disabled}>
                        Použít
                    </StyledButton>
                </ButtonRow>
            </FormStack>
            <Divider />
            <h2>Role uživatele:</h2>
            <FormStack component='form' onSubmit={(e) => handleEdit(e, { UserType: e.target.role.value })}>
                <StyledSelect id='role' label='Role uživatele' defaultValue={user?.UserType ?? ''} options={userRoleOptions} disabled={disabled} />
                <ButtonRow>
                    <StyledButton type='submit' disabled={disabled}>
                        Použít
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </FormStack>
    );
};
