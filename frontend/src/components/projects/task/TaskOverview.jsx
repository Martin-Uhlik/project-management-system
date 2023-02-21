import React, {useEffect, useState} from "react";
import {useLocation, useNavigate, useOutletContext, useParams} from "react-router-dom";
import {AssignedTasks} from "../../tabs/overview/AssignedTasks";
import {RemoveButton} from "../../utils/RemoveButton";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {handleAxiosError} from "../../../errorHandler";
import {useRecoilState, useSetRecoilState} from "recoil";
import {dialogAtom, notificationsAtom, tickAtom} from "../../../state/atoms";
import {UserMultiSelect} from "../../utils/UserMultiSelect";
import {UserSingleSelect} from "../../utils/UserSingleSelect";
import moment from "moment";
import {CustomizedDateTimePicker} from "../../utils/CustomizedDateTimePicker";
import {RestrictedComponent} from "../../utils/RestrictedComponent";

export const TaskOverview = () => {
    const navigate = useNavigate();
    const props = useOutletContext();
    const subTab = useLocation().pathname.split("/")[5];
    const setDialog = useSetRecoilState(dialogAtom);
    React.useEffect(() => {
        props(subTab);
    });
    const [disabled, setDisabled] = useState(true);
    const [tick, setTick] = useRecoilState(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);

    const projectID = useParams().project;
    const taskID = useParams().task;
    const [task, setTask] = useState(null);
    const [users, setUsers] = React.useState([]);
    const [finishDate, setFinishDate] = useState(null);
    const [finished, setFinished] = useState(false);

    const [selectedUsers, setSelectedUsers] = React.useState([]);
    const [descriptionValue, setDescriptionValue] = useState("");

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
            getAuthHeader())
        .then((response) => {
            setTask(response.data);
            setFinishDate(response.data.FinishDate);
            setFinished(response.data.Finished);
            setSelectedUsers(response.data.User_Task.map((user) => user.User.ID));
            setDescriptionValue(response.data.Description);
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

    const handleSubmit = (event) => {
        event.preventDefault();
        axios.patch(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
            {
                Name: event.target.name.value,
                Description: descriptionValue,
                FinishDate: finishDate,
                OwnerID: +event.target.owner.value,
                Members: selectedUsers.map((user) => {
                    return {UserID: user};
                }),
                DurationHours: +event.target.hod.value,
                DurationMinutes: +event.target.min.value
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

    const handleFinish = (event) => {
        event.preventDefault();
        axios.patch(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
            {
                Finished: !finished
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

    const removeTask = () => {
        axios.delete(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`),
            getAuthHeader())
        .then((response) => {
            navigate(`/auth/projects/${projectID}`);
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const addDependency = (id, dependencyType) => {
        axios.post(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}/${dependencyType}`),
            {id: +id},
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };
    const handleAddDependency = (dependencyType) => {
        setDialog({
            type: "SelectDependency",
            data: {
                dependencyType: dependencyType,
                handleSubmit: addDependency,
                handleCancel: () => {
                }
            }
        });
    };

    const removeDependency = (id, dependencyType) => {
        axios.delete(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}/${dependencyType}`),
            {id: +id},
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };


    const handleRemoveDependency = (dependencyType, nodes) => {
        setDialog({
            type: "RemoveDependency",
            data: {
                dependencyType: dependencyType,
                nodes: nodes,
                handleSubmit: removeDependency,
                handleCancel: () => {
                }
            }
        });
    };

    return (
        <div className="content-2-column">
            <div className="content-box">
                <div className="content-box_content">
                    <form className="login-form h-100" onSubmit={handleSubmit}>
                        <div className="content-box_header">
                            <h1>{task?.Name}</h1>
                            <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                                <div className="content-box_subheader">
                                    {disabled ?
                                        <>
                                            <RemoveButton handleSuccess={removeTask}/>
                                            <button className="btn btn-outline-dark" onClick={(e) => {
                                                e.preventDefault();
                                                setDisabled(false);
                                            }
                                            }>Upravit
                                            </button>
                                        </>
                                        :
                                        <>
                                            <button className="btn btn-danger" type="reset"
                                                    onClick={() => setDisabled(true)}>Zrušit
                                            </button>
                                            <button className="btn btn-success" type="submit">Použít</button>
                                        </>
                                    }
                                </div>
                            </RestrictedComponent>
                        </div>
                        <hr/>
                        <div className="form-group">
                            <label htmlFor="name">Název úkolu:</label>
                            <input className="form-control"
                                   type="text"
                                   id="name"
                                   name="name"
                                   defaultValue={task?.Name}
                                   disabled={disabled}/>
                        </div>
                        <div className="form-group d-flex flex-column">
                            <label htmlFor="finishDate">Datum dokončení:</label>
                            <CustomizedDateTimePicker finishDate={finishDate}
                                                      setFinishDate={setFinishDate}
                                                      disabled={disabled}
                            />
                        </div>
                        <div className="row">
                            <label htmlFor="sname">Předpokládaný čas:</label>
                            <div className="col">
                                <div className="input-group">
                                    <input type="text"
                                           className="form-control"
                                           id="hod"
                                           name="hod"
                                           defaultValue={task?.DurationHours}
                                           disabled={disabled}/>
                                    <span className="input-group-text">hod</span>
                                </div>
                            </div>
                            <div className="col">
                                <div className="input-group">
                                    <input type="text" className="form-control"
                                           id="min"
                                           name="min"
                                           defaultValue={task?.DurationMinutes}
                                           disabled={disabled}/>
                                    <span className="input-group-text">min</span>
                                </div>
                            </div>
                        </div>
                        <RestrictedComponent types={["ADMIN", "MANAGER"]} ids={selectedUsers}>
                            <div className="form-check">
                                <label className="form-check-label" htmlFor="finished">Úkol dokončen</label>
                                <input className="form-check-input"
                                       type="checkbox"
                                       checked={finished}
                                       onChange={handleFinish}
                                       id="finished"
                                       name="finished"
                                />
                            </div>
                        </RestrictedComponent>
                        <hr/>
                        <UserSingleSelect disabled={disabled}
                                          users={users}
                                          owner={task?.OwnerID}
                        />
                        <UserMultiSelect disabled={disabled}
                                         users={users}
                                         task={task}
                                         selectedUsers={selectedUsers}
                                         setSelectedUsers={setSelectedUsers}/>
                        <hr/>
                        <div className="form-group h-100 min-vh-25">
                            <label htmlFor="description">Popis:</label>
                            <textarea
                                className="form-control content-box_textarea"
                                id="description"
                                name="description"
                                value={descriptionValue}
                                onChange={event => setDescriptionValue(event.target.value)}
                                disabled={disabled}></textarea>
                        </div>
                    </form>
                </div>
            </div>
            <div className="content-2-row">
                <div className="content-box">
                    <div className="content-box_content">

                        <div className="content-box_header">
                            <h1>Předchozí úkoly</h1>
                            <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                                <div className="content-box_header">
                                    <button className="add-button" onClick={() =>
                                        handleRemoveDependency("predecessor", task?.Successors?.map(task => task.Predecessor))}
                                    >-
                                    </button>
                                    <button className="add-button"
                                            onClick={() => handleAddDependency("predecessor")}>+
                                    </button>
                                </div>
                            </RestrictedComponent>
                        </div>
                        <div className="content-box_chart-wrapper-outer">
                            <div className="content-box_chart-wrapper-inner">
                                <AssignedTasks machineTasks={task?.Successors?.map(task => task.Predecessor)}/>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="content-box">
                    <div className="content-box_content">
                        <div className="content-box_header">
                            <h1>Následující úkoly</h1>
                            <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                                <div className="content-box_header">
                                    <button className="add-button" onClick={() =>
                                        handleRemoveDependency("successor", task?.Predecessors?.map(task => task.Successor))
                                    }>-
                                    </button>
                                    <button className="add-button" onClick={() => handleAddDependency("successor")}>+
                                    </button>
                                </div>
                            </RestrictedComponent>
                        </div>
                        <div className="content-box_chart-wrapper-outer">
                            <div className="content-box_chart-wrapper-inner">
                                <AssignedTasks machineTasks={task?.Predecessors?.map(task => task.Successor)}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};