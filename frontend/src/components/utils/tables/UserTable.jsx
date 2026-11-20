import { StyledTable, useSearch } from '../../ui';
import { UserRow } from './rows/UserRow';

export const UserTable = ({ users, setSelectedUser }) => {
    const managerOf = (user) => users?.find((other) => other.ID === user.ManagerID);
    const search = useSearch(users, (user) => [user.FirstName, user.LastName, user.Position, managerOf(user)?.FirstName, managerOf(user)?.LastName]);
    return (
        <StyledTable columns={[{ label: 'Jméno' }, { label: 'Pozice' }, { label: 'Vedoucí' }, { label: 'Stav' }]} search={search}>
            {search.results.map((user) => (
                <UserRow key={user.ID} user={user} manager={managerOf(user)} setSelectedUser={setSelectedUser} />
            ))}
        </StyledTable>
    );
};
