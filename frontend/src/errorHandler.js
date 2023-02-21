import {pushNotification} from "./components/Notifications";

export const handleAxiosError = (error, [notifications, setNotifications]) => {
    let notificationText = `${error?.response?.data?.errorMessage} (${error?.response?.status})`;
    pushNotification({
        notification: {text: notificationText, type: "notification__danger"},
        notifications: notifications,
        setNotifications: setNotifications
    });
};