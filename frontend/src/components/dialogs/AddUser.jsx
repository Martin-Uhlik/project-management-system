import React from "react";
import {useRecoilState} from "recoil";
import {dialogAtom} from "../../state/atoms";


export const AddUser = () => {
    const [dialog, setDialog] = useRecoilState(dialogAtom)
    const [uname, setUname] = React.useState("")
    const [fname, setFname] = React.useState("")
    const [lname, setLname] = React.useState("")
    const [position, setPosition] = React.useState("")
    const [role, setRole] = React.useState("USER")
    const [password, setPassword] = React.useState("")

    const handleCancel = (event) => {
        event.preventDefault()
        dialog.data.handleCancel();
        setDialog(null)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        dialog.data.handleSubmit({UserName: uname, FirstName: fname, LastName: lname,
            Password: password, Position: position, UserType: role});
        setDialog(null)
    }

    return(
        <div className="dialog-background">
            <div className="dialog">
                <h1 className="dialog-h1">Přidat uživatele</h1>
                <hr className="hline" />
                <form className="login-form">
                    <div className="form-group">
                        <label htmlFor="uname">Uživatelské jméno:</label>
                        <input className="form-control"
                               type="text"
                               id="uname"
                               name="uname"
                               value={uname}
                               onChange={(event) => {setUname(event.target.value)}}
                               autoFocus/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="fname">Jméno:</label>
                        <input className="form-control"
                               type="text"
                               id="fname"
                               name="fname"
                               value={fname}
                               onChange={(event) => {setFname(event.target.value)}} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lname">Příjmení:</label>
                        <input className="form-control"
                               type="text"
                               id="lname"
                               name="lname"
                               value={lname}
                               onChange={(event) => {setLname(event.target.value)}} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Heslo:</label>
                        <input className="form-control"
                               type="password"
                               id="password"
                               name="password"
                               value={password}
                               onChange={(event) => {setPassword(event.target.value)}} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="position">Pozice:</label>
                        <input className="form-control"
                               type="text"
                               id="position"
                               name="position"
                               value={position}
                               onChange={(event) => {setPosition(event.target.value)}} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Role uživatele:</label>
                        <select id="role" className="form-select" defaultValue="USER" onChange={(event) => {setRole(event.target.value)}}>
                            <option value="ADMIN">Administrátor</option>
                            <option value="MANAGER">Manažer</option>
                            <option value="USER">Uživatel</option>
                        </select>
                    </div>
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="btn btn-danger" onClick={handleCancel}>Zrušit</button>
                        <button className="btn btn-success" onClick={handleSubmit}>Ok</button>
                    </div>
                </form>
            </div>
        </div>
    )
}