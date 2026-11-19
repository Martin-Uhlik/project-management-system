import { useSetAtom } from 'jotai';
import { selectedTabAtom } from '../../state/atoms';
import React from 'react';
import { Link, Outlet } from 'react-router';

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
            <div className='sub-tabs'>
                <Link className='btn sub-tabs_button btn-primary' to='../..' relative='path'>
                    Zpět
                </Link>
                {subTabs.map((machine) => {
                    return (
                        <Link
                            key={machine.address}
                            className={'btn sub-tabs_button ' + (selectedSubTab === machine.address ? 'btn-light' : 'btn-outline-light')}
                            to={machine.address}
                            aria-current={selectedSubTab === machine.address ? 'page' : undefined}
                        >
                            {machine.name}
                        </Link>
                    );
                })}
            </div>
            <div className='content-wrap_inner'>
                <Outlet context={setSelectedSubTab} />
            </div>
        </>
    );
};
