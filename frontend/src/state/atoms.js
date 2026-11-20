import { atom } from 'jotai';
import dayjs from '../dayjs';

export const selectedTabAtom = atom(null);

export const notificationsAtom = atom([]);

export const dialogAtom = atom(null);

export const userAtom = atom(null);

export const showNavAtom = atom(false);

export const tickAtom = atom(dayjs());
