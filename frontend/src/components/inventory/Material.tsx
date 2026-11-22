import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useSetAtom } from 'jotai';
import { selectedTabAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { CartIcon, InventoryIcon, StyledPageHeader, StyledPageHeaderFact } from '../ui';
import { formatAmount, formatPrice, stockState, stockTone } from './format';
import { MaterialOverview } from './MaterialOverview';
import { MaterialHistory, MaterialRequests, MaterialReservations, MaterialSettings } from './MaterialTabs';
import type { MaterialDetail } from '../../types';

const tabs = [
    { label: 'Přehled', value: 'overview' },
    { label: 'Historie', value: 'history' },
    { label: 'Rezervace', value: 'reservations' },
    { label: 'Požadavky', value: 'requests' },
    { label: 'Nastavení', value: 'settings' },
] as const;

type TabValue = (typeof tabs)[number]['value'];

// A stock item's page: its header (in stock, available, price) with the tabs Přehled (numbers, chart, movements),
// Historie, Rezervace, Požadavky and Nastavení; the open tab is kept in the address (?tab=history)
export const Material = () => {
    const setTab = useSetAtom(selectedTabAtom);
    useEffect(() => {
        setTab('Sklad');
    }, [setTab]);
    const materialID = useParams().material;
    // reloaded when someone changes this data (live updates) or after a change made here
    const material = useApi<MaterialDetail>(`/auth/material/${materialID}`, { topics: ['material'] }).data ?? null;

    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (tabs.find((item) => item.value === searchParams.get('tab'))?.value ?? 'overview') as TabValue;
    const selectTab = (value: TabValue) => setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true });
    const totals: Partial<Record<TabValue, number>> = {
        history: material?.Events.length,
        reservations: material?.Reservations.length,
        requests: material?.Requests.length,
    };
    const state = material ? stockState(material) : 'ok';

    return (
        <>
            <StyledPageHeader
                breadcrumbs={[{ label: 'Sklad', to: '/auth/inventory' }]}
                back={{ to: '/auth/inventory', label: 'Zpět na sklad' }}
                title={material?.Name ?? null}
                facts={
                    material ? (
                        <>
                            <StyledPageHeaderFact icon={InventoryIcon} label='Na skladě'>
                                {formatAmount(material.Count, material.Unit)}
                            </StyledPageHeaderFact>
                            <StyledPageHeaderFact icon={InventoryIcon} label='Dostupné' color={stockTone[state]}>
                                {formatAmount(material.Available, material.Unit)}
                            </StyledPageHeaderFact>
                            {material.Price ? (
                                <StyledPageHeaderFact icon={CartIcon} label={`Cena za ${material.Unit || 'ks'}`}>
                                    {formatPrice(material.Price)}
                                </StyledPageHeaderFact>
                            ) : null}
                        </>
                    ) : null
                }
                tabs={tabs.map((item) => ({ ...item, total: totals[item.value] }))}
                active={tab}
                onSelect={selectTab}
            />
            <div className='content-wrap_inner'>
                {!material ? null : tab === 'history' ? (
                    <MaterialHistory material={material} />
                ) : tab === 'reservations' ? (
                    <MaterialReservations material={material} />
                ) : tab === 'requests' ? (
                    <MaterialRequests material={material} />
                ) : tab === 'settings' ? (
                    <MaterialSettings material={material} />
                ) : (
                    <MaterialOverview material={material} />
                )}
            </div>
        </>
    );
};
