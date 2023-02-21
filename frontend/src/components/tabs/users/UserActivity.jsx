import React, {useEffect, useState} from "react";
import {AssignedTasks} from "../overview/AssignedTasks";
import {WorkPlanChart} from "../../utils/WorkPlanChart";
import moment from "moment";
import {getAuthHeader} from "../../../Auth";
import {useRecoilState, useRecoilValue} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {handleAxiosError} from "../../../errorHandler";

export const UserActivity = (props) => {
    const selectedUser = props.user;

    const tick = useRecoilValue(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (selectedUser) {
            axios.get(getBackendAddress(`/auth/users/${selectedUser.ID}`),
                getAuthHeader())
            .then((response) => {
                setUser(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, selectedUser]);

    return (
        <>
            <h1>{`${user?.FirstName} ${user?.LastName}`}</h1>
            <h2>
                Aktuální práce:
            </h2>
            <form className="login-form">
                <div className="form-group">
                    <label htmlFor="uname">Začátek práce:</label>
                    <input className="form-control"
                           type="text"
                           id="uname"
                           name="uname"
                           value={user?.WorkStartTime ? moment(user.WorkStartTime).format("LLL") : ""}
                           disabled/>
                </div>
                <div className="form-group">
                    <label htmlFor="fname">Aktuální úkol:</label>
                    <input className="form-control"
                           type="text"
                           id="fname"
                           name="fname"
                           value={user?.CurrentTaskID?.toString()}
                           disabled/>
                </div>
            </form>
            <hr/>
            <h2>
                Plán práce:
            </h2>
            <div className="min-vh-25">
                <div className="content-box_chart-wrapper-outer">
                    <div className="content-box_chart-wrapper-inner">
                        <WorkPlanChart tasks={user?.User_Task?.map(task => task.Task)}/>
                    </div>
                </div>
            </div>
            <hr/>
            <h2>
                Přířazené úkoly:
            </h2>
            <AssignedTasks showHeader={false} userID={user?.ID}/>
        </>
    );
};