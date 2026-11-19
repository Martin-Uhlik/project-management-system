import { useState } from 'react';

export const UserSingleSelect = ({ users, disabled, owner }) => {
    const [pom, setPom] = useState(owner);
    // follow a new owner from the parent (adjusting state while rendering, instead of in an effect)
    const [prevOwner, setPrevOwner] = useState(owner);
    if (owner !== prevOwner) {
        setPrevOwner(owner);
        setPom(owner);
    }
    return (
        <div className='form-group'>
            <label htmlFor='owner'>Zodpovědný pracovník:</label>
            <select id='owner' name='owner' className='form-select' value={pom} onChange={(e) => setPom(e.target.value)} disabled={disabled}>
                {users.map((user) => {
                    return <option key={user.ID} value={user.ID}>{`${user.FirstName} ${user.LastName}`}</option>;
                })}
            </select>
        </div>
    );
};
