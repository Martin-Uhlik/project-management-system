import { useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';
import Box from '@mui/material/Box';
import { dialogAtom } from '../../../state/atoms';
import { StyledTable, StyledTableCell, StyledTableRow, useSearch } from '../../ui';
import { useApi } from '../../../state/query';
import type { Material } from '../../../types';
import { formatAmount, stockState, stockTone } from '../../inventory/format';

const none: Material[] = [];

// The stock items: in stock, reserved and available (in their units; available in orange below the item's minimum,
// red when more is reserved than in stock). In Sklad (onSelect) a row selects the item for the preview and its arrow
// opens the item's page; on a task's page (taskID) a row opens the dialog to take out or reserve for the task.
export const MaterialTable = ({ taskID, selectedID, onSelect }: { taskID?: number | string; selectedID?: number | null; onSelect?: (id: number) => void }) => {
    const navigate = useNavigate();
    const setDialog = useSetAtom(dialogAtom);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: materials = none } = useApi<Material[]>('/auth/material', { topics: ['material'] });
    const search = useSearch(materials, (material) => [material.Name, material.Supplier ?? '', material.Location ?? '']);

    const open = (material: Material) =>
        onSelect ? onSelect(material.ID) : setDialog({ type: 'EditMaterial', data: { material, taskID, handleSubmit: () => {}, handleCancel: () => {} } });

    return (
        <StyledTable
            columns={[
                { label: 'Název' },
                { label: 'Na skladě', align: 'right' },
                { label: 'Rezervováno', align: 'right' },
                { label: 'Dostupné', align: 'right' },
            ]}
            search={search}
        >
            {search.results.map((material) => (
                <StyledTableRow
                    key={material.ID}
                    selected={onSelect ? material.ID === selectedID : undefined}
                    onClick={() => open(material)}
                    onArrowClick={onSelect ? () => navigate(`/auth/inventory/${material.ID}`) : undefined}
                    arrowLabel='Přejít na materiál'
                >
                    <StyledTableCell>{material.Name}</StyledTableCell>
                    <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        {formatAmount(material.Count, material.Unit)}
                    </StyledTableCell>
                    <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        {formatAmount(material.Reserved, material.Unit)}
                    </StyledTableCell>
                    <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        <Box
                            component='span'
                            sx={{ fontWeight: 600, color: stockTone[stockState(material)] ? `${stockTone[stockState(material)]}.main` : undefined }}
                        >
                            {formatAmount(material.Available, material.Unit)}
                        </Box>
                    </StyledTableCell>
                </StyledTableRow>
            ))}
        </StyledTable>
    );
};
