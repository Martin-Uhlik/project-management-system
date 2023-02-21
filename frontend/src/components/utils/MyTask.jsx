import moment from "moment";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {getAuthHeader, getUserID} from "../../Auth";
import {handleAxiosError} from "../../errorHandler";
import {useRecoilState, useSetRecoilState} from "recoil";
import {notificationsAtom, tickAtom} from "../../state/atoms";

export const MyTask = (props) => {
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const setTick = useSetRecoilState(tickAtom);
    const finishTask = () => {
        axios.patch(getBackendAddress(`/auth/${getUserID()}/personal-tasks/${props.task.ID}`),
            {
                task: {
                    Finished: !props.task.Finished
                }
            },
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    return (
        <tr className={"task p-3 " + (props.task.Finished ? "task__finished" : null)} onClick={finishTask}>
            <td>
                {props.task.Name}
            </td>
            <td>
                {moment(props.task.FinifhDate).format("L")}
            </td>
            <td>
                {props.task.Description}
            </td>
        </tr>
    );
};