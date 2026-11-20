import { StyledTableCell, StyledTableRow } from '../../../ui';
import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../../../state/atoms';

export const MaterialRow = (props) => {
    const row = props.row;
    const setDialog = useSetAtom(dialogAtom);

    const handleEditMaterial = () => {
        setDialog({
            type: 'EditMaterial',
            data: {
                material: props.row.material,
                taskID: props.taskID,
                handleSubmit: () => {},
                handleCancel: () => {},
            },
        });
    };

    return (
        <StyledTableRow onClick={handleEditMaterial}>
            <StyledTableCell>{row.material.Name}</StyledTableCell>
            <StyledTableCell align='right'>{row.count}</StyledTableCell>
            <StyledTableCell align='right'>{row.reserved}</StyledTableCell>
            <StyledTableCell align='right'>{row.count - row.reserved}</StyledTableCell>
        </StyledTableRow>
    );
};
