import { StyledCheckbox, StyledTableCell, StyledTableRow } from '../../../ui';
export const UserRow = (props) => {
    const user = props.user;

    return (
        <StyledTableRow
            onClick={() => {
                props.setSelectedUser(user);
            }}
        >
            <StyledTableCell>{`${user.FirstName} ${user.LastName}`}</StyledTableCell>
            <StyledTableCell>{user.Position}</StyledTableCell>
            <StyledTableCell>
                <StyledCheckbox disabled checked={user.WorkStartTime !== null} aria-label='Pracuje' />
            </StyledTableCell>
            <StyledTableCell>
                <StyledCheckbox disabled checked={user.Enabled} aria-label='Povoleno' />
            </StyledTableCell>
        </StyledTableRow>
    );
};
