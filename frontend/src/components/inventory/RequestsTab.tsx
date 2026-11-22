import { useState } from 'react';
import { Link } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { dialogAtom, userAtom } from '../../state/atoms';
import dayjs from '../../dayjs';
import { useApi } from '../../state/query';
import { MaterialRequirementTable } from '../utils/tables/MaterialRequirementTable';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import {
    ButtonRow,
    CheckIcon,
    PencilIcon,
    PlusIcon,
    StyledAddButton,
    StyledBoxHeader,
    StyledButton,
    StyledChip,
    StyledFact,
    StyledFacts,
    TrashIcon,
} from '../ui';
import { formatAmount, formatPrice, fullName, requestState, requestStateColors, requestStateLabels, taskLabel, taskLink } from './format';
import { useSend } from './useSend';
import type { MaterialRequest } from '../../types';

const none: MaterialRequest[] = [];

// The chosen request: everything about it and what can be done with it - approve (admins, managers), stock it once
// approved (admins, managers), change or remove it (them and its author)
const RequestPreview = ({ request }: { request: MaterialRequest }) => {
    const me = useAtomValue(userAtom);
    const setDialog = useSetAtom(dialogAtom);
    const send = useSend();
    const isManager = me?.UserType === 'ADMIN' || me?.UserType === 'MANAGER';
    const canChange = isManager || me?.ID === request.TargetUserID;
    const state = requestState(request);
    const unit = request.Material?.Unit;
    const late = request.NeededDate && dayjs(request.NeededDate).isBefore(dayjs());

    const handleRemove = () =>
        setDialog({
            type: 'ConfirmDialog',
            data: {
                title: 'Odstranit požadavek',
                description: `Opravdu chcete odstranit požadavek „${request.Name}“?`,
                handleCancel: () => {},
                handleSuccess: () => send('delete', `/auth/materialRequirements/${request.ID}`, null, 'Požadavek odstraněn.'),
            },
        });

    return (
        <div className='content-box_content'>
            <div className='content-box_header'>
                <Stack sx={{ gap: 0.5, minWidth: 0 }}>
                    <h1>{request.Name}</h1>
                    <div>
                        <StyledChip label={requestStateLabels[state]} color={requestStateColors[state]} variant='outlined' />
                    </div>
                </Stack>
            </div>
            <Divider />
            <StyledFacts>
                <StyledFact label='Počet'>{formatAmount(request.Count, unit)}</StyledFact>
                <StyledFact label='Cena za kus'>{formatPrice(request.Price)}</StyledFact>
                <StyledFact label='Cena celkem'>{formatPrice(request.Price * request.Count)}</StyledFact>
                <StyledFact label='Potřeba do' tone={late ? 'error' : undefined}>
                    {request.NeededDate ? dayjs(request.NeededDate).format('LL') : null}
                </StyledFact>
                <StyledFact label='Pro úkol'>
                    {request.TargetTask ? (
                        <Typography component={Link} to={taskLink(request.TargetTask)} sx={{ color: 'inherit', fontWeight: 500 }}>
                            {taskLabel(request.TargetTask)}
                        </Typography>
                    ) : null}
                </StyledFact>
                <StyledFact label='Doplní materiál'>
                    {request.Material ? (
                        <Typography component={Link} to={`/auth/inventory/${request.Material.ID}`} sx={{ color: 'inherit', fontWeight: 500 }}>
                            {request.Material.Name}
                        </Typography>
                    ) : (
                        'nová položka skladu'
                    )}
                </StyledFact>
                <StyledFact label='Zadal(a)'>
                    {fullName(request.TargetUser)}, {dayjs(request.AddedDate).format('L')}
                </StyledFact>
                <StyledFact label='Schválil(a)'>
                    {request.AcceptedBy ? `${fullName(request.AcceptedBy)}, ${dayjs(request.AcceptedDate).format('L')}` : null}
                </StyledFact>
            </StyledFacts>
            <Divider />
            <StyledFact label='Popis'>{request.Description}</StyledFact>
            <ButtonRow sx={{ mt: 'auto' }}>
                {canChange ? (
                    <>
                        <StyledButton color='error' variant='outlined' startIcon={<TrashIcon />} onClick={handleRemove}>
                            Odstranit
                        </StyledButton>
                        <StyledButton
                            startIcon={<PencilIcon />}
                            onClick={() =>
                                setDialog({ type: 'EditMaterialRequirement', data: { material: request, handleSubmit: () => {}, handleCancel: () => {} } })
                            }
                        >
                            Upravit
                        </StyledButton>
                    </>
                ) : null}
                {isManager && state === 'waiting' ? (
                    <StyledButton
                        color='success'
                        startIcon={<CheckIcon />}
                        onClick={() => send('patch', `/auth/materialRequirements/${request.ID}`, { Accepted: true }, 'Požadavek schválen.')}
                    >
                        Schválit
                    </StyledButton>
                ) : null}
                {isManager && state === 'approved' ? (
                    <StyledButton
                        color='success'
                        startIcon={<PlusIcon />}
                        onClick={() =>
                            send(
                                'post',
                                `/auth/materialRequirements/${request.ID}/stock`,
                                {},
                                request.TargetTask ? 'Materiál naskladněn a zarezervován pro úkol.' : 'Materiál naskladněn.',
                            )
                        }
                    >
                        Naskladnit
                    </StyledButton>
                ) : null}
            </ButtonRow>
        </div>
    );
};

// "Požadavky" in Sklad: the requests for material on the left, the chosen one on the right
export const RequestsTab = () => {
    const setDialog = useSetAtom(dialogAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: requests = none } = useApi<MaterialRequest[]>('/auth/materialRequirements', { topics: ['material'] });
    const [chosen, setChosen] = useState<number | null>(null);
    const request = requests.find((item) => item.ID === chosen) ?? requests[0] ?? null;

    return (
        <div className='content-2-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <StyledBoxHeader
                        title='Požadavky na materiál'
                        add={
                            <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                <StyledAddButton
                                    label='Přidat požadavek na materiál'
                                    onClick={() => setDialog({ type: 'AddMaterialRequirement', data: { handleCancel: () => {} } })}
                                />
                            </RestrictedComponent>
                        }
                    />
                    <MaterialRequirementTable selectedID={request?.ID} onSelect={setChosen} />
                    {requests.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Žádné požadavky.</Typography> : null}
                </div>
            </div>
            <div className='content-box'>{request ? <RequestPreview request={request} /> : null}</div>
        </div>
    );
};
