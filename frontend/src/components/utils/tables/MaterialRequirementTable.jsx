import { StyledTable, useSearch } from '../../ui';
import { useEffect, useState } from 'react';
import { MaterialRequirementRow } from './rows/MaterialRequirementRow';
import { useAtom, useAtomValue } from 'jotai';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import { handleAxiosError } from '../../../errorHandler';

export const MaterialRequirementTable = ({ taskID }) => {
    const tick = useAtomValue(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const [materialRequests, setMaterialRequests] = useState(null);

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/materialRequirements`), getAuthHeader())
            .then((response) => {
                if (taskID) {
                    setMaterialRequests(response.data.filter((requirement) => requirement.TargetTaskID === +taskID));
                } else {
                    setMaterialRequests(response.data);
                }
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

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
