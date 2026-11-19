import React from 'react';
import { Notification } from './utils/Notification';
import { useAtom } from 'jotai';
import { notificationsAtom } from '../state/atoms';

export const pushNotification = ({ notification, notifications, setNotifications }) => {
    setNotifications([...notifications, { id: new Date(), ...notification }]);
};

export const Notifications = () => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    React.useEffect(() => {
        if (notifications.length > 5) {
            setNotifications(notifications.slice(notifications.length - 5, notifications.length));
        }
    }, [notifications, setNotifications]);

    return (
        <div className='notifications'>
            {notifications.map((notification) => {
                return <Notification key={notification.id.getTime()} notification={notification} />;
            })}
        </div>
    );
};
