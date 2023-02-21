import {useRecoilState, useSetRecoilState} from "recoil";
import {dialogAtom, notificationsAtom, selectedTabAtom, tickAtom} from "../../state/atoms";
import React, {useEffect} from "react";
import {Link, Outlet, useNavigate} from "react-router-dom";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {getAuthHeader} from "../../Auth";
import {handleAxiosError} from "../../errorHandler";
import moment from "moment";
import {RestrictedComponent} from "../utils/RestrictedComponent";

export const Machines = () => {
    const navigate = useNavigate();
    const setDialog = useSetRecoilState(dialogAtom);
    const setTab = useSetRecoilState(selectedTabAtom);
    const [selectedMachine, setSelectedMachine] = React.useState(null);
    const [machines, setMachines] = React.useState([]);
    const [tick, setTick] = useRecoilState(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    React.useEffect(() => {
        setTab("Stroje");
    }, [setTab]);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/machines`),
            getAuthHeader())
        .then((response) => {
            setMachines(response.data);
            if (!selectedMachine) {
                if (response.data.length > 0) {
                    navigate(response.data[0].ID.toString());
                }
            }
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const addMachine = (name) => {
        axios.post(getBackendAddress(`/auth/machines`),
            {Name: name},
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const handleAddMachine = () => {
        setDialog({
            type: "AddMachineDialog",
            data: {
                handleSubmit: addMachine,
                handleCancel: () => {
                }
            }
        });
    };

    return (
        <>
            <div className="sub-tabs">
                {machines.map((machine) => {
                    return <Link key={machine.ID}
                                 className={"btn sub-tabs_button " + (selectedMachine === machine.ID.toString() ? "btn-light" : "btn-outline-light")}
                                 to={machine.ID.toString()}>{machine.Name}</Link>;
                })}
                <RestrictedComponent types={["ADMIN"]}>
                    <button className="btn btn-outline-light sub-tabs_button" onClick={handleAddMachine}>+</button>
                </RestrictedComponent>
            </div>
            <div className="content-wrap_inner">
                <Outlet context={setSelectedMachine}/>
            </div>
        </>
    );
};
