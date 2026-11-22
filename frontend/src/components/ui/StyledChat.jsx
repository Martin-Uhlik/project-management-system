import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { AccountGroupIcon, ArrowLeftIcon, ChatIcon, SendIcon } from './icons';

// The chat's building blocks: the header button with the unread badge, the page layout, a conversation in the list, a
// message and the field to write one. Messages and the avatars are rounded, the message field like every other field (Marty's choice
// for the chat); colours from the theme, so they work in light and dark mode.

const initials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');

// a small red count, a pill like the other badges
const badgeSx = { '& .MuiBadge-badge': { borderRadius: '999px', fontWeight: 'bold', minWidth: '1.25rem', height: '1.25rem', px: 0.5 } };

// The chat icon in the top bar, with how many messages are unread. onClick opens the panel.
export const StyledChatButton = ({ unread = 0, onClick, active }) => {
    const label = unread ? `Chat, nepřečtené zprávy: ${unread}` : 'Chat';
    return (
        <Tooltip title='Chat'>
            <IconButton
                onClick={onClick}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                sx={{
                    color: 'var(--icons-primary)',
                    // rounded like the user menu next to it
                    borderRadius: '0.5rem',
                    width: { xs: '2.25rem', md: '2.75rem' },
                    height: { xs: '2.25rem', md: '2.75rem' },
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
                }}
            >
                <Badge badgeContent={unread} max={99} color='primary' sx={badgeSx}>
                    <ChatIcon sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }} />
                </Badge>
            </IconButton>
        </Tooltip>
    );
};

// The chat page laid out like the other pages: two boxes on the page background, the conversation list on the left
// and the open conversation in a much wider box on the right. On a phone only one of them shows: the list, or the
// conversation once one is open (showConversation).
const chatBoxSx = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    bgcolor: 'var(--content-box-background)',
    boxShadow: 'var(--shadow-small)',
    overflow: 'hidden',
};
export const StyledChatLayout = ({ list, conversation, showConversation }) => (
    <Box
        sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            gap: { xs: '1rem', md: '2rem' },
            p: { xs: '1rem', md: '2rem' },
            boxShadow: 'var(--shadow-small-inset)',
        }}
    >
        <Box
            component='aside'
            aria-label='Konverzace'
            sx={{
                ...chatBoxSx,
                width: { xs: '100%', md: '20rem', lg: '22rem' },
                flexShrink: 0,
                display: { xs: showConversation ? 'none' : 'flex', md: 'flex' },
            }}
        >
            {list}
        </Box>
        <Box component='section' sx={{ ...chatBoxSx, flex: 1, display: { xs: showConversation ? 'flex' : 'none', md: 'flex' } }}>
            {conversation}
        </Box>
    </Box>
);

// The bar over an open conversation: an avatar, its name and a quiet line under it. onBack: an arrow back to the list
// (only on a phone, where the list is hidden)
export const StyledChatHeader = ({ name, group, subtitle, onBack }) => (
    <Stack direction='row' sx={{ alignItems: 'center', gap: 1.5, px: 2, minHeight: '4rem', flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
        {onBack ? (
            <IconButton onClick={onBack} aria-label='Zpět na seznam konverzací' sx={{ borderRadius: '0.5rem', display: { md: 'none' }, ml: -1 }}>
                <ArrowLeftIcon />
            </IconButton>
        ) : null}
        <ChatAvatar name={name} group={group} />
        <Box sx={{ minWidth: 0 }}>
            <Typography component='h1' sx={{ fontWeight: 'bold', fontSize: '1.1rem', m: 0 }} noWrap>
                {name}
            </Typography>
            {subtitle ? (
                <Typography variant='body2' sx={{ color: 'text.secondary' }} noWrap>
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
    </Stack>
);

// Shown in place of a conversation when none is open
export const StyledChatEmpty = ({ children }) => (
    <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1.5, color: 'text.secondary', p: 4, textAlign: 'center' }}>
        <ChatIcon sx={{ fontSize: '4rem', opacity: 0.4 }} />
        <Typography>{children}</Typography>
    </Stack>
);

const ChatAvatar = ({ name, group, muted }) => (
    <Avatar
        sx={{
            width: 40,
            height: 40,
            fontSize: '0.95rem',
            fontWeight: 'bold',
            color: '#ffffff',
            bgcolor: muted ? 'action.disabled' : group ? 'dark.main' : 'primary.main',
        }}
    >
        {group ? <AccountGroupIcon /> : initials(name)}
    </Avatar>
);

// A heading over a group of conversations in the list ('Projekty', 'Lidé')
export const StyledChatListHeading = ({ children }) => (
    <Typography
        variant='overline'
        component='h3'
        sx={{ display: 'block', px: 2, pt: 2, pb: 0.5, color: 'text.secondary', fontWeight: 'bold', lineHeight: 1.5 }}
    >
        {children}
    </Typography>
);

// One conversation in the list: a round avatar (initials, or a group icon for a project), the name, the last message
// and its time, and how many messages are unread (bold while some are). muted: a disabled user or a finished project.
export const StyledChatConversation = ({ name, group, preview, time, unread = 0, muted, selected, onClick }) => (
    <Box
        component='button'
        type='button'
        onClick={onClick}
        aria-current={selected ? 'true' : undefined}
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: '100%',
            px: 2,
            py: 1.25,
            border: 0,
            borderRadius: 0,
            background: 'none',
            color: 'text.primary',
            font: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
            backgroundColor: selected ? 'action.selected' : undefined,
            // the open conversation: a red line on the left
            boxShadow: selected ? 'inset 3px 0 0 var(--mui-palette-primary-main)' : 'none',
            '&:hover, &:focus-visible': { backgroundColor: selected ? 'action.selected' : 'action.hover' },
        }}
    >
        <ChatAvatar name={name} group={group} muted={muted} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction='row' sx={{ alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ fontWeight: unread ? 'bold' : 500, flex: 1, minWidth: 0, color: muted ? 'text.secondary' : undefined }} noWrap>
                    {name}
                </Typography>
                {time ? (
                    <Typography
                        variant='caption'
                        sx={{ color: unread ? 'primary.main' : 'text.secondary', fontWeight: unread ? 'bold' : undefined, flexShrink: 0 }}
                    >
                        {time}
                    </Typography>
                ) : null}
            </Stack>
            <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
                <Typography variant='body2' sx={{ color: unread ? 'text.primary' : 'text.secondary', flex: 1, minWidth: 0 }} noWrap>
                    {preview}
                </Typography>
                {unread ? (
                    <Box
                        component='span'
                        aria-label={`Nepřečtené: ${unread}`}
                        sx={{
                            flexShrink: 0,
                            minWidth: '1.25rem',
                            px: 0.5,
                            lineHeight: '1.25rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            borderRadius: '999px',
                            bgcolor: 'primary.main',
                            color: '#ffffff',
                        }}
                    >
                        {unread > 99 ? '99+' : unread}
                    </Box>
                ) : null}
            </Stack>
        </Box>
    </Box>
);

