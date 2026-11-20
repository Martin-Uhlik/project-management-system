import { StyledTable, useSearch } from '../../ui';
import { useEffect, useState } from 'react';
import { MaterialRow } from './rows/MaterialRow';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';
import { useAtom } from 'jotai';
import { notificationsAtom } from '../../../state/atoms';
import { useLive } from '../../../state/live';

export const MaterialTable = (props) => {
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive('material');
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const [materials, setMaterials] = useState(null);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/material`), getAuthHeader())
            .then((response) => {
                setMaterials(
                    response.data.map((material) => {
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
                    }),
                );
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

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
