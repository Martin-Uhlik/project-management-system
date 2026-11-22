import { useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useApi } from '../../state/query';
import { getUserID } from '../../Auth';
import {
    ButtonRow,
    FormStack,
    MinusIcon,
    PlusIcon,
    ReserveIcon,
    StyledAlert,
    StyledButton,
    StyledFact,
    StyledFacts,
    StyledInput,
    StyledSelect,
    StyledStatTile,
} from '../ui';
import { formatAmount, formatPrice, stockState, stockTone, stockStateLabels } from './format';
import { StockChart } from './StockChart';
import { useSend } from './useSend';

const none = [];

// Putting items in stock, taking them out and reserving them, optionally for one of the user's tasks
const StockMovement = ({ material }) => {
    const send = useSend();
    const userID = getUserID();
    const { data: assigned = none } = useApi(`/auth/${userID}/tasks`, { topics: [`user:${userID}`] });
    const tasks = assigned.map((item) => item.Task).filter((task) => !task.Finished);
    const [amount, setAmount] = useState('');
    const [taskID, setTaskID] = useState('');
    const count = Number(amount);
    const valid = Number.isInteger(count) && count > 0;
    const move = (EventType, text) =>
        send('post', `/auth/material/${material.ID}/event`, { EventType, Count: count, TargetTaskID: taskID ? Number(taskID) : null }, text).then(
            (result) => result && setAmount(''),
        );
    return (
        <FormStack component='form' onSubmit={(event) => event.preventDefault()}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' } }}>
                <StyledInput
                    id='amount'
                    label={`Počet (${material.Unit || 'ks'})`}
                    type='number'
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                />
                <StyledSelect
                    id='task'
                    label='Pro úkol'
                    value={taskID}
                    onChange={(event) => setTaskID(event.target.value)}
                    options={[{ value: '', label: 'bez úkolu' }, ...tasks.map((task) => ({ value: task.ID, label: `${task.Project?.Name} / ${task.Name}` }))]}
                />
            </Box>
            <ButtonRow justify='stretch'>
                <StyledButton color='success' startIcon={<PlusIcon />} disabled={!valid} onClick={() => move('ADD', 'Materiál naskladněn.')}>
                    Naskladnit
                </StyledButton>
                <StyledButton color='error' startIcon={<MinusIcon />} disabled={!valid} onClick={() => move('REMOVE', 'Materiál vydán ze skladu.')}>
                    Vydat
                </StyledButton>
                <StyledButton startIcon={<ReserveIcon />} disabled={!valid} onClick={() => move('RESERVATION', 'Materiál zarezervován.')}>
                    Zarezervovat
                </StyledButton>
            </ButtonRow>
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                Výdej pro úkol spotřebuje jeho rezervaci. Rezervaci lze zrušit na záložce Rezervace.
            </Typography>
        </FormStack>
    );
};

// A stock item's "Přehled": the stock in numbers, its details, how the stock went over time and stock movements
export const MaterialOverview = ({ material }) => {
    const state = stockState(material);
    return (
        <div className='content-2-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <h1>Přehled</h1>
                    {state !== 'ok' ? (
                        <StyledAlert severity={state === 'short' ? 'error' : 'warning'}>
                            {stockStateLabels[state]}: dostupné {formatAmount(material.Available, material.Unit)}
                            {material.MinCount ? `, minimum ${formatAmount(material.MinCount, material.Unit)}` : ''}.
                        </StyledAlert>
                    ) : null}
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                        <StyledStatTile label='Na skladě' value={formatAmount(material.Count, material.Unit)} />
                        <StyledStatTile
                            label='Rezervováno'
                            value={formatAmount(material.Reserved, material.Unit)}
                            caption={`${material.Reservations.length} rezervací`}
                        />
                        <StyledStatTile
                            label='Dostupné'
                            value={formatAmount(material.Available, material.Unit)}
                            tone={stockTone[state]}
                            caption={material.MinCount ? `minimum ${formatAmount(material.MinCount, material.Unit)}` : 'bez minima'}
                        />
                        <StyledStatTile
                            label='Hodnota zásoby'
                            value={formatPrice(Math.max(0, material.Count) * material.Price)}
                            caption={`${formatPrice(material.Price)} za ${material.Unit || 'ks'}`}
                        />
                    </Box>
                    <Divider />
                    <StyledFacts>
                        <StyledFact label='Dodavatel'>{material.Supplier}</StyledFact>
                        <StyledFact label='Umístění'>{material.Location}</StyledFact>
                    </StyledFacts>
                    <StyledFact label='Popis'>{material.Description}</StyledFact>
                </div>
            </div>
            <div className='content-2-row'>
                <div className='content-box'>
                    <div className='content-box_content'>
                        <h1>Vývoj zásoby</h1>
                        <div className='content-box_chart-wrapper-outer'>
                            <div className='content-box_chart-wrapper-inner'>
                                {material.Events.length ? (
                                    <StockChart material={material} />
                                ) : (
                                    <Typography sx={{ color: 'text.secondary' }}>Zatím žádné pohyby.</Typography>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='content-box' style={{ flexGrow: 0, flexBasis: 'auto', height: 'auto' }}>
                    <div className='content-box_content'>
                        <h1>Pohyb na skladě</h1>
                        <StockMovement material={material} />
                    </div>
                </div>
            </div>
        </div>
    );
};
