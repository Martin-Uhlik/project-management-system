import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';
import Typography from '@mui/material/Typography';
import { userAtom } from '../../state/atoms';
import dayjs from '../../dayjs';
import { MaterialRequirementTable } from '../utils/tables/MaterialRequirementTable';
import { MaterialFields, materialBody } from '../dialogs/AddMaterial';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import {
    ButtonRow,
    FormStack,
    StyledAddButton,
    StyledBoxHeader,
    StyledButton,
    StyledChip,
    StyledSection,
    StyledTable,
    StyledTableCell,
    StyledTableRow,
    useSearch,
} from '../ui';
import { eventColors, eventLabels, eventSign, formatAmount, fullName, taskLabel, taskLink } from './format';
import { useSend } from './useSend';
import { useRestock } from './MaterialPreview';
import type { MaterialDetail } from '../../types';
import type { MaterialSetters, MaterialValues } from '../dialogs/AddMaterial';

// "Historie": every stock movement of the item, newest first; a movement for a task opens the task
export const MaterialHistory = ({ material }: { material: MaterialDetail }) => {
    const navigate = useNavigate();
    const search = useSearch(material.Events, (event) => [eventLabels[event.EventType], taskLabel(event.TargetTask) ?? '', fullName(event.TargetUser) ?? '']);
    return (
        <div className='content-box'>
            <div className='content-box_content'>
                <StyledBoxHeader title='Historie pohybů' />
                <StyledTable
                    search={search}
                    columns={[{ label: 'Datum' }, { label: 'Pohyb' }, { label: 'Množství', align: 'right' }, { label: 'Úkol' }, { label: 'Provedl(a)' }]}
                >
                    {search.results.map((event) => (
                        <StyledTableRow
                            key={event.ID}
                            onClick={event.TargetTask ? () => navigate(taskLink(event.TargetTask!)) : undefined}
                            showArrow={Boolean(event.TargetTask)}
                            arrowLabel='Přejít na úkol'
                        >
                            <StyledTableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(event.CreatedAt).format('L LT')}</StyledTableCell>
                            <StyledTableCell>
                                <StyledChip label={eventLabels[event.EventType]} color={eventColors[event.EventType]} variant='outlined' />
                            </StyledTableCell>
                            <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                                {eventSign[event.EventType]} {formatAmount(event.Count, material.Unit)}
                            </StyledTableCell>
                            <StyledTableCell>{taskLabel(event.TargetTask) ?? '–'}</StyledTableCell>
                            <StyledTableCell>{fullName(event.TargetUser) ?? '–'}</StyledTableCell>
                        </StyledTableRow>
                    ))}
                </StyledTable>
                {material.Events.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Zatím žádné pohyby.</Typography> : null}
            </div>
        </div>
    );
};

// "Rezervace": what of the item is set aside for which task; a row opens the reservation in Sklad, where it can be
// taken out or given back
export const MaterialReservations = ({ material }: { material: MaterialDetail }) => {
    const navigate = useNavigate();
    return (
        <div className='content-box'>
            <div className='content-box_content'>
                <StyledBoxHeader title='Otevřené rezervace' />
                <StyledTable
                    columns={[
                        { label: 'Úkol' },
                        { label: 'Termín', align: 'right' },
                        { label: 'Rezervováno', align: 'right' },
                        { label: 'Vydáno', align: 'right' },
                        { label: 'Rezervoval(a)' },
                    ]}
                >
                    {material.Reservations.map((reservation) => (
                        <StyledTableRow
                            key={reservation.Key}
                            onClick={reservation.Task ? () => navigate(taskLink(reservation.Task!)) : undefined}
                            showArrow={Boolean(reservation.Task)}
                            arrowLabel='Přejít na úkol'
                        >
                            <StyledTableCell>{taskLabel(reservation.Task) ?? 'bez úkolu'}</StyledTableCell>
                            <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                                {reservation.Task ? dayjs(reservation.Task.FinishDate).format('L') : '–'}
                            </StyledTableCell>
                            <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                                {formatAmount(reservation.Open, material.Unit)}
                            </StyledTableCell>
                            <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                                {formatAmount(reservation.Taken, material.Unit)}
                            </StyledTableCell>
                            <StyledTableCell>{reservation.ReservedBy.map(fullName).join(', ')}</StyledTableCell>
                        </StyledTableRow>
                    ))}
                </StyledTable>
                {material.Reservations.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Nic není zarezervováno.</Typography> : null}
                {material.Reservations.length ? (
                    <ButtonRow>
                        <StyledButton onClick={() => navigate('/auth/inventory?tab=reservations')}>Vydat nebo zrušit v rezervacích skladu</StyledButton>
                    </ButtonRow>
                ) : null}
            </div>
        </div>
    );
};

