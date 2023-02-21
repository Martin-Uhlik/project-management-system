import React from "react";
import {useRecoilState, useSetRecoilState} from "recoil";
import {notificationsAtom, selectedTabAtom} from "../../state/atoms";
import {pushNotification} from "../Notifications";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {getAuthHeader, getUserID} from "../../Auth";
import {handleAxiosError} from "../../errorHandler";

export const Settings = () => {
    const setTab = useSetRecoilState(selectedTabAtom);
    React.useEffect(() => {
        setTab("Nastavení");
    });
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [rNewPassword, setRNewPassword] = React.useState("");

    const handlePasswordChange = (event) => {
        event.preventDefault(event);
        axios.patch(
            getBackendAddress(`/auth/users/password/${getUserID()}`),
            {
                oldPassword: event.target.password.value.toString(),
                newPassword: event.target.newPassword.value.toString()
            },
            getAuthHeader()
        ).then(() => {
            pushNotification({
                notification: {text: "Heslo úspěšně změněno.", type: "notification__success"},
                notifications: notifications,
                setNotifications: setNotifications
            });
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    return (
        <div className="content-wrap_inner">
            <div className="content-1-column">
                <div className="content-box">
                    <div className="content-box_content">
                        <h1>Heslo</h1>
                        <form className="login-form" onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label htmlFor="password">Aktuální heslo:</label>
                                <input className="form-control"
                                       type="password"
                                       id="password"
                                       name="password"
                                       placeholder="Zadejte aktuální heslo"
                                       value={currentPassword}
                                       onChange={(event) => {
                                           setCurrentPassword(event.target.value);
                                       }}/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="new-password">Nové heslo:</label>
                                <input className="form-control"
                                       type="password"
                                       id="new-password"
                                       name="newPassword"
                                       placeholder="Zadejte nové heslo"
                                       value={newPassword}
                                       onChange={(event) => {
                                           setNewPassword(event.target.value);
                                       }}/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="r-new-password">Potvrzení nového hesla:</label>
                                <input className="form-control"
                                       type="password"
                                       id="r-new-password"
                                       name="rNewPassword"
                                       placeholder="Zopakujte nové heslo"
                                       value={rNewPassword}
                                       onChange={(event) => {
                                           setRNewPassword(event.target.value);
                                       }}/>
                            </div>
                            <div className="d-flex justify-content-end">
                                <button className="btn btn-dark" type="submit">Změnit heslo</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};