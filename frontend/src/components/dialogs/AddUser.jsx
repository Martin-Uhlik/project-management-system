import React from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledInput, StyledSelect } from '../ui';

export const userRoleOptions = [
    { value: 'ADMIN', label: 'Administrátor' },
    { value: 'MANAGER', label: 'Manažer' },
    { value: 'USER', label: 'Uživatel' },
];

export const AddUser = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [uname, setUname] = React.useState('');
    const [fname, setFname] = React.useState('');
    const [lname, setLname] = React.useState('');
    const [position, setPosition] = React.useState('');
    const [role, setRole] = React.useState('USER');
    const [password, setPassword] = React.useState('');

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit({ UserName: uname, FirstName: fname, LastName: lname, Password: password, Position: position, UserType: role });
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat uživatele' onClose={handleCancel}>
            <FormStack component='form' onSubmit={handleSubmit}>
                <StyledInput id='uname' label='Uživatelské jméno' value={uname} onChange={(event) => setUname(event.target.value)} />
                <StyledInput id='fname' label='Jméno' value={fname} onChange={(event) => setFname(event.target.value)} />
                <StyledInput id='lname' label='Příjmení' value={lname} onChange={(event) => setLname(event.target.value)} />
                <StyledInput id='password' label='Heslo' type='password' value={password} onChange={(event) => setPassword(event.target.value)} />
                <StyledInput id='position' label='Pozice' value={position} onChange={(event) => setPosition(event.target.value)} />
                <StyledSelect id='role' label='Role uživatele' value={role} onChange={(event) => setRole(event.target.value)} options={userRoleOptions} />
                <ButtonRow>
                    <StyledButton color='error' onClick={handleCancel}>
                        Zrušit
                    </StyledButton>
                    <StyledButton color='success' type='submit'>
                        Ok
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
