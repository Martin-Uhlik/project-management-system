import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom, userAtom } from '../state/atoms';
import { pushNotification } from './Notifications';
import { getBackendAddress } from '../config';
import { getAuthHeader, getUserID } from '../Auth';
import axios from 'axios';
import { handleAxiosError } from '../errorHandler';
import dayjs from '../dayjs';
import { PlayIcon, StopIcon, StyledIconButton, TimerIcon, useElapsed } from './ui';

// bare play/stop icons, green and red, in the size of the other header icons
const timerButtonSx = (color) => ({
    p: 0.25,
    color: `${color}.main`,
    '& svg': { fontSize: '2.5rem' },
    '&:hover': { color: `${color}.light` },
});

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
            <TimerIcon className='menu-icon' titleAccess='Časovač' />
            <span className='menu-text'>{elapsed}</span>
            {/* play starts the timer (asking for the task), stop ends it and logs the time */}
            {startTime ? (
                <StyledIconButton label='Zastavit a zapsat čas' onClick={handleTimerStop} sx={timerButtonSx('error')}>
                    <StopIcon />
                </StyledIconButton>
            ) : (
                <StyledIconButton label='Spustit časovač' onClick={handleTimerStart} sx={timerButtonSx('success')}>
                    <PlayIcon />
                </StyledIconButton>
            )}
        </div>
    );
};
