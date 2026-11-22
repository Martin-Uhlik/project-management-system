import { useAtom } from 'jotai';
import Typography from '@mui/material/Typography';
import { dialogAtom } from '../../state/atoms';
import { listFilters, useListFilters } from '../../state/listFilters';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledSwitch } from '../ui';

// Which items a list shows (dialog.data.list: 'tasks', 'projects' or 'users', see listFilters). A change applies at
// once; the choice is kept in this browser.
export const ListFilters = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const list = dialog.data.list;
    const { filters, setFilters } = useListFilters(list);
    const close = () => setDialog(null);

    return (
        <StyledDialog title={listFilters[list].title} onClose={close}>
            <FormStack gap={3}>
                <FormStack gap={0}>
                    {listFilters[list].options.map((option) => (
                        <FormStack key={option.key} gap={0}>
                            <StyledSwitch
                                id={`filter-${option.key}`}
                                label={option.label}
                                checked={filters[option.key]}
                                onChange={(event) => setFilters({ [option.key]: event.target.checked })}
                            />
                            {option.hint ? (
                                <Typography variant='body2' sx={{ color: 'text.secondary', pl: 6.5 }}>
                                    {option.hint}
                                </Typography>
                            ) : null}
                        </FormStack>
                    ))}
                </FormStack>
                <ButtonRow>
                    <StyledButton onClick={close}>Zavřít</StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
