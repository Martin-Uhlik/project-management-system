import { useSetAtom } from 'jotai';
import { selectedTabAtom } from '../../state/atoms';
import React from 'react';
import { Link, Outlet } from 'react-router';
import { StyledSubTab, StyledSubTabs } from '../ui';

const subTabs = [
    { name: 'Přehled', address: 'overview' },
    { name: 'Vstupní soubory', address: 'input-files' },
    { name: 'Výstupní soubory', address: 'output-files' },
    { name: 'Stroje', address: 'machines' },
    { name: 'Materiál', address: 'material' },
];

export const ProjectTask = () => {
    const setTab = useSetAtom(selectedTabAtom);
    React.useEffect(() => {
        setTab('Projekty');
    });
    const [selectedSubTab, setSelectedSubTab] = React.useState(null);

    return (
        <>
            <StyledSubTabs>
                <StyledSubTab back component={Link} to='../..' relative='path'>
                    Zpět
                </StyledSubTab>
                {subTabs.map((machine) => {
                    return (
                        <StyledSubTab key={machine.address} component={Link} to={machine.address} active={selectedSubTab === machine.address}>
                            {machine.name}
                        </StyledSubTab>
                    );
                })}
            </StyledSubTabs>
            <div className='content-wrap_inner'>
                <Outlet context={setSelectedSubTab} />
            </div>
        </>
    );
};
