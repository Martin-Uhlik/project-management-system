import {useRecoilState, useSetRecoilState} from "recoil";
import {dialogAtom, notificationsAtom, selectedTabAtom, tickAtom} from "../../state/atoms";
import React from "react";
import {MaterialTable} from "../utils/tables/MaterialTable";
import {MaterialRequirementTable} from "../utils/tables/MaterialRequirementTable";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {getAuthHeader, getUserID} from "../../Auth";
import moment from "moment/moment";
import {handleAxiosError} from "../../errorHandler";
import {RestrictedComponent} from "../utils/RestrictedComponent";

export const Inventory = () => {
    const setTab = useSetRecoilState(selectedTabAtom);
    const setDialog = useSetRecoilState(dialogAtom);
    React.useEffect(() => {
        setTab("Sklad");
    });

    const setTick = useSetRecoilState(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);

    const addMaterial = (props) => {
        axios.post(getBackendAddress(`/auth/material`),
            {
                Name: props.name,
                Count: +props.count,
                TargetUserID: +getUserID()
            },
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const addMaterialRequirement = (props) => {
        axios.post(getBackendAddress(`/auth/materialRequirements`),
            {
                Name: props.name,
                Description: props.description,
                Count: +props.count,
                Price: +props.price,
                NeededDate: props.date,
                TargetUserID: +getUserID()
            },
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const handleAddMaterial = () => {
        setDialog({
            type: "AddMaterial",
            data: {
                handleSubmit: addMaterial,
                handleCancel: () => {
                }
            }
        });
    };

    const handleAddMaterialRequirement = () => {
        setDialog({
            type: "AddMaterialRequirement",
            data: {
                handleSubmit: addMaterialRequirement,
                handleCancel: () => {
                }
            }
        });
    };

    return (
        <div className="content-wrap_inner">
            <div className="content-2-column">
                <div className="content-box">
                    <div className="content-box_content">
                        <div className="content-box_header">
                            <h1>Dostupný materiál</h1>
                            <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                                <button className="add-button" onClick={handleAddMaterial}>+</button>
                            </RestrictedComponent>
                        </div>
                        <MaterialTable/>
                    </div>
                </div>
                <div className="content-box">
                    <div className="content-box_content">
                        <div className="content-box_header">
                            <h1>Požadavky na materiál</h1>
                            <button className="add-button" onClick={handleAddMaterialRequirement}>+</button>
                        </div>
                        <MaterialRequirementTable/>
                    </div>
                </div>
            </div>
        </div>
    );
};
