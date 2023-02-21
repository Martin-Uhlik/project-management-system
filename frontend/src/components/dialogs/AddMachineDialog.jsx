import React from "react";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";

export const AddMachineDialog = () => {
    const [dialog, setDialog] = useRecoilState(dialogAtom);
    const [name, setName] = React.useState("");

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit(name);
        setDialog(null);
    };

    return (
        <div className="dialog-background" onSubmit={handleSubmit}>
            <div className="dialog">
                <h1 className="dialog-h1">Přidat stroj</h1>
                <hr className="hline"/>
                <form className="d-flex flex-column gap-5">
                    <div className="d-flex flex-row align-items-center gap-3">
                        <h2>Název:</h2>
                        <div className="form-group">
                            <label htmlFor="name">Název stroje:</label>
                            <input className="form-control" type="text" id="name" name="name"
                                   placeholder="Zadejte jméno" value={name} onChange={(event) => {
                                setName(event.target.value);
                            }} autoFocus/>
                        </div>
                    </div>
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="btn btn-danger" type="button" onClick={handleCancel}>Zrušit</button>
                        <button className="btn btn-success" type="submit">Ok</button>
                    </div>
                </form>
            </div>
        </div>
    );
};