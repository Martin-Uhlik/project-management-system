import { useState } from 'react';
import { useDialog } from '../../state/atoms';
import dayjs from '../../dayjs';
import { getUserID } from '../../Auth';
import { ButtonRow, FormStack, StyledButton, StyledDateTimePicker, StyledDialog, StyledInput } from '../ui';
import { fieldValue } from '../../form';
import type { SyntheticEvent } from 'react';
import type { Dayjs } from 'dayjs';

interface AddProjectData {
    handleSubmit: (project: { Name: string; Description: string; Customer: string; FinishDate: Dayjs | null; OwnerID: number }) => void;
}

export const AddProject = () => {
    const [dialog, setDialog] = useDialog<AddProjectData>();
    const [finishDate, setFinishDate] = useState<Dayjs | null>(dayjs());

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleSubmit({
            Name: fieldValue(event, 'projectName'),
            Description: fieldValue(event, 'description'),
            Customer: fieldValue(event, 'customer'),
            FinishDate: finishDate,
            OwnerID: Number(getUserID()),
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
