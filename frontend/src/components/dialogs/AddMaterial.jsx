import React from "react";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";

export const AddMaterial = () => {
    const [dialog, setDialog] = useRecoilState(dialogAtom);
    const [name, setName] = React.useState("");
    const [amount, setAmount] = React.useState("");

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit({name: name, count: amount});
        setDialog(null);
    };

    return (
        <div className="dialog-background">
            <div className="dialog">
                <h1 className="dialog-h1">Přidat materiál</h1>
                <hr className="hline"/>
                <form className="d-flex flex-column gap-3">
                    <div className="form-group">
                        <label htmlFor="name">Název:</label>
                        <input className="form-control"
                               type="text"
                               id="name"
                               name="name"
                               placeholder="Zadejte název"
                               value={name}
                               onChange={(event) => {
                                   setName(event.target.value);
                               }}
                               autoFocus/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="amount">Počet:</label>
                        <input className="form-control"
                               type="text"
                               id="amount"
                               name="amount"
                               placeholder="Zadejte počet kusů"
                               value={amount}
                               onChange={(event) => {
                                   setAmount(event.target.value);
                               }} autoFocus/>
                    </div>
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="btn btn-danger" onClick={handleCancel}>Zrušit</button>
                        <button className="btn btn-success" onClick={handleSubmit}>Ok</button>
                    </div>
                </form>
            </div>
        </div>
    );
};