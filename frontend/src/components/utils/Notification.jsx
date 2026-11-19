import { useAtom } from 'jotai';
import { notificationsAtom } from '../../state/atoms';

export const Notification = (props) => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const handleClose = () => {
        setNotifications(
            notifications.filter((notification) => {
                return notification.id !== props.notification.id;
            }),
        );
    };
    return (
        <div>
            <div className={'notification ' + props.notification.type}>
                {props.notification.id.toLocaleTimeString('cs-CZ')} - {props.notification.text}
                <button onClick={handleClose}>
                    <img className='notification_icon' src='/icons/close-thick.svg' alt='Zavřít' />
                </button>
            </div>
        </div>
    );
};
