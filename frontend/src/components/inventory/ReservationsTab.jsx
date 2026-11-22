import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import dayjs from '../../dayjs';
import { useApi } from '../../state/query';
import {
    ButtonRow,
    FormStack,
    StyledBoxHeader,
    StyledButton,
    StyledFact,
    StyledFacts,
    StyledInput,
    StyledOpenButton,
    StyledTable,
    StyledTableCell,
    StyledTableRow,
    useSearch,
} from '../ui';
import { formatAmount, formatPrice, fullName, taskLabel, taskLink } from './format';
import { useSend } from './useSend';

const none = [];

// A reservation's actions: take items out of stock for its task (which uses the reservation up) or give them back
const ReservationActions = ({ reservation }) => {
    const send = useSend();
    const [count, setCount] = useState('');
    const amount = Number(count);
    const valid = Number.isInteger(amount) && amount > 0 && amount <= reservation.Open;
    const move = (EventType, text) =>
        send('post', `/auth/material/${reservation.Material.ID}/event`, { EventType, Count: amount, TargetTaskID: reservation.Task?.ID ?? null }, text).then(
            (result) => result && setCount(''),
        );
    return (
        <FormStack component='form' onSubmit={(event) => event.preventDefault()}>
            <StyledInput
                id='reservation-count'
                label={`Počet (nejvýše ${formatAmount(reservation.Open, reservation.Material.Unit)})`}
                type='number'
                value={count}
                onChange={(event) => setCount(event.target.value)}
            />
            <ButtonRow justify='stretch'>
                <StyledButton color='dark' disabled={!valid} onClick={() => move('RELEASE', 'Rezervace zrušena.')}>
                    Zrušit rezervaci
                </StyledButton>
                <StyledButton disabled={!valid} onClick={() => move('REMOVE', 'Materiál vydán ze skladu.')}>
                    Vydat ze skladu
                </StyledButton>
            </ButtonRow>
        </FormStack>
    );
};

// "Rezervace" in Sklad: what is set aside for which task (the soonest deadline first) and, for the chosen one, how much
// was reserved, taken and given back, with the actions
export const ReservationsTab = () => {
    const navigate = useNavigate();
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: reservations = none } = useApi('/auth/material/reservations', { topics: ['material'] });
    const search = useSearch(reservations, (item) => [item.Material.Name, taskLabel(item.Task) ?? '']);
    const [chosen, setChosen] = useState(null);
    const reservation = reservations.find((item) => item.Key === chosen) ?? reservations[0] ?? null;

    return (
        <div className='content-2-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <StyledBoxHeader title='Rezervace materiálu' />
                    <StyledTable
                        search={search}
                        columns={[{ label: 'Materiál' }, { label: 'Úkol' }, { label: 'Rezervováno', align: 'right' }, { label: 'Termín', align: 'right' }]}
                    >
                        {search.results.map((item) => (
                            <StyledTableRow
                                key={item.Key}
                                selected={item.Key === reservation?.Key}
                                onClick={() => setChosen(item.Key)}
                                onArrowClick={() => navigate(`/auth/inventory/${item.Material.ID}?tab=reservations`)}
                                arrowLabel='Přejít na materiál'
                            >
                                <StyledTableCell>{item.Material.Name}</StyledTableCell>
                                <StyledTableCell>{taskLabel(item.Task) ?? 'bez úkolu'}</StyledTableCell>
                                <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                                    {formatAmount(item.Open, item.Material.Unit)}
                                </StyledTableCell>
                                <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                                    {item.Task ? dayjs(item.Task.FinishDate).format('L') : '–'}
                                </StyledTableCell>
                            </StyledTableRow>
                        ))}
                    </StyledTable>
                    {reservations.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Nic není zarezervováno.</Typography> : null}
                </div>
            </div>
            <div className='content-box'>
                {reservation ? (
                    <div className='content-box_content'>
                        <div className='content-box_header'>
                            <h1>{reservation.Material.Name}</h1>
                            <StyledOpenButton label='Přejít na materiál' to={`/auth/inventory/${reservation.Material.ID}?tab=reservations`} />
                        </div>
                        <Divider />
                        <StyledFacts>
                            <StyledFact label='Úkol'>
                                {reservation.Task ? (
                                    <Typography component={Link} to={taskLink(reservation.Task)} sx={{ color: 'inherit', fontWeight: 500 }}>
                                        {reservation.Task.Name}
                                    </Typography>
                                ) : (
                                    'bez úkolu'
                                )}
                            </StyledFact>
                            <StyledFact label='Projekt'>{reservation.Task?.Project?.Name}</StyledFact>
                            <StyledFact
                                label='Termín úkolu'
                                tone={reservation.Task && dayjs(reservation.Task.FinishDate).isBefore(dayjs()) ? 'error' : undefined}
                            >
                                {reservation.Task ? dayjs(reservation.Task.FinishDate).format('LL') : null}
                            </StyledFact>
                            <StyledFact label='Stále rezervováno'>{formatAmount(reservation.Open, reservation.Material.Unit)}</StyledFact>
                            <StyledFact label='Rezervováno celkem'>{formatAmount(reservation.Reserved, reservation.Material.Unit)}</StyledFact>
                            <StyledFact label='Vydáno pro úkol'>{formatAmount(reservation.Taken, reservation.Material.Unit)}</StyledFact>
                            <StyledFact label='Hodnota rezervace'>
                                {reservation.Material.Price ? formatPrice(reservation.Open * reservation.Material.Price) : null}
                            </StyledFact>
                            <StyledFact label='Rezervoval(a)'>{reservation.ReservedBy.map(fullName).join(', ')}</StyledFact>
                            <StyledFact label='Naposledy rezervováno'>{dayjs(reservation.ReservedAt).format('L LT')}</StyledFact>
                        </StyledFacts>
                        <Divider />
                        <h2 style={{ margin: 0 }}>Vydat nebo zrušit</h2>
                        <ReservationActions key={reservation.Key} reservation={reservation} />
                    </div>
                ) : null}
            </div>
        </div>
    );
};
