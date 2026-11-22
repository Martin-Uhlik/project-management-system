import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import axios from 'axios';
import { getBackendAddress } from '../config';
import { getUserID } from '../Auth';
import { onChatEvent, useLive } from './live';
import type { ChatMessage, PublicUser, Project } from '../types';

export interface Conversation {
    kind: 'user' | 'project';
    id: number;
}

export interface ChatOverviewEntry {
    LastMessage: ChatMessage | null;
    Unread: number;
}

export interface ChatOverview {
    Unread: number;
    Users: (ChatOverviewEntry & { User: PublicUser & { Enabled?: boolean } })[];
    Projects: (ChatOverviewEntry & { Project: Pick<Project, 'ID' | 'Name' | 'Finished'> })[];
}

// The chat: the conversation list (with the unread counts) for the header badge, the chat page and the project's chat
// tab. Messages come over the live connection as they are sent (onChatEvent); the list is loaded again over REST then.
// A conversation is { kind: 'user' | 'project', id }.

// GET /auth/chat: { Unread, Users: [{ User, LastMessage, Unread }], Projects: [{ Project, LastMessage, Unread }] }
export const chatOverviewAtom = atom<ChatOverview | null>(null);

export const chatPath = (conversation: Conversation) => `${conversation.kind === 'project' ? 'projects' : 'users'}/${conversation.id}`;

// Whether a message (from the live connection) belongs to the conversation
export const inConversation = (message: Partial<ChatMessage> | null | undefined, conversation: Conversation | null | undefined) => {
    if (!conversation || !message?.ID) return false;
    if (conversation.kind === 'project') return message.ProjectID === conversation.id;
    const me = Number(getUserID());
    return (
        message.ProjectID === null &&
        ((message.SenderID === conversation.id && message.RecipientID === me) || (message.SenderID === me && message.RecipientID === conversation.id))
    );
};

// Keeps chatOverviewAtom loaded (rendered once, by the header's chat button): on start, on every chat message, when
// the user read something in another tab, and when projects or users change (someone joined a project)
let reloadOverview: (() => void) | null = null;
// Loads the conversation list again (e.g. after the open conversation was marked read)
export const reloadChatOverview = () => reloadOverview?.();

export const useChatOverviewLoader = () => {
    const setOverview = useSetAtom(chatOverviewAtom);
    const live = useLive(`chat:${getUserID()}`, 'projects', 'users');

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const load = () =>
            axios
                .get(getBackendAddress('/auth/chat'))
                .then((response) => !cancelled && setOverview(response.data))
                .catch(() => {});
        // several messages at once load the list once
        const reload = () => {
            clearTimeout(timer);
            timer = setTimeout(load, 150);
        };
        reloadOverview = reload;
        load();
        const stop = onChatEvent(reload);
        return () => {
            cancelled = true;
            if (reloadOverview === reload) reloadOverview = null;
            clearTimeout(timer);
            stop();
        };
    }, [live, setOverview]);
};

// The unread count of one conversation (e.g. the project's chat tab)
export const useChatUnread = (kind: Conversation['kind'], id: number | string | undefined) => {
    const overview = useAtomValue(chatOverviewAtom);
    if (!overview) return 0;
    const list =
        kind === 'project'
            ? overview.Projects.map((entry) => ({ ID: entry.Project.ID, Unread: entry.Unread }))
            : overview.Users.map((entry) => ({ ID: entry.User.ID, Unread: entry.Unread }));
    return list.find((conversation) => conversation.ID === Number(id))?.Unread ?? 0;
};
