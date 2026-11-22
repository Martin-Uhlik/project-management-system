import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { listFilters, useListFilters, type ListName } from '../../state/listFilters';
import { CogIcon, StyledIconButton } from '../ui';

// The gear next to a list's title: opens the choice of which items it shows (list: 'tasks', 'projects' or 'users',
// see listFilters). It is highlighted while some items are hidden.
export const ListFiltersButton = ({ list }: { list: ListName }) => {
    const setDialog = useSetAtom(dialogAtom);
    const { hiding } = useListFilters(list);
    const { title, hidden } = listFilters[list];
    return (
        <StyledIconButton label={hiding ? `${title} (${hidden})` : title} active={hiding} onClick={() => setDialog({ type: 'ListFilters', data: { list } })}>
            <CogIcon />
        </StyledIconButton>
    );
};
