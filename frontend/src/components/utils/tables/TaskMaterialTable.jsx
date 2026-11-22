import { StyledTable, useSearch } from '../../ui';
import { useApi } from '../../../state/query';
import { useParams } from 'react-router';
import { ReservedMaterialRow } from './rows/ReservedMaterialRow';

export const TaskMaterialTable = () => {
    // reloaded when someone changes this data (live updates) or after a change made here
    const taskID = useParams().task;
    const materials = useApi(`/auth/tasks/${taskID}/material`, { topics: ['material'] }).data ?? null;

    const search = useSearch(materials, (mat) => mat.Material?.Name);

    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Počet', align: 'right' }]} search={search}>
            {search.results.map((mat) => (
                <ReservedMaterialRow key={mat.ID} row={mat} />
            ))}
        </StyledTable>
    );
};
