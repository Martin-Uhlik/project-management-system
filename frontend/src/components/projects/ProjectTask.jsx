import { useSetAtom } from 'jotai';
import { selectedTabAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import React from 'react';
import { Outlet, useParams } from 'react-router';
import dayjs from '../../dayjs';
import { AccountIcon, CalendarIcon, ClockOutlineIcon, StyledPageHeader, StyledPageHeaderFact, formatMinutes, taskStatus } from '../ui';

const subTabs = [
    { label: 'Přehled', value: 'overview' },
    { label: 'Vstupní soubory', value: 'input-files', counted: 'InputFiles' },
    { label: 'Výstupní soubory', value: 'output-files', counted: 'OutputFiles' },
    { label: 'Stroje', value: 'machines', counted: 'Machines' },
    { label: 'Materiál', value: 'material', counted: 'Material' },
];

// A task's page: the header (where the task sits, its status, deadline, estimate and workers) with its sections as tabs
export const ProjectTask = () => {
    const setTab = useSetAtom(selectedTabAtom);
    React.useEffect(() => {
        setTab('Projekty');
    });
    const [selectedSubTab, setSelectedSubTab] = React.useState(null);

    const { project: projectID, task: taskID } = useParams();
    // only the name for the breadcrumb: someone assigned to just this task may not open the project (quiet)
    const project = useApi(`/auth/projects/${projectID}`, { topics: ['projects', `project:${projectID}`], quiet: true }).data;
    // reloaded when someone changes this data (live updates) or after a change made here
    const task = useApi(`/auth/projects/${projectID}/tasks/${taskID}`, { topics: [`project:${projectID}`] }).data ?? null;

    const status = task ? taskStatus(task) : null;
    const deadline = task?.FinishDate ? dayjs(task.FinishDate) : null;
    const overdue = deadline && status !== 'finished' && deadline.isBefore(dayjs());
    const workers = task?.User_Task?.map((assignment) => `${assignment.User.FirstName} ${assignment.User.LastName}`) ?? [];
    const planned = task ? task.DurationHours * 60 + task.DurationMinutes : 0;

    return (
        <>
            <StyledPageHeader
                back={{ to: `/auth/projects/${projectID}`, label: 'Zpět na projekt' }}
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
                // each section's tab says how many items it holds (task.Counts)
                tabs={subTabs.map((tab) => ({ ...tab, to: tab.value, total: tab.counted && task?.Counts ? task.Counts[tab.counted] : undefined }))}
                active={selectedSubTab}
            />
            <div className='content-wrap_inner'>
                <Outlet context={setSelectedSubTab} />
            </div>
        </>
    );
};
