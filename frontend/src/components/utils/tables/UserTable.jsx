import { StyledTable, useSearch } from '../../ui';
import { UserRow } from './rows/UserRow';

// users: the rows; allUsers (default: users): where managers are looked up, so a hidden manager is still named
export const UserTable = ({ users, allUsers = users, setSelectedUser }) => {
    const managerOf = (user) => allUsers?.find((other) => other.ID === user.ManagerID);
    const search = useSearch(users, (user) => [user.FirstName, user.LastName, user.Position, managerOf(user)?.FirstName, managerOf(user)?.LastName]);
    return (
        <StyledTable columns={[{ label: 'Jméno' }, { label: 'Pozice' }, { label: 'Vedoucí' }, { label: 'Stav' }]} search={search}>
            {search.results.map((user) => (
                <UserRow key={user.ID} user={user} manager={managerOf(user)} setSelectedUser={setSelectedUser} />
            ))}
        </StyledTable>
    );
};
