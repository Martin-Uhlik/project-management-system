import {useNavigate} from "react-router-dom";
import axios from "axios";
import {setAuthCookie} from "../Auth";
import {getBackendAddress} from "../index";

export const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (event) => {
        event.preventDefault();
        axios.post(getBackendAddress("/login"),
            {
                name: event.target.name.value,
                password: event.target.password.value
            })
        .then((response) => {
            setAuthCookie(response.data.cookie)
            setAuthCookie(response.data.userId)
            navigate("/auth/overview");
        });
    }

    return (
        <div className="login">
            <div className="login_left">
                <img className="login_logo" src="images/logo-adamdesign.svg" alt="logo-adamdesign" />
                    <div className="login_box">
                        <form className="login-form text-white" onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="name"> Uživatelské jméno:</label>
                                <input className="form-control" type="text" id="name" name="name"
                                       placeholder="Zadejte jméno" autoFocus />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password"> Heslo:</label>
                                <input className="form-control" type="password" id="password" name="password"
                                       placeholder="Zadejte heslo" />
                            </div>
                            <div className="d-flex justify-content-end">
                                <button className="btn btn-danger login_button" type="submit">Přihlásit se</button>
                            </div>
                        </form>
                    </div>
            </div>
            <div className="login_right content-wrap"></div>
        </div>
    );
}