// A line between the days of a conversation ('Dnes', 'Včera', 'pondělí 16. listopadu')
export const StyledChatDay = ({ children }) => (
    <Typography variant='caption' sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', fontWeight: 'bold', my: 1.5 }}>
        {children}
    </Typography>
);

// One message: the user's own on the right in red, others' on the left in grey. author: the sender's name, shown above
// the first of their messages in a row in a group chat; note: a quiet line under it (e.g. 'Přečteno')
export const StyledChatMessage = ({ own, author, time, note, children }) => (
    <Stack sx={{ alignItems: own ? 'flex-end' : 'flex-start', mt: author ? 1.25 : 0.375 }}>
        {author ? (
            <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 'bold', px: 0.25, mb: 0.25 }}>
                {author}
            </Typography>
        ) : null}
        <Tooltip title={time ?? ''} placement={own ? 'left' : 'right'}>
            <Box
                sx={{
                    maxWidth: 'min(85%, 40rem)',
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '1rem',
                    // the corner towards the sender is less rounded, like a speech bubble
                    ...(own ? { borderBottomRightRadius: '0.25rem' } : { borderBottomLeftRadius: '0.25rem' }),
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    ...(own ? { bgcolor: 'primary.main', color: '#ffffff' } : { bgcolor: 'action.selected', color: 'text.primary' }),
                }}
            >
                {children}
            </Box>
        </Tooltip>
        {note ? (
            <Typography variant='caption' sx={{ color: 'text.secondary', px: 0.25, mt: 0.25 }}>
                {note}
            </Typography>
        ) : null}
    </Stack>
);

// The field to write a message: Enter sends, Shift+Enter starts a new line. onSend(text) returns a promise; the
// field empties once it succeeded.
export const StyledChatComposer = ({ onSend, maxLength = 4000, placeholder = 'Napište zprávu…', inputRef }) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const empty = !text.trim();

    const send = () => {
        if (empty || sending) return;
        setSending(true);
        Promise.resolve(onSend(text.trim()))
            .then(() => setText(''))
            .catch(() => {})
            .finally(() => setSending(false));
    };

    return (
        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
            <TextField
                multiline
                maxRows={6}
                value={text}
                inputRef={inputRef}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        send();
                    }
                }}
                placeholder={placeholder}
                sx={{ '& .MuiOutlinedInput-root': { pr: 0.5 } }}
                slotProps={{
                    htmlInput: { maxLength, 'aria-label': 'Zpráva' },
                    input: {
                        endAdornment: (
                            <InputAdornment position='end' sx={{ alignSelf: 'flex-end', mb: 1.5 }}>
                                <IconButton onClick={send} disabled={empty || sending} aria-label='Odeslat' color='primary'>
                                    <SendIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />
        </Box>
    );
};
