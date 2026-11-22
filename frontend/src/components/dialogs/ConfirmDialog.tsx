import { useDialog } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog } from '../ui';
import type { ReactNode, SyntheticEvent } from 'react';

interface ConfirmData {
    title: string;
    description: ReactNode;
    handleSuccess: () => void;
    handleCancel: () => void;
}

export const ConfirmDialog = () => {
    const [dialog, setDialog] = useDialog<ConfirmData>();

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event: SyntheticEvent) => {
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
