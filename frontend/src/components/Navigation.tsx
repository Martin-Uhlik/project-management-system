import React from 'react';
import { NavigationItem } from './utils/NavigationItem';
import { useAtom, useAtomValue } from 'jotai';
import { showNavAtom, userAtom } from '../state/atoms';
import { HomeIcon, InventoryIcon, MachinesIcon, PeopleIcon, ProjectsIcon, StatsIcon } from './ui';

function Navigation() {
    const user = useAtomValue(userAtom);
    const menuItems = [
        { key: 0, to: '/auth/overview', icon: HomeIcon, text: 'Přehled' },
        { key: 2, to: '/auth/projects', icon: ProjectsIcon, text: 'Projekty' },
        { key: 3, to: '/auth/inventory', icon: InventoryIcon, text: 'Sklad' },
        { key: 4, to: '/auth/machines', icon: MachinesIcon, text: 'Stroje' },
        { key: 7, to: '/auth/stats', icon: StatsIcon, text: 'Statistiky' },
        // managing the workers' accounts: admins only (the user's own settings are in the user menu at the top)
        ...(user?.UserType === 'ADMIN' ? [{ key: 5, to: '/auth/users', icon: PeopleIcon, text: 'Pracovníci' }] : []),
    ];
    const createItem = (item: (typeof menuItems)[number]) => {
        return (
            <div key={item.key}>
                <hr className='nav_spacer' />
                <NavigationItem to={item.to} icon={item.icon} text={item.text} />
            </div>
        );
    };
    const [showNav, setShowNav] = useAtom(showNavAtom);

    // the opened menu (small screens) closes with Escape too, not just by clicking the dimmed background
    React.useEffect(() => {
        if (!showNav) return undefined;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setShowNav(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showNav, setShowNav]);

    return (
        <>
            {showNav && (
                <button
                    type='button'
                    className='nav__background'
                    tabIndex={-1}
                    aria-label='Zavřít menu'
                    onClick={() => {
                        setShowNav(false);
                    }}
                ></button>
            )}
            <nav id='main-navigation' aria-label='Hlavní menu' className={'nav' + (showNav ? ' nav__visible' : '')}>
                <div className='nav_items'>
                    <NavigationItem key={menuItems[0].key} to={menuItems[0].to} icon={menuItems[0].icon} text={menuItems[0].text} />
                    {menuItems.slice(1).map(createItem)}
                </div>
            </nav>
        </>
    );
}

export default Navigation;
