import React, {useEffect, useState} from "react";
import {AssignedTasks} from "./overview/AssignedTasks";
import {MyTasks} from "./overview/MyTasks";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {notificationsAtom, selectedTabAtom, tickAtom} from "../../state/atoms";
import {WorkTimeChart} from "../utils/WorkTimeChart";
import {WorkPlanChart} from "../utils/WorkPlanChart";
import {getAuthHeader, getUserID} from "../../Auth";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {handleAxiosError} from "../../errorHandler";
import moment from "moment";

export const Overview = () => {
    const [selectedButton, setSelectedButton] = React.useState(0);
    const setTab = useSetRecoilState(selectedTabAtom);

    React.useEffect(() => {
        setTab("Přehled");

    });

    const tick = useRecoilValue(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [user, setUser] = useState(null);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/users/${getUserID()}`),
            getAuthHeader())
        .then((response) => {
            setUser(response.data);
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const workTimeDataset = [0, 0, 0, 0, 0, 0, 0];
    user?.WorkTime.map(time => {
        const startTime = moment(time.StartTime);
        const endTime = moment(time.StopTime);
        const hours = endTime.diff(startTime, "hour", true);
        workTimeDataset[startTime.isoWeekday() - 1] += hours;
        return {hours: hours, day: startTime.isoWeekday() - 1};
    });

    return (
        <div className="content-wrap_inner">
            <div className="content-2-column">
                <div className="content-box">
                    <div className="d-flex w-100">
                        <button className={"btn w-50 btn-sharp " + (selectedButton === 0 ? "btn-danger" : "btn-dark")}
                                onClick={() => (setSelectedButton(0))}>
                            Přidělené úkoly
                        </button>
                        <button className={"btn w-50 btn-sharp " + (selectedButton === 1 ? "btn-danger" : "btn-dark")}
                                onClick={() => (setSelectedButton(1))}>Vlastní úkoly
                        </button>
                    </div>
                    <div className="content-box_content">
                        {selectedButton === 0 ? <AssignedTasks showHeader={true} userID={getUserID()}/> : <MyTasks/>}
                    </div>
                </div>
                <div className="content-2-row">
                    <div className="content-box">
                        <div className="content-box_content">
                            <h1>Můj harmonogram</h1>
                            <div className="content-box_chart-wrapper-outer">
                                <div className="content-box_chart-wrapper-inner">
                                    <WorkPlanChart tasks={user?.User_Task?.map(task => task.Task)}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="content-box">
                        <div className="content-box_content">
                            <h1>Odpracovaný čas</h1>
                            <div className="content-box_chart-wrapper-outer">
                                <div className="content-box_chart-wrapper-inner">
                                    <WorkTimeChart dataset={workTimeDataset}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
