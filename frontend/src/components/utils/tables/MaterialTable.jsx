import { StyledTable, useSearch } from '../../ui';
import { useMemo } from 'react';
import { MaterialRow } from './rows/MaterialRow';
import { useApi } from '../../../state/query';

export const MaterialTable = (props) => {
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data } = useApi('/auth/material', { topics: ['material'] });
    const materials = useMemo(
        () =>
            data?.map((material) => {
                let amount = 0;
                let reserved = 0;
                material.MaterialEvent.forEach((value) => {
                    if (value.EventType === 'ADD') {
                        amount += value.Count;
                    } else if (value.EventType === 'REMOVE') {
                        amount -= value.Count;
                    } else if (value.EventType === 'RESERVATION') {
                        reserved += value.Count;
                    }
                });
                return { material: material, count: amount, reserved: reserved };
            }) ?? null,
        [data],
    );

    const search = useSearch(materials, (mat) => mat.material.Name);

    return (
        <StyledTable
            columns={[
                { label: 'Název' },
                { label: 'Počet', align: 'right' },
                { label: 'Zarezervované', align: 'right' },
                { label: 'Dostupné', align: 'right' },
            ]}
            search={search}
        >
            {search.results.map((mat) => (
                <MaterialRow key={mat.material.ID} row={mat} taskID={props.taskID} />
            ))}
        </StyledTable>
    );
};
