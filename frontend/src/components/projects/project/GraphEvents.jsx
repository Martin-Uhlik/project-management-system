import {useRegisterEvents, useSigma} from "@react-sigma/core";
import React from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useRecoilState, useSetRecoilState} from "recoil";
import {dialogAtom, notificationsAtom, tickAtom} from "../../../state/atoms";
import axios from "axios";
import {getAuthHeader, getUserID} from "../../../Auth";
import {getBackendAddress} from "../../../index";
import moment from "moment/moment";
import {handleAxiosError} from "../../../errorHandler";

export const GraphEvents = (props) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = React.useState(null);
    const navigate = useNavigate();
    const setDialog = useSetRecoilState(dialogAtom);

    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const setTick = useSetRecoilState(tickAtom);

    const project = useParams().project;

    const addTask = (e, name, size, description, finishDate) => {
        const pos = sigma.viewportToGraph({x: e.event.x, y: e.event.y});
        axios.post(getBackendAddress(`/auth/projects/${project}/tasks`),
            {
                Name: name,
                Description: description,
                FinishDate: finishDate,
                XPosition: pos.x,
                YPosition: pos.y,
                Size: size,
                OwnerID: +getUserID(),
                ProjectID: +project,
                Finished: false
            },
            getAuthHeader())
        .then((response) => {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const updateTask = (e) => {
        const pos = sigma.viewportToGraph(e);
        axios.patch(getBackendAddress(`/auth/projects/${project}/tasks/${draggedNode}`),
            {
                XPosition: pos.x,
                YPosition: pos.y
            },
            getAuthHeader())
        .then((response) => {
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    const handleAddTask = (e) => {
        setDialog({
            type: "AddTask",
            data: {
                event: e,
                handleSubmit: addTask,
                handleCancel: () => {
                }
            }
        });
    };

    React.useEffect(() => {
        registerEvents({
            downNode: (e) => {
                setDraggedNode(e.node);
                props.selectNode(e.node);
                sigma.getGraph().setNodeAttribute(e.node, "highlighted", true);
            },
            mouseup: (e) => {
                if (draggedNode) {
                    updateTask(e);
                    setDraggedNode(null);
                    sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
                }
            },
            mousedown: (e) => {
                if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
            },
            mousemove: (e) => {
                if (draggedNode) {
                    e.preventSigmaDefault();
                    e.original.preventDefault();
                    e.original.stopPropagation();
                    const pos = sigma.viewportToGraph(e);
                    sigma.getGraph().setNodeAttribute(draggedNode, "x", pos.x);
                    sigma.getGraph().setNodeAttribute(draggedNode, "y", pos.y);
                }
            },
            clickStage: (e) => {
                props.selectNode(null);
                if (props.addNode.addNode) {
                    handleAddTask(e);
                    props.addNode.setAddNode(false);
                }
            },
            doubleClickNode: (e) => {
                navigate(e.node);
            },
            doubleClickStage: (e) => {
                e.preventSigmaDefault();
                handleAddTask(e);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draggedNode, registerEvents, props.selectNode, sigma]);
};