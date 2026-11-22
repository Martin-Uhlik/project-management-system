import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { selectedTabAtom } from '../../state/atoms';
import { chatOverviewAtom, reloadChatOverview, type Conversation } from '../../state/chat';
import { StyledChatEmpty, StyledChatHeader, StyledChatLayout } from '../ui';
import { ChatList } from './ChatList';
import { ChatConversation } from './ChatConversation';
import { fullName } from './chatTime';

// The chat page (/auth/chat), like a messenger: every conversation on the left, the open one on the right. The open
// conversation lives in the address (?user=12 or ?project=3), so it survives a reload and can be linked to.
export const ChatPage = () => {
    const setTab = useSetAtom(selectedTabAtom);
    useEffect(() => setTab(null), [setTab]);

    const overview = useAtomValue(chatOverviewAtom);
    const [searchParams, setSearchParams] = useSearchParams();
    const userID = Number(searchParams.get('user'));
    const projectID = Number(searchParams.get('project'));
    const conversation: Conversation | null = projectID > 0 ? { kind: 'project', id: projectID } : userID > 0 ? { kind: 'user', id: userID } : null;

    const open = (next: Conversation | null) => setSearchParams(next ? { [next.kind]: String(next.id) } : {});

    let header: { name: string; subtitle?: string | null; group?: boolean } = { name: '' };
    if (conversation?.kind === 'user') {
        const user = overview?.Users.find((item) => item.User.ID === conversation.id)?.User;
        header = {
            name: user ? fullName(user) : '…',
            subtitle: user ? [user.Position, user.Enabled ? null : 'deaktivovaný účet'].filter(Boolean).join(' · ') : null,
        };
    } else if (conversation?.kind === 'project') {
        const project = overview?.Projects.find((item) => item.Project.ID === conversation.id)?.Project;
        header = { name: project?.Name ?? 'Projekt', subtitle: 'Chat projektu', group: true };
    }

    return (
        <StyledChatLayout
            showConversation={Boolean(conversation)}
            list={<ChatList overview={overview} selected={conversation} onOpen={open} />}
            conversation={
                conversation ? (
                    <>
                        <StyledChatHeader name={header.name} subtitle={header.subtitle ?? undefined} group={header.group} onBack={() => open(null)} />
                        <ChatConversation key={`${conversation.kind}:${conversation.id}`} conversation={conversation} onRead={reloadChatOverview} />
                    </>
                ) : (
                    <StyledChatEmpty>Vyberte konverzaci vlevo.</StyledChatEmpty>
                )
            }
        />
    );
};
