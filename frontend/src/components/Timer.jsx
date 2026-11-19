import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom, userAtom } from '../state/atoms';
import { pushNotification } from './Notifications';
import { getBackendAddress } from '../config';
import { getAuthHeader, getUserID } from '../Auth';
import axios from 'axios';
import { handleAxiosError } from '../errorHandler';
import moment from 'moment/moment';

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
                setTick(moment());
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
                setTick(moment());
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
                setTick(moment());
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
        <div className='d-flex flex-row  align-items-center gap-3 timer'>
            <img className='menu-icon' src='/icons/timer-outline.svg' alt='Časovač' />
            <span className='menu-text'>
                {startTime !== null ? new Date(time + new Date().getTimezoneOffset() * 60000).toLocaleTimeString('cs-CZ') : '0:00:00'}
            </span>
            {startTime ? (
                <button type='button' className='btn btn-danger' onClick={handleTimerStop}>
                    Zapsat
                </button>
            ) : (
                <button type='button' className='btn btn-success' onClick={handleTimerStart}>
                    Spustit
                </button>
            )}
        </div>
    );
};
