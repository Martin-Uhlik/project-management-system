import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom, userAtom } from '../state/atoms';
import { pushNotification } from './Notifications';
import { getBackendAddress } from '../config';
import { getAuthHeader, getUserID } from '../Auth';
import axios from 'axios';
import { handleAxiosError } from '../errorHandler';
import dayjs from '../dayjs';
import { StyledButton } from './ui';

export const Timer = () => {
    const [user, setUser] = useAtom(userAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);

    const startTime = user?.WorkStartTime;
    const setStartTime = (newTime) => {
        setUser({ ...user, WorkStartTime: newTime });
    };

    const [time, setTime] = useState(0);
    const setDialog = useSetAtom(dialogAtom);

    useEffect(() => {
        let interval = null;
        if (startTime) {
            interval = setInterval(() => setTime(Date.now() - new Date(startTime)), 1000);
        }
        return () => {
            clearInterval(interval);
        };
    }, [startTime]);

    const handleSuccess = (newStartTime, newStopTime) => {
        axios
            .post(
                getBackendAddress(`/auth/users/timer/${getUserID()}`),
                {
                    WorkStartTime: new Date(newStartTime),
                    WorkStopTime: newStopTime,
                },
                getAuthHeader(),
            )
            .then(() => {
                pushNotification({
                    notification: { text: 'Čas úspěšně zapsán.', type: 'notification__success' },
                    notifications: notifications,
                    setNotifications: setNotifications,
                });
                setStartTime(null);
                setTime(0);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleDiscard = () => {
        axios
            .patch(getBackendAddress(`/auth/users/${getUserID()}`), { WorkStartTime: null }, getAuthHeader())
            .then(() => {
                setStartTime(null);
                setTime(0);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleTimerStart = () => {
        axios
            .patch(getBackendAddress(`/auth/users/${getUserID()}`), { WorkStartTime: new Date() }, getAuthHeader())
            .then(() => {
                setStartTime(Date.now());
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleTimerStop = () => {
        setDialog({
            type: 'TimeDialog',
            data: {
                startTime: startTime,
                handleSuccess: handleSuccess,
                handleCancel: () => {},
                handleDiscard: handleDiscard,
            },
        });
    };

    return (
        <div className='timer'>
            <img className='menu-icon' src='/icons/timer-outline.svg' alt='Časovač' />
            <span className='menu-text'>
                {startTime !== null ? new Date(time + new Date().getTimezoneOffset() * 60000).toLocaleTimeString('cs-CZ') : '0:00:00'}
            </span>
            {startTime ? (
                <StyledButton color='error' onClick={handleTimerStop}>
                    Zapsat
                </StyledButton>
            ) : (
                <StyledButton color='success' onClick={handleTimerStart}>
                    Spustit
                </StyledButton>
            )}
        </div>
    );
};
