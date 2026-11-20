import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

// how long after opening a page the loaded values may still arrive in the fields
const SETTLE_MS = 1500;

// When a page opens, its fields fill in with loaded data a moment later and every label would slide up at once,
// which looks like the page shifting. For a short while after each page change the labels (and the outline gap
// they sit in) jump straight to place instead; afterwards focusing a field animates as usual. See styles.css.
export const SettleFields = () => {
    const { pathname } = useLocation();
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-fields-settling', '');
        const timer = setTimeout(() => root.removeAttribute('data-fields-settling'), SETTLE_MS);
        return () => {
            clearTimeout(timer);
            root.removeAttribute('data-fields-settling');
        };
    }, [pathname]);
    return null;
};
