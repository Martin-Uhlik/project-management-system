import { useNavigate, useParams } from 'react-router';
import { StyledTable, StyledTableCell, StyledTableRow, useSearch } from '../../ui';
import { useApi } from '../../../state/query';
import { formatAmount } from '../../inventory/format';

// The material of the open task: per item, how many are still reserved for it and how many were taken out for it;
// a row opens the item's page
export const TaskMaterialTable = () => {
    const navigate = useNavigate();
    const taskID = useParams().task;
    // reloaded when someone changes this data (live updates) or after a change made here
    const materials = useApi(`/auth/tasks/${taskID}/material`, { topics: ['material'] }).data ?? null;
    const search = useSearch(materials, (row) => row.Material.Name);

    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Rezervováno', align: 'right' }, { label: 'Vydáno', align: 'right' }]} search={search}>
            {search.results.map((row) => (
                <StyledTableRow key={row.Material.ID} onClick={() => navigate(`/auth/inventory/${row.Material.ID}`)} arrowLabel='Přejít na materiál'>
                    <StyledTableCell>{row.Material.Name}</StyledTableCell>
                    <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        {formatAmount(row.Reserved, row.Material.Unit)}
                    </StyledTableCell>
                    <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        {formatAmount(row.Taken, row.Material.Unit)}
                    </StyledTableCell>
                </StyledTableRow>
            ))}
        </StyledTable>
    );
};
