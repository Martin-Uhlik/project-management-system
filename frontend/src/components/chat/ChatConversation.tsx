import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import axios from 'axios';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import dayjs from '../../dayjs';
import { getBackendAddress } from '../../config';
import { getUserID } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import { notificationsAtom } from '../../state/atoms';
import { chatPath, inConversation } from '../../state/chat';
import { onChatEvent, useLive } from '../../state/live';
import { StyledButton, StyledChatComposer, StyledChatDay, StyledChatMessage } from '../ui';
import { dayLabel, fullName, messageTime } from './chatTime';
import type { Conversation } from '../../state/chat';
import type { ChatMessage } from '../../types';

interface MessagesPage {
    Messages: ChatMessage[];
    HasMore: boolean;
    PartnerLastReadID?: number;
}

// messages joined by ID, oldest first (a message can arrive both live and in a loaded page)
const merge = (current: ChatMessage[], incoming: ChatMessage[]) => {
    const byID = new Map(current.map((message) => [message.ID, message]));
    for (const message of incoming) byID.set(message.ID, message);
    return [...byID.values()].sort((a, b) => a.ID - b.ID);
};

// how close to the bottom (px) still counts as "reading the newest", so new messages scroll into view
const NEAR_BOTTOM = 120;

// One open conversation: its messages (older ones load on request), new ones as they arrive, and the field to write.
// conversation: { kind: 'user' | 'project', id }; onRead: called after the conversation was marked read
export const ChatConversation = ({ conversation, onRead }: { conversation: Conversation; onRead?: () => void }) => {
    const me = Number(getUserID());
    const path = chatPath(conversation);
    const group = conversation.kind === 'project';
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [messages, setMessages] = useState<ChatMessage[] | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [partnerLastRead, setPartnerLastRead] = useState(0);
    const scroller = useRef<HTMLDivElement>(null);
    const composer = useRef<HTMLInputElement>(null);
    // what to do with the scroll position after the next render: 'bottom', or keep the view after older messages loaded
    const pendingScroll = useRef<'bottom' | { fromBottom: number } | null>(null);
    // changes when the live connection came back (missed messages): load the newest again
    const reconnected = useLive();

    const showError = useCallback((error: unknown) => handleAxiosError(error, [notifications, setNotifications]), [notifications, setNotifications]);

    const markRead = useCallback(
        (lastReadID?: number) => {
            axios
                .post(getBackendAddress(`/auth/chat/${path}/read`), lastReadID ? { LastReadID: lastReadID } : {})
                .then(() => onRead?.())
                .catch(() => {});
        },
        [path, onRead],
    );

    const nearBottom = () => {
        const node = scroller.current;
        return !node || node.scrollHeight - node.scrollTop - node.clientHeight < NEAR_BOTTOM;
    };

    // the newest messages (on opening, and again after the connection came back)
    useEffect(() => {
        let cancelled = false;
        axios
            .get<MessagesPage>(getBackendAddress(`/auth/chat/${path}/messages`))
            .then((response) => {
                if (cancelled) return;
                pendingScroll.current = 'bottom';
                setMessages((current) => {
                    if (current === null) setHasMore(response.data.HasMore);
                    return merge(current ?? [], response.data.Messages);
                });
                if (response.data.PartnerLastReadID) setPartnerLastRead((value) => Math.max(value, response.data.PartnerLastReadID!));
                markRead();
            })
            .catch((error) => {
                if (cancelled) return;
                setMessages([]);
                showError(error);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, reconnected]);

    // new messages of this conversation as they are sent, and the partner reading them
    useEffect(
        () =>
            onChatEvent((data) => {
                if (data?.Read) {
                    if (!group && data.Read.ReaderID === conversation.id) setPartnerLastRead((value) => Math.max(value, data.Read.LastReadID));
                    return;
                }
                if (!inConversation(data, conversation)) return;
                if (data.SenderID === me || nearBottom()) pendingScroll.current = 'bottom';
                setMessages((current) => merge(current ?? [], [data]));
                if (data.SenderID !== me && document.visibilityState === 'visible') markRead(data.ID);
            }),
        [conversation, group, me, markRead],
    );

    // messages that came while the tab was in the background count as read when the user comes back
    useEffect(() => {
        const onVisible = () => document.visibilityState === 'visible' && markRead();
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [markRead]);

    useLayoutEffect(() => {
        const node = scroller.current;
        const pending = pendingScroll.current;
        pendingScroll.current = null;
        if (!node || !pending) return;
        if (pending === 'bottom') node.scrollTop = node.scrollHeight;
        else node.scrollTop = node.scrollHeight - pending.fromBottom;
    }, [messages]);

    useEffect(() => {
        composer.current?.focus();
    }, []);

    const loadOlder = () => {
        if (!messages?.length) return;
        setLoadingOlder(true);
        axios
            .get<MessagesPage>(getBackendAddress(`/auth/chat/${path}/messages`), { params: { before: messages[0].ID } })
            .then((response) => {
                const node = scroller.current;
                // keep the messages on screen where they are
                pendingScroll.current = { fromBottom: node ? node.scrollHeight - node.scrollTop : 0 };
                setMessages((current) => merge(current ?? [], response.data.Messages));
                setHasMore(response.data.HasMore);
            })
            .catch(showError)
            .finally(() => setLoadingOlder(false));
    };

    const send = (Text: string) =>
        axios
            .post<ChatMessage>(getBackendAddress(`/auth/chat/${path}/messages`), { Text })
            .then((response) => {
                pendingScroll.current = 'bottom';
                setMessages((current) => merge(current ?? [], [response.data]));
                onRead?.();
            })
            .catch((error) => {
                showError(error);
                // the composer keeps the text
                throw error;
            });

    // the user's last message, under which "Přečteno" shows once the partner has read it
    const lastOwn = messages ? [...messages].reverse().find((message) => message.SenderID === me) : null;
    const seenNote = !group && lastOwn && partnerLastRead >= lastOwn.ID && messages!.at(-1)?.ID === lastOwn.ID ? 'Přečteno' : null;

    return (
        <>
            <Box ref={scroller} sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }} role='log' aria-live='polite' aria-label='Zprávy'>
                {messages === null ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size='2rem' aria-label='Načítání' />
                    </Box>
                ) : messages.length === 0 ? (
                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', p: 4 }}>
                        {group ? 'Zatím žádné zprávy. Napište týmu první.' : 'Zatím žádné zprávy. Napište první.'}
                    </Typography>
                ) : (
                    <>
                        {hasMore ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                <StyledButton variant='outlined' color='secondary' size='small' onClick={loadOlder} disabled={loadingOlder}>
                                    {loadingOlder ? 'Načítání…' : 'Načíst starší zprávy'}
                                </StyledButton>
                            </Box>
                        ) : null}
                        {messages.map((message, index) => {
                            const previous = messages[index - 1];
                            const newDay = !previous || !dayjs(previous.SentAt).isSame(message.SentAt, 'day');
                            const own = message.SenderID === me;
                            // in a group chat, the name above the first of someone's messages in a row
                            const author = group && !own && (newDay || previous.SenderID !== message.SenderID) ? fullName(message.Sender) : null;
                            return (
                                <Fragment key={message.ID}>
                                    {newDay ? <StyledChatDay>{dayLabel(message.SentAt)}</StyledChatDay> : null}
                                    <StyledChatMessage
                                        own={own}
                                        author={author}
                                        time={messageTime(message.SentAt)}
                                        note={message === lastOwn ? seenNote : null}
                                    >
                                        {message.Text}
                                    </StyledChatMessage>
                                </Fragment>
                            );
                        })}
                    </>
                )}
            </Box>
            <StyledChatComposer onSend={send} inputRef={composer} />
        </>
    );
};
