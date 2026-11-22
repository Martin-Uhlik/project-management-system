import { useLoadGraph } from '@react-sigma/core';
import { useEffect } from 'react';
import Graph from 'graphology';
import { useApi } from '../../../state/query';
import { useParams } from 'react-router';
import { taskStatus, useGraphColors } from '../../ui';

export const LoadGraph = () => {
    const loadGraph = useLoadGraph();

    const project = useParams().project;
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data } = useApi(`/auth/projects/${project}/tasks`, { topics: [`project:${project}`] });

    // node colours: finished green, in progress orange, todo blue, blocked red (taskStatus), in the light or dark look
    const colors = useGraphColors();

    const createNode = (task, graph) => {
        const color = colors.task[taskStatus(task)];
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
        if (!data) return;
        const graph = new Graph();
        data.tasks.forEach((task) => createNode(task, graph));
        data.dependencies.forEach((dependency) => createEdge(dependency, graph));
        loadGraph(graph);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, colors, loadGraph]);

    return null;
};
