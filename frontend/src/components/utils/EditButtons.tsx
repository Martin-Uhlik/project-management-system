import { StyledButton } from '../ui';

// The buttons of a form that is read-only until "Upravit" is pressed. Put them inside the form:
// "Zrušit" resets the fields to what they were, "Použít" submits the form.
export const EditButtons = ({ editing, setEditing }: { editing: boolean; setEditing: (editing: boolean) => void }) => {
    return editing ? (
        <>
            <StyledButton color='error' type='reset' onClick={() => setEditing(false)}>
                Zrušit
            </StyledButton>
            <StyledButton color='success' type='submit'>
                Použít
            </StyledButton>
        </>
    ) : (
        <StyledButton variant='outlined' onClick={() => setEditing(true)}>
            Upravit
        </StyledButton>
    );
};
