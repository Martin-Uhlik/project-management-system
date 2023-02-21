import React, {useEffect, useState} from "react";
import {useLocation, useOutletContext, useParams} from "react-router-dom";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {handleAxiosError} from "../../../errorHandler";
import {useRecoilState} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";
import moment from "moment";
import {RestrictedComponent} from "../../utils/RestrictedComponent";

export const TaskMachines = () => {
    const props = useOutletContext();
    const subTab = useLocation().pathname.split("/")[5];
    React.useEffect(() => {
        props(subTab);
    });

    const projectID = useParams().project;
    const taskID = useParams().task;
    const [machines, setMachines] = React.useState([]);
    const [tick, setTick] = useRecoilState(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [selectedMachine, setSelectedMachine] = useState(null);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
            getAuthHeader())
        .then((response) => {
            setSelectedMachine(response.data.MachineID);
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });

        axios.get(getBackendAddress(`/auth/machines`),
            getAuthHeader())
        .then((response) => {
            setMachines(response.data);
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const setMachine = (event) => {
        event.preventDefault();
        axios.patch(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
            {
                MachineID: +selectedMachine
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
        <div className="content-1-column ">
            <div className="content-box">
                <div className="content-box_content">
                    <div className="content-box_header">
                        <h1>Stroje</h1>
                    </div>
                    <form className="login-form" onSubmit={setMachine}>
                        <div className="form-group">
                            <label htmlFor="machine">Přiřazený stroj:</label>
                            <select className="form-select"
                                    id="machine"
                                    name="machine"
                                    value={selectedMachine || "UNDEFINED"}
                                    onChange={e => setSelectedMachine(e.target.value)}
                            >
                                <option value="UNDEFINED" disabled hidden></option>
                                {machines.map(machine => {
                                    return <option key={machine.ID} value={machine.ID}>{machine.Name}</option>;
                                })}
                            </select>
                        </div>
                        <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                            <div className="d-flex justify-content-end">
                                <button className="btn btn-dark" type="submit">Použít</button>
                            </div>
                        </RestrictedComponent>
                    </form>
                </div>
            </div>
        </div>
    );
};