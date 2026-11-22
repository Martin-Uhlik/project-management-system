import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { selectedTabAtom, userAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import dayjs from '../../dayjs';
import { AccountIcon, CalendarIcon, ClockOutlineIcon, StyledPageHeader, StyledPageHeaderFact } from '../ui';
import { serviceState } from './ServiceDate';
import { MachineTasks } from './MachineTasks';
import { MachineServices } from './MachineServices';
import { MachineFiles } from './MachineFiles';
import { MachineSettings } from './MachineSettings';

const tabs = [
    { label: 'Úkoly', value: 'tasks' },
    { label: 'Servis', value: 'services' },
    { label: 'Soubory', value: 'files' },
    { label: 'Nastavení', value: 'settings' },
];

const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : null);

// A machine's page: its header (responsible person, last and next service) with the tabs Úkoly (the production queue
// and plan), Servis, Soubory (documentation...) and Nastavení; the open tab is kept in the address (?tab=services)
export const Machine = () => {
    const setTab = useSetAtom(selectedTabAtom);
    useEffect(() => {
        setTab('Stroje');
    }, [setTab]);
    const machineID = useParams().machine;
    const me = useAtomValue(userAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const machine = useApi(`/auth/machines/${machineID}`, { topics: ['machines', 'users'] }).data ?? null;
    // the machine's details, services and files are changed by admins, managers and its responsible person
    const canEdit = !!me && !!machine && (me.UserType === 'ADMIN' || me.UserType === 'MANAGER' || me.ID === machine.ResponsibleID);

    const [searchParams, setSearchParams] = useSearchParams();
    const tab = tabs.some((item) => item.value === searchParams.get('tab')) ? searchParams.get('tab') : 'tasks';
    const selectTab = (value) => setSearchParams(value === 'tasks' ? {} : { tab: value }, { replace: true });

    const openTasks = machine?.Task.filter((task) => !task.Finished).length;
    const totals = { tasks: openTasks, services: machine?.Services.length, files: machine?.FileCount };
    const next = machine?.NextService;
    const nextState = serviceState(next);

    return (
        <>
            <StyledPageHeader
                breadcrumbs={[{ label: 'Stroje', to: '/auth/machines' }]}
                back={{ to: '/auth/machines', label: 'Zpět na stroje' }}
                title={machine?.Name ?? null}
                facts={
                    machine ? (
                        <>
                            <StyledPageHeaderFact icon={AccountIcon} label='Zodpovědný pracovník'>
                                {fullName(machine.Responsible) ?? 'nepřiřazen'}
                            </StyledPageHeaderFact>
                            <StyledPageHeaderFact icon={ClockOutlineIcon} label='Poslední servis'>
                                {machine.LastService ? dayjs(machine.LastService.Date).format('LL') : 'žádný'}
                            </StyledPageHeaderFact>
                            <StyledPageHeaderFact
                                icon={CalendarIcon}
                                label='Příští servis'
                                color={nextState === 'overdue' ? 'error' : nextState === 'soon' ? 'warning' : undefined}
                            >
                                {next ? dayjs(next.Date).format('LL') : 'neplánován'}
                            </StyledPageHeaderFact>
                        </>
                    ) : null
                }
                tabs={tabs.map((item) => ({ ...item, total: totals[item.value] }))}
                active={tab}
                onSelect={selectTab}
            />
            <div className='content-wrap_inner'>
                {!machine ? null : tab === 'services' ? (
                    <MachineServices machine={machine} canEdit={canEdit} />
                ) : tab === 'files' ? (
                    <MachineFiles machine={machine} canEdit={canEdit} />
                ) : tab === 'settings' ? (
                    <MachineSettings machine={machine} canEdit={canEdit} />
                ) : (
                    <MachineTasks machine={machine} />
                )}
            </div>
        </>
    );
};
