import {AssignedTask} from "../../utils/AssignedTask";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {handleAxiosError} from "../../../errorHandler";
import {useRecoilState, useRecoilValue} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";

export const AssignedTasks = ({showHeader, userID, machineTasks = []}) => {
    const tick = useRecoilValue(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);

    const [tasks, setTasks] = useState([]);


    useEffect(() => {
        if (userID) {
            axios.get(getBackendAddress(`/auth/${userID}/tasks`),
                getAuthHeader())
            .then((response) => {
                setTasks(response.data.map((task) => task.Task));
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, userID]);

    return (
        <>
            {showHeader && <h1>Moje úkoly</h1>}
            <table className="w-100">
                <thead>
                <tr>
                    <th>Název</th>
                    <th>Projekt</th>
                    <th>Autor</th>
                    <th>Dokončení</th>
                </tr>
                </thead>
                <tbody className="w-100 ">
                {userID ?
                    tasks.map((task) => <AssignedTask key={task.ID} task={task}/>)
                    :
                    machineTasks.map((task) => <AssignedTask key={task.ID} task={task}/>)
                }
                </tbody>
            </table>
        </>
    );
};