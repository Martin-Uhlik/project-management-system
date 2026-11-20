import { useAtom, useSetAtom } from 'jotai';
import { notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { AccountIcon, CalendarIcon, ClockOutlineIcon, StyledPageHeader, StyledPageHeaderFact, formatMinutes, taskStatus } from '../ui';

const subTabs = [
    { label: 'Přehled', value: 'overview' },
    { label: 'Vstupní soubory', value: 'input-files' },
    { label: 'Výstupní soubory', value: 'output-files' },
    { label: 'Stroje', value: 'machines' },
    { label: 'Materiál', value: 'material' },
];

// A task's page: the header (where the task sits, its status, deadline, estimate and workers) with its sections as tabs
export const ProjectTask = () => {
    const setTab = useSetAtom(selectedTabAtom);
    React.useEffect(() => {
        setTab('Projekty');
    });
    const [selectedSubTab, setSelectedSubTab] = React.useState(null);

    const { project: projectID, task: taskID } = useParams();
    const [project, setProject] = useState(null);
    const [task, setTask] = useState(null);
    const [tick] = useAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${projectID}`), getAuthHeader())
            .then((response) => setProject(response.data))
            .catch(() => {
                // only the name for the breadcrumb: someone assigned to just this task may not open the project
            });
    }, [projectID]);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}`), getAuthHeader())
            .then((response) => setTask(response.data))
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectID, taskID, tick]);

    const status = task ? taskStatus(task) : null;
    const deadline = task?.FinishDate ? dayjs(task.FinishDate) : null;
    const overdue = deadline && status !== 'finished' && deadline.isBefore(dayjs());
    const workers = task?.User_Task?.map((assignment) => `${assignment.User.FirstName} ${assignment.User.LastName}`) ?? [];
    const planned = task ? task.DurationHours * 60 + task.DurationMinutes : 0;

    return (
        <>
            <StyledPageHeader
                breadcrumbs={[
                    { label: 'Projekty', to: '/auth/projects' },
                    { label: project?.Name ?? 'Projekt', to: `/auth/projects/${projectID}` },
                ]}
                title={task?.Name ?? null}
                status={status}
                facts={
                    task ? (
                        <>
                            <StyledPageHeaderFact icon={CalendarIcon} label='Termín' color={overdue ? 'error' : undefined}>
                                {deadline?.format('LL')}
                            </StyledPageHeaderFact>
                            <StyledPageHeaderFact icon={ClockOutlineIcon} label='Odhad'>
                                {planned ? formatMinutes(planned) : 'neuveden'}
                            </StyledPageHeaderFact>
                            <StyledPageHeaderFact icon={AccountIcon} label={workers.length > 1 ? 'Pracovníci' : 'Pracovník'}>
                                {workers.length ? workers.join(', ') : 'nepřiřazen'}
                            </StyledPageHeaderFact>
                        </>
                    ) : null
                }
                tabs={subTabs.map((tab) => ({ ...tab, to: tab.value }))}
                active={selectedSubTab}
            />
            <div className='content-wrap_inner'>
                <Outlet context={setSelectedSubTab} />
            </div>
        </>
    );
};
