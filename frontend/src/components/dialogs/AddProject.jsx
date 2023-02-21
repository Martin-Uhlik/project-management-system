import React, {useState} from "react";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";
import moment from "moment";
import {getUserID} from "../../Auth";
import {CustomizedDateTimePicker} from "../utils/CustomizedDateTimePicker";


export const AddProject = () => {
    const [dialog, setDialog] = useRecoilState(dialogAtom);
    const [uname, setUname] = React.useState("");
    const [fname, setFname] = React.useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit({
            Name: event.target.projectName.value,
            Description: event.target.description.value,
            Customer: event.target.customer.value,
            FinishDate: finishDate,
            OwnerID: +getUserID()
        });
        setDialog(null);
    };

    const [finishDate, setFinishDate] = useState(moment());

    return (
        <div className="dialog-background">
            <div className="dialog">
                <h1 className="dialog-h1">Přidat projekt</h1>
                <hr className="hline"/>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="projectName">Název projektu:</label>
                        <input className="form-control"
                               type="text"
                               id="projectName"
                               name="projectName"
                               value={uname}
                               onChange={(event) => {
                                   setUname(event.target.value);
                               }}
                               autoFocus/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="customer">Zákazník:</label>
                        <input className="form-control"
                               type="text"
                               id="customer"
                               name="customer"
                               value={fname}
                               onChange={(event) => {
                                   setFname(event.target.value);
                               }}/>
                    </div>
                    <CustomizedDateTimePicker finishDate={finishDate} setFinishDate={setFinishDate}/>
                    <div className="form-group">
                        <label htmlFor="description">Popis:</label>
                        <textarea className="form-control"
                                  id="description"
                                  name="description"
                                  rows="3"
                        ></textarea>
                    </div>
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="btn btn-danger" type="reset" onClick={() => setDialog(null)}>Zrušit</button>
                        <button className="btn btn-success" type="submit">Ok</button>
                    </div>
                </form>
            </div>
        </div>
    );
};