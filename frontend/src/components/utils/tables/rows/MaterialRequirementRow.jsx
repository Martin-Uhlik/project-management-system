import { StyledTableCell, StyledTableRow } from '../../../ui';
import dayjs from '../../../../dayjs';
import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../../../state/atoms';

export const MaterialRequirementRow = (props) => {
    const requirement = props.row;
    const setDialog = useSetAtom(dialogAtom);

    const handleEditMaterial = () => {
        setDialog({
            type: 'EditMaterialRequirement',
            data: {
                material: requirement,
                handleSubmit: () => {},
                handleCancel: () => {},
            },
        });
    };

    return (
        <StyledTableRow onClick={handleEditMaterial}>
            <StyledTableCell>{requirement.Name}</StyledTableCell>
            <StyledTableCell align='right'>{requirement.Price * requirement.Count}</StyledTableCell>
            <StyledTableCell align='right'>{dayjs(requirement.NeededDate).format('L')}</StyledTableCell>
            <StyledTableCell align='right'>{`${requirement.TargetUser.FirstName} ${requirement.TargetUser.LastName}`}</StyledTableCell>
            <StyledTableCell align='right'>{`${requirement?.AcceptedBy?.FirstName || ''} ${requirement?.AcceptedBy?.LastName || ''}`}</StyledTableCell>
        </StyledTableRow>
    );
};
