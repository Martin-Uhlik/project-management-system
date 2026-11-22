import { useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../../state/atoms';
import dayjs from '../../../dayjs';
import { StyledChip, StyledTable, StyledTableCell, StyledTableRow, useSearch } from '../../ui';
import { useApi } from '../../../state/query';
import type { MaterialRequest } from '../../../types';
import { formatAmount, formatPrice, fullName, requestState, requestStateColors, requestStateLabels } from '../../inventory/format';

const none: MaterialRequest[] = [];

// Requests for material: what, how many, the total price, when it is needed and whether it is approved. In Sklad
// (onSelect) a row selects the request for the preview; elsewhere (a task's page: taskID, only its requests; an item's
// page: materialID) a row opens the dialog to change it.
export const MaterialRequirementTable = ({
    taskID,
    materialID,
    selectedID,
    onSelect,
}: {
    taskID?: number | string;
    materialID?: number | string;
    selectedID?: number | null;
    onSelect?: (id: number) => void;
}) => {
    const setDialog = useSetAtom(dialogAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data = none } = useApi<MaterialRequest[]>('/auth/materialRequirements', { topics: ['material'] });
    const requests = useMemo(
        () => data.filter((request) => (!taskID || request.TargetTaskID === Number(taskID)) && (!materialID || request.MaterialID === Number(materialID))),
        [data, taskID, materialID],
    );
    const search = useSearch(requests, (request) => [request.Name, fullName(request.TargetUser) ?? '', fullName(request.AcceptedBy) ?? '']);

    const open = (request: MaterialRequest) =>
        onSelect
            ? onSelect(request.ID)
            : setDialog({ type: 'EditMaterialRequirement', data: { material: request, handleSubmit: () => {}, handleCancel: () => {} } });

    return (
        <StyledTable
            columns={[
                { label: 'Název' },
                { label: 'Počet', align: 'right' },
                { label: 'Cena celkem', align: 'right' },
                { label: 'Potřeba do', align: 'right' },
                { label: 'Stav' },
            ]}
            search={search}
        >
            {search.results.map((request) => {
                const state = requestState(request);
                const late = request.NeededDate && dayjs(request.NeededDate).isBefore(dayjs());
                return (
                    <StyledTableRow
                        key={request.ID}
                        selected={onSelect ? request.ID === selectedID : undefined}
                        onClick={() => open(request)}
                        showArrow={false}
                    >
                        <StyledTableCell>{request.Name}</StyledTableCell>
                        <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                            {formatAmount(request.Count, request.Material?.Unit)}
                        </StyledTableCell>
                        <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                            {formatPrice(request.Price * request.Count)}
                        </StyledTableCell>
                        <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap', color: late ? 'error.main' : undefined }}>
                            {request.NeededDate ? dayjs(request.NeededDate).format('L') : '–'}
                        </StyledTableCell>
                        <StyledTableCell sx={{ whiteSpace: 'nowrap' }}>
                            <StyledChip label={requestStateLabels[state]} color={requestStateColors[state]} variant='outlined' />
                        </StyledTableCell>
                    </StyledTableRow>
                );
            })}
        </StyledTable>
    );
};
