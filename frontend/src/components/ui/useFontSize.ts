import { useSyncExternalStore } from 'react';

// The text size of the whole app. Everything is sized in rem, so changing the page's base font size scales the
// text, the controls and the spacing together (like browser zoom, but only for this app). The choice is kept in
// this browser (localStorage 'font-size'); index.html applies it before the app loads.
export const fontSizes = { small: '87.5%', medium: '100%', large: '112.5%' };
export type FontSize = keyof typeof fontSizes;
const STORAGE_KEY = 'font-size';

const read = (): FontSize => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored && stored in fontSizes ? (stored as FontSize) : 'medium';
    } catch {
        return 'medium';
    }
};

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const setFontSize = (size: FontSize) => {
    try {
        localStorage.setItem(STORAGE_KEY, size);
    } catch {
        // private mode / storage blocked: the size still applies until the page is reloaded
    }
    document.documentElement.style.fontSize = fontSizes[size];
    current = size;
    listeners.forEach((listener) => listener());
};

let current = read();

// fontSize: 'small', 'medium' or 'large'
export const useFontSize = () => {
    const fontSize = useSyncExternalStore(subscribe, () => current);
    return { fontSize, setFontSize };
};
