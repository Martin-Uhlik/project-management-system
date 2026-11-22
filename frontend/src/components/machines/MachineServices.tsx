import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { dialogAtom, notificationsAtom, tickAtom } from '../../state/atoms';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import {
    ButtonRow,
    CheckIcon,
    FormStack,
    StyledButton,
    StyledChip,
    StyledDateTimePicker,
    StyledInput,
    StyledSwitch,
    StyledTable,
    StyledTableCell,
    StyledTableRow,
    TrashIcon,
    UndoIcon,
    useSearch,
} from '../ui';
import { serviceState } from './ServiceDate';
import type { AxiosPromise } from 'axios';
import type { ChipProps } from '@mui/material/Chip';
import type { Dayjs } from 'dayjs';
import type { MachineDetail, MachineService, PublicUser } from '../../types';

const fullName = (user: PublicUser | null | undefined) => (user ? `${user.FirstName} ${user.LastName}` : '');
const stateChips: Record<string, { label: string; color: ChipProps['color'] }> = {
    done: { label: 'Proveden', color: 'success' },
    overdue: { label: 'Po termínu', color: 'error' },
    soon: { label: 'Brzy', color: 'warning' },
    planned: { label: 'Plánován', color: 'info' },
};

// A machine's "Servis" tab: its services, planned ones first (soonest first), then the ones done (newest first); the
// people who may edit the machine add services, mark planned ones done (or back) and delete them
export const MachineServices = ({ machine, canEdit }: { machine: MachineDetail; canEdit: boolean }) => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);
    const setDialog = useSetAtom(dialogAtom);
    const base = getBackendAddress(`/auth/machines/${machine.ID}/services`);

    const planned = machine.Services.filter((service) => !service.Done).sort((a, b) => dayjs(a.Date).diff(dayjs(b.Date)));
    const done = machine.Services.filter((service) => service.Done).sort((a, b) => dayjs(b.Date).diff(dayjs(a.Date)));
    const search = useSearch([...planned, ...done], (service) => [service.Title, service.Note ?? '', dayjs(service.Date).format('L')]);

    // true when the change went through
    const call = (request: AxiosPromise) =>
        request
            .then(() => {
                setTick(dayjs());
                return true;
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
                return false;
            });

    // the new service's form
    const [date, setDate] = useState<Dayjs | null>(() => dayjs().add(1, 'month').hour(8).minute(0));
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [isDone, setIsDone] = useState(false);
    const handleAdd = (event: FormEvent) => {
        event.preventDefault();
        call(axios.post(base, { Date: date, Title: title, Note: note || null, Done: isDone }, getAuthHeader())).then((ok) => {
            if (!ok) return;
            setTitle('');
            setNote('');
        });
    };

    const remove = (service: MachineService) =>
        setDialog({
            type: 'ConfirmDialog',
            data: {
                title: 'Odstranit servis',
                description: `Opravdu chcete odstranit servis „${service.Title}“ (${dayjs(service.Date).format('L')})?`,
                handleCancel: () => {},
                handleSuccess: () => call(axios.delete(`${base}/${service.ID}`, getAuthHeader())),
            },
        });

    const list = (
        <div className='content-box'>
            <div className='content-box_content'>
                <div className='content-box_header'>
                    <h1>Servisy</h1>
                </div>
                <StyledTable search={search} columns={[{ label: 'Datum' }, { label: 'Servis' }, { label: 'Stav' }, { label: 'Zapsal' }]}>
                    {search.results.map((service) => {
                        const state = service.Done ? 'done' : (serviceState(service) ?? 'planned');
                        return (
                            <StyledTableRow
                                key={service.ID}
                                showArrow={false}
                                actions={
                                    canEdit
                                        ? [
                                              service.Done
                                                  ? {
                                                        label: 'Vrátit mezi plánované',
                                                        icon: <UndoIcon />,
                                                        onClick: () => call(axios.patch(`${base}/${service.ID}`, { Done: false }, getAuthHeader())),
                                                    }
                                                  : {
                                                        label: 'Servis proběhl',
                                                        icon: <CheckIcon />,
                                                        onClick: () => call(axios.patch(`${base}/${service.ID}`, { Done: true }, getAuthHeader())),
                                                    },
                                              { label: 'Odstranit', icon: <TrashIcon />, onClick: () => remove(service) },
                                          ]
                                        : undefined
                                }
                            >
                                <StyledTableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(service.Date).format('L')}</StyledTableCell>
                                <StyledTableCell>
                                    {service.Title}
                                    {service.Note ? (
                                        <Typography variant='body2' sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                            {service.Note}
                                        </Typography>
                                    ) : null}
                                </StyledTableCell>
                                <StyledTableCell>
                                    <StyledChip label={stateChips[state].label} color={stateChips[state].color} variant='outlined' />
                                </StyledTableCell>
                                <StyledTableCell>{fullName(service.CreatedBy)}</StyledTableCell>
                            </StyledTableRow>
                        );
                    })}
                </StyledTable>
                {machine.Services.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Stroj zatím nemá žádný servis.</Typography> : null}
            </div>
        </div>
    );

    if (!canEdit) return list;
    return (
        <div className='content-2-column'>
            {list}
            <div className='content-box'>
                <div className='content-box_content'>
                    <FormStack component='form' onSubmit={handleAdd}>
                        <div className='content-box_header'>
                            <h1>Přidat servis</h1>
                        </div>
                        <StyledInput id='serviceTitle' label='Co se dělá' value={title} onChange={(event) => setTitle(event.target.value)} required />
                        <StyledDateTimePicker label='Datum' value={date} onChange={setDate} />
                        <StyledSwitch id='serviceDone' label='Servis už proběhl' checked={isDone} onChange={() => setIsDone(!isDone)} />
                        <StyledInput id='serviceNote' label='Poznámka' multiline minRows={4} value={note} onChange={(event) => setNote(event.target.value)} />
                        <ButtonRow>
                            <StyledButton type='submit' color='success' disabled={!title.trim() || !date}>
                                {isDone ? 'Zapsat servis' : 'Naplánovat servis'}
                            </StyledButton>
                        </ButtonRow>
                    </FormStack>
                </div>
            </div>
        </div>
    );
};
