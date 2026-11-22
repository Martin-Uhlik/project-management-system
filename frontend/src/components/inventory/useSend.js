import { useAtom, useSetAtom } from 'jotai';
import axios from 'axios';
import { notificationsAtom, tickAtom } from '../../state/atoms';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { pushNotification } from '../Notifications';

// Sends a change to the backend: send(method, path, body, successText). The data on the page is then reloaded and the
// success text (if any) shown; an error shows as a message. Resolves to the response's data, or null after an error.
export const useSend = () => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);
    return (method, path, body, successText) =>
        (method === 'delete' ? axios.delete(getBackendAddress(path), getAuthHeader()) : axios[method](getBackendAddress(path), body, getAuthHeader()))
            .then((response) => {
                setTick(dayjs());
                if (successText) pushNotification({ notification: { text: successText, type: 'notification__success' }, notifications, setNotifications });
                return response.data ?? {};
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
                return null;
            });
};
