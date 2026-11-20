import { StyledChip, StyledElapsed, StyledStatus, StyledTableCell, StyledTableRow, userStatus } from '../../../ui';

const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : '');

// A worker, styled like the other tables: a disabled account is grey with a crossed-out person icon and struck through,
// someone working has a green stripe, timer icon and the running time
export const UserRow = ({ user, manager, setSelectedUser }) => {
    const status = userStatus(user);
    return (
        <StyledTableRow status={status} disabled={status === 'disabled'} onClick={() => setSelectedUser(user)}>
            <StyledTableCell>
                <StyledStatus status={status}>{fullName(user)}</StyledStatus>
            </StyledTableCell>
            <StyledTableCell>{user.Position}</StyledTableCell>
            <StyledTableCell>{fullName(manager)}</StyledTableCell>
            <StyledTableCell>
                {status === 'disabled' ? <StyledChip label='Zakázán' variant='outlined' /> : null}
                {status === 'working' ? <StyledElapsed since={user.WorkStartTime} /> : null}
            </StyledTableCell>
        </StyledTableRow>
    );
};
