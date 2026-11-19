import { useLoadGraph } from '@react-sigma/core';
import { useEffect } from 'react';
import Graph from 'graphology';
import { useAtom, useAtomValue } from 'jotai';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';
import { useParams } from 'react-router';

export const LoadGraph = () => {
    const loadGraph = useLoadGraph();

    const project = useParams().project;
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const tick = useAtomValue(tickAtom);

    const createNode = (task, graph) => {
        const color = task.Finished ? 'lightgreen' : 'red';
        return graph.addNode(task.ID, {
            x: task.XPosition,
            y: task.YPosition,
            size: task.Size,
            label: task.Name,
            color: color,
        });
    };

    const createEdge = (dependency, graph) => {
        return graph.addDirectedEdge(dependency.PredecessorID, dependency.SuccessorID, { type: 'arrow', size: 5 });
    };

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${project}/tasks`), getAuthHeader())
            .then((response) => {
                const graph = new Graph();
                response.data.tasks.map((task) => {
                    createNode(task, graph);
                    return null;
                });
                response.data.dependencies.map((dependency) => {
                    createEdge(dependency, graph);
                    return null;
                });
                loadGraph(graph);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    return null;
};
