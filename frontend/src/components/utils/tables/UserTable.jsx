import { StyledTable } from '../../ui';
import { UserRow } from './rows/UserRow';

export const UserTable = ({ users: users, setSelectedUser: setSelectedUser }) => {
    return (
        <StyledTable columns={[{ label: 'Jméno' }, { label: 'Pozice' }, { label: 'Pracuje' }, { label: 'Povoleno' }]}>
            {users.map((user) => (
                <UserRow key={user.ID} user={user} setSelectedUser={setSelectedUser} />
            ))}
        </StyledTable>
    );
};
