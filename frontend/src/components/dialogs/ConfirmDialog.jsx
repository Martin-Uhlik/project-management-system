import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog } from '../ui';

export const ConfirmDialog = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSuccess();
        setDialog(null);
    };

    return (
        <StyledDialog title={dialog.data.title} onClose={handleCancel}>
            <FormStack gap={4}>
                <span>{dialog.data.description}</span>
                <ButtonRow>
                    <StyledButton color='error' onClick={handleCancel}>
                        Zrušit
                    </StyledButton>
                    <StyledButton color='success' onClick={handleSubmit}>
                        Ok
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
