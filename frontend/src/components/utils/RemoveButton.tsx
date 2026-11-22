import type React from 'react';
import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { StyledButton } from '../ui';

export const RemoveButton = (props: { handleSuccess: () => void }) => {
    const setDialog = useSetAtom(dialogAtom);
    const handleCLick = (event: React.MouseEvent) => {
        event.preventDefault();
        setDialog({
            type: 'ConfirmDialog',
            data: {
                title: 'Varování',
                description: 'Opravdu chcete odstranit danou položku? Tento krok je nevratný!',
                handleSuccess: props.handleSuccess,
                handleCancel: () => {},
            },
        });
    };

    return (
        <StyledButton color='error' variant='outlined' onClick={handleCLick}>
            Odstranit
        </StyledButton>
    );
};
