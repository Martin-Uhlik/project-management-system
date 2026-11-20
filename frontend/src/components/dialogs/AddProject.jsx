import { useState } from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import dayjs from '../../dayjs';
import { getUserID } from '../../Auth';
import { ButtonRow, FormStack, StyledButton, StyledDateTimePicker, StyledDialog, StyledInput } from '../ui';

export const AddProject = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [finishDate, setFinishDate] = useState(dayjs());

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit({
            Name: event.target.projectName.value,
            Description: event.target.description.value,
            Customer: event.target.customer.value,
            FinishDate: finishDate,
            OwnerID: +getUserID(),
        });
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat projekt' onClose={() => setDialog(null)}>
            <FormStack component='form' onSubmit={handleSubmit}>
                <StyledInput id='projectName' label='Název projektu' />
                <StyledInput id='customer' label='Zákazník' />
                <StyledDateTimePicker value={finishDate} onChange={setFinishDate} />
                <StyledInput id='description' label='Popis' multiline rows={3} />
                <ButtonRow>
                    <StyledButton color='error' onClick={() => setDialog(null)}>
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
