import moment from 'moment';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader, getUserID } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import { useAtom, useSetAtom } from 'jotai';
import { notificationsAtom, tickAtom } from '../../state/atoms';

export const MyTask = (props) => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);
    const finishTask = () => {
        axios
            .patch(
                getBackendAddress(`/auth/${getUserID()}/personal-tasks/${props.task.ID}`),
                {
                    task: {
                        Finished: !props.task.Finished,
                    },
                },
                getAuthHeader(),
            )
            .then(() => {
                setTick(moment());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    return (
        <tr className={'task p-3 ' + (props.task.Finished ? 'task__finished' : null)} onClick={finishTask}>
            <td>
                {/* the whole row toggles the task with a mouse; this button makes it reachable by keyboard too */}
                <button
                    type='button'
                    className='task_toggle'
                    aria-pressed={props.task.Finished}
                    onClick={(event) => {
                        event.stopPropagation();
                        finishTask();
                    }}
                >
                    {props.task.Name}
                </button>
            </td>
            <td>{moment(props.task.FinishDate).format('L')}</td>
            <td>{props.task.Description}</td>
        </tr>
    );
};
