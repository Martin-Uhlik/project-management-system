import { useAtom, useSetAtom } from 'jotai';
import axios from 'axios';
import { notificationsAtom, tickAtom } from '../../state/atoms';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { pushNotification } from '../Notifications';

export type SendMethod = 'post' | 'patch' | 'put' | 'delete';

export type Send = <T = Record<string, unknown>>(method: SendMethod, path: string, body?: unknown, successText?: string) => Promise<T | null>;

// Sends a change to the backend: send(method, path, body, successText). The data on the page is then reloaded and the
// success text (if any) shown; an error shows as a message. Resolves to the response's data, or null after an error.
export const useSend = () => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);
    const send: Send = <T>(method: SendMethod, path: string, body?: unknown, successText?: string) =>
        (method === 'delete' ? axios.delete(getBackendAddress(path), getAuthHeader()) : axios[method](getBackendAddress(path), body, getAuthHeader()))
            .then((response) => {
                setTick(dayjs());
                if (successText) pushNotification({ notification: { text: successText, type: 'notification__success' }, notifications, setNotifications });
                return (response.data ?? {}) as T;
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
                return null;
            });
    return send;
};
