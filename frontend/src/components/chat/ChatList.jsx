import { useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { getUserID } from '../../Auth';
import { StyledChatConversation, StyledChatListHeading, StyledSearchInput } from '../ui';
import { listTime } from './chatTime';

// conversations with the newest message first, then the rest in their order (by name)
const byLastMessage = (a, b) => (b.LastMessage?.ID ?? 0) - (a.LastMessage?.ID ?? 0);

const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// "Vy: …" for the user's own last message; in a group chat the sender's first name
const preview = (message, group) => {
    if (!message) return null;
    if (message.SenderID === Number(getUserID())) return `Vy: ${message.Text}`;
    return group && message.Sender ? `${message.Sender.FirstName}: ${message.Text}` : message.Text;
};

// The conversation list: the user's project chats, then everyone they can write to
// selected: the open conversation, highlighted
export const ChatList = ({ overview, selected, onOpen }) => {
    const [search, setSearch] = useState('');

    if (!overview) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size='2rem' aria-label='Načítání' />
            </Box>
        );
    }

    const query = normalize(search.trim());
    const matches = (...texts) => !query || texts.some((text) => text && normalize(text).includes(query));
    const projects = overview.Projects.filter((item) => matches(item.Project.Name)).sort(byLastMessage);
    const users = overview.Users.filter((item) => matches(`${item.User.FirstName} ${item.User.LastName}`, item.User.UserName, item.User.Position)).sort(
        byLastMessage,
    );

    return (
        <>
            <Box sx={{ p: 1.5, pb: 0.5, flexShrink: 0 }}>
                <StyledSearchInput value={search} onChange={setSearch} placeholder='Hledat lidi a projekty…' />
            </Box>
            <Box sx={{ overflowY: 'auto', flex: 1, pb: 2 }}>
                {projects.length ? (
                    <section aria-label='Projekty'>
                        <StyledChatListHeading>Projekty</StyledChatListHeading>
                        {projects.map(({ Project, LastMessage, Unread }) => (
                            <StyledChatConversation
                                key={`project-${Project.ID}`}
                                group
                                name={Project.Name}
                                preview={preview(LastMessage, true) ?? 'Zatím žádné zprávy'}
                                time={LastMessage ? listTime(LastMessage.SentAt) : null}
                                unread={Unread}
                                muted={Project.Finished}
                                selected={selected?.kind === 'project' && selected.id === Project.ID}
                                onClick={() => onOpen({ kind: 'project', id: Project.ID })}
                            />
                        ))}
                    </section>
                ) : null}
                {users.length ? (
                    <section aria-label='Lidé'>
                        <StyledChatListHeading>Lidé</StyledChatListHeading>
                        {users.map(({ User, LastMessage, Unread }) => (
                            <StyledChatConversation
                                key={`user-${User.ID}`}
                                name={`${User.FirstName} ${User.LastName}`}
                                preview={preview(LastMessage, false) ?? User.Position ?? ''}
                                time={LastMessage ? listTime(LastMessage.SentAt) : null}
                                unread={Unread}
                                muted={!User.Enabled}
                                selected={selected?.kind === 'user' && selected.id === User.ID}
                                onClick={() => onOpen({ kind: 'user', id: User.ID })}
                            />
                        ))}
                    </section>
                ) : null}
                {!projects.length && !users.length ? (
                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', p: 4 }}>{query ? 'Nic nenalezeno.' : 'Zatím tu nikdo není.'}</Typography>
                ) : null}
            </Box>
        </>
    );
};
