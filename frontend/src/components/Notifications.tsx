import React from 'react';
import { Notification } from './utils/Notification';
import { useAtom } from 'jotai';
import { notificationsAtom } from '../state/atoms';
import { StyledToastStack } from './ui';
import type { NotificationItem } from '../types';

type SetNotifications = (notifications: NotificationItem[]) => void;

export const pushNotification = ({
    notification,
    notifications,
    setNotifications,
}: {
    notification: Omit<NotificationItem, 'id'>;
    notifications: NotificationItem[];
    setNotifications: SetNotifications;
}) => {
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
        <StyledToastStack>
            {notifications.map((notification) => {
                return <Notification key={notification.id.getTime()} notification={notification} />;
            })}
        </StyledToastStack>
    );
};
