import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledSelect } from '../ui';

export const RemoveDependency = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit(event.target.dependency.value, dialog.data.dependencyType);
        setDialog(null);
    };

    return (
        <StyledDialog title='Odebrat závislost' onClose={handleCancel}>
            <FormStack component='form' gap={4} onSubmit={handleSubmit}>
                <StyledSelect
                    id='dependency'
                    label='Úkol'
                    defaultValue={dialog.data.nodes[0]?.ID ?? ''}
                    options={dialog.data.nodes.map((node) => ({ value: node.ID, label: node.Name }))}
                />
                <ButtonRow>
                    <StyledButton color='error' onClick={handleCancel}>
                        Zrušit
                    </StyledButton>
                    <StyledButton color='success' type='submit'>
                        Ok
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
