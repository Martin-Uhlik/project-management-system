import React from 'react';
import { useModalDialog } from '../utils/useModalDialog';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import utc from 'dayjs/plugin/utc';
import { CustomizedDateTimePicker } from '../utils/CustomizedDateTimePicker';

export const TimeDialog = () => {
    dayjs.extend(utc);
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

    const dialogRef = useModalDialog(handleCancel);
    return (
        <div className='dialog-background'>
            <div className='dialog' role='dialog' aria-modal='true' aria-labelledby='dialog-title' ref={dialogRef}>
                <h1 id='dialog-title' className='dialog-h1'>
                    Zapsat čas ({dayjs(stopDateTime.diff(startDateTime)).utcOffset(0).format('HH:mm:ss')})
                </h1>
                <hr className='hline' />
                <form className='d-flex flex-column gap-5'>
                    <div className='d-flex flex-row align-items-center gap-3'>
                        <h2>Začátek:</h2>
                        <CustomizedDateTimePicker label='Začátek' finishDate={startDateTime} setFinishDate={setStartDateTime} maxDateTime={stopDateTime} />
                    </div>
                    <div className='d-flex flex-row align-items-center gap-3'>
                        <h2>Konec:</h2>
                        <CustomizedDateTimePicker label='Konec' finishDate={stopDateTime} setFinishDate={setStopDateTime} minDateTime={startDateTime} />
                    </div>
                    <div className='d-flex justify-content-between'>
                        <button className='btn btn-secondary' onClick={handleDiscard}>
                            Zahodit
                        </button>

                        <div className='d-flex gap-3'>
                            <button className='btn btn-danger' onClick={handleCancel}>
                                Zrušit
                            </button>
                            <button className='btn btn-success' onClick={handleSubmit}>
                                Zapsat
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
