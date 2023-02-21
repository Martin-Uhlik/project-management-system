import React, {useState} from "react";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {pushNotification} from "../../Notifications";
import {handleAxiosError} from "../../../errorHandler";
import {useRecoilState, useSetRecoilState} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";
import moment from "moment";
import {RestrictedComponent} from "../../utils/RestrictedComponent";

export const UserSettings = (props) => {
    const user = props.user;
    const [disabled, setDisabled] = useState(true);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const setTick = useSetRecoilState(tickAtom);
    const handleEdit = (event, data) => {
        event.preventDefault();

        axios.patch(
            getBackendAddress(`/auth/users/${user.ID}`),
            {
                ...data
            },
            getAuthHeader()
        ).then(() => {
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

    const handlePasswordChange = (event) => {
        event.preventDefault(event);
        axios.patch(
            getBackendAddress(`/auth/users/password/${user.ID}`),
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
            setDisabled(true);
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-start">
                <h1>{`${user?.FirstName} ${user?.LastName}`}</h1>
                <RestrictedComponent types={["ADMIN"]}>
                    {disabled ?
                        <button className="btn btn-outline-dark" onClick={() => {
                            setDisabled(false);
                        }}>Upravit</button>
                        :
                        <button className="btn btn-danger" onClick={() => {
                            setDisabled(true);
                        }}>Zrušit</button>
                    }
                </RestrictedComponent>

            </div>
            <h2>
                Status uživatele:
            </h2>
            <form className="login-form" onSubmit={(e) =>
                handleEdit(e, {
                    Enabled: (e.target.enabled.value === "true")
                })}>
                <div className="form-group">
                    <label htmlFor="enabled">Status uživatele</label>
                    <select id="enabled" defaultValue={user?.Enabled?.toString()} className="form-select">
                        <option value="true">Povolen</option>
                        <option value="false">Zakázán</option>
                    </select>
                </div>
                <div className="d-flex justify-content-end">
                    <button className="btn btn-dark" type="submit">Použít</button>
                </div>
            </form>
            <hr/>
            <h2>
                Uživatelské informace:
            </h2>
            <form className="login-form" onSubmit={(e) =>
                handleEdit(e, {
                    UserName: e.target.uname.value,
                    FirstName: e.target.fname.value,
                    LastName: e.target.lname.value,
                    Position: e.target.position.value
                })}>
                <div className="form-group">
                    <label htmlFor="uname">Uživatelské jméno:</label>
                    <input className="form-control"
                           type="text"
                           id="uname"
                           name="uname"
                           defaultValue={user?.UserName}
                           disabled={disabled}/>
                </div>
                <div className="form-group">
                    <label htmlFor="fname">Jméno:</label>
                    <input className="form-control"
                           type="text"
                           id="fname"
                           name="fname"
                           defaultValue={user?.FirstName}
                           disabled={disabled}/>
                </div>
                <div className="form-group">
                    <label htmlFor="lname">Příjmení:</label>
                    <input className="form-control"
                           type="text"
                           id="lname"
                           name="lname"
                           defaultValue={user?.LastName}
                           disabled={disabled}/>
                </div>
                <div className="form-group">
                    <label htmlFor="position">Pozice:</label>
                    <input className="form-control"
                           type="text"
                           id="position"
                           name="position"
                           defaultValue={user?.Position}
                           disabled={disabled}/>
                </div>
                <div className="d-flex justify-content-end">
                    <button className="btn btn-dark"
                            type="submit"
                            disabled={disabled}>Použít
                    </button>
                </div>
            </form>
            <hr/>
            <h2>
                Heslo:
            </h2>
            <form className="login-form" onSubmit={handlePasswordChange}>
                <div className="form-group">
                    <label htmlFor="newPassword">Nové heslo:</label>
                    <input className="form-control"
                           type="password"
                           id="newPassword"
                           name="newPassword"
                           placeholder="Zadejte nové heslo"
                           disabled={disabled}/>
                </div>
                <div className="form-group">
                    <label htmlFor="rNewPassword">Potvrzení nového hesla:</label>
                    <input className="form-control"
                           type="password"
                           id="rNewPassword"
                           name="rNewPassword"
                           placeholder="Zopakujte nové heslo"
                           disabled={disabled}/>
                </div>
                <div className="d-flex justify-content-end">
                    <button className="btn btn-dark" type="submit" disabled={disabled}>Použít</button>
                </div>
            </form>
            <hr/>
            <h2>
                Role uživatele:
            </h2>
            <form className="login-form" onSubmit={(e) =>
                handleEdit(e, {
                    UserType: e.target.role.value
                })}>
                <div className="form-group">
                    <label htmlFor="role">Role uživatele:</label>
                    <select id="role"
                            className="form-select"
                            defaultValue={user?.UserType}
                            disabled={disabled}>
                        <option value="ADMIN">Administrátor</option>
                        <option value="MANAGER">Manažer</option>
                        <option value="USER">Uživatel</option>
                    </select>
                </div>
                <div className="d-flex justify-content-end">
                    <button className="btn btn-dark" type="submit" disabled={disabled}>Použít</button>
                </div>
            </form>
        </>
    );
};