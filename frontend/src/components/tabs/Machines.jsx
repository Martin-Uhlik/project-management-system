import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import axios from 'axios';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { dialogAtom, notificationsAtom, selectedTabAtom, tickAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { ServiceDate } from '../machines/ServiceDate';
import { ArrowRightIcon, StyledAddButton, StyledBoxHeader, StyledIconButton, StyledTable, StyledTableCell, StyledTableRow, useSearch } from '../ui';

const noMachines = [];
const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : null);

// One fact of the selected machine: a quiet label over its value ('–' when it has none)
const Fact = ({ label, children }) => (
    <Stack sx={{ gap: 0.5 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {label}
        </Typography>
        <Box sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children || children === 0 ? children : '–'}</Box>
    </Stack>
);

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
    const { data: machines = noMachines } = useApi('/auth/machines', { topics: ['machines', 'users'] });
    const search = useSearch(machines, (machine) => [machine.Name, fullName(machine.Responsible) ?? '']);

    // the machine clicked in the list, else the first one
    const [chosen, setChosen] = useState(null);
    const machine = machines.find((item) => item.ID === chosen) ?? machines[0] ?? null;

    const addMachine = (name) => {
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
                                <StyledIconButton
                                    label='Přejít na stroj'
                                    component={Link}
                                    to={`/auth/machines/${machine.ID}`}
                                    sx={{ bgcolor: 'primary.main', color: '#ffffff', p: 1, '&:hover': { bgcolor: 'primary.dark' } }}
                                >
                                    <ArrowRightIcon sx={{ fontSize: '2rem' }} />
                                </StyledIconButton>
                            </div>
                            <Divider />
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                <Fact label='Zodpovědný pracovník'>{fullName(machine.Responsible)}</Fact>
                                <Fact label='Úkoly ve frontě'>{machine.OpenTasks}</Fact>
                                <Fact label='Poslední servis'>
                                    {machine.LastService ? (
                                        <>
                                            <ServiceDate service={machine.LastService} long />
                                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                                {machine.LastService.Title}
                                            </Typography>
                                        </>
                                    ) : null}
                                </Fact>
                                <Fact label='Příští plánovaný servis'>
                                    {machine.NextService ? (
                                        <>
                                            <ServiceDate service={machine.NextService} long />
                                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                                {machine.NextService.Title}
                                            </Typography>
                                        </>
                                    ) : null}
                                </Fact>
                            </Box>
                            <Divider />
                            <Fact label='Popis'>{machine.Description}</Fact>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
