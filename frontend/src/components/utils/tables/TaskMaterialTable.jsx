import { StyledTable, useSearch } from '../../ui';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';
import { useAtom } from 'jotai';
import { notificationsAtom } from '../../../state/atoms';
import { useLive } from '../../../state/live';
import { useParams } from 'react-router';
import { ReservedMaterialRow } from './rows/ReservedMaterialRow';

export const TaskMaterialTable = () => {
    // reloaded when someone changes this data (live updates) or after a change made here
    const tick = useLive('material');
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const [materials, setMaterials] = useState(null);

    const taskID = useParams().task;

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/tasks/${taskID}/material`), getAuthHeader())
            .then((response) => {
                setMaterials(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const search = useSearch(materials, (mat) => mat.Material?.Name);

    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Počet', align: 'right' }]} search={search}>
            {search.results.map((mat) => (
                <ReservedMaterialRow key={mat.ID} row={mat} />
            ))}
        </StyledTable>
    );
};
