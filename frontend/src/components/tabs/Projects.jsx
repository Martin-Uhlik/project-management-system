import {useRecoilState, useSetRecoilState} from "recoil";
import {dialogAtom, notificationsAtom, selectedTabAtom, tickAtom} from "../../state/atoms";
import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {RemoveButton} from "../utils/RemoveButton";
import {UserMultiSelect} from "../utils/UserMultiSelect";
import axios from "axios";
import {getBackendAddress} from "../../index";
import {getAuthHeader} from "../../Auth";
import {handleAxiosError} from "../../errorHandler";
import moment from "moment";
import {pushNotification} from "../Notifications";
import {UserSingleSelect} from "../utils/UserSingleSelect";
import {CustomizedDateTimePicker} from "../utils/CustomizedDateTimePicker";
import {ProjectTable} from "../utils/tables/ProjectTable";
import {RestrictedComponent} from "../utils/RestrictedComponent";

export const Projects = () => {
    const setTab = useSetRecoilState(selectedTabAtom);
    const setDialog = useSetRecoilState(dialogAtom);
    useEffect(() => {
        setTab("Projekty");
    });

    const [disabled, setDisabled] = useState(true);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [tick, setTick] = useRecoilState(tickAtom);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [project, setProject] = useState(null);
    const [users, setUsers] = React.useState([]);
    const [selectedUsers, setSelectedUsers] = React.useState([]);
    const [finishDate, setFinishDate] = useState(null);
    const [descriptionValue, setDescriptionValue] = useState("");
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/projects`),
            getAuthHeader())
        .then((response) => {
            setProjects(response.data);
            if (!selectedProject && response.data.length > 0) {
                setSelectedProject(response.data[0].ID);
            }
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });

        axios.get(getBackendAddress(`/auth/users`),
            getAuthHeader())
        .then((response) => {
            setUsers(response.data);
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    useEffect(() => {
        if (selectedProject && disabled) {
            axios.get(getBackendAddress(`/auth/projects/${selectedProject}`),
                getAuthHeader())
            .then((response) => {
                setProject(response.data);
                setFinishDate(response.data.FinishDate);
                setSelectedUsers(response.data.Memeber.map((user) => user.User.ID));
                setDescriptionValue(response.data.Description);
                setFinished(response.data.Finished);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, selectedProject]);

    const handleUpdateProject = (event) => {
        event.preventDefault();
        axios.patch(getBackendAddress(`/auth/projects/${project?.ID}`),
            {
                Name: event.target.name.value,
                Description: descriptionValue,
                Customer: event.target.customer.value,
                FinishDate: finishDate,
                Finished: finished,
                OwnerID: +event.target.owner.value,
                Members: selectedUsers.map((user) => {
                    return {UserID: user};
                })
            },
            getAuthHeader())
        .then((response) => {
            setDisabled(true);
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const handleRemoveProject = () => {
        axios.delete(getBackendAddress(`/auth/projects/${selectedProject}`),
            getAuthHeader())
        .then((response) => {
            pushNotification({
                notification: {text: "Projekt úspěšně odstraněn.", type: "notification__success"},
                notifications: notifications,
                setNotifications: setNotifications
            });
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const addProject = (data) => {
        axios.post(getBackendAddress(`/auth/projects`),
            {
                ...data
            },
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const handleAddProject = () => {
        setDialog({
            type: "AddProject",
            data: {
                handleSubmit: addProject,
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
                            <h1>Projekty</h1>
                            <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                                <button className="add-button" onClick={handleAddProject}>+</button>
                            </RestrictedComponent>
                        </div>
                        <ProjectTable projects={projects} setSelectedProject={setSelectedProject}/>
                    </div>
                </div>
                <div className="content-box">
                    <div className="content-box_content">
                        <form className="login-form h-100" onSubmit={handleUpdateProject}>
                            <div className="content-box_header">
                                <h1>{project?.Name}</h1>
                                <div className="content-box_subheader">
                                    {disabled ?
                                        <>
                                            <RestrictedComponent types={["ADMIN"]}>
                                                <RemoveButton handleSuccess={handleRemoveProject}/>
                                            </RestrictedComponent>
                                            <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                                                <button className="btn btn-outline-dark"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            setDisabled(false);
                                                        }}
                                                >Upravit
                                                </button>
                                            </RestrictedComponent>
                                            <RestrictedComponent types={["ADMIN"]} ids={selectedUsers}>
                                                <Link className="btn btn-dark" to={project?.ID.toString() || "#"}>Přejít
                                                    na projekt</Link>
                                            </RestrictedComponent>
                                        </>
                                        :
                                        <>
                                            <button className="btn btn-danger"
                                                    type="reset"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        setDisabled(true);
                                                    }}
                                            >Zrušit
                                            </button>
                                            <button className="btn btn-success" type="submit">Použít</button>
                                        </>
                                    }
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="name">Název projektu:</label>
                                <input className="form-control"
                                       type="text"
                                       id="name"
                                       name="name"
                                       defaultValue={project?.Name}
                                       disabled={disabled}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="customer">Zákazník:</label>
                                <input className="form-control"
                                       type="text"
                                       id="customer"
                                       name="customer"
                                       defaultValue={project?.Customer}
                                       disabled={disabled}
                                />
                            </div>
                            <div className="form-group d-flex flex-column">
                                <label htmlFor="finishDate">Datum dokončení:</label>
                                <CustomizedDateTimePicker finishDate={finishDate}
                                                          setFinishDate={setFinishDate}
                                                          disabled={disabled}
                                />
                            </div>
                            <div className="form-check">
                                <label className="form-check-label" htmlFor="finished">Projekt dokončen</label>
                                <input className="form-check-input"
                                       type="checkbox"
                                       checked={finished}
                                       onChange={() => setFinished(!finished)}
                                       id="finished"
                                       name="finished"
                                       disabled={disabled}
                                />

                            </div>
                            <hr/>
                            <UserSingleSelect disabled={disabled}
                                              users={users}
                                              owner={project?.OwnerID}
                            />
                            <UserMultiSelect disabled={disabled}
                                             users={users}
                                             selectedUsers={selectedUsers}
                                             setSelectedUsers={setSelectedUsers}/>
                            <hr/>
                            <div className="form-group h-100 min-vh-25">
                                <label htmlFor="description">Popis:</label>
                                <textarea
                                    className="form-control content-box_textarea"
                                    id="description"
                                    value={descriptionValue}
                                    onChange={event => setDescriptionValue(event.target.value)}
                                    disabled={disabled}></textarea>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
