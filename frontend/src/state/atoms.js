import {atom} from "recoil";
import moment from "moment";


export const selectedTabAtom = atom({
    key: 'selectedTabAtom',
    default: null
});

export const notificationsAtom = atom({
    key: 'notificationsAtom',
    default: []
});

export const dialogAtom = atom({
    key: 'dialogAtom',
    default: null
});

export const userAtom = atom({
    key: 'userAtom',
    default: null
});

export const showNavAtom = atom({
    key: 'showNavAtom',
    default: false
});

export const tickAtom = atom({
    key: 'tick',
    default: moment()
});