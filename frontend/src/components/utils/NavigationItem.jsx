import { Link } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { selectedTabAtom, showNavAtom } from '../../state/atoms';

export const NavigationItem = (props) => {
    const setShowNav = useSetAtom(showNavAtom);
    const selectedTab = useAtomValue(selectedTabAtom);
    const isActive = props.text === selectedTab;
    const Icon = props.icon;
    return (
        <Link
            to={props.to}
            className={'nav_button' + (isActive ? ' nav_button__active' : '')}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setShowNav(false)}
        >
            <Icon className='menu-icon' titleAccess={props.text} />
        </Link>
    );
};
