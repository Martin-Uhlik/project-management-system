import React, {useEffect, useState} from "react";
import {useNavigate, useOutletContext, useParams} from "react-router-dom";
import {WorkPlanChart} from "../utils/WorkPlanChart";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {getAuthHeader} from "../../Auth";
import {handleAxiosError} from "../../errorHandler";
import {useRecoilState} from "recoil";
import {notificationsAtom, tickAtom} from "../../state/atoms";
import {pushNotification} from "../Notifications";
import moment from "moment/moment";
import {AssignedTasks} from "../tabs/overview/AssignedTasks";
import {RemoveButton} from "../utils/RemoveButton";
import {RestrictedComponent} from "../utils/RestrictedComponent";

export const Machine = () => {
    const navigate = useNavigate();
    const props = useOutletContext();
    const {machine} = useParams();
    React.useEffect(() => {
        props(machine);
    });
    const [disabled, setDisabled] = useState(true);

    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [tick, setTick] = useRecoilState(tickAtom);

    const [currentMachine, setCurrentMachine] = useState(null);
    const [description, setDescription] = useState(null);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/machines/${machine}`),
            getAuthHeader())
        .then((response) => {
            setCurrentMachine(response.data);
            if (disabled) {
                setDescription(response.data.Description);
            }
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, machine]);

    const updateMachine = (event) => {
        event.preventDefault();
        axios.patch(getBackendAddress(`/auth/machines/${machine}`),
            {
                Description: event.target.description.value
            },
            getAuthHeader())
        .then((response) => {
            pushNotification({
                notification: {text: "Nastavení úspěšně změněno.", type: "notification__success"},
                notifications: notifications,
                setNotifications: setNotifications
            });
            setDisabled(true);
            setTick(moment());

        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const removeMachine = () => {
        axios.delete(getBackendAddress(`/auth/machines/${machine}`),
            getAuthHeader())
        .then((response) => {
            pushNotification({
                notification: {text: "Nastavení úspěšně změněno.", type: "notification__success"},
                notifications: notifications,
                setNotifications: setNotifications
            });
            setTick(moment());
            navigate("/auth/machines");
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };


    return (
        <div className="content-2-column">
            <div className="content-box">
                <div className="content-box_content">
                    <div className="content-box_header">
                        <h1>Fronta výroby</h1>
                        <RestrictedComponent types={["ADMIN"]}>
                            <RemoveButton handleSuccess={removeMachine}/>
                        </RestrictedComponent>
                    </div>
                    <AssignedTasks showHeader={false} machineTasks={currentMachine?.Task}/>
                </div>
            </div>
            <div className="content-2-row">
                <div className="content-box">
                    <div className="content-box_content">
                        <h1>Harmonogram výroby</h1>
                        <div className="content-box_chart-wrapper-outer">
                            <div className="content-box_chart-wrapper-inner">
                                <WorkPlanChart tasks={currentMachine?.Task}/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="content-box">
                    <div className="content-box_content">
                        <form className="login-form h-100" onSubmit={updateMachine}>
                            <div className="content-box_header">
                                <h1>Popis</h1>
                                <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                                    {disabled ?
                                        <button className="btn btn-outline-dark" onClick={() => {
                                            setDisabled(false);
                                        }}>Upravit</button>
                                        :
                                        <div className="content-box_header">
                                            <button type="reset" className="btn btn-danger"
                                                    onClick={() => setDisabled(true)}>Zrušit
                                            </button>
                                            <button type="submit" className="btn btn-success">Použít</button>
                                        </div>
                                    }
                                </RestrictedComponent>
                            </div>
                            <textarea className="form-control content-box_textarea"
                                      id="description"
                                      name="description"
                                      value={description || ""}
                                      onChange={(event) => setDescription(event.target.value)}
                                      disabled={disabled}>
                            </textarea>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};