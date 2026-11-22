import { isAxiosError } from 'axios';
import { pushNotification } from './components/Notifications';
import type { NotificationItem } from './types';

export const handleAxiosError = (error: unknown, [notifications, setNotifications]: [NotificationItem[], (notifications: NotificationItem[]) => void]) => {
    const response = isAxiosError<{ errorMessage?: string }>(error) ? error.response : undefined;
    const notificationText = `${response?.data?.errorMessage} (${response?.status})`;
    pushNotification({
        notification: { text: notificationText, type: 'notification__danger' },
        notifications: notifications,
        setNotifications: setNotifications,
    });
};
