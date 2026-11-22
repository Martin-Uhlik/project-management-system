import { StyledMultiSelect } from '../ui';
import type { PublicUser } from '../../types';

// Project or task members; selectedUsers holds user IDs
export const UserMultiSelect = ({
    users,
    disabled,
    selectedUsers,
    setSelectedUsers,
}: {
    users: PublicUser[];
    disabled?: boolean;
    selectedUsers: number[];
    setSelectedUsers: (users: number[]) => void;
}) => {
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
