import React from 'react';
import { NavigationItem } from './utils/NavigationItem';
import { useAtom } from 'jotai';
import { showNavAtom } from '../state/atoms';

function Navigation() {
    const menuItems = [
        { key: 0, to: '/auth/overview', icon: '/icons/home.svg', text: 'Přehled' },
        { key: 2, to: '/auth/projects', icon: '/icons/folder-multiple.svg', text: 'Projekty' },
        { key: 3, to: '/auth/inventory', icon: '/icons/package-variant.svg', text: 'Sklad' },
        { key: 4, to: '/auth/machines', icon: '/icons/robot-industrial.svg', text: 'Stroje' },
        { key: 5, to: '/auth/users', icon: '/icons/account-multiple.svg', text: 'Uživatelé' },
        { key: 6, to: '/auth/settings', icon: '/icons/cog.svg', text: 'Nastavení' },
    ];
    const createItem = (item) => {
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
        const handleKeyDown = (event) => {
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
                <div className='d-flex flex-column justify-content-center align-items-center flex-grow-1'>
                    <NavigationItem key={menuItems[0].key} to={menuItems[0].to} icon={menuItems[0].icon} text={menuItems[0].text} />
                    {menuItems.slice(1, -1).map(createItem)}
                </div>
                {createItem(menuItems[menuItems.length - 1])}
            </nav>
        </>
    );
}

export default Navigation;
