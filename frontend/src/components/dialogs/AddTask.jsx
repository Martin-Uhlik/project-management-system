import React, {useState} from "react";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";
import moment from "moment/moment";
import {CustomizedDateTimePicker} from "../utils/CustomizedDateTimePicker";


export const AddTask = (e) => {
    const [dialog, setDialog] = useRecoilState(dialogAtom);
    const [name, setName] = React.useState("");
    const [role, setRole] = React.useState(30);

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit(dialog.data.event, name, role, event.target.description.value, finishDate);
        setDialog(null);
    };

    const [finishDate, setFinishDate] = useState(moment());

    return (
        <div className="dialog-background">
            <div className="dialog">
                <h1 className="dialog-h1">Přidat úkol</h1>
                <hr className="hline"/>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Název úkolu:</label>
                        <input className="form-control"
                               type="text"
                               id="name"
                               name="name"
                               value={name}
                               onChange={(event) => {
                                   setName(event.target.value);
                               }}
                               autoFocus/>
                    </div>
                    <CustomizedDateTimePicker finishDate={finishDate} setFinishDate={setFinishDate}/>

                    <div className="form-group">
                        <label htmlFor="role">Velikost:</label>
                        <select
                            id="size"
                            name="size"
                            className="form-select"
                            onChange={(event) => {
                                setRole(+event.target.value);
                            }}
                            defaultValue={"30"}
                        >
                            <option value="10">XS</option>
                            <option value="20">S</option>
                            <option value="30">M</option>
                            <option value="40">L</option>
                            <option value="50">XL</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Popis:</label>
                        <textarea className="form-control" id="description" name="description" rows="3"></textarea>
                    </div>
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="btn btn-danger" type="reset" onClick={handleCancel}>Zrušit</button>
                        <button className="btn btn-success" type="submit">Ok</button>
                    </div>
                </form>
            </div>
        </div>
    );
};