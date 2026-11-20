import React from 'react';
import dayjs from '../../dayjs';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDateTimePicker, StyledDialog } from '../ui';

export const TimeDialog = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [startDateTime, setStartDateTime] = React.useState(dayjs(dialog.data.startTime));
    const [stopDateTime, setStopDateTime] = React.useState(dayjs());

    const handleDiscard = (event) => {
        event.preventDefault();
        dialog.data.handleDiscard();
        setDialog(null);
    };

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSuccess(startDateTime, stopDateTime);
        setDialog(null);
    };

    const duration = startDateTime && stopDateTime ? dayjs(stopDateTime.diff(startDateTime)).utcOffset(0).format('HH:mm:ss') : '--:--:--';

    return (
        <StyledDialog title={`Zapsat čas (${duration})`} onClose={handleCancel}>
            <FormStack component='form' gap={3} onSubmit={handleSubmit}>
                <StyledDateTimePicker label='Začátek' value={startDateTime} onChange={setStartDateTime} maxDateTime={stopDateTime} />
                <StyledDateTimePicker label='Konec' value={stopDateTime} onChange={setStopDateTime} minDateTime={startDateTime} />
                <ButtonRow justify='space-between'>
                    <StyledButton color='secondary' onClick={handleDiscard}>
                        Zahodit
                    </StyledButton>
                    <ButtonRow>
                        <StyledButton color='error' onClick={handleCancel}>
                            Zrušit
                        </StyledButton>
                        <StyledButton color='success' type='submit' disabled={!startDateTime || !stopDateTime}>
                            Zapsat
                        </StyledButton>
                    </ButtonRow>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
