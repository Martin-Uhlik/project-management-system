import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom, userAtom } from '../state/atoms';
import { pushNotification } from './Notifications';
import { getBackendAddress } from '../config';
import { getAuthHeader, getUserID } from '../Auth';
import axios from 'axios';
import { handleAxiosError } from '../errorHandler';
import dayjs from '../dayjs';
import { StyledButton, useElapsed } from './ui';

export const Timer = () => {
    const [user, setUser] = useAtom(userAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);

    const startTime = user?.WorkStartTime;
    // the timer runs from WorkStartTime, on the task CurrentTaskID (or none)
    const setTimer = (newTime, taskID = null) => {
        setUser({ ...user, WorkStartTime: newTime, CurrentTaskID: taskID });
    };

    const elapsed = useElapsed(startTime);
    const setDialog = useSetAtom(dialogAtom);

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
                setTimer(null);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleDiscard = () => {
        axios
            .patch(getBackendAddress(`/auth/users/${getUserID()}`), { WorkStartTime: null, CurrentTaskID: null }, getAuthHeader())
            .then(() => {
                setTimer(null);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const startTimer = (taskID) => {
        axios
            .patch(getBackendAddress(`/auth/users/${getUserID()}`), { WorkStartTime: new Date(), CurrentTaskID: taskID }, getAuthHeader())
            .then(() => {
                setTimer(Date.now(), taskID);
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    // first ask which task the time is for
    const handleTimerStart = () => {
        setDialog({ type: 'StartTimer', data: { handleSubmit: startTimer } });
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
            <span className='menu-text'>{elapsed}</span>
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
