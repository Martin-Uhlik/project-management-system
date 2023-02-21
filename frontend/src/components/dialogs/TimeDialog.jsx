import React from "react";
import dayjs from "dayjs";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";
import utc from "dayjs/plugin/utc";
import {CustomizedDateTimePicker} from "../utils/CustomizedDateTimePicker";

export const TimeDialog = () => {
    dayjs.extend(utc);
    const [dialog, setDialog] = useRecoilState(dialogAtom);
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

    return (
        <div className="dialog-background">
            <div className="dialog">
                <h1 className="dialog-h1">Zapsat čas
                    ({dayjs(stopDateTime.diff(startDateTime)).utcOffset(0).format("HH:mm:ss")})</h1>
                <hr className="hline"/>
                <form className="d-flex flex-column gap-5">
                    <div className="d-flex flex-row align-items-center gap-3">
                        <h2>Začátek:</h2>
                        <CustomizedDateTimePicker finishDate={startDateTime} setFinishDate={setStartDateTime}
                                                  maxDateTime={stopDateTime}/>

                    </div>
                    <div className="d-flex flex-row align-items-center gap-3">
                        <h2>Konec:</h2>
                        <CustomizedDateTimePicker finishDate={stopDateTime} setFinishDate={setStopDateTime}
                                                  minDateTime={startDateTime}/>

                    </div>
                    <div className="d-flex justify-content-between">
                        <button className="btn btn-secondary" onClick={handleDiscard}>Zahodit</button>

                        <div className="d-flex gap-3">
                            <button className="btn btn-danger" onClick={handleCancel}>Zrušit</button>
                            <button className="btn btn-success" onClick={handleSubmit}>Zapsat</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};