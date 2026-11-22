import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { ServiceDate } from '../machines/ServiceDate';
import { StyledAddButton, StyledBoxHeader, StyledFact, StyledFacts, StyledOpenButton, StyledTable, StyledTableCell, StyledTableRow, useSearch } from '../ui';
import type { MachineListItem, PublicUser } from '../../types';

const noMachines: MachineListItem[] = [];
const fullName = (user: PublicUser | null | undefined) => (user ? `${user.FirstName} ${user.LastName}` : null);

// The Stroje section, laid out like Projekty: the machines on the left (responsible person, last and next service),
// the chosen one on the right with an arrow to its detail page
export const Machines = () => {
    const setDialog = useSetAtom(dialogAtom);
    const navigate = useNavigate();
    const setTab = useSetAtom(selectedTabAtom);
    useEffect(() => {
        setTab('Stroje');
    }, [setTab]);
    const setTick = useSetAtom(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: machines = noMachines } = useApi<MachineListItem[]>('/auth/machines', { topics: ['machines', 'users'] });
    const search = useSearch(machines, (machine) => [machine.Name, fullName(machine.Responsible) ?? '']);

    // the machine clicked in the list, else the first one
    const [chosen, setChosen] = useState<number | null>(null);
    const machine = machines.find((item) => item.ID === chosen) ?? machines[0] ?? null;

    const addMachine = (name: string) => {
        axios
            .post(getBackendAddress(`/auth/machines`), { Name: name }, getAuthHeader())
            .then(() => setTick(dayjs()))
            .catch((error) => handleAxiosError(error, [notifications, setNotifications]));
    };
    const handleAddMachine = () => {
        setDialog({ type: 'AddMachineDialog', data: { handleSubmit: addMachine, handleCancel: () => {} } });
    };

    return (
        <div className='content-wrap_inner'>
            <div className='content-2-column'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <StyledBoxHeader
                            title='Stroje'
                            add={
                                <RestrictedComponent types={['ADMIN']}>
                                    <StyledAddButton label='Přidat stroj' onClick={handleAddMachine} />
                                </RestrictedComponent>
                            }
                        />
                        <StyledTable
                            search={search}
                            columns={[{ label: 'Název' }, { label: 'Zodpovědný pracovník' }, { label: 'Poslední servis' }, { label: 'Příští servis' }]}
                        >
                            {search.results.map((item) => (
                                <StyledTableRow
                                    key={item.ID}
                                    selected={item.ID === machine?.ID}
                                    onClick={() => setChosen(item.ID)}
                                    onArrowClick={() => navigate(`/auth/machines/${item.ID}`)}
                                    arrowLabel='Přejít na stroj'
                                >
                                    <StyledTableCell>{item.Name}</StyledTableCell>
                                    <StyledTableCell>{fullName(item.Responsible) ?? '–'}</StyledTableCell>
                                    <StyledTableCell>
                                        <ServiceDate service={item.LastService} />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <ServiceDate service={item.NextService} />
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))}
                        </StyledTable>
                    </div>
                </div>
                <div className='content-box'>
                    {machine ? (
                        <div className='content-box_content'>
                            <div className='content-box_header'>
                                <h1>{machine.Name}</h1>
                                <StyledOpenButton label='Přejít na stroj' to={`/auth/machines/${machine.ID}`} />
                            </div>
                            <Divider />
                            <StyledFacts>
                                <StyledFact label='Zodpovědný pracovník'>{fullName(machine.Responsible)}</StyledFact>
                                <StyledFact label='Úkoly ve frontě'>{machine.OpenTasks}</StyledFact>
                                <StyledFact label='Poslední servis'>
                                    {machine.LastService ? (
                                        <>
                                            <ServiceDate service={machine.LastService} long />
                                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                                {machine.LastService.Title}
                                            </Typography>
                                        </>
                                    ) : null}
                                </StyledFact>
                                <StyledFact label='Příští plánovaný servis'>
                                    {machine.NextService ? (
                                        <>
                                            <ServiceDate service={machine.NextService} long />
                                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                                {machine.NextService.Title}
                                            </Typography>
                                        </>
                                    ) : null}
                                </StyledFact>
                            </StyledFacts>
                            <Divider />
                            <StyledFact label='Popis'>{machine.Description}</StyledFact>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
