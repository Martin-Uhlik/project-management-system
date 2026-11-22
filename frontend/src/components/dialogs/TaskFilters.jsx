import { useSetAtom } from 'jotai';
import Typography from '@mui/material/Typography';
import { dialogAtom } from '../../state/atoms';
import { useTaskFilters } from '../../state/taskFilters';
import { ButtonRow, FormStack, StyledButton, StyledSwitch, StyledDialog } from '../ui';

// Which tasks the overview's task lists show. A change applies at once; the choice is kept in this browser.
export const TaskFilters = () => {
    const setDialog = useSetAtom(dialogAtom);
    const { filters, setTaskFilters } = useTaskFilters();
    const close = () => setDialog(null);

    return (
        <StyledDialog title='Zobrazení úkolů' onClose={close}>
            <FormStack gap={3}>
                <FormStack gap={0}>
                    <StyledSwitch
                        id='show-finished'
                        label='Zobrazit dokončené úkoly'
                        checked={filters.showFinished}
                        onChange={(event) => setTaskFilters({ showFinished: event.target.checked })}
                    />
                    <StyledSwitch
                        id='show-blocked'
                        label='Zobrazit zamčené úkoly'
                        checked={filters.showBlocked}
                        onChange={(event) => setTaskFilters({ showBlocked: event.target.checked })}
                    />
                    <Typography variant='body2' sx={{ color: 'text.secondary', pl: 6.5 }}>
                        Zamčené úkoly čekají na dokončení předchozích úkolů.
                    </Typography>
                </FormStack>
                <ButtonRow>
                    <StyledButton onClick={close}>Zavřít</StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
