import { useRegisterEvents, useSigma } from '@react-sigma/core';
import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../../state/atoms';
import axios from 'axios';
import { getAuthHeader, getUserID } from '../../../Auth';
import { getBackendAddress } from '../../../config';
import dayjs from '../../../dayjs';
import { handleAxiosError } from '../../../errorHandler';
import type { Dayjs } from 'dayjs';
import type { SigmaStageEventPayload } from 'sigma/types';

export const GraphEvents = (props: { selectNode: (node: string | null) => void; addNode: { addNode: boolean; setAddNode: (value: boolean) => void } }) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();
    const [draggedNode, setDraggedNode] = React.useState<string | null>(null);
    const navigate = useNavigate();
    const setDialog = useSetAtom(dialogAtom);

    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);

    const project = useParams().project;

    const addTask = (e: SigmaStageEventPayload, name: string, size: number, description: string, finishDate: Dayjs | null) => {
        const pos = sigma.viewportToGraph({ x: e.event.x, y: e.event.y });
        axios
            .post(
                getBackendAddress(`/auth/projects/${project}/tasks`),
                {
                    Name: name,
                    Description: description,
                    FinishDate: finishDate,
                    XPosition: pos.x,
                    YPosition: pos.y,
                    Size: size,
                    OwnerID: Number(getUserID()),
                    ProjectID: Number(project),
                    Finished: false,
                },
                getAuthHeader(),
            )
            .then(() => {
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const updateTask = (e: { x: number; y: number }) => {
        const pos = sigma.viewportToGraph(e);
        axios
            .patch(
                getBackendAddress(`/auth/projects/${project}/tasks/${draggedNode}`),
                {
                    XPosition: pos.x,
                    YPosition: pos.y,
                },
                getAuthHeader(),
            )
            .then(() => {})
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const handleAddTask = (e: SigmaStageEventPayload) => {
        setDialog({
            type: 'AddTask',
            data: {
                event: e,
                handleSubmit: addTask,
                handleCancel: () => {},
            },
        });
    };

    React.useEffect(() => {
        registerEvents({
            downNode: (e) => {
                setDraggedNode(e.node);
                props.selectNode(e.node);
                sigma.getGraph().setNodeAttribute(e.node, 'highlighted', true);
            },
            mouseup: (e) => {
                if (draggedNode) {
                    updateTask(e);
                    setDraggedNode(null);
                    sigma.getGraph().removeNodeAttribute(draggedNode, 'highlighted');
                }
            },
            mousedown: () => {
                if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
            },
            mousemove: (e) => {
                if (draggedNode) {
                    e.preventSigmaDefault();
                    e.original.preventDefault();
                    e.original.stopPropagation();
                    const pos = sigma.viewportToGraph(e);
                    sigma.getGraph().setNodeAttribute(draggedNode, 'x', pos.x);
                    sigma.getGraph().setNodeAttribute(draggedNode, 'y', pos.y);
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
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draggedNode, registerEvents, props.selectNode, sigma]);

    return null;
};
