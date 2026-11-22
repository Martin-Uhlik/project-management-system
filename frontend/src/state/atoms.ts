import { atom, useAtom } from 'jotai';
import dayjs from '../dayjs';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import type { NotificationItem, User } from '../types';

export const selectedTabAtom = atom<string | null>(null);

export const notificationsAtom = atom<NotificationItem[]>([]);

// the open dialog (components/Dialogs): its kind and what it needs
export interface DialogState {
    type: string;
    data?: unknown;
    title?: ReactNode;
    [key: string]: unknown;
}
export const dialogAtom = atom<DialogState | null>(null);

// The open dialog inside a dialog component (Dialogs shows it only while it's open), with what it was opened with
export const useDialog = <T>() => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    return [dialog as DialogState & { data: T }, setDialog] as const;
};

export const userAtom = atom<User | null>(null);

export const showNavAtom = atom(false);

export const tickAtom = atom<Dayjs>(dayjs());
