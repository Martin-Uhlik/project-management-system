import React from "react";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";
import dayjs from "dayjs";
import {CustomizedDateTimePicker} from "../utils/CustomizedDateTimePicker";

export const AddMyTask = () => {
    const [dialog, setDialog] = useRecoilState(dialogAtom)
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [stopDateTime, setStopDateTime] = React.useState(dayjs())

    const handleCancel = (event) => {
        event.preventDefault()
        dialog.data.handleCancel();
        setDialog(null)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        dialog.data.handleSubmit({Name: name, Description: description, FinifhDate: stopDateTime});
        setDialog(null)
    }

    return(
        <div className="dialog-background">
            <div className="dialog">
                <h1 className="dialog-h1">Přidat úkol</h1>
                <hr className="hline" />
                <form className="d-flex flex-column gap-3">
                    <div className="form-group w-100">
                        <label htmlFor="name">Název:</label>
                        <input className="form-control" type="text" id="name" name="name"
                               placeholder="Zadejte název" value={name} onChange={(event) => {setName(event.target.value)}} autoFocus />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Popis:</label>
                        <textarea className="form-control" id="description" rows="3" value={description} onChange={(event) => {setDescription(event.target.value)}}></textarea>
                    </div>
                    <div className="form-group d-flex flex-column">
                        <label>Datum dokončení:</label>
                        <CustomizedDateTimePicker finishDate={stopDateTime} setFinishDate={setStopDateTime} />
                    </div>
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="btn btn-danger" type="reset" onClick={handleCancel}>Zrušit</button>
                        <button className="btn btn-success" type="submit" onClick={handleSubmit}>Ok</button>
                    </div>
                </form>
            </div>
        </div>
    )
}