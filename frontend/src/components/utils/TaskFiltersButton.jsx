import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { useTaskFilters } from '../../state/taskFilters';
import { CogIcon, StyledIconButton } from '../ui';

// The gear next to a task list's title: opens the choice of which tasks are shown (finished, locked). It is
// highlighted while some tasks are hidden.
export const TaskFiltersButton = () => {
    const setDialog = useSetAtom(dialogAtom);
    const { hiding } = useTaskFilters();
    return (
        <StyledIconButton
            label={hiding ? 'Zobrazení úkolů (některé úkoly jsou skryté)' : 'Zobrazení úkolů'}
            active={hiding}
            onClick={() => setDialog({ type: 'TaskFilters' })}
        >
            <CogIcon />
        </StyledIconButton>
    );
};
