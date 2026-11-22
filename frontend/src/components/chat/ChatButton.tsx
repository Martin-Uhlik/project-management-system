import { useLocation, useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';
import { chatOverviewAtom, useChatOverviewLoader } from '../../state/chat';
import { StyledChatButton } from '../ui';

// The chat icon in the top bar with the unread count; opens the chat page. It also keeps the conversation list
// (chatOverviewAtom) loaded for the whole app.
export const ChatButton = () => {
    useChatOverviewLoader();
    const overview = useAtomValue(chatOverviewAtom);
    const navigate = useNavigate();
    const active = useLocation().pathname.startsWith('/auth/chat');
    return <StyledChatButton unread={overview?.Unread ?? 0} active={active} onClick={() => navigate('/auth/chat')} />;
};
