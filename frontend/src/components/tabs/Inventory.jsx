import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useSetAtom } from 'jotai';
import { dialogAtom, selectedTabAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { MaterialTable } from '../utils/tables/MaterialTable';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { MaterialPreview } from '../inventory/MaterialPreview';
import { ReservationsTab } from '../inventory/ReservationsTab';
import { RequestsTab } from '../inventory/RequestsTab';
import { StyledAddButton, StyledBoxHeader, StyledPageHeader } from '../ui';

const tabs = [
    { label: 'Dostupný materiál', value: 'material' },
    { label: 'Rezervace', value: 'reservations' },
    { label: 'Požadavky', value: 'requests' },
];
const none = [];

// "Dostupný materiál": the stock items on the left, the chosen one on the right with an arrow to its page
const MaterialTab = () => {
    const setDialog = useSetAtom(dialogAtom);
    const { data: materials = none } = useApi('/auth/material', { topics: ['material'] });
    const [chosen, setChosen] = useState(null);
    const material = materials.find((item) => item.ID === chosen) ?? materials[0] ?? null;
    return (
        <div className='content-2-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <StyledBoxHeader
                        title='Materiál na skladě'
                        add={
                            <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                                <StyledAddButton label='Přidat materiál' onClick={() => setDialog({ type: 'AddMaterial', data: { handleCancel: () => {} } })} />
                            </RestrictedComponent>
                        }
                    />
                    <MaterialTable selectedID={material?.ID} onSelect={setChosen} />
                </div>
            </div>
            <div className='content-box'>{material ? <MaterialPreview material={material} /> : null}</div>
        </div>
    );
};

// The Sklad section: a header with the tabs Dostupný materiál, Rezervace and Požadavky (each a list with a preview of
// the chosen item); the open tab is kept in the address (?tab=reservations)
export const Inventory = () => {
    const setTab = useSetAtom(selectedTabAtom);
    useEffect(() => {
        setTab('Sklad');
    }, [setTab]);
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = tabs.some((item) => item.value === searchParams.get('tab')) ? searchParams.get('tab') : 'material';
    const selectTab = (value) => setSearchParams(value === 'material' ? {} : { tab: value }, { replace: true });

    // the numbers on the tabs (the same lists as the tabs load)
    const materials = useApi('/auth/material', { topics: ['material'] }).data;
    const reservations = useApi('/auth/material/reservations', { topics: ['material'] }).data;
    const requests = useApi('/auth/materialRequirements', { topics: ['material'] }).data;
    const totals = { material: materials?.length, reservations: reservations?.length, requests: requests?.length };

    return (
        <>
            <StyledPageHeader title='Sklad' tabs={tabs.map((item) => ({ ...item, total: totals[item.value] }))} active={tab} onSelect={selectTab} />
            <div className='content-wrap_inner'>{tab === 'reservations' ? <ReservationsTab /> : tab === 'requests' ? <RequestsTab /> : <MaterialTab />}</div>
        </>
    );
};
