import { StyledTable, useSearch } from '../../ui';
import { UserRow } from './rows/UserRow';

export const UserTable = ({ users: users, setSelectedUser: setSelectedUser }) => {
    const search = useSearch(users, (user) => [user.FirstName, user.LastName, user.Position]);
    return (
        <StyledTable columns={[{ label: 'Jméno' }, { label: 'Pozice' }, { label: 'Pracuje' }, { label: 'Povoleno' }]} search={search}>
            {search.results.map((user) => (
                <UserRow key={user.ID} user={user} setSelectedUser={setSelectedUser} />
            ))}
        </StyledTable>
    );
};
