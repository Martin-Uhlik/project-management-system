import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import axios from 'axios';
import { getBackendAddress } from '../config';
import { getUserID } from '../Auth';
import { onChatEvent, useLive } from './live';

// The chat: the conversation list (with the unread counts) for the header badge, the chat page and the project's chat
// tab. Messages come over the live connection as they are sent (onChatEvent); the list is loaded again over REST then.
// A conversation is { kind: 'user' | 'project', id }.

// GET /auth/chat: { Unread, Users: [{ User, LastMessage, Unread }], Projects: [{ Project, LastMessage, Unread }] }
export const chatOverviewAtom = atom(null);

export const chatPath = (conversation) => `${conversation.kind === 'project' ? 'projects' : 'users'}/${conversation.id}`;

// Whether a message (from the live connection) belongs to the conversation
export const inConversation = (message, conversation) => {
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
let reloadOverview = null;
// Loads the conversation list again (e.g. after the open conversation was marked read)
export const reloadChatOverview = () => reloadOverview?.();

export const useChatOverviewLoader = () => {
    const setOverview = useSetAtom(chatOverviewAtom);
    const live = useLive(`chat:${getUserID()}`, 'projects', 'users');

    useEffect(() => {
        let cancelled = false;
        let timer = null;
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
export const useChatUnread = (kind, id) => {
    const overview = useAtomValue(chatOverviewAtom);
    if (!overview) return 0;
    const list = kind === 'project' ? overview.Projects : overview.Users;
    const key = kind === 'project' ? 'Project' : 'User';
    return list.find((conversation) => conversation[key].ID === Number(id))?.Unread ?? 0;
};
