import React from 'react';
import dayjs from '../../dayjs';
import { useDialog } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDateTimePicker, StyledDialog } from '../ui';
import type { SyntheticEvent } from 'react';
import type { Dayjs } from 'dayjs';

interface TimeDialogData {
    startTime: string | null | undefined;
    handleSuccess: (start: Dayjs | null, stop: Dayjs | null) => void;
    handleCancel: () => void;
    handleDiscard: () => void;
}

export const TimeDialog = () => {
    const [dialog, setDialog] = useDialog<TimeDialogData>();
    const [startDateTime, setStartDateTime] = React.useState<Dayjs | null>(dayjs(dialog.data.startTime));
    const [stopDateTime, setStopDateTime] = React.useState<Dayjs | null>(dayjs());

    const handleDiscard = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleDiscard();
        setDialog(null);
    };

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event: SyntheticEvent) => {
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
