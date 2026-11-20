import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { notificationsAtom, selectedTabAtom } from '../../state/atoms';
import { pushNotification } from '../Notifications';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader, getUserID } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import { ButtonRow, FormStack, StyledButton, StyledInput, StyledFontSizeSelect, StyledThemeSelect } from '../ui';

export const Settings = () => {
    const setTab = useSetAtom(selectedTabAtom);
    React.useEffect(() => {
        setTab('Nastavení');
    });
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [rNewPassword, setRNewPassword] = React.useState('');

    const handlePasswordChange = (event) => {
        event.preventDefault(event);
        axios
            .patch(
                getBackendAddress(`/auth/users/password/${getUserID()}`),
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
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    return (
        <div className='content-wrap_inner'>
            <div className='content-1-column'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <h1>Vzhled</h1>
                        <p className='settings_description'>Nastavení se uloží v tomto prohlížeči.</p>
                        <h2 className='settings_subtitle'>Barevný režim</h2>
                        <p className='settings_description'>Světlý, tmavý, nebo podle nastavení vašeho počítače či telefonu.</p>
                        <StyledThemeSelect showLabels />
                        <h2 className='settings_subtitle'>Velikost písma</h2>
                        <p className='settings_description'>Zvětší nebo zmenší text i ovládací prvky v celé aplikaci.</p>
                        <StyledFontSizeSelect showLabels />
                    </div>
                </div>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <h1>Heslo</h1>
                        <FormStack component='form' onSubmit={handlePasswordChange}>
                            <StyledInput
                                id='password'
                                label='Aktuální heslo'
                                type='password'
                                autoComplete='current-password'
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                            />
                            <StyledInput
                                id='new-password'
                                name='newPassword'
                                label='Nové heslo'
                                type='password'
                                autoComplete='new-password'
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                            />
                            <StyledInput
                                id='r-new-password'
                                name='rNewPassword'
                                label='Potvrzení nového hesla'
                                type='password'
                                autoComplete='new-password'
                                value={rNewPassword}
                                onChange={(event) => setRNewPassword(event.target.value)}
                            />
                            <ButtonRow>
                                <StyledButton type='submit'>Změnit heslo</StyledButton>
                            </ButtonRow>
                        </FormStack>
                    </div>
                </div>
            </div>
        </div>
    );
};
