import React from "react";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";

export const ConfirmDialog = () => {
    const [dialog, setDialog] = useRecoilState(dialogAtom)

    const handleCancel = (event) => {
        event.preventDefault()
        dialog.data.handleCancel();
        setDialog(null)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        dialog.data.handleSuccess();
        setDialog(null)
    }

    return(
        <div className="dialog-background">
            <div className="dialog">
                <h1 className="dialog-h1">{dialog.data.title}</h1>
                <hr className="hline" />
                <div className="d-flex flex-column gap-5">
                    <span>{dialog.data.description}</span>
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="btn btn-danger" onClick={handleCancel}>Zrušit</button>
                        <button className="btn btn-success" onClick={handleSubmit}>Ok</button>
                    </div>

                </div>
            </div>
        </div>
    )
}