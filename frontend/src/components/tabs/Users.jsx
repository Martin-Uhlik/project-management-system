import React, {useEffect} from "react";
import {useRecoilState, useSetRecoilState} from "recoil";
import {dialogAtom, notificationsAtom, selectedTabAtom, tickAtom} from "../../state/atoms";
import {UserSettings} from "./users/UserSettings";
import {UserActivity} from "./users/UserActivity";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {getAuthHeader} from "../../Auth";
import {handleAxiosError} from "../../errorHandler";
import moment from "moment/moment";
import {UserTable} from "../utils/tables/UserTable";
import {RestrictedComponent} from "../utils/RestrictedComponent";

export const Users = () => {
    const setTab = useSetRecoilState(selectedTabAtom);
    const setDialog = useSetRecoilState(dialogAtom);
    React.useEffect(() => {
        setTab("Uživatelé");
    });
    const [selectedButton, setSelectedButton] = React.useState(0);
    const [tick, setTick] = useRecoilState(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [users, setUsers] = React.useState([]);
    const [selectedUser, setSelectedUser] = React.useState(null);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/users`),
            getAuthHeader())
        .then((response) => {
            setUsers(response.data);
            if (!selectedUser) {
                setSelectedUser(response.data[0]);
            }
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const addUser = (user) => {
        axios.post(getBackendAddress(`/auth/users`),
            {user},
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const handleAddUser = () => {
        setDialog({
            type: "AddUser",
            data: {
                handleSubmit: addUser,
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
                            <h1>Uživatelé</h1>
                            <RestrictedComponent types={["ADMIN"]}>
                                <button className="add-button" onClick={handleAddUser}>+</button>
                            </RestrictedComponent>
                        </div>
                        <UserTable users={users} setSelectedUser={setSelectedUser}/>
                    </div>
                </div>

                <div className="content-box">
                    <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                        <div className="d-flex w-100">
                            <button
                                className={"btn w-50 btn-sharp " + (selectedButton === 0 ? "btn-danger" : "btn-dark")}
                                onClick={() => {
                                    setSelectedButton(0);
                                }}>Aktivita uživatele
                            </button>
                            <button
                                className={"btn w-50 btn-sharp " + (selectedButton === 1 ? "btn-danger" : "btn-dark")}
                                onClick={() => {
                                    setSelectedButton(1);
                                }}>Nastavení uživatele
                            </button>
                        </div>
                    </RestrictedComponent>
                    <div className="content-box_content">
                        {selectedButton === 0 ?
                            <UserActivity user={selectedUser}/>
                            :
                            <UserSettings user={selectedUser}/>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};
