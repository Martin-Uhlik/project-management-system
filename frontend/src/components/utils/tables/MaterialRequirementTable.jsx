import { StyledTable, useSearch } from '../../ui';
import { useMemo } from 'react';
import { MaterialRequirementRow } from './rows/MaterialRequirementRow';
import { useApi } from '../../../state/query';

export const MaterialRequirementTable = ({ taskID }) => {
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data } = useApi('/auth/materialRequirements', { topics: ['material'] });
    const materialRequests = useMemo(
        () => (data && taskID ? data.filter((requirement) => requirement.TargetTaskID === +taskID) : (data ?? null)),
        [data, taskID],
    );

    const search = useSearch(materialRequests, (row) => [
        row.Name,
        row.TargetUser?.FirstName,
        row.TargetUser?.LastName,
        row.AcceptedBy?.FirstName,
        row.AcceptedBy?.LastName,
    ]);

    return (
        <StyledTable
            columns={[
                { label: 'Název' },
                { label: 'Cena celkem', align: 'right' },
                { label: 'Datum potřeby', align: 'right' },
                { label: 'Autor', align: 'right' },
                { label: 'Schválil', align: 'right' },
            ]}
            search={search}
        >
            {search.results.map((row) => (
                <MaterialRequirementRow key={row.ID} row={row} />
            ))}
        </StyledTable>
    );
};