// "Požadavky": the requests to restock the item; admins and managers add one
export const MaterialRequests = ({ material }: { material: MaterialDetail }) => {
    const restock = useRestock();
    return (
        <div className='content-box'>
            <div className='content-box_content'>
                <StyledBoxHeader
                    title='Požadavky na doplnění'
                    add={
                        <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                            <StyledAddButton label='Doobjednat materiál' onClick={() => restock(material)} />
                        </RestrictedComponent>
                    }
                />
                <MaterialRequirementTable materialID={material.ID} />
                {material.Requests.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Žádné požadavky na doplnění.</Typography> : null}
            </div>
        </div>
    );
};

const formValues = (material: MaterialDetail): MaterialValues => ({
    name: material.Name ?? '',
    unit: material.Unit ?? 'ks',
    price: String(material.Price ?? ''),
    minCount: String(material.MinCount ?? ''),
    supplier: material.Supplier ?? '',
    location: material.Location ?? '',
    description: material.Description ?? '',
});

// "Nastavení": the item's details; admins and managers change them
export const MaterialSettings = ({ material }: { material: MaterialDetail }) => {
    const me = useAtomValue(userAtom);
    const canEdit = me?.UserType === 'ADMIN' || me?.UserType === 'MANAGER';
    const send = useSend();
    // the form follows the loaded item until something in it is changed here
    const [dirty, setDirty] = useState(false);
    const [source, setSource] = useState<MaterialDetail | null>(null);
    const [values, setValues] = useState(() => formValues(material));
    if (!dirty && material !== source) {
        setSource(material);
        setValues(formValues(material));
    }
    const setters = Object.fromEntries(
        Object.keys(values).map((key) => [
            key,
            (value: string) => {
                setDirty(true);
                setValues((old) => ({ ...old, [key]: value }));
            },
        ]),
    ) as MaterialSetters;
    const handleSave = (event: FormEvent) => {
        event.preventDefault();
        send('patch', `/auth/material/${material.ID}`, materialBody(values), 'Změny materiálu uloženy.').then((result) => result && setDirty(false));
    };
    return (
        <FormStack sx={{ width: 'min(50rem, 100%)', mx: 'auto' }}>
            <StyledSection title='Údaje materiálu' caption={canEdit ? undefined : 'Upravit je může vedoucí nebo administrátor.'}>
                <FormStack component='form' onSubmit={handleSave} sx={{ mt: 2 }}>
                    <MaterialFields values={values} setters={setters} disabled={!canEdit} />
                    {canEdit ? (
                        <ButtonRow>
                            <StyledButton
                                color='dark'
                                disabled={!dirty}
                                onClick={() => {
                                    setDirty(false);
                                    setSource(null);
                                }}
                            >
                                Zrušit změny
                            </StyledButton>
                            <StyledButton type='submit' color='success' disabled={!dirty || !values.name.trim()}>
                                Uložit
                            </StyledButton>
                        </ButtonRow>
                    ) : null}
                </FormStack>
            </StyledSection>
        </FormStack>
    );
};
