import { useState } from 'react';
import { StyledSelect } from '../ui';

// One worker from a list; the surrounding form reads the choice from the field named `id` ("owner" by default).
// emptyLabel: also offer "nobody" under this label
export const UserSingleSelect = ({ users, disabled, owner, id = 'owner', label = 'Zodpovědný pracovník', emptyLabel }) => {
    const [selected, setSelected] = useState(owner ?? '');
    // follow a new owner from the parent (adjusting state while rendering, instead of in an effect)
    const [prevOwner, setPrevOwner] = useState(owner);
    if (owner !== prevOwner) {
        setPrevOwner(owner);
        setSelected(owner ?? '');
    }
    const options = [
        ...(emptyLabel ? [{ value: '', label: emptyLabel }] : []),
        ...users.map((user) => ({ value: user.ID, label: `${user.FirstName} ${user.LastName}` })),
    ];
    // until the users have loaded the owner isn't among the options yet
    const value = options.some((option) => option.value !== '' && option.value === +selected) ? +selected : '';
    return <StyledSelect id={id} label={label} value={value} onChange={(event) => setSelected(event.target.value)} options={options} disabled={disabled} />;
};
