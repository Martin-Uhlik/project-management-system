import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';

export const RemoveButton = (props) => {
    const setDialog = useSetAtom(dialogAtom);
    const handleCLick = (event) => {
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
        <button type='button' className='btn btn-outline-danger' onClick={handleCLick}>
            Odstranit
        </button>
    );
};
