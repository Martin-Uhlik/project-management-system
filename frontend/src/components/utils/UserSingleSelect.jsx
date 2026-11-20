import { useState } from 'react';
import { StyledSelect } from '../ui';

// The person responsible; the surrounding form reads the choice from the field named "owner"
export const UserSingleSelect = ({ users, disabled, owner }) => {
    const [selected, setSelected] = useState(owner ?? '');
    // follow a new owner from the parent (adjusting state while rendering, instead of in an effect)
    const [prevOwner, setPrevOwner] = useState(owner);
    if (owner !== prevOwner) {
        setPrevOwner(owner);
        setSelected(owner ?? '');
    }
    const options = users.map((user) => ({ value: user.ID, label: `${user.FirstName} ${user.LastName}` }));
    // until the users have loaded the owner isn't among the options yet
    const value = options.some((option) => option.value === +selected) ? +selected : '';
    return (
        <StyledSelect
            id='owner'
            label='Zodpovědný pracovník'
            value={value}
            onChange={(event) => setSelected(event.target.value)}
            options={options}
            disabled={disabled}
        />
    );
};
