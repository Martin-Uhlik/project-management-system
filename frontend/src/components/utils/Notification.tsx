import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { notificationsAtom } from '../../state/atoms';
import { StyledToast } from '../ui';
import type { AlertColor } from '@mui/material/Alert';
import type { NotificationItem } from '../../types';

const severities: Record<string, AlertColor> = { notification__success: 'success', notification__danger: 'error' };

// success messages go away on their own after a while; errors stay until closed
const successTimeout = 6000;

export const Notification = ({ notification }: { notification: NotificationItem }) => {
    const setNotifications = useSetAtom(notificationsAtom);
    const severity = severities[notification.type] ?? 'info';
    const handleClose = () => {
        setNotifications((notifications) => notifications.filter((item) => item.id !== notification.id));
    };

    useEffect(() => {
        if (severity !== 'success') return undefined;
        const timer = setTimeout(handleClose, successTimeout);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <StyledToast severity={severity} time={notification.id.toLocaleTimeString('cs-CZ')} onClose={handleClose}>
            {notification.text}
        </StyledToast>
    );
};
