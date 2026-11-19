import { atom } from 'jotai';
import moment from 'moment';

export const selectedTabAtom = atom(null);

export const notificationsAtom = atom([]);

export const dialogAtom = atom(null);

export const userAtom = atom(null);

export const showNavAtom = atom(false);

export const tickAtom = atom(moment());
