import { StyledMultiSelect } from '../ui';

// Project or task members; selectedUsers holds user IDs
export const UserMultiSelect = ({ users, disabled, selectedUsers, setSelectedUsers }) => {
    return (
        <StyledMultiSelect
            id='users'
            label='Členové'
            options={users.map((user) => ({ value: user.ID, label: `${user.FirstName} ${user.LastName}` }))}
            value={selectedUsers}
            onChange={setSelectedUsers}
            disabled={disabled}
        />
    );
};
